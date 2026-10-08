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
   [js/main.js](js/main.js), and in `makePipe()`. The one approved exception: obstacles that
   spawn once the score reaches `HARD_AT` (20) get the narrower `HARD_GAP` (155 px instead of
   170). Nothing else gets harder or easier during a run.
2. **The scoreboard code is not modified.** [js/scoreboard.js](js/scoreboard.js) is the
   original Firebase code, moved without edits. The only change is the translated "no scores
   yet" message.
3. **No new gameplay features:** no power-ups, collectibles, levels, or history/timeline content.
4. **No image files in the game.** Everything inside the frame is drawn with canvas paths and
   gradients, or inline SVG. (The beer crate was considered as a PNG and kept in canvas on purpose.)
   The one approved exception is page-level content outside the frame: the jubilee side banners
   (`ads/`) and the sponsor logos (`sponsors/`).
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
| **Kelp grows in clumps** in the seabed silhouettes: each plant gets one or two shorter sibling strands. | Single strands looked sparse. The siblings use their own seeded generator, so the main strands stay where they were. |
| **Distant sea life** (`render/sealife.js`): a small school of fish, a lone cod and two jellyfish, drawn behind the far ridge. | Adds life to the water without competing with the obstacles: faint, softened, and fading with the surface light. In the dark stages only a faint cream rim on the jellyfish remains. |
| **Leaderboard medallions and update flash.** The top three ranks sit on brass/silver/bronze medallions, a brass divider with a small porthole sits under the header, and a row glows when its score changes. | Done entirely from outside `scoreboard.js`: the medallions style its existing `gold`/`silver`/`bronze` classes, and `leaderboard-fx.js` watches `#lb-list` for redraws and marks the rows whose score changed. The first redraw after loading only records the scores. |
| **Jubilee side banners and a sponsor block** (`?v=117`). On screens at least 1240 px wide, a borderless banner card with rounded corners and a drop shadow, like the leaderboard card, sits at each end of the row. It is exactly as tall as the game frame, and the navy page shows around it. The leaderboard and a sponsor card now share a right column (`#sidebar`) that is exactly as tall as the frame. | Ad space for the jubilee and the sponsors, in the style of game portals' side ads. Image files are allowed here because they sit outside the game (rule 4). A banner keeps the artwork's 1:2 shape when there is room and gets slimmer on narrower screens, where `object-fit: cover` crops its sides; hence the safe zone below. Logos sit on cream plates so any logo colour reads on navy. HTML and CSS only: no JS changed, and the step-600 dump is identical. |
| **Phone, tablet and landscape fit** (`?v=118`, CSS only). The game height uses `100svh`, so it doesn't resize when the browser toolbar hides. The right column stacks under the game below 840 px (side by side needs 834 px; iPads in portrait used to get a 250 px wide, frame-tall column). Phones up to 460 px wide and screens under 500 px tall get the slim frame and a 10 px gutter. Short screens also hide the emblem and tighten the overlay screens. The name field is 16 px, and the page has `touch-action: manipulation`. | Safari zooms into inputs under 16 px and stays zoomed, and fast taps beside the game could double-tap zoom. Landscape phones give a game about 190 px wide: it stays usable, with no "rotate" hint by choice. |
| **Full names for the contest** (`?v=118`). A short rule under the name field (`#name-hint`): "Bruk fullt navn for å delta i konkurransen. Ett navn, én poengsum: din beste lagres." It brightens while the field has focus. The field takes 24 characters (was 16), the placeholder reads "Fullt navn…" and `autocomplete="name"` lets phones suggest the player's full name. Space in the field now types a space (one guard in the `keydown` listener in main.js, idle state only). | `scores/` keeps one record per name, so two players called "Ola" would share one score. `scoreboard.js` is unchanged: `nameKey()` turns spaces into `_` and keeps 20 characters, so names that match in their first 20 characters still share a record. |
| **Difficulty step at 20** (`?v=119`). Obstacles spawned once the score is 20 or more have a 155 px gap instead of 170 (`HARD_AT`, `HARD_GAP` in constants.js). `makePipe()` stores the gap on the pipe (`p.gap`), and `collides()` and `obstacle.js` read it from there. The `topH` range uses the same gap, so the top and bottom margins stay the same. | A small step up for good players. 20 is also the second depth-colour change, so the darker water signals it and no extra UI is needed. The gap is fixed when an obstacle spawns off-screen, so the 1–2 obstacles already in view when the score reaches 20 keep the wide gap. Below 20 nothing changed: same arithmetic, same `Math.random` calls, identical step-600 dump. Scores above about 20 from before `?v=119` are from an easier game, so release it at a weekly reset (clear `scores/` on Monday). |

