// Shared drawing helpers. Pure functions only: nothing here touches game state.
import { CONFIG } from '../config.js';

export const TAU = Math.PI * 2;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const rand = (lo, hi) => lo + Math.random() * (hi - lo);
export const lerp = (a, b, t) => a + (b - a) * t;

// Small seeded PRNG, so the scenery is the same on every visit
// (and never consumes Math.random, which the game uses for pipes).
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Reduced-motion users get fewer particles and calmer movement.
// Checked live, so toggling the OS setting takes effect without a reload.
const reducedMotionMQ = matchMedia('(prefers-reduced-motion: reduce)');
export const reducedMotion = () => reducedMotionMQ.matches;
export const particleScale = () => reducedMotion() ? CONFIG.reducedMotion.particleScale : 1;

// Offscreen canvas in logical px, backed at `scale` device px per logical px.
export function makeSprite(w, h, scale) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * scale); c.height = Math.ceil(h * scale);
  const g = c.getContext('2d');
  g.scale(scale, scale);
  return { c, g };
}

export function roundRectPath(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// Small domed fastener (the shackle on the crate's sling).
export function drawBolt(g, x, y, r, base, shine) {
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath(); g.arc(x + r * 0.35, y + r * 0.45, r * 1.1, 0, TAU); g.fill();
  g.fillStyle = base;
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.fillStyle = shine;
  g.beginPath(); g.arc(x - r * 0.3, y - r * 0.35, r * 0.38, 0, TAU); g.fill();
}

// '#RRGGBB' → [r, g, b]
export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

// 'rgba(r,g,b,a)' or 'rgb(r,g,b)' → [r, g, b, a]
export function parseRgba(css) {
  const [r, g, b, a = 1] = css.match(/[\d.]+/g).map(Number);
  return [r, g, b, a];
}

// [r, g, b] → CSS colour string
export const rgbCss = c => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
