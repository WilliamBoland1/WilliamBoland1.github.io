// ══════════════════════════════════════════════════════════════════
// VISUAL CONFIG: every look-and-feel tuning value lives here.
// Nothing in this object affects physics, difficulty or scoring.
// ══════════════════════════════════════════════════════════════════
export const CONFIG = {
  colors: {
    navy: '#0B1F3A', cream: '#F3E9D2',
    brass: '#B08D57', brassLight: '#DCC08A', brassDark: '#6E5530',
    rovBody: '#E9B82C', rovLight: '#F6D467', rovShade: '#B7861A', rovFrame: '#23282C',
    glass: '#8DB8C9', glassDeep: '#1D3E52',
    rope: '#D9CBA6', ropeDark: '#8C7A55',
    crate: '#A23B2C', crateLight: '#C4553F', crateDark: '#6A2218', crateHole: 'rgba(30,10,8,0.7)',
    bottle: '#8A4A14', bottleLight: '#C98A3A', bottleDark: '#3E1F08',   // amber glass
    label: '#EFE3C4', labelBand: '#A23B2C',                                // bottle labels
    containerBar: '#B9BEC0',
    lamp: '255,238,196'          // rgb triple; alpha is applied in code
  },
  rov: {
    tiltMin: -18, tiltMax: 22,   // degrees: gentle visual clamp of the existing vy*4 angle
    lampAlpha: 0.28,             // headlamp glow strength
    lampReach: 72                // headlamp glow length in px
  },
  bubbles: {
    perFlap: 4, pool: 40,
    life: 1300,                  // ms
    minR: 1.2, maxR: 2.8,
    rise: 0.045                  // px/ms
  },
  obstacle: {
    // Crate height and rope width are the hitbox, so they live in constants.js (CRATE, ROPE).
    slingHeight: 18,             // sling from the crate's top corners up to the rope
    bottles: 5,                  // bottle necks showing above the crate rim
    crateFont: 'Fraunces, Georgia, serif',
    containerHeight: 74,         // one container, door end (2.44 × 2.59 m at 70 px wide)
    containers: [                // stacked in turn; the starting colour varies per obstacle
      { base: '#8A4A32', light: '#B0694C', dark: '#5E2F1F' },   // rust red
      { base: '#2F6468', light: '#4C8589', dark: '#1D4144' },   // faded teal
      { base: '#56683A', light: '#768A55', dark: '#384625' }    // dull green
    ]
  },
  depth: {
    every: 10,                   // points per depth stage
    transitionMs: 4000,          // slow cross-fade between stages
    // Water gradient (top / middle / bottom), light-ray strength, ROV lamp
    // strength, warm seabed glow, and haze (how much the water colour tints
    // the bulkheads) per stage. Loops after the last one.
    stages: [
      { top: '#7FBCD6', mid: '#4B93B8', bot: '#2A6A92', rays: 0.16,  lamp: 0.16, glow: 0,    haze: 0.08 }, // near the surface
      { top: '#3E86B0', mid: '#23628E', bot: '#154569', rays: 0.09,  lamp: 0.26, glow: 0,    haze: 0.16 }, // mid water
      { top: '#173F66', mid: '#0E2B4C', bot: '#081B33', rays: 0.035, lamp: 0.40, glow: 0,    haze: 0.30 }, // deep navy
      { top: '#0F2640', mid: '#1B2A36', bot: '#3B2D20', rays: 0,     lamp: 0.50, glow: 0.22, haze: 0.26 }  // lamp-lit seabed
    ]
  },
  scenery: {
    rays: 5,                     // light rays from the surface
    raySway: 0.00025,            // sway speed (per ms)
    rayLean: 0.18,               // horizontal lean per px of ray length
    snow: 60,                    // marine snow specks (scaled down for reduced motion)
    snowDrift: 0.004,            // px/ms leftward drift, even when the world is still
    parallaxFar: 0.15,           // far silhouettes, as a fraction of world speed
    parallaxNear: 0.35,          // near silhouettes
    snowFar: 0.2, snowNear: 0.45,
    silhouetteFar: 'rgba(5,18,36,0.30)',
    silhouetteNear: 'rgba(4,14,28,0.55)',
    sandTop: '#8A7654', sandBottom: '#4A3C29',
    rock: '#6A655C', rockDark: '#3A362F',
    kelp: '#4E6A3C', kelpSpeed: 0.0016,
    groundTint: 0.35,            // how strongly the seabed takes on the water colour
    glow: '255,186,110'          // rgb of the warm seabed glow
  },
  sealife: {                     // distant fish and jellyfish behind the far ridge
    color: '#061428',            // silhouette colour
    alpha: 0.24,                 // strength near the surface; fades with the light rays
    glow: 0.16,                  // faint cream rim on the jellyfish once the light is gone
    parallax: 0.12,              // fraction of world speed (the far ridge moves at 0.15)
    blur: 0.8                    // px of softening, so they sit in the murk like the ridges
  },
  reducedMotion: { particleScale: 0.4 }
};
