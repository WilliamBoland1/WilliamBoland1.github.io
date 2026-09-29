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
  const SHX = 8, SHY = 8;                          // contact shadow: reach past each side, height above the floor
  let rope, crate, containers = [], shadow, scale = 1;

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

  // Amber glass shading across a bottle of width w centred on cx: dark edges,
  // warm glow left of centre (light through the beer).
  function glass(g, cx, w) {
    const gr = g.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    gr.addColorStop(0, C.bottleDark); gr.addColorStop(0.3, C.bottleLight);
    gr.addColorStop(0.55, C.bottle); gr.addColorStop(1, C.bottleDark);
    return gr;
  }

  // Crate of beer seen from the side: amber bottles stand in a row of open
  // windows, their necks and crown caps sticking out above the rim, and a
  // two-leg sling runs up to a shackle at the top centre where the rope ties on.
  // Sprite origin: top of the sling. The crate body fills SL … SL+CH.
  function buildCrate() {
    const { c, g } = makeSprite(SW, SL + CH, scale);
    const top = SL, bot = SL + CH;
    const P = 5, RIB = 2.5, n = O.bottles;          // corner posts, ribs between the windows
    const WW = (SW - 2 * P - (n - 1) * RIB) / n;    // window width; one bottle per window
    const bx = i => P + i * (WW + RIB) + WW / 2;    // bottle centre line
    const BAND = 13, WY = top + BAND + 1, WH = CH - BAND - 8;   // window top and height

    // Necks and crown caps above the rim (drawn first so the rim covers their base)
    for (let i = 0; i < n; i++) {
      const x = bx(i), capY = top - NECK;
      g.fillStyle = glass(g, x, 5.6);
      g.beginPath();                                 // neck flares slightly towards the shoulder
      g.moveTo(x - 2.2, capY + 2.6); g.lineTo(x + 2.2, capY + 2.6);
      g.lineTo(x + 2.8, top); g.lineTo(x - 2.8, top); g.closePath(); g.fill();
      g.fillStyle = C.label; g.fillRect(x - 2.5, top - 4.6, 5, 2.2);          // neck label
      g.fillStyle = C.labelBand; g.fillRect(x - 2.5, top - 3.9, 5, 0.8);
      g.fillStyle = 'rgba(255,240,210,0.45)'; g.fillRect(x - 1.5, capY + 3, 0.7, 4.6);   // glint
      // crown cap: domed top, crimped skirt
      const cap = g.createLinearGradient(x - 3, 0, x + 3, 0);
      cap.addColorStop(0, C.brassDark); cap.addColorStop(0.35, C.brassLight); cap.addColorStop(1, C.brassDark);
      g.fillStyle = cap; roundRectPath(g, x - 3, capY, 6, 3, 1); g.fill();
      g.fillStyle = 'rgba(40,25,5,0.55)';
      for (let k = -2.4; k <= 2.4; k += 1.2) g.fillRect(x + k - 0.2, capY + 1.5, 0.4, 1.5);
      g.fillStyle = 'rgba(255,245,220,0.5)'; g.fillRect(x - 2, capY + 0.3, 3, 0.6);
    }

    // Crate body
    const body = g.createLinearGradient(0, top, 0, bot);
    body.addColorStop(0, C.crateLight);
    body.addColorStop(0.5, C.crate);
    body.addColorStop(1, C.crateDark);
    g.fillStyle = body; g.fillRect(0, top, SW, CH);

    // Windows: dark inside, a bottle standing in each, shaded by the band above
    for (let i = 0; i < n; i++) {
      const x = bx(i), x0 = x - WW / 2;
      g.save();
      roundRectPath(g, x0, WY, WW, WH, 1.8); g.clip();
      g.fillStyle = C.crateHole; g.fillRect(x0, WY, WW, WH);
      const bw = WW - 1.6;
      g.fillStyle = glass(g, x, bw); g.fillRect(x - bw / 2, WY, bw, WH);
      // paper label wrapped round the bottle, with a coloured band and a small oval
      const ly = WY + 5, lh = 10;
      const paper = g.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0);
      paper.addColorStop(0, 'rgba(0,0,0,0.35)'); paper.addColorStop(0.3, 'rgba(0,0,0,0)');
      paper.addColorStop(0.75, 'rgba(0,0,0,0)'); paper.addColorStop(1, 'rgba(0,0,0,0.4)');
      g.fillStyle = C.label; g.fillRect(x - bw / 2, ly, bw, lh);
      g.fillStyle = C.labelBand; g.fillRect(x - bw / 2, ly + lh - 3.2, bw, 1.6);
      g.beginPath(); g.ellipse(x, ly + 3.2, bw * 0.26, 1.7, 0, 0, TAU); g.fill();
      g.fillStyle = C.brass; g.fillRect(x - bw / 2, ly, bw, 0.6); g.fillRect(x - bw / 2, ly + lh - 0.6, bw, 0.6);
      g.fillStyle = paper; g.fillRect(x - bw / 2, ly, bw, lh);
      g.fillStyle = 'rgba(255,240,210,0.5)'; g.fillRect(x - bw / 2 + 1.6, WY, 0.8, WH);   // glint
      // shadow of the band above, and the window's inner edge
      const sh = g.createLinearGradient(0, WY, 0, WY + 5);
      sh.addColorStop(0, 'rgba(20,6,4,0.6)'); sh.addColorStop(1, 'rgba(20,6,4,0)');
      g.fillStyle = sh; g.fillRect(x0, WY, WW, 5);
      g.restore();
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.6;
      roundRectPath(g, x0 + 0.3, WY + 0.3, WW - 0.6, WH - 0.6, 1.6); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x0 + WW, WY + 1, 0.6, WH - 2);   // lit rib edge
    }

    // Rim, corner posts and foot
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(0, top, SW, 4);
    g.fillStyle = 'rgba(255,245,220,0.35)'; g.fillRect(0, top, SW, 0.8);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, top + 4, SW, 0.8);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, top, P, CH); g.fillRect(SW - P, top, P, CH);
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(P, top + 4.8, 0.8, CH - 10);
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, bot - 5, SW, 5);
    g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(0, bot - 5, SW, 0.6);

    // Band under the rim: a hand hole at each end and an "ØL" plate in the middle
    const bandY = top + 4.8, bandH = BAND - 4.8;
    g.fillStyle = C.crateHole;
    for (const hx of [P + 3, SW - P - 3 - 12]) { roundRectPath(g, hx, bandY + 2, 12, 4.4, 2.2); g.fill(); }
    const pw = 22, ph = bandH - 1.6, px = SW / 2 - pw / 2, py = bandY + 0.8;
    g.fillStyle = C.label; roundRectPath(g, px, py, pw, ph, 1.2); g.fill();
    g.strokeStyle = C.brassDark; g.lineWidth = 0.5; roundRectPath(g, px + 0.8, py + 0.8, pw - 1.6, ph - 1.6, 0.8); g.stroke();
    g.font = `600 6.4px ${O.crateFont}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = C.crateDark; g.fillText('ØL', SW / 2, py + ph / 2 + 0.3);

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

  // Soft contact shadow where the bottom container meets the seabed: darkest at the floor
  // line, fading upward and out past the corners. Only the half above the floor is built,
  // because the seabed strip is drawn over everything below it.
  function buildShadow() {
    const w = SW + 2 * SHX, { c, g } = makeSprite(w, SHY, scale);
    const up = g.createLinearGradient(0, SHY, 0, 0);
    up.addColorStop(0, 'rgba(0,0,0,0.32)');
    up.addColorStop(0.45, 'rgba(0,0,0,0.12)');
    up.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = up; g.fillRect(0, 0, w, SHY);
    // fade the ends: half strength at the container's corners, gone SHX beyond them
    const ends = g.createLinearGradient(0, 0, w, 0), e = 2 * SHX / w;
    ends.addColorStop(0, 'rgba(0,0,0,0)'); ends.addColorStop(e, '#000');
    ends.addColorStop(1 - e, '#000'); ends.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-in';
    g.fillStyle = ends; g.fillRect(0, 0, w, SHY);
    return c;
  }

  function build(s) {
    scale = s; rope = buildRope(); crate = buildCrate();
    containers = O.containers.map(buildContainer);
    shadow = buildShadow();
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
    // 4. Contact shadow where the bottom container meets the sand.
    g.drawImage(shadow, gx - SHX, floor - SHY, SW + 2 * SHX, SHY);
  }

  return { build, draw };
})();
