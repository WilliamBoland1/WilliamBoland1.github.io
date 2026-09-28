// ══════════════════════════════════════════════════════════════════
// PLAYER: yellow ROV with porthole, headlamp, tether and bubbles.
// Visual only: position and hitbox still come from `bird`.
// ══════════════════════════════════════════════════════════════════
import { CONFIG } from '../config.js';
import { PS, STEP } from '../constants.js';
import { TAU, clamp, rand, particleScale, makeSprite, roundRectPath } from './util.js';

export const Rov = (() => {
  const R = CONFIG.rov, C = CONFIG.colors, T = CONFIG.tether, B = CONFIG.bubbles;
  const SPR = { w: 54, h: 34, ox: 29, oy: 15 };   // sprite box and origin (ROV centre)
  const LAMP = { x: 17, y: 5 };                    // headlamp position in ROV space
  const ANCHOR = -26;                              // tether attaches at the thruster
  let sprite, scale = 1, lampGlow = null;

  function buildSprite() {
    const { c, g } = makeSprite(SPR.w, SPR.h, scale);
    g.translate(SPR.ox, SPR.oy);
    // skids and frame legs
    g.fillStyle = C.rovFrame;
    roundRectPath(g, -15, 11, 30, 3, 1.5); g.fill();
    g.fillRect(-11, 8, 2, 4); g.fillRect(9, 8, 2, 4);
    // rear thruster with a brass ring
    roundRectPath(g, -26, -5, 9, 10, 2); g.fill();
    g.fillStyle = C.brass; g.fillRect(-23, -5, 1.5, 10);
    // body
    const body = g.createLinearGradient(0, -11, 0, 10);
    body.addColorStop(0, C.rovLight);
    body.addColorStop(0.45, C.rovBody);
    body.addColorStop(1, C.rovShade);
    g.fillStyle = body;
    roundRectPath(g, -18, -11, 34, 21, 6); g.fill();
    g.strokeStyle = 'rgba(70,45,0,0.5)'; g.lineWidth = 1; g.stroke();
    // frame bar and a thin highlight along the top
    g.fillStyle = 'rgba(35,40,44,0.5)'; g.fillRect(-9, -11, 2, 21);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-13, -9.5, 22, 1.2);
    // porthole: brass rim, deep glass, small highlight
    g.fillStyle = C.brass;
    g.beginPath(); g.arc(7, -1, 7.5, 0, TAU); g.fill();
    g.strokeStyle = C.brassDark; g.lineWidth = 0.8; g.stroke();
    const glass = g.createRadialGradient(5.5, -3, 0.5, 7, -1, 5.5);
    glass.addColorStop(0, C.glass);
    glass.addColorStop(1, C.glassDeep);
    g.fillStyle = glass;
    g.beginPath(); g.arc(7, -1, 5.5, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.beginPath(); g.arc(5, -3.3, 1.5, 0, TAU); g.fill();
    // headlamp housing
    g.fillStyle = C.brassDark;
    g.beginPath(); g.arc(LAMP.x - 0.5, LAMP.y, 2.6, 0, TAU); g.fill();
    g.fillStyle = C.cream;
    g.beginPath(); g.arc(LAMP.x, LAMP.y, 1.6, 0, TAU); g.fill();
    return c;
  }

  function build(s) { scale = s; sprite = buildSprite(); lampGlow = null; }

  // ── Tether: points chase the one in front of them, which gives the lag ──
  const tether = { owner: null, pts: [], broken: false, age: 0 };

  function resetTether(ax, ay) {
    tether.pts = [];
    for (let i = 0; i < T.segments; i++) tether.pts.push({ x: ax - (i + 1) * T.spacing, y: ay, vx: 0, vy: 0 });
    tether.broken = false; tether.age = 0;
  }

  function updateTether(ax, ay, dt, snapped) {
    if (snapped && !tether.broken) {
      // "Tauet røk!": let the tether go and drift away
      tether.broken = true; tether.age = 0;
      tether.pts.forEach((p, i) => { p.vx = -T.snapDrift * (0.6 + i * 0.12); p.vy = rand(-0.01, 0.02); });
    }
    if (tether.broken) {
      tether.age += dt;
      for (const p of tether.pts) { p.x += p.vx * dt; p.y += p.vy * dt; }
      return;
    }
    const k = 1 - Math.exp(-T.follow * dt);
    const maxDy = T.spacing * T.stretch;           // keeps the tether short when the ROV moves fast
    let prevY = ay;
    tether.pts.forEach((p, i) => {
      p.x = ax - (i + 1) * T.spacing;
      p.y += (prevY - p.y) * k;
      p.y = clamp(p.y, prevY - maxDy, prevY + maxDy);
      prevY = p.y;
    });
  }

  function drawTether(g, ax, ay, t) {
    const alpha = tether.broken ? 1 - tether.age / T.snapFade : 1;
    if (alpha <= 0) return;
    const pts = tether.pts.map((p, i) => ({
      x: p.x,
      y: p.y + Math.sin(t * T.wobbleSpeed + i * 0.9) * T.wobble * (i + 1) / T.segments
    }));
    if (!tether.broken) pts.unshift({ x: ax, y: ay });
    g.globalAlpha = alpha * 0.9;
    g.strokeStyle = C.tether; g.lineWidth = 1.6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      g.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
    }
    const end = pts[pts.length - 1];
    g.lineTo(end.x, end.y); g.stroke();
    g.globalAlpha = 1;
  }

  // ── Bubbles: pooled so flapping never allocates ──
  const bubbles = Array.from({ length: B.pool }, () => ({ on: false, x: 0, y: 0, r: 0, age: 0, seed: 0 }));

  function emitBubbles(x, y) {
    let n = Math.max(1, Math.round(B.perFlap * particleScale()));
    for (const b of bubbles) {
      if (n === 0) break;
      if (b.on) continue;
      b.on = true; b.age = 0; b.seed = rand(0, TAU);
      b.x = x + rand(-3, 3); b.y = y + rand(-3, 3); b.r = rand(B.minR, B.maxR);
      n--;
    }
  }

  function updateBubbles(dt, worldMoving) {
    const drift = worldMoving ? PS / STEP : 0;     // bubbles drift with the scrolling world
    for (const b of bubbles) {
      if (!b.on) continue;
      b.age += dt;
      if (b.age > B.life || b.y < -10) { b.on = false; continue; }
      b.y -= B.rise * dt * (0.7 + b.r / B.maxR * 0.5);
      b.x += (Math.sin(b.age * 0.008 + b.seed) * 0.02 - drift) * dt;
    }
  }

  function drawBubbles(g) {
    g.strokeStyle = C.cream; g.fillStyle = C.cream; g.lineWidth = 0.9;
    for (const b of bubbles) {
      if (!b.on) continue;
      g.globalAlpha = (1 - b.age / B.life) * 0.7;
      g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.stroke();
      g.beginPath(); g.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.3, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
  }

  // ── Per-frame entry point ──
  let lastFlap = 0;
  // lamp: headlamp strength (brighter in the deeper stages)
  function frame(g, b, x, y, t, dt, st, lamp = R.lampAlpha) {
    const tilt = clamp(b.angle, R.tiltMin, R.tiltMax) * Math.PI / 180;
    const cos = Math.cos(tilt), sin = Math.sin(tilt);
    const ax = x + ANCHOR * cos, ay = y + ANCHOR * sin;

    if (tether.owner !== b) { tether.owner = b; resetTether(ax, ay); lastFlap = 0; }
    // a new flap (flap counter jumped up) releases a few bubbles from the thruster
    if (b.flap > lastFlap) emitBubbles(x - 20 * cos + 6 * sin, y - 20 * sin - 6 * cos);
    lastFlap = b.flap;

    updateTether(ax, ay, dt, st === 'dead');
    updateBubbles(dt, st === 'playing');

    drawTether(g, ax, ay, t);
    drawBubbles(g);

    g.save();
    g.translate(x, y); g.rotate(tilt);
    // soft headlamp glow, stretched forward
    if (!lampGlow) {
      lampGlow = g.createRadialGradient(0, 0, 2, R.lampReach * 0.3, 0, R.lampReach);
      lampGlow.addColorStop(0, `rgba(${C.lamp},1)`);
      lampGlow.addColorStop(0.35, `rgba(${C.lamp},0.35)`);
      lampGlow.addColorStop(1, `rgba(${C.lamp},0)`);
    }
    g.save();
    g.translate(LAMP.x, LAMP.y); g.scale(1, 0.55);
    g.globalAlpha = lamp; g.fillStyle = lampGlow;
    g.beginPath(); g.arc(R.lampReach * 0.3, 0, R.lampReach, 0, TAU); g.fill();
    g.restore();
    g.drawImage(sprite, -SPR.ox, -SPR.oy, SPR.w, SPR.h);
    g.restore();
  }

  return { build, frame };
})();
