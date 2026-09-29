# Dypdykk 110: handover

Read this before changing anything in `game.html` or `dypdykk/`. For how to check that a
change didn't alter gameplay, see [TESTING.md](TESTING.md).

## What this is

"Dypdykk 110" is an underwater reskin of the Flappy Bird clone that used to be called
"Flakse Fugl". It was made for **Mannhullet's 110th anniversary**; Mannhullet is the marine
technology student association at NTNU. It will be embedded on the jubilee website and used for
**weekly Monday–Friday score contests**. The player steers a yellow ROV between beer crates hanging on
ropes from above and shipping containers stacked on the seabed, and the water changes colour
with depth as the score rises.

- Live URL: `https://williamboland1.github.io/game.html`
- The code has no build step and no dependencies, apart from Firebase and Google Fonts
  loaded from their CDNs.
- All reskin work is in commit `4a248a6`, "Add styling and structure for Dypdykk 110 game interface".

## Rules that must hold

These came from the original brief. They exist because the game is used for score contests.

1. **Gameplay never changes.** Gravity, flap strength, speed, gap size, pipe spacing, the
   hitbox and scoring must stay exactly as they are. All of them live in
   [js/constants.js](js/constants.js), in `collides()` and `step()` in
   [js/main.js](js/main.js), and in `makePipe()`. Nothing gets harder or easier during a run.
2. **The scoreboard code is not modified.** [js/scoreboard.js](js/scoreboard.js) is the
   original Firebase code, moved without edits. The only change is the translated "no scores
   yet" message.
3. **No new gameplay features:** no power-ups, collectibles, levels, or history/timeline content.
4. **No image files.** Everything is drawn with canvas paths and gradients, or inline SVG.
   (The beer crate was considered as a PNG and kept in canvas on purpose.)
5. **Calm heritage look:** navy, cream and brass colours, Fraunces for titles, JetBrains Mono
   for numbers and labels. No neon and no arcade look.
6. **All player-facing text is in Norwegian bokmål.**

If a request conflicts with one of these rules, ask William before doing it.

## Decisions made along the way (all approved by William)

| Decision | Why |
| --- | --- |
| **Fixed 60 Hz timestep.** `step()` holds the original per-frame update, run exactly 60×/s. Pipe spawning counts steps (`(simStep-lastPipe)*STEP > PINT`) instead of real time. | The original ran physics once per display frame but spawned pipes on a real-time clock, so 120 Hz screens got double speed and double pipe spacing. That's unfair in a contest. On a 60 Hz screen the game plays as it did before. |
| **The first pipe always appears 1.6 s into a run.** | It's a side effect of the fixed step. Before, starting from the menu after waiting more than 1.6 s spawned a pipe immediately, while retrying waited 1.6 s. Now every run starts the same way. |
| **Obstacles: a beer crate on a rope above the gap, shipping containers below.** Replaced the steel bulkheads with a round brass collar, which read as a manhole and didn't work visually. | The crate's bottom and the top container's roof sit exactly on the gap edges, across the full 70 px width. Containers are stacked end-on from the gap down; the seabed covers the base of the lowest one. Their colour order comes from `topH`, not `Math.random` (see TESTING.md). |
| **Rope centred over the crate, and the top hitbox matches the drawing** (the only approved change to `collides()`). The top hitbox used to be a solid 70 px column with the rope drawn down its left edge. Now it's a full-width crate box (`CRATE` = 54 px: 44 px body + 10 px bottle necks) above the opening, plus a `ROPE` = 4 px column in the middle from the surface down to the crate. | Scores and survivable paths are unchanged. The new boxes lie inside the old column, so nothing that was safe became a crash. A ROV above the crate inside the column still can't get through: the crate blocks going down, the rope blocks going forward, and the ceiling kills going up. It just crashes a few steps later, at the rope. A pipe only scores once the ROV has passed it, so the later crash never adds a point. Checked by simulating 100 000 random runs with both hitboxes (see TESTING.md). |
| **No tether on the ROV.** | The trailing tether made the ROV look like a sperm cell. The crash title changed from "Tauet røk!" to "Kræsj!" to match. |
| **Scoreboard strings translated, logic untouched.** | Bokmål throughout. "Lagrer…", "Ny personlig rekord lagret!" and similar messages are in `gameOver()` in main.js; "Ingen poeng ennå" is in scoreboard.js. |
| **Replaced `game.html` in place** rather than making a new page. | The URL stays the same. The old Flakse Fugl is in git history (for example `cec7869:game.html`). |
| **Split into modules** (CSS file + ES modules). | Easier to maintain, and the obstacle style can be swapped as one file. The page already needed HTTP because of Firebase. |
| **Emoji medal hidden with CSS** (`#medal { display:none }`). `medal()` still runs. | The emoji didn't fit the heritage look. |
| **Depth haze over bulkheads.** | Without it, bright steel looked pasted onto the dark stages. |

## Architecture

