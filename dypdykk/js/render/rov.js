// ══════════════════════════════════════════════════════════════════
// PLAYER: yellow toy-bathyscaphe ROV with porthole, headlamp and bubbles.
// Visual only: position and hitbox still come from `bird`.
// ══════════════════════════════════════════════════════════════════
import { CONFIG } from '../config.js';
import { PS, STEP } from '../constants.js';
import { TAU, clamp, rand, particleScale, makeSprite, roundRectPath } from './util.js';

export const Rov = (() => {
  const R = CONFIG.rov, C = CONFIG.colors, B = CONFIG.bubbles;
  const SPR = { w: 54, h: 34, ox: 29, oy: 15 };   // sprite box and origin (ROV centre)
  const LAMP = { x: 17, y: 5 };                    // headlamp position in ROV space
  let sprite, scale = 1, lampGlow = null;

  // A toy bathyscaphe: round-nosed hull with a big porthole, a brass band and hatch,
  // two raked skid-fins, and a ducted thruster that hangs a little low, with a tail fin.
  // It fills the same box as before, around the unchanged hitbox (±14 × ±10).
  function buildSprite() {
    const { c, g } = makeSprite(SPR.w, SPR.h, scale);
    g.translate(SPR.ox, SPR.oy);
    const outline = 'rgba(70,45,0,0.5)';
    // skid-fins under the belly, raked back, each on a small brass shoe (the hull covers their roots)
    for (const fx of [-7, 8]) {
      g.fillStyle = C.rovFrame;
      g.beginPath();
      g.moveTo(fx - 3, 7); g.lineTo(fx + 3, 7);
      g.quadraticCurveTo(fx + 1.5, 10.5, fx - 1, 12.5);
      g.lineTo(fx - 5, 12.5);
      g.quadraticCurveTo(fx - 4.5, 10, fx - 3, 7);
      g.fill();
      g.fillStyle = C.brass;
      roundRectPath(g, fx - 6.5, 12, 7, 1.8, 0.9); g.fill();
    }
    // ducted thruster: flares toward the back, more below than above
    const duct = g.createLinearGradient(0, -5, 0, 9);
    duct.addColorStop(0, '#3E474D');
    duct.addColorStop(1, C.rovFrame);
    g.fillStyle = duct;
    g.beginPath();
    g.moveTo(-14, -2.5); g.lineTo(-24.5, -3.8);
    g.quadraticCurveTo(-26.5, 2, -24.5, 7.8);
    g.lineTo(-14, 5.5);
    g.closePath(); g.fill();
    // propeller hub, then the brass ring on the duct's rim, seen edge-on
    g.fillStyle = C.brass;
    g.beginPath(); g.moveTo(-25, 0.3); g.lineTo(-28.5, 2); g.lineTo(-25, 3.7); g.fill();
    g.strokeStyle = C.brass; g.lineWidth = 1.3;
    g.beginPath(); g.ellipse(-24.7, 2, 1.2, 5.6, 0, 0, TAU); g.stroke();
    // tail fin on top of the duct
    g.fillStyle = C.rovShade;
    g.beginPath();
    g.moveTo(-12, -7); g.lineTo(-21.5, -3.8); g.lineTo(-24, -10.5);
    g.quadraticCurveTo(-22.8, -12.6, -19.5, -11.6);
    g.closePath(); g.fill();
    g.strokeStyle = outline; g.lineWidth = 0.8; g.stroke();
    // hull: domed top curving into a big round nose, a flat belly, a rounded stern
    const hull = () => {
      g.beginPath();
      g.moveTo(-9, -11);
      g.bezierCurveTo(1, -12.5, 10, -12, 13.5, -5.5);
      g.bezierCurveTo(16.5, 0, 15, 8, 8, 9);
      g.lineTo(-10, 9);
      g.bezierCurveTo(-15.5, 9, -17, 5, -17, 0);
      g.bezierCurveTo(-17, -7, -14.5, -11, -9, -11);
      g.closePath();
    };
    const body = g.createLinearGradient(0, -12, 0, 9);
    body.addColorStop(0, C.rovLight);
    body.addColorStop(0.45, C.rovBody);
    body.addColorStop(1, C.rovShade);
    g.fillStyle = body;
    hull(); g.fill();
    // brass band around the hull, with rivets
    g.save(); hull(); g.clip();
    const band = g.createLinearGradient(-9, 0, -4, 0);
    band.addColorStop(0, C.brass);
    band.addColorStop(0.4, C.brassLight);
    band.addColorStop(1, C.brass);
    g.fillStyle = band; g.fillRect(-9, -13, 4.5, 23);
    g.fillStyle = 'rgba(60,40,10,0.45)'; g.fillRect(-9, -13, 0.6, 23); g.fillRect(-5.1, -13, 0.6, 23);
    g.fillStyle = C.brassDark;
    for (const ry of [-6.5, -1, 4.5]) { g.beginPath(); g.arc(-6.75, ry, 0.7, 0, TAU); g.fill(); }
    g.restore();
    hull(); g.strokeStyle = outline; g.lineWidth = 1; g.stroke();
    // hatch on top of the band
    const hatch = g.createLinearGradient(0, -14.5, 0, -11);
    hatch.addColorStop(0, C.brassLight);
    hatch.addColorStop(1, C.brassDark);
    g.fillStyle = hatch;
    g.beginPath(); g.ellipse(-6.75, -11.2, 3.6, 2.9, 0, Math.PI, TAU); g.fill();
    g.fillStyle = C.brassDark; roundRectPath(g, -11, -11.7, 8.5, 1.4, 0.7); g.fill();
    // sheen along the top
    g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-14.5, -5); g.quadraticCurveTo(-13, -9.6, -8, -9.9); g.moveTo(-3, -10.2); g.quadraticCurveTo(0, -10.5, 1, -10.4); g.stroke();
    // porthole: brass rim with small bolts, deep glass, small highlight
    g.fillStyle = C.brass;
    g.beginPath(); g.arc(6, -1, 7.5, 0, TAU); g.fill();
    g.strokeStyle = C.brassDark; g.lineWidth = 0.8; g.stroke();
    g.fillStyle = C.brassDark;
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8 + TAU / 16;
      g.beginPath(); g.arc(6 + Math.cos(a) * 6.5, -1 + Math.sin(a) * 6.5, 0.45, 0, TAU); g.fill();
    }
    const glass = g.createRadialGradient(4.5, -3, 0.5, 6, -1, 5.5);
    glass.addColorStop(0, C.glass);
    glass.addColorStop(1, C.glassDeep);
    g.fillStyle = glass;
    g.beginPath(); g.arc(6, -1, 5.5, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.beginPath(); g.arc(4, -3.3, 1.5, 0, TAU); g.fill();
    // headlamp housing under the nose
    g.fillStyle = C.brassDark;
    g.beginPath(); g.arc(LAMP.x - 0.5, LAMP.y, 2.6, 0, TAU); g.fill();
    g.fillStyle = C.cream;
    g.beginPath(); g.arc(LAMP.x, LAMP.y, 1.6, 0, TAU); g.fill();
    return c;
  }

  function build(s) { scale = s; sprite = buildSprite(); lampGlow = null; }

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
  let owner = null, lastFlap = 0;
  // lamp: headlamp strength (brighter in the deeper stages)
  function frame(g, b, x, y, t, dt, st, lamp = R.lampAlpha) {
    const tilt = clamp(b.angle, R.tiltMin, R.tiltMax) * Math.PI / 180;
    const cos = Math.cos(tilt), sin = Math.sin(tilt);

    if (owner !== b) { owner = b; lastFlap = 0; }     // new run: new bird object
    // a new flap (flap counter jumped up) releases a few bubbles from the thruster duct
    if (b.flap > lastFlap) emitBubbles(x - 27 * cos - 2 * sin, y - 27 * sin + 2 * cos);
    lastFlap = b.flap;

    updateBubbles(dt, st === 'playing');
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
