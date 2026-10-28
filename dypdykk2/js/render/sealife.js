// ══════════════════════════════════════════════════════════════════
// SEA LIFE: a small school of fish, a lone cod and two jellyfish drifting
// far behind the seabed ridges. Background only: faint, softened
// silhouettes that fade out with the surface light, while the jellyfish
// keep a faint cream rim in the dark stages.
// Where each one is follows from time and worldX alone (nothing is
// stored per frame), and the layout comes from a seeded generator, so
// the scene is the same on every visit and never touches Math.random.
// ══════════════════════════════════════════════════════════════════
import { CONFIG } from '../config.js';
import { W } from '../constants.js';
import { TAU, reducedMotion, makeSprite, seeded } from './util.js';

export const SeaLife = (() => {
  const L = CONFIG.sealife, C = CONFIG.colors;
  const MARGIN = 90, SPAN = W + 2 * MARGIN;   // creatures wrap around off screen, school and all
  const TAIL_FRAMES = 6, TAIL_SPEED = 0.012;  // tail beats: frames per cycle, radians per ms
  const JELLY_FRAMES = 8, JELLY_R = 7;        // tentacle wave frames; bell radius the sprites are drawn at
  const SMALL = 11, BIG = 24;                 // fish lengths the sprites are drawn at
  let scale = 1, small = [], big = [], jelly = [], jellyGlow = [];

  // Draws `paint` onto a sprite softened by `blur` px. The box is w × h around the
  // creature's origin, which sits at (ox, oy) inside it.
  function softSprite(w, h, ox, oy, blur, paint) {
    const pad = Math.ceil(blur * 3), sw = w + 2 * pad, sh = h + 2 * pad;
    const sharp = makeSprite(sw, sh, scale), soft = makeSprite(sw, sh, scale);
    sharp.g.translate(pad + ox, pad + oy);
    paint(sharp.g);
    soft.g.filter = `blur(${blur * scale}px)`;   // filter lengths are device px
    soft.g.drawImage(sharp.c, 0, 0, sw * scale, sh * scale, 0, 0, sw, sh);
    return { c: soft.c, w: sw, h: sh, ox: pad + ox, oy: pad + oy };
  }

  // Fish facing left, centred on the origin. `tail` swings the tail (radians), `fork`
  // runs from a square tail (0) to a deep fork (1), and `fins` lists dorsal fins as
  // [start, end] fractions of the length.
  function paintFish(g, len, tail, fork, fins) {
    const u = len;
    g.translate(-0.5 * u, 0);
    g.fillStyle = L.color;
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(0.06 * u, -0.17 * u, 0.36 * u, -0.19 * u, 0.74 * u, -0.04 * u);
    g.lineTo(0.74 * u, 0.04 * u);
    g.bezierCurveTo(0.36 * u, 0.16 * u, 0.08 * u, 0.13 * u, 0, 0);
    g.fill();
    for (const [a, b] of fins) {
      g.beginPath(); g.moveTo(a * u, -0.1 * u); g.quadraticCurveTo((a + 0.03) * u, -0.34 * u, b * u, -0.1 * u); g.fill();
    }
    g.translate(0.7 * u, 0); g.rotate(tail);
    g.beginPath();
    g.moveTo(0, -0.05 * u); g.lineTo(0.3 * u, -0.17 * u);
    g.lineTo((0.3 - 0.13 * fork) * u, 0);
    g.lineTo(0.3 * u, 0.17 * u); g.lineTo(0, 0.05 * u);
    g.closePath(); g.fill();
  }

  // Jellyfish, origin at the middle of the bell's rim. `wave` is the tentacles' phase.
  // The glow version only outlines the bell and traces the tentacles faintly.
  function paintJelly(g, r, wave, glow) {
    g.fillStyle = L.color; g.strokeStyle = glow ? C.cream : L.color; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-r, 0);
    g.bezierCurveTo(-r, -1.4 * r, r, -1.4 * r, r, 0);
    for (let i = 0; i < 4; i++) g.quadraticCurveTo(r - (i + 0.5) * r / 2, 0.24 * r, r - (i + 1) * r / 2, 0);   // scalloped rim
    if (glow) { g.lineWidth = 0.9; g.stroke(); } else g.fill();
    // thin tentacles, and two thicker oral arms in the middle
    const hang = (x, len, lw, amp, ph) => {
      g.lineWidth = lw;
      g.beginPath(); g.moveTo(x, 0);
      for (let y = 1; y <= len; y++) g.lineTo(x + Math.sin(y * 0.35 - wave + ph) * amp * y / len, y);
      g.stroke();
    };
    g.globalAlpha = glow ? 0.5 : 1;
    for (let i = 0; i < 5; i++) hang(-0.8 * r + i * 0.4 * r, 2.4 * r, 0.6, 0.22 * r, i * 1.3);
    if (!glow) for (const x of [-0.2 * r, 0.2 * r]) hang(x, 1.5 * r, 1.6, 0.14 * r, x);
    g.globalAlpha = 1;
  }

  function build(s) {
    scale = s;
    const b = L.blur;
    const tailAt = i => Math.sin(i / TAIL_FRAMES * TAU) * 0.35;
    // herring-sized fish: one dorsal fin, forked tail. Cod: three dorsal fins, squarer tail.
    small = Array.from({ length: TAIL_FRAMES }, (_, i) =>
      softSprite(SMALL * 1.2, SMALL * 0.6, SMALL * 0.6, SMALL * 0.3, b, g => paintFish(g, SMALL, tailAt(i), 1, [[0.36, 0.5]])));
    big = Array.from({ length: TAIL_FRAMES }, (_, i) =>
      softSprite(BIG * 1.2, BIG * 0.6, BIG * 0.6, BIG * 0.3, b, g => paintFish(g, BIG, tailAt(i), 0.25, [[0.22, 0.33], [0.37, 0.5], [0.54, 0.66]])));
    const r = JELLY_R, jw = 2.8 * r, jh = 3.6 * r;
    jelly = Array.from({ length: JELLY_FRAMES }, (_, i) =>
      softSprite(jw, jh, jw / 2, 1.1 * r, b, g => paintJelly(g, r, i / JELLY_FRAMES * TAU, false)));
    jellyGlow = Array.from({ length: JELLY_FRAMES }, (_, i) =>
      softSprite(jw, jh, jw / 2, 1.1 * r, b * 1.5, g => paintJelly(g, r, i / JELLY_FRAMES * TAU, true)));
  }

  // ── Where everything swims ──
  // x0: start position, v: own speed in px/ms (negative = leftwards), par: parallax.
  // A group moves as one; its members keep their offsets, and each has its own size (k),
  // tail rhythm and bob.
  const groups = (() => {
    const r = seeded(83);
    const member = (dx, dy, k) => ({ dx, dy, k, phase: r() * TAU, bob: 0.6 + r() * 1.2 });
    const school = Array.from({ length: 6 }, (_, i) => member(i * 10 + r() * 7, (r() - 0.5) * 20, 0.8 + r() * 0.3));
    return [
      // a small school swimming left, so the ROV passes it
      { x0: r() * SPAN, y: 104 + r() * 20, v: -0.012, par: L.parallax, big: false, members: school },
      // a lone cod swimming right, slower than the ROV, so it falls behind during a run
      { x0: r() * SPAN, y: 178 + r() * 16, v: 0.006, par: L.parallax * 0.85, big: true, members: [member(0, 0, 1)] }
    ];
  })();

  const jellies = (() => {
    const r = seeded(97);
    return [{ y: 128, size: 6.5 }, { y: 238, size: 8 }].map((j, i) => ({
      ...j, x0: (i + 0.2 + r() * 0.6) * SPAN / 2, v: -0.002 - r() * 0.002, phase: r() * TAU
    }));
  })();

  const place = (x0, v, par, t, worldX) => (((x0 + v * t - worldX * par) % SPAN) + SPAN) % SPAN - MARGIN;
  const frameAt = (cycle, n) => Math.floor((cycle / TAU % 1 + 1) % 1 * n);

  function blit(g, s, x, y, kx, ky, angle = 0) {
    g.save();
    g.translate(x, y); g.rotate(angle); g.scale(kx, ky);
    g.drawImage(s.c, -s.ox, -s.oy, s.w, s.h);
    g.restore();
  }

  // light: 1 with full surface light (shallow stage), 0 in the dark stages.
  function draw(g, t, worldX, light) {
    const sil = L.alpha * light, glow = L.glow * (1 - light);
    const still = reducedMotion();
    if (sil > 0.003) {
      g.globalAlpha = sil;
      for (const s of groups) {
        const x = place(s.x0, s.v, s.par, t, worldX), face = s.v > 0 ? -1 : 1;   // sprites face left
        const sprites = s.big ? big : small;
        for (const m of s.members) {
          const f = still ? 0 : frameAt(t * TAIL_SPEED + m.phase, TAIL_FRAMES);
          const bob = still ? 0 : Math.sin(t * 0.0011 + m.phase) * m.bob;
          blit(g, sprites[f], x + m.dx, s.y + m.dy + bob, face * m.k, m.k);
        }
      }
    }
    for (const j of jellies) {
      // a slow pulse: the bell squeezes in and lifts a little, then relaxes
      const ph = t * 0.0024 + j.phase, p = still ? 0 : Math.sin(ph);
      const x = place(j.x0, j.v, L.parallax, t, worldX);
      const y = j.y + (still ? 0 : Math.sin(t * 0.0005 + j.phase) * 5 - Math.max(0, p) * 1.5);
      const k = j.size / JELLY_R, sx = k * (1 - 0.08 * p), sy = k * (1 + 0.07 * p);
      const tilt = still ? 0 : Math.sin(t * 0.0004 + j.phase) * 0.12;
      const f = still ? 0 : frameAt(ph * 0.5, JELLY_FRAMES);
      if (sil > 0.003) { g.globalAlpha = sil; blit(g, jelly[f], x, y, sx, sy, tilt); }
      if (glow > 0.003) { g.globalAlpha = glow; blit(g, jellyGlow[f], x, y, sx, sy, tilt); }
    }
    g.globalAlpha = 1;
  }

  return { build, draw };
})();