```
game.html                    markup only; links style.css and js/main.js with ?v=110
dypdykk/
  style.css                  colour tokens (:root), brass frame, screens, leaderboard
  js/constants.js            W, H, GH, PW, GAP, GR, JP, PS, PINT, STEP, CRATE, ROPE. DO NOT CHANGE.
  js/config.js               CONFIG: every visual value (colours, depth stages, particles…)
  js/main.js                 state, step(), loop(), render(), collides(), flap(), gameOver(),
                             pause/resume, input, fitCanvas() (high-DPI sizing)
  js/scoreboard.js           Firebase: nameKey, submitScore, onValue → renderLB. DO NOT CHANGE.
  js/render/util.js          pure helpers: makeSprite, drawBolt, colours, reducedMotion()
  js/render/obstacle.js      Obstacle.build(scale) / draw(ctx, pipe, x): crate, rope, containers
  js/render/rov.js           Rov.build(scale) / frame(ctx, bird, x, y, t, dt, state, lamp): ROV + bubbles
  js/render/background.js    Background.build / update / drawBack / drawFront / drawGround / lamp
```

**Data flow.** `main.js` owns all game state. The render modules import only `config.js`,
`constants.js` and `util.js`, and receive what they need as arguments. They must never write
to game state. Keep it that way, because it is what makes visual changes safe.

**Frame order** (`render()` in main.js): water gradient → seabed glow → light rays → far
silhouettes → far snow → near silhouettes → obstacles (rope, crate, containers) → depth haze +
near snow → seabed strip → bubbles, headlamp, ROV.

**Timing.**
- `loop()` adds real frame time to an accumulator and runs `step()` in 1000/60 ms slices,
  at most 5 per frame.
- It snaps small timer jitter, so a 60 Hz screen gets exactly one step per frame.
- Between steps, positions are projected forward by `acc/STEP` for smooth drawing on
  90/120 Hz screens. That offset is 0 at 60 Hz.
- Visual effects use real `dt`.
- `worldX = (simStep + a) * PS` drives everything that scrolls, so the seabed moves in exact
  step with the obstacles.

**Canvas sizing.**
- CSS sets the on-screen size with `--game-w` in style.css: it fits the viewport, keeps the
  2:3 shape and caps at 480 px.
- `fitCanvas()` sizes the backing store to CSS size × devicePixelRatio (max 3) and sets a
  transform so the game always works in 360×540 units.
- It then rebuilds the sprites at the new scale and redraws immediately, because resizing a
  canvas clears it.

**Performance.**
- The rope strip, crate, three container colours, ROV body, silhouettes and the seabed tile
  are pre-rendered once per resize into offscreen canvases.
- Marine snow is drawn as one path per depth layer, and bubbles come from a fixed pool.
- Measured about 0.4 ms per frame at a 990×1485 canvas, and about 2 ms (6.7 ms at worst)
  with 4× CPU throttle.

**States.** `idle` (start screen, ROV bobs) → `playing` → `dead` (game-over screen after
600 ms). `paused` is entered when the tab is hidden during play; a tap or Space resumes.

**Input.**
- Everything goes through `press()`: keyboard Space or ArrowUp, and pointerdown on the canvas.
- On the start screen, the start button, Enter, and tapping anywhere except the input or
  buttons all go through the original `flap()` start path.
- An empty name shakes the input.
- Space typed into the name field starts the game, as it did in the original, so names can't
  contain spaces.

## Common tasks

- **Tweak colours, depth stages or particle counts:** edit [js/config.js](js/config.js).
  Page colours are the tokens at the top of [style.css](style.css).
- **Restyle the obstacles:** write a new `render/obstacle.js` that exports `Obstacle` with the
  same `build(scale)` and `draw(ctx, pipe, x)`. The hitboxes are: `x-6` to `x+PW+6` from
  `pipe.topH-CRATE` to `pipe.topH` (crate) and below `pipe.topH+GAP` (containers), plus a
  `ROPE`-wide column centred on the pipe from the top of the screen down to the crate. Draw on
  those boxes, especially the gap edges, the crate top and the rope.
- **Change text:** screens are in `game.html`, save messages in `gameOver()` in main.js, and
  the empty-leaderboard message is in scoreboard.js.
- **Release:** commit, push, and bump `?v=110` on both links in `game.html`.
- **Embed on the jubilee site:** use an `<iframe src="https://williamboland1.github.io/game.html">`
  (the layout works down to phone width), or copy `game.html` **and** the `dypdykk/` folder.

## Open items and known limitations

Nothing is broken. These are the items still open:

1. **Not tested on real devices yet.** Everything was verified in headless Chrome only.
   Still to do: a mid-range phone (touch start, frame rate), a 120 Hz screen (speed should
   match 60 Hz), Safari/iOS, and the live leaderboard with a real score.
2. **There is no weekly reset.** `scores/` keeps each name's best score of all time, and it
   still holds scores from the old Flakse Fugl game. Running Monday–Friday contests needs a
   plan: clear `scores/` manually in the Firebase console each Monday, or change the path.
   Changing the path touches scoreboard.js and needs William's approval.
3. **The leaderboard can be cheated.** Scores are written from the browser, so anyone can post
   a fake score with DevTools unless the Firebase security rules prevent it. The rules haven't
   been reviewed. This is outside the reskin's scope, but it matters for prizes.
4. **Cache-busting covers only the entry files.** `?v=` is on `style.css` and `main.js`, but
   not on the modules `main.js` imports. For up to about 10 minutes after a deploy, a
   returning visitor could mix old and new modules. If that matters, add `?v=` to the imports
   too.
5. **Leftovers:** `images/image.jpg` (the old bird texture) is no longer used. `medal()` still
   runs but is hidden.