## Architecture

```
game.html                    markup only; links style.css and js/main.js with ?v=110
dypdykk/
  style.css                  colour tokens (:root), brass frame, screens, leaderboard, side banners, sponsors
  ads/                       banner-venstre.jpg, banner-hoyre.jpg (side banners)
  sponsors/                  sponsor logos (SVG), referenced from #sponsors in game.html
  js/constants.js            W, H, GH, PW, GAP, GR, JP, PS, PINT, STEP, CRATE, ROPE, HARD_AT, HARD_GAP. DO NOT CHANGE.
  js/config.js               CONFIG: every visual value (colours, depth stages, particles…)
  js/main.js                 state, step(), loop(), render(), collides(), flap(), gameOver(),
                             pause/resume, input, fitCanvas() (high-DPI sizing)
  js/scoreboard.js           Firebase: nameKey, submitScore, onValue → renderLB. DO NOT CHANGE.
  js/leaderboard-fx.js       watches #lb-list and marks rows whose score changed (.fresh) for the CSS flash
  js/render/util.js          pure helpers: makeSprite, drawBolt, seeded() PRNG, colours, reducedMotion()
  js/render/obstacle.js      Obstacle.build(scale) / draw(ctx, pipe, x): crate, rope, containers
  js/render/rov.js           Rov.build(scale) / frame(ctx, bird, x, y, t, dt, state, lamp): ROV + bubbles
  js/render/background.js    Background.build / update / drawBack / drawFront / drawGround / lamp
  js/render/sealife.js       SeaLife.build(scale) / draw(ctx, t, worldX, light): distant fish and jellyfish,
                             called from Background (build, and drawBack)
```

**Data flow.** `main.js` owns all game state. The render modules import only `config.js`,
`constants.js` and `util.js`, and receive what they need as arguments. They must never write
to game state. Keep it that way, because it is what makes visual changes safe.

**Frame order** (`render()` in main.js): water gradient → seabed glow → light rays → distant
sea life → far silhouettes → far snow → near silhouettes → obstacles (rope, crate, containers) → depth haze +
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
- The rope strip, crate, three container colours, ROV body, silhouettes, the seabed tile and
  the sea-life animation frames are pre-rendered once per resize into offscreen canvases.
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
- Space typed into the name field types a space, so full names work; Enter starts. (In the
  original, Space there started the game, so names couldn't contain spaces.) Space anywhere
  else on the start screen still starts.

## Common tasks

- **Tweak colours, depth stages, particle counts or the sea life:** edit [js/config.js](js/config.js).
  Page colours are the tokens at the top of [style.css](style.css).
- **Restyle the obstacles:** write a new `render/obstacle.js` that exports `Obstacle` with the
  same `build(scale)` and `draw(ctx, pipe, x)`. The hitboxes are: `x-6` to `x+PW+6` from
  `pipe.topH-CRATE` to `pipe.topH` (crate) and below `pipe.topH+pipe.gap` (containers), plus a
  `ROPE`-wide column centred on the pipe from the top of the screen down to the crate. Draw on
  those boxes, especially the gap edges, the crate top and the rope.
- **Swap a side banner:** save it as `ads/banner-venstre.jpg` or `ads/banner-hoyre.jpg`; no code
  change is needed.
  - Make it a JPG at 1000 × 2000 px, quality about 80, under about 300 KB.
  - The full height always shows. The full width shows on wide screens (about 1700 px and up),
    but laptops around 1440 px wide crop the sides to about 1:2.8, and 1280×720 to about 1:3.
    **Keep text and logos inside the central 640 px of width.**
  - Each banner links to its own page: the left one to the volunteer sign-up, the right one to the
    jubilee Facebook page. Change the `href` on the `.side-ad` links in `game.html` to match a new
    banner. They open in a new tab, and switching tabs pauses a running game.
  - Update the `alt` text to describe the banner.
- **Add a sponsor:** put the logo in `sponsors/` (SVG, or a PNG with a transparent background
  like `hoegh-autoliners.png`), then add a plate to `.sp-grid` in `game.html`:
  `<a class="sp-plate" href="https://…" target="_blank" rel="noopener"><img src="dypdykk/sponsors/navn.svg" alt="Navn"/></a>`.
  - A main sponsor gets `class="sp-plate main"` and goes first: full width and taller.
  - Plates are cream, so the logo keeps its own colours. Trim empty margins from the logo (for an SVG,
    its `viewBox`), or the logo looks small.
  - Up to four small plates fit without squeezing the leaderboard. More plates still work,
    but the leaderboard list then scrolls sooner.
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
