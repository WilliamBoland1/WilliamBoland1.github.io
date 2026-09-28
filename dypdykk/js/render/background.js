// ══════════════════════════════════════════════════════════════════
// BACKGROUND: depth-stage water colour, light rays, marine snow,
// seabed silhouettes and the scrolling seabed strip. Visual only.
// Everything that moves with the world is driven by `worldX`, which
// main.js derives from the simulation, so the seabed scrolls exactly
// in step with the bulkheads.
// ══════════════════════════════════════════════════════════════════
import { CONFIG } from '../config.js';
import { W, H, GH } from '../constants.js';
import { TAU, lerp, reducedMotion, particleScale, makeSprite, hexToRgb, rgbCss } from './util.js';

// Small seeded PRNG, so the scenery is the same on every visit
// (and never consumes Math.random, which the game uses for pipes).
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Point on a quadratic curve, used to place kelp leaves along a strand.
const quad = (p0, p1, p2, t) => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;

export const Background = (() => {
  const D = CONFIG.depth, S = CONFIG.scenery, C = CONFIG.colors;
  const FLOOR = H - GH;
  const FAR = { w: 540, h: 160 }, NEAR = { w: 720, h: 120 };

  // ── Depth stages ──
  const stages = D.stages.map(s => ({
    top: hexToRgb(s.top), mid: hexToRgb(s.mid), bot: hexToRgb(s.bot),
    rays: s.rays, lamp: s.lamp, glow: s.glow, haze: s.haze
  }));
  const copyStage = s => ({ top: [...s.top], mid: [...s.mid], bot: [...s.bot], rays: s.rays, lamp: s.lamp, glow: s.glow, haze: s.haze });
  const blend = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

  let cur = copyStage(stages[0]);   // what is on screen right now
  let from = stages[0], to = stages[0], progress = 1, stageIndex = 0;
  let waterGrad = null, groundTintCss = '', hazeCss = '', rayGrad = null, glowGrad = null;

  function updateStage(dt, score) {
    const idx = Math.floor(score / D.every) % stages.length;
    if (idx !== stageIndex) {
      // start a new cross-fade from whatever is showing now (even mid-fade)
      stageIndex = idx; from = copyStage(cur); to = stages[idx]; progress = 0;
    }
    if (progress < 1) {
      progress = Math.min(1, progress + dt / D.transitionMs);
      const e = progress * progress * (3 - 2 * progress);   // smoothstep: gentle start and finish
      cur.top = blend(from.top, to.top, e);
      cur.mid = blend(from.mid, to.mid, e);
      cur.bot = blend(from.bot, to.bot, e);
      cur.rays = lerp(from.rays, to.rays, e);
      cur.lamp = lerp(from.lamp, to.lamp, e);
      cur.glow = lerp(from.glow, to.glow, e);
      cur.haze = lerp(from.haze, to.haze, e);
      waterGrad = null;             // gradient is rebuilt only while a fade is running
    }
  }

  function drawWater(g) {
    if (!waterGrad) {
      waterGrad = g.createLinearGradient(0, 0, 0, FLOOR);
      waterGrad.addColorStop(0, rgbCss(cur.top));
      waterGrad.addColorStop(0.55, rgbCss(cur.mid));
      waterGrad.addColorStop(1, rgbCss(cur.bot));
      groundTintCss = rgbCss(cur.bot);
      hazeCss = rgbCss(cur.mid);
    }
    g.fillStyle = waterGrad;
    g.fillRect(0, 0, W, H);
  }

  // Warm lamp light pooling on the seabed (only in the deepest stage).
  function drawGlow(g) {
    if (cur.glow < 0.005) return;
    if (!glowGrad) {
      glowGrad = g.createRadialGradient(W / 2, FLOOR, 0, W / 2, FLOOR, W * 0.9);
      glowGrad.addColorStop(0, `rgba(${S.glow},1)`);
      glowGrad.addColorStop(1, `rgba(${S.glow},0)`);
    }
    g.globalAlpha = cur.glow;
    g.fillStyle = glowGrad;
    g.fillRect(0, 0, W, FLOOR);
    g.globalAlpha = 1;
  }

  // ── Light rays from the surface ──
  const rays = (() => {
    const r = seeded(7);
    return Array.from({ length: S.rays }, (_, i) => ({
      x: (i + 0.3 + r() * 0.4) * W / S.rays,
      top: 10 + r() * 18, bot: 50 + r() * 50,
      len: H * (0.5 + r() * 0.3), phase: r() * TAU
    }));
  })();

  function drawRays(g, t) {
    if (cur.rays < 0.002) return;
    if (!rayGrad) {
      rayGrad = g.createLinearGradient(0, 0, 0, H * 0.8);
      rayGrad.addColorStop(0, 'rgba(255,250,232,1)');
      rayGrad.addColorStop(1, 'rgba(255,250,232,0)');
    }
    const still = reducedMotion();
    g.fillStyle = rayGrad;
    for (const r of rays) {
      const off = still ? 0 : Math.sin(t * S.raySway + r.phase) * 10;
      const pulse = still ? 0.8 : 0.65 + 0.35 * Math.sin(t * 0.0005 + r.phase * 1.7);
      const lean = S.rayLean * r.len;
      g.globalAlpha = cur.rays * pulse;
      g.beginPath();
      g.moveTo(r.x - r.top / 2 + off, 0);
      g.lineTo(r.x + r.top / 2 + off, 0);
      g.lineTo(r.x + lean + r.bot / 2 + off * 1.6, r.len);
      g.lineTo(r.x + lean - r.bot / 2 + off * 1.6, r.len);
      g.closePath();
      g.fill();
    }
    g.globalAlpha = 1;
  }

  // ── Seabed silhouettes: rocks and kelp, pre-rendered as seamless tiles ──
  let scale = 1, farTile, nearTile, groundTile;

  function buildSilhouette({ w, h }, color, seed, rocks, kelps, kelpMax) {
    const { c, g } = makeSprite(w, h, scale);
    const r = seeded(seed);
    // Ridge line made of sines whose periods divide the tile width, so the tile wraps seamlessly.
    const p1 = r() * TAU, p2 = r() * TAU;
    const ridge = x => h * 0.62 + Math.sin(x * 2 * TAU / w + p1) * h * 0.1 + Math.sin(x * 5 * TAU / w + p2) * h * 0.05;
    g.fillStyle = color; g.strokeStyle = color; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w; x += 4) g.lineTo(x, ridge(x));
    g.lineTo(w, h); g.closePath(); g.fill();
    // Each shape is also drawn one tile width to each side, so nothing is cut at the seam.
    for (let i = 0; i < rocks; i++) {
      const x = r() * w, rw = 20 + r() * 40, rh = 10 + r() * 22, y = ridge(x) + 4;
      for (const ox of [-w, 0, w]) { g.beginPath(); g.ellipse(x + ox, y, rw / 2, rh, 0, Math.PI, TAU); g.fill(); }
    }
    for (let i = 0; i < kelps; i++) {
      const x = r() * w, len = kelpMax * (0.5 + r() * 0.5), base = ridge(x) + 6;
      const bend = (r() - 0.5) * 24, lw = 2 + r() * 2;
      for (const ox of [-w, 0, w]) {
        const x0 = x + ox, x1 = x0 + bend, x2 = x0 + bend * 0.3;
        g.lineWidth = lw;
        g.beginPath(); g.moveTo(x0, base); g.quadraticCurveTo(x1, base - len / 2, x2, base - len); g.stroke();
        for (let j = 1; j <= 4; j++) {            // small leaves along the strand
          const tt = j / 5, side = j % 2 ? 1 : -1;
          g.beginPath();
          g.ellipse(quad(x0, x1, x2, tt) + side * 4, quad(base, base - len / 2, base - len, tt), 5, 1.8, side * 0.6, 0, TAU);
          g.fill();
        }
      }
    }
    return c;
  }

  function drawTile(g, tile, { w, h }, factor, worldX) {
    const off = ((worldX * factor) % w + w) % w;
    const y = FLOOR - h + 8;
    g.drawImage(tile, -off, y, w, h);
    g.drawImage(tile, w - off, y, w, h);
  }

  // ── Seabed strip (the ground, which the ROV crashes into) ──
  // Nothing in the tile rises above the ground line, so the collision edge is exactly what you see.
  function buildGround() {
    const { c, g } = makeSprite(W, GH, scale);
    const r = seeded(31);
    const sand = g.createLinearGradient(0, 0, 0, GH);
    sand.addColorStop(0, S.sandTop);
    sand.addColorStop(1, S.sandBottom);
    g.fillStyle = sand; g.fillRect(0, 0, W, GH);
    g.fillStyle = 'rgba(255,240,210,0.18)'; g.fillRect(0, 0, W, 2);
    // soft sand ripples (periods divide W, so the tile wraps)
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1;
    for (let row = 0; row < 3; row++) {
      const y0 = 10 + row * 10, k = (6 + row * 2) * TAU / W;
      g.beginPath();
      for (let x = 0; x <= W; x += 3) g.lineTo(x, y0 + Math.sin(x * k + row) * 1.5);
      g.stroke();
    }
    // pebbles
    for (let i = 0; i < 40; i++) {
      const x = r() * W, y = 6 + r() * (GH - 10), rr = 0.8 + r() * 1.8;
      g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.16)' : 'rgba(255,240,210,0.12)';
      for (const ox of [-W, 0, W]) { g.beginPath(); g.ellipse(x + ox, y, rr * 1.4, rr, 0, 0, TAU); g.fill(); }
    }
    // half-buried rocks, tops below the ground line
    for (let i = 0; i < 3; i++) {
      const x = 40 + i * 120 + r() * 60, rw = 26 + r() * 30, rh = 9 + r() * 7, top = 5 + r() * 5;
      const rock = g.createLinearGradient(0, top, 0, top + rh);
      rock.addColorStop(0, S.rock);
      rock.addColorStop(1, S.rockDark);
      g.fillStyle = rock;
      for (const ox of [-W, 0, W]) { g.beginPath(); g.ellipse(x + ox, top + rh, rw / 2, rh, 0, Math.PI, TAU); g.fill(); }
    }
    return c;
  }

  // Short kelp tufts rooted in the sand, drawn live so they can sway.
  const groundKelp = (() => {
    const r = seeded(59);
    return Array.from({ length: 5 }, (_, i) => ({
      x: (i + r() * 0.8) * W / 5, len: 10 + r() * 8, blades: 2 + Math.floor(r() * 2), phase: r() * TAU
    }));
  })();

  function drawGround(g, t, worldX) {
    const off = ((worldX % W) + W) % W;
    g.drawImage(groundTile, -off, FLOOR, W, GH);
    g.drawImage(groundTile, W - off, FLOOR, W, GH);
    // tint so the seabed sits in the same water as everything above it
    g.globalAlpha = S.groundTint; g.fillStyle = groundTintCss; g.fillRect(0, FLOOR, W, GH); g.globalAlpha = 1;
    const amp = reducedMotion() ? 0.3 : 1;
    g.strokeStyle = S.kelp; g.lineCap = 'round'; g.lineWidth = 2;
    for (const k of groundKelp) {
      for (const ox of [0, W]) {
        const x = k.x - off + ox;
        if (x < -20 || x > W + 20) continue;
        for (let b = 0; b < k.blades; b++) {
          const bx = x + b * 3, sway = Math.sin(t * S.kelpSpeed + k.phase + b) * k.len * 0.35 * amp;
          g.beginPath();
          g.moveTo(bx, FLOOR + 6);
          g.quadraticCurveTo(bx + sway * 0.4, FLOOR + 6 - k.len / 2, bx + sway, FLOOR + 6 - k.len);
          g.stroke();
        }
      }
    }
  }

  // ── Marine snow: two parallax depths, drawn as one path per depth ──
  let snow = [], snowScale = -1, lastWorldX = null;

  function makeSnow() {
    snowScale = particleScale();
    const r = seeded(47), n = Math.round(S.snow * snowScale);
    snow = Array.from({ length: n }, (_, i) => ({
      x: r() * W, y: r() * FLOOR, size: 0.6 + r() * 1.1,
      near: i % 3 === 0, vy: 0.006 + r() * 0.01, phase: r() * TAU
    }));
  }

  function updateSnow(dt, dx, t) {
    if (snowScale !== particleScale()) makeSnow();   // reduced-motion setting changed
    for (const p of snow) {
      p.y += p.vy * dt;
      p.x -= dx * (p.near ? S.snowNear : S.snowFar) + S.snowDrift * dt - Math.sin(t * 0.001 + p.phase) * 0.004 * dt;
      if (p.y > FLOOR) p.y -= FLOOR + 4;
      if (p.x < -3) p.x += W + 6; else if (p.x > W + 3) p.x -= W + 6;
    }
  }

  function drawSnow(g, near) {
    g.fillStyle = C.cream;
    g.globalAlpha = near ? 0.5 : 0.28;
    g.beginPath();
    for (const p of snow) {
      if (p.near !== near) continue;
      g.moveTo(p.x + p.size, p.y);
      g.arc(p.x, p.y, p.size, 0, TAU);
    }
    g.fill();
    g.globalAlpha = 1;
  }

  return {
    // Pre-render the tiles at the canvas' device-pixel scale.
    build(s) {
      scale = s;
      waterGrad = rayGrad = glowGrad = null;
      farTile = buildSilhouette(FAR, S.silhouetteFar, 11, 6, 7, 110);
      nearTile = buildSilhouette(NEAR, S.silhouetteNear, 23, 5, 6, 80);
      groundTile = buildGround();
      if (!snow.length) makeSnow();
    },
    // Advance colours and particles. dt: real ms, score: current score, worldX: px scrolled.
    update(dt, score, t, worldX) {
      updateStage(dt, score);
      const dx = lastWorldX === null ? 0 : Math.max(0, worldX - lastWorldX);
      lastWorldX = worldX;
      updateSnow(dt, dx, t);
    },
    // Behind the bulkheads: water, glow, rays, far silhouettes, far snow, near silhouettes.
    drawBack(g, t, worldX) {
      drawWater(g);
      drawGlow(g);
      drawRays(g, t);
      drawTile(g, farTile, FAR, S.parallaxFar, worldX);
      drawSnow(g, false);
      drawTile(g, nearTile, NEAR, S.parallaxNear, worldX);
    },
    // In front of the bulkheads but behind the ROV: a faint wash of water colour
    // so the steel sits at the same depth as the scene, then the near snow.
    drawFront(g) {
      g.globalAlpha = cur.haze; g.fillStyle = hazeCss; g.fillRect(0, 0, W, FLOOR); g.globalAlpha = 1;
      drawSnow(g, true);
    },
    drawGround,
    // Headlamp strength for the current depth.
    get lamp() { return cur.lamp; }
  };
})();
