// Game constants: physics, difficulty and playfield size.
// These values are the original Flakse Fugl tuning. Do not change them:
// the weekly score contests depend on every run playing the same.
// The one approved exception is the difficulty step at the bottom.

// Logical playfield size in px. The canvas is scaled for the screen, but the game always runs in these units.
export const W = 360, H = 540;

// GH ground height, PW pipe width, GAP opening height, GR gravity,
// JP flap velocity, PS pipe speed (px/step), PINT ms between pipes
export const GH=55, PW=58, GAP=170, GR=0.44, JP=-8.5, PS=3, PINT=1600;

// Upper obstacle hitbox: CRATE is the full-width crate box above the opening
// (44 px body + 10 px bottle necks), ROPE the width of the rope centred above it.
export const CRATE=54, ROPE=4;

// Difficulty step (approved by William, ?v=119): obstacles spawned once the
// score reaches HARD_AT get the narrower HARD_GAP opening instead of GAP.
export const HARD_AT=20, HARD_GAP=155;

// Fixed simulation step: the game updates exactly 60 times per second on every display.
export const STEP = 1000/60;
