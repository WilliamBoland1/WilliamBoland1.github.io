// ══════════════════════════════════════════════════════════════════
// OBSTACLE STYLE: riveted steel bulkhead with a brass-rimmed porthole.
// Swap this file to restyle the obstacles; any replacement must export
// an `Obstacle` with the same build(scale) / draw(ctx, pipe, x) shape.
// It only draws: the collision box stays in collides() (main.js), and
// the steel and lip edges are placed exactly on that box
// (x-6 … x+PW+6, gap topH … topH+GAP).
// ══════════════════════════════════════════════════════════════════
import { CONFIG } from '../config.js';
import { W, H, GH, PW, GAP } from '../constants.js';
import { TAU, makeSprite, drawBolt } from './util.js';

export const Obstacle = (() => {
  const O = CONFIG.obstacle, C = CONFIG.colors;
  const SW = PW + 12;                              // drawn width == collision width
  const collarMid = GAP / 2 + O.collarWidth / 2;   // collar's inner edge sits on the gap
  let steel, lip, collar, scale = 1;

  // One tall steel strip with plate seams and rivets. Each bulkhead is sliced from it.
  function buildSteel() {
    const { c, g } = makeSprite(SW, H, scale);
    const shade = g.createLinearGradient(0, 0, SW, 0);
    shade.addColorStop(0, C.steelDark);
    shade.addColorStop(0.28, C.steelLight);
    shade.addColorStop(0.6, C.steel);
    shade.addColorStop(1, C.steelDark);
    g.fillStyle = shade; g.fillRect(0, 0, SW, H);
    // edge flanges
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, 0, 3, H); g.fillRect(SW - 3, 0, 3, H);
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(3, 0, 1, H);
    // horizontal plate seams, each with a row of rivets
    for (let y = O.seamEvery; y < H; y += O.seamEvery) {
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, y, SW, 1.5);
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, y + 1.5, SW, 1);
      for (let x = SW / 2 - 17; x <= SW / 2 + 17; x += 17) drawBolt(g, x, y + 6, 1.6, C.rivet, 'rgba(255,255,255,0.35)');
    }
    // rivet columns along both edges
    for (let y = 8; y < H; y += O.rivetEvery) {
      drawBolt(g, 8, y, 1.6, C.rivet, 'rgba(255,255,255,0.35)');
      drawBolt(g, SW - 8, y, 1.6, C.rivet, 'rgba(255,255,255,0.35)');
    }
    return c;
  }

  // Brass lip that caps each steel piece at the opening.
  function buildLip() {
    const L = O.lipHeight;
    const { c, g } = makeSprite(SW, L, scale);
    const grad = g.createLinearGradient(0, 0, 0, L);
    grad.addColorStop(0, C.brassLight);
    grad.addColorStop(0.5, C.brass);
    grad.addColorStop(1, C.brassDark);
    g.fillStyle = grad; g.fillRect(0, 0, SW, L);
    g.fillStyle = 'rgba(40,25,5,0.4)'; g.fillRect(0, 0, SW, 0.8); g.fillRect(0, L - 0.8, SW, 0.8);
    for (let i = 1; i <= O.lipBolts; i++) drawBolt(g, SW * i / (O.lipBolts + 1), L / 2, 1.5, C.brassDark, C.brassLight);
    return c;
  }

  // Round bolted collar centred on the opening, so the gap reads as a porthole.
  function buildCollar() {
    const size = Math.ceil((collarMid + O.collarWidth / 2 + 3) * 2), m = size / 2;
    const { c, g } = makeSprite(size, size, scale);
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = O.collarWidth + 2;
    g.beginPath(); g.arc(m + 1.5, m + 2, collarMid, 0, TAU); g.stroke();
    const sheen = g.createLinearGradient(0, 0, size, size);
    sheen.addColorStop(0, C.brassLight);
    sheen.addColorStop(0.45, C.brass);
    sheen.addColorStop(0.75, C.brassDark);
    sheen.addColorStop(1, C.brass);
    g.strokeStyle = sheen; g.lineWidth = O.collarWidth;
    g.beginPath(); g.arc(m, m, collarMid, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(40,25,5,0.45)'; g.lineWidth = 0.8;
    g.beginPath(); g.arc(m, m, collarMid - O.collarWidth / 2, 0, TAU); g.stroke();
    g.beginPath(); g.arc(m, m, collarMid + O.collarWidth / 2, 0, TAU); g.stroke();
    for (let i = 0; i < O.collarBolts; i++) {
      const a = (i + 0.5) / O.collarBolts * TAU;
      drawBolt(g, m + Math.cos(a) * collarMid, m + Math.sin(a) * collarMid, 1.6, C.brassDark, C.brassLight);
    }
    return { c, size };
  }

  function build(s) { scale = s; steel = buildSteel(); lip = buildLip(); collar = buildCollar(); }

  // g: context, p: pipe, x: pipe x to draw at (may be interpolated between steps)
  function draw(g, p, x) {
    const gx = x - 6, top = p.topH, bot = p.topH + GAP, floor = H - GH, L = O.lipHeight;

    // 1. Collar behind the plate, clipped out of the gap so no brass ever shows in open water.
    g.save();
    g.beginPath(); g.rect(0, 0, W, H); g.rect(gx, top, SW, GAP); g.clip('evenodd');
    g.drawImage(collar.c, gx + SW / 2 - collar.size / 2, top + GAP / 2 - collar.size / 2, collar.size, collar.size);
    g.restore();

    // 2. Steel above and below, sliced from the pre-rendered strip.
    const topLen = top - L, botY = bot + L, botLen = floor - botY;
    if (topLen > 0) g.drawImage(steel, 0, 0, SW * scale, topLen * scale, gx, 0, SW, topLen);
    if (botLen > 0) g.drawImage(steel, 0, botY * scale, SW * scale, botLen * scale, gx, botY, SW, botLen);

    // 3. Brass lips: their inner edges sit exactly on the collision boundary.
    g.drawImage(lip, gx, top - L, SW, L);
    g.drawImage(lip, gx, bot, SW, L);
  }

  return { build, draw };
})();
