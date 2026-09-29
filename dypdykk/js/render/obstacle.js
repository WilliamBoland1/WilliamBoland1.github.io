// ══════════════════════════════════════════════════════════════════
// OBSTACLE STYLE: a beer crate hanging on a rope above the opening,
// and shipping containers stacked end-on below it.
// Swap this file to restyle the obstacles; any replacement must export
// an `Obstacle` with the same build(scale) / draw(ctx, pipe, x) shape.
// It only draws: the collision boxes stay in collides() (main.js), and the
// drawing must sit on them:
//  - Crate: x-6 … x+PW+6, from topH-CRATE (bottle caps) down to topH. Its
//    bottom edge is the top of the opening.
//  - Rope: ROPE px wide, centred on the obstacle, from the surface down to
//    the crate box.
//  - Containers: x-6 … x+PW+6, below topH+GAP; the top container's roof is
//    the bottom of the opening.
// ══════════════════════════════════════════════════════════════════
import { CONFIG } from '../config.js';
import { H, GH, PW, GAP, CRATE, ROPE } from '../constants.js';
import { TAU, makeSprite, roundRectPath, drawBolt } from './util.js';

export const Obstacle = (() => {
  const O = CONFIG.obstacle, C = CONFIG.colors;
  const SW = PW + 12;                              // drawn width == collision width
  const NECK = 10;                                 // bottle necks above the rim, part of the CRATE box
  const CH = CRATE - NECK, SL = O.slingHeight, RW = ROPE, KH = O.containerHeight;
  let rope, crate, containers = [], scale = 1;

  // One tall strip of twisted rope. Each obstacle slices the length it needs.
  function buildRope() {
    const { c, g } = makeSprite(RW, H, scale);
    const shade = g.createLinearGradient(0, 0, RW, 0);
    shade.addColorStop(0, C.ropeDark);
    shade.addColorStop(0.4, C.rope);
    shade.addColorStop(1, C.ropeDark);
    g.fillStyle = shade; g.fillRect(0, 0, RW, H);
    // the lay of the strands: short diagonal grooves
    g.strokeStyle = 'rgba(60,45,25,0.55)'; g.lineWidth = 0.7;
    for (let y = -RW; y < H; y += 3) { g.beginPath(); g.moveTo(0, y + RW); g.lineTo(RW, y); g.stroke(); }
    return c;
  }

  // Crate seen from the side, bottle necks sticking out of the top, and a
  // two-leg sling up to a shackle at the top centre where the rope ties on.
  // Sprite origin: top of the sling. The crate body fills SL … SL+CH.
  function buildCrate() {
    const { c, g } = makeSprite(SW, SL + CH, scale);
    const top = SL, bot = SL + CH;

    // bottle necks and caps behind the rim
    for (let i = 0; i < O.bottles; i++) {
      const bx = SW * (i + 0.5) / O.bottles;
      const neck = g.createLinearGradient(bx - 3, 0, bx + 3, 0);
      neck.addColorStop(0, C.bottleDark); neck.addColorStop(0.35, C.bottle); neck.addColorStop(1, C.bottleDark);
      g.fillStyle = neck; g.fillRect(bx - 2.5, top - 8, 5, 10);
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(bx - 1.4, top - 7, 0.8, 7);
      g.fillStyle = C.brass; g.fillRect(bx - 3.2, top - 10.5, 6.4, 3);
      g.fillStyle = C.brassDark; g.fillRect(bx - 3.2, top - 8, 6.4, 0.6);
    }

    // body
    const body = g.createLinearGradient(0, top, 0, bot);
    body.addColorStop(0, C.crateLight);
    body.addColorStop(0.5, C.crate);
    body.addColorStop(1, C.crateDark);
    g.fillStyle = body; g.fillRect(0, top, SW, CH);
    // rims and corner posts
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, top, SW, 5);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, top + 5, SW, 1); g.fillRect(0, bot - 4, SW, 4);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, top, 5, CH); g.fillRect(SW - 5, top, 5, CH);
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(5, top + 5, 1, CH - 9);

    // handle cut-out at the top, with a slot row on each side of it
    const hw = 26;
    g.fillStyle = C.crateHole;
    roundRectPath(g, SW / 2 - hw / 2, top + 8, hw, 7, 3.5); g.fill();
    for (let x = 9; x + 3 < SW - 8; x += 7) {
      if (x + 3 > SW / 2 - hw / 2 - 3 && x < SW / 2 + hw / 2 + 3) continue;
      roundRectPath(g, x, top + 9, 3, 6, 1.5); g.fill();
    }
    // lower band of vertical ribs around a plain centre plate with "110"
    const plate = 24;
    for (let x = 9; x + 3 < SW - 8; x += 7) {
      if (x + 3 > SW / 2 - plate / 2 && x < SW / 2 + plate / 2) continue;
      roundRectPath(g, x, top + 19, 3, CH - 26, 1.5); g.fill();
    }
    g.font = `600 11px ${O.crateFont}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const ty = top + 19 + (CH - 26) / 2;
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillText('110', SW / 2 - 0.6, ty - 0.6);
    g.fillStyle = C.crateDark; g.fillText('110', SW / 2, ty);

    // sling: two legs from the shackle to the crate's top corners
    const sx = SW / 2, sy = 3;
    g.lineCap = 'round';
    for (const [w, col] of [[1.6, C.ropeDark], [0.8, C.rope]]) {
      g.strokeStyle = col; g.lineWidth = w;
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(2.5, top + 1);
      g.moveTo(sx, sy); g.lineTo(SW - 2.5, top + 1); g.stroke();
    }
    drawBolt(g, sx, sy, 2.4, C.brassDark, C.brassLight);
    return c;
  }

  // One container seen from the door end. Its roof is the sprite's top edge.
  function buildContainer(p) {
    const { c, g } = makeSprite(SW, KH, scale);
    g.fillStyle = p.base; g.fillRect(0, 0, SW, KH);
    // doors: faint vertical corrugation, split down the middle
    for (let x = 6; x < SW - 6; x += 5) {
      g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x, 5, 2, KH - 11);
      g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(x + 2, 5, 1.5, KH - 11);
    }
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(SW / 2 - 0.5, 5, 1, KH - 11);
    // frame: corner posts, top and bottom rails
    g.fillStyle = p.dark;
    g.fillRect(0, 0, 5, KH); g.fillRect(SW - 5, 0, 5, KH);
    g.fillRect(0, 0, SW, 5); g.fillRect(0, KH - 6, SW, 6);
    g.fillStyle = p.light; g.fillRect(0, 0, SW, 1.2);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, KH - 1, SW, 1);   // seam to the container below
    // corner castings with their oval holes
    for (const [cx, cy] of [[0, 0], [SW - 7, 0], [0, KH - 7], [SW - 7, KH - 7]]) {
      g.fillStyle = p.dark; g.fillRect(cx, cy, 7, 7);
      g.fillStyle = 'rgba(0,0,0,0.6)';
      g.beginPath(); g.ellipse(cx + 3.5, cy + 3.5, 2.2, 1.3, 0, 0, TAU); g.fill();
    }
    // locking bars, with cam keepers at the ends and a handle on each
    for (const bx of [13, 26, SW - 28, SW - 15]) {
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(bx + 1, 6, 2, KH - 12);
      g.fillStyle = C.containerBar; g.fillRect(bx, 6, 2, KH - 12);
      g.fillStyle = p.dark; g.fillRect(bx - 1, 6, 4, 3); g.fillRect(bx - 1, KH - 9, 4, 3);
      const hx = bx < SW / 2 ? bx + 2 : bx - 6;
      g.fillStyle = C.containerBar; g.fillRect(hx, KH * 0.58, 6, 1.8);
    }
    return c;
  }

  function build(s) {
    scale = s; rope = buildRope(); crate = buildCrate();
    containers = O.containers.map(buildContainer);
  }

  // g: context, p: pipe, x: pipe x to draw at (may be interpolated between steps)
  function draw(g, p, x) {
    const gx = x - 6, top = p.topH, bot = p.topH + GAP, floor = H - GH;

    // 1. Rope from the surface down to the shackle, centred over the crate.
    const crateY = top - CH - SL, ropeLen = crateY + 3;
    if (ropeLen > 0) g.drawImage(rope, 0, 0, RW * scale, ropeLen * scale, gx + SW / 2 - RW / 2, 0, RW, ropeLen);
    // 2. Crate: its bottom edge is the top of the opening.
    g.drawImage(crate, gx, crateY, SW, SL + CH);

    // 3. Containers stacked from the opening down; the seabed hides the cut-off base.
    // Colour order comes from topH (not Math.random, which would shift pipe heights).
    const n = containers.length, v = Math.floor(p.topH * 997) % n;
    for (let y = bot, i = 0; y < floor; y += KH, i++) {
      const h = Math.min(KH, floor - y), k = containers[(v + i) % n];
      g.drawImage(k, 0, 0, SW * scale, h * scale, gx, y, SW, h);
    }
  }

  return { build, draw };
})();
