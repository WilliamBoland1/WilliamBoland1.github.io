// ══════════════════════════════════════════════════════════════════
// VISUAL CONFIG: every look-and-feel tuning value lives here.
// Nothing in this object affects physics, difficulty or scoring.
// ══════════════════════════════════════════════════════════════════
export const CONFIG = {
  colors: {
    navy: '#0B1F3A', cream: '#F3E9D2',
    brass: '#B08D57', brassLight: '#DCC08A', brassDark: '#6E5530',
    steel: '#56626B', steelLight: '#7B8891', steelDark: '#2F383F', rivet: '#9AA6AE',
    rovBody: '#E9B82C', rovLight: '#F6D467', rovShade: '#B7861A', rovFrame: '#23282C',
    glass: '#8DB8C9', glassDeep: '#1D3E52',
    tether: '#E6DCC3',
    lamp: '255,238,196'          // rgb triple; alpha is applied in code
  },
  rov: {
    tiltMin: -18, tiltMax: 22,   // degrees: gentle visual clamp of the existing vy*4 angle
    lampAlpha: 0.28,             // headlamp glow strength
    lampReach: 72                // headlamp glow length in px
  },
  tether: {
    segments: 6,                 // points trailing the anchor
    spacing: 7,                  // px between points
    follow: 0.014,               // catch-up rate per ms; lower = more lag
    stretch: 0.7,                // max vertical offset per segment, as a fraction of spacing
    wobble: 1.4,                 // px sine wobble at the tail
    wobbleSpeed: 0.004,
    snapDrift: 0.045,            // px/ms the loose tether drifts after it snaps
    snapFade: 1400               // ms until the loose tether is gone
  },
  bubbles: {
    perFlap: 4, pool: 40,
    life: 1300,                  // ms
    minR: 1.2, maxR: 2.8,
    rise: 0.045                  // px/ms
  },
  obstacle: {
    lipHeight: 9,                // brass lip on each edge of the opening
    lipBolts: 3,
    collarWidth: 8,              // round brass collar drawn behind the opening
    collarBolts: 12,
    seamEvery: 96,               // px between horizontal plate seams
    rivetEvery: 16               // px between rivets along the plate edges
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
  reducedMotion: { particleScale: 0.4 }
};
