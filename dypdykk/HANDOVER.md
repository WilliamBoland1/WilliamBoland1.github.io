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
   [js/main.js](js/main.js), and in `makePipe()`. The one approved exception is the depth
   ladder `GAPS`: obstacles that spawn once the score reaches 20, 30 or 40 get a narrower
   opening (155, 145, 140 px instead of 170). Nothing else gets harder or easier during a run.
2. **The scoreboard code is not modified.** [js/scoreboard.js](js/scoreboard.js) is the
   original Firebase code, moved without edits. The only change is the translated "no scores
   yet" message.
3. **No new gameplay features:** no power-ups, collectibles, levels, or history/timeline content.
4. **No image files in the game.** Everything inside the frame is drawn with canvas paths and
   gradients, or inline SVG. (The beer crate was considered as a PNG and kept in canvas on purpose.)
   The approved exceptions are page-level content outside the frame (the jubilee side banners,
   `ads/`) and the official NTH 110 logo on the start screen (`img/logo-nth110.png`). The canvas
   itself never draws an image file.
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
| **Phone, tablet and landscape fit** (`?v=118`, CSS only). The game height uses `100svh`, so it doesn't resize when the browser toolbar hides. The right column stacks under the game below 840 px (side by side needs 834 px; iPads in portrait used to get a 250 px wide, frame-tall column). Phones up to 460 px wide and screens under 500 px tall get the slim frame (no frame since `?v=121`) and a 10 px gutter. Short screens also hide the emblem and tighten the overlay screens. The name field is 16 px, and the page has `touch-action: manipulation`. | Safari zooms into inputs under 16 px and stays zoomed, and fast taps beside the game could double-tap zoom. Landscape phones give a game about 190 px wide: it stays usable, with no "rotate" hint by choice. |
| **Full names for the contest** (`?v=118`). A short rule under the name field (`#name-hint`): "Bruk fullt navn for å delta i konkurransen. Ett navn, én poengsum: din beste lagres." It brightens while the field has focus. The field takes 24 characters (was 16), the placeholder reads "Fullt navn…" and `autocomplete="name"` lets phones suggest the player's full name. Space in the field now types a space (one guard in the `keydown` listener in main.js, idle state only). | `scores/` keeps one record per name, so two players called "Ola" would share one score. `scoreboard.js` is unchanged: `nameKey()` turns spaces into `_` and keeps 20 characters, so names that match in their first 20 characters still share a record. |
| **Difficulty step at 20** (`?v=119`). Obstacles spawned once the score is 20 or more have a 155 px gap instead of 170 (`HARD_AT`, `HARD_GAP` in constants.js). `makePipe()` stores the gap on the pipe (`p.gap`), and `collides()` and `obstacle.js` read it from there. The `topH` range uses the same gap, so the top and bottom margins stay the same. | A small step up for good players. 20 is also the second depth-colour change, so the darker water signals it and no extra UI is needed. The gap is fixed when an obstacle spawns off-screen, so the 1–2 obstacles already in view when the score reaches 20 keep the wide gap. Below 20 nothing changed: same arithmetic, same `Math.random` calls, identical step-600 dump. Scores above about 20 from before `?v=119` are from an easier game, so release it at a weekly reset (clear `scores/` on Monday). |
| **Contest rules instead of sponsors; leaderboard sized to 10 rows** (`?v=120`, HTML/CSS only). The sponsor card is gone and a "Regler" card (`#rules`) under the leaderboard gives the contest dates, the prize (a beer token for the best player and one random player) and that both winners must be registered as volunteers ("funker"), linking to the volunteer sign-up. Every leaderboard row is `--lb-row` (38 px) tall and the list is exactly 10 rows high, so there is neither a gap nor a scrollbar; the rules card fills the rest of the column. The column is now at least (`min-height`) as tall as the frame instead of exactly as tall. | Sponsors weren't needed on this page, and the rules belong next to the scores. On viewports about 700 px tall or less, 10 rows plus the rules don't fit beside the frame, so the column runs a little past it rather than cutting off rows or rules. |
| **Phone mode: the game alone, leaderboard and rules in a sheet** (`?v=121`). On phones (the phone query: up to 460 px wide or under 500 px tall) the brass frame is gone, so the game fills the width (370 px instead of 334 on a 390 px phone), and the right column is hidden. A "Toppliste og regler" button on the start and crash screens (`.info-btn`, phones only) adds `info-open` to `body`, which turns `#sidebar` into a full-screen sheet. "Tilbake til spillet" (`#info-close`, pinned to the bottom) closes it. While the sheet is open, keys work its buttons, not the game. Short screens also hide `.screen-sub` and the line under "Kræsj!" so the extra button fits. | Phone players come to play, but the game shared the screen with a leaderboard they had to scroll past. The sheet is the same `#sidebar` element restyled, so `scoreboard.js` and `leaderboard-fx.js` are untouched, and live updates and the glow work inside it. The sheet opens from a button instead of after every crash, so a retry stays one tap. Tablets and desktop are unchanged, and the step-600 dump is identical. |
| **Start screen split around the ROV** (`?v=122`, HTML/CSS only). The emblem and title (`.start-head`) end at y = 205 and the name field starts at y = 279 (game units, via `--u`), so the idle ROV, which bobs between y = 217 and 267, shows in the gap instead of behind the title or name field. On small phones the gap shrinks first so the controls still fit (on 320 × 568 it closes and the ROV is hidden as before). Screens 500 px tall or less keep the centred stack. | The ROV is the star of the game, but the start screen covered it on every screen size. |
| **Official NTH 110 logo on the start screen** (`?v=123`, HTML/CSS only). The inline SVG "110" emblem is replaced by the jubilee committee's logo (anchor and porthole) as `img/logo-nth110.png`. Since `?v=126` it is the official white-ring version for dark backgrounds: off-white porthole ring, white "NTH 110" and waves, orange date, grey anchor, and see-through glass and bolt holes, so the water shows through. (`?v=123` to `?v=125` used a brass recolour.) The PDF's white version is flattened onto white, so the PNG is rebuilt from the shapes of its navy version with real transparency (289×336 px, 256 colours, 12 KB). Its height follows the game, `min(112px, 24 % of --game-w)`, and it keeps the old `.emblem` class, so short screens still hide it. | The official logo instead of a home-made mark. The navy version nearly disappears on the navy screens; the white-ring version is the logo's own variant for dark backgrounds. It sits in the space above the title, so the title, the gap for the bobbing ROV and the controls stay where they were (on 320×568 the title moves down about 8 px). The approved exception to rule 4. No JS changed. |
| **Phone game edge to edge** (`?v=124`, CSS only). In portrait on phones (up to 460 px wide) the game drops its 10 px side gutters and runs the full screen width; the vertical gutter, landscape, tablets and the leaderboard sheet are unchanged. On a 390 px phone with the browser bars showing (about 390×665) the game grows from 370×555 to 390×585, and the empty bands above and below shrink from 55 to 40 px. | The 2:3 shape is fixed by the gameplay (`W`, `H` and everything built on them), so the width is what limits the height on a phone, and the side gutters were the only room left to grow into. A taller playfield would give more room to fly, and stretching or cropping it would distort the picture or hide oncoming obstacles, so the rest of the bands stay. No JS changed. |
| **Steel frames on the side banners** (`?v=125`, CSS only). Each `.side-ad` gets a 3 px brushed-steel frame (`--steel-light`, `--steel`, `--steel-dark`, lit from the top left like the brass game frame), a 1 px dark outline outside it and a faint light edge inside it (`::after`). The artwork fills the inside of the frame, so it is 6 px narrower and shorter than before; the safe zone in "Swap a side banner" still holds. | The banners were borderless, so dark artwork melted into the navy page and light artwork looked pasted on. Steel is a different metal from the game's brass, so the ads read as separate from the game and the cards while keeping the calm heritage look (rule 5). Steel is used for the ads only. No JS changed. |
| **Rules under a shorter right banner** (`?v=126`, HTML/CSS only). With the side banners showing (1240 px and wider) `#layout` becomes a grid: left banner, game, leaderboard, and a right column where the right banner sits over the rules card. Every column is as tall as the game frame. `#sidebar` gets `display: contents` there, so the leaderboard and the rules card take grid cells of their own; the banners are told apart by `.ad-left` and `.ad-right`. The rules card is pinned to the banner's width (`width: 0; min-width: 100%`), and the right banner takes whatever height the rules card leaves. The leaderboard now fills the frame height alone, so its 10 rows share it (`.lb-row` 10 % of the list, about 63 px at full size). Below 1240 px, on tablets and in the phone sheet, nothing changed. | The rules and prize belong where people look for them, beside the banners instead of squeezed under the leaderboard. The right banner's crop changes with it; see "Swap a side banner". `scoreboard.js` and `leaderboard-fx.js` are untouched. No JS changed. |
| **Rules as a cream note with the prize up front** (`?v=127`, HTML/CSS only). The rules card is now a note of cream paper (`--paper`, ink-navy text) with a strip of tape, a slight tilt and a drop shadow. It opens with an inline SVG beer mug and the headline "Vinn en ølbong", then a small "Regler" label over the rules; the prize line became "Beste spiller og én tilfeldig deltaker vinner hver sin." On wide screens the right column (banner over the note) gets 58 % of the room beside the game and the left banner the rest (`--side-room`); both still stop at the banners' 1:2 shape. At 1440×900 the note grows from 279 to 324 px wide. | The prize should catch the eye: a paper note stands out among the navy cards and fits the heritage look. The wider column gives the headline room; the price is a narrower left banner on laptops (see "Swap a side banner"). The same note shows in the tablet column and the phone sheet. No JS changed. |
| **Game centred on wide screens** (`?v=128`, CSS only). With the side banners showing, the columns are sized so the game sits in the middle of the screen: the left column is as wide as everything right of the game (leaderboard, gap, right column), and the right column gets half of what the leaderboard leaves (`--right-w`, `--left-w` in `#layout`). The right column never drops under 260 px (or v127's 58 %, if that is less) and never exceeds the artwork's 1:2 shape; the left banner never exceeds 1:2 either and sits next to the game (`justify-self: end`), so on very wide screens the spare room is empty navy at the far left. Exactly centred from about 1660 px wide (1920×1080: banner 384, right column 382); below that the note's floor pushes the game left as little as it can (1440×900: about 120 px off centre instead of 180; 1490×754: 77 instead of 185). At 1240 px nothing changed. | The game is the point of the page, and with the leaderboard and the right column on one side it sat well left of centre. Widths are the only thing that moves: same order, same cards. 260 px is the width v127 already gave the note at 1280 px, so it stays readable; lower it to centre more on laptops at the cost of a narrower note. No JS changed. |
| **Depth ladder; the water stays deep** (`?v=129`). `HARD_AT`/`HARD_GAP` became `GAPS` in constants.js: obstacles spawned from score 30 get a 145 px gap and from 40 a 140 px gap, on top of the 155 px from 20. The water no longer loops back to the surface at 40; it stays on the lamp-lit seabed (`Math.min` instead of `%` in `updateStage()`, background.js). | Deeper means tighter, and the darker water announces each step, so no UI is needed. Before, the hardest part of a run had the brightest water. 140 is the floor: a flap rises about 82 px and the ROV's hitbox is 20 px tall. In 400 seeded runs per gap, an autopilot that taps up to 50 ms late cleared 100 obstacles every time at 140 and none at 130 (see TESTING.md). Below 30 nothing changed: identical step-600 dump. Scores above 30 from before `?v=129` are from an easier game, so release it at a weekly reset. |
| **Funk poster as the left banner** (`?v=130`). `ads/banner-venstre.jpg` is now the funk recruitment poster (`images/Funkeplakat-1-4.pdf`, application deadline 9.11) instead of the "Har du søkt funk?" stock photo. The A-size poster is scaled to 1000 px wide at the bottom of the 1000 × 2000 canvas, with its own cream filling the top. The title (FUNK, 110-årsjubileum, søknadsfrist) is moved up into the empty cream above the waves: in the PDF it is three text objects over the wave image, so the waves are rendered without them (pypdfium2, removing those objects), and the title is rendered alone and centred in the cream. `.ad-left img` uses `object-fit: contain` at the bottom, so on narrower columns the whole poster shrinks instead of losing its sides. Same link (volunteer sign-up). | The poster has text out to its edges ("110-årsjubileum", "Kultur", "Vertskap"), which the usual side crop cut off below about 1530 px wide. The stock photo also still had its Shutterstock watermark. CSS and image only; no JS changed. |
| **Right banner rotates** (`?v=131`). Each page load shows the Facebook ad or the old "Har du søkt funk?" ad (back as `ads/banner-funk.jpg`, linking to the volunteer sign-up), 50/50. A small inline script right after `.ad-right` in `game.html` picks a row from its `ads` list and sets the link, image and alt text. | Both messages get the slot without a timer swapping images under the player. Inline, not in main.js: main.js only runs once Firebase has loaded, so the ad would visibly change; inline it is set before the image loads, and with no `src` in the markup only the chosen image downloads. `crypto.getRandomValues`, not `Math.random`, so pipe heights and the step-600 dump are untouched (identical dump). The funk photo still has its Shutterstock watermark; at 1:2 the bar at its bottom shows (about 1500–1700 px wide). |

## Architecture

```
game.html                    markup only; links style.css and js/main.js with ?v=110
dypdykk/
  style.css                  colour tokens (:root), brass frame, screens, leaderboard, side banners, rules
  ads/                       banner-venstre.jpg, banner-hoyre.jpg (side banners)
  img/                       logo-nth110.png (official jubilee logo, white-ring version, start screen),
                             favicon-32.png + apple-touch-icon.png (the dark version of the logo)
  js/constants.js            W, H, GH, PW, GAP, GR, JP, PS, PINT, STEP, CRATE, ROPE, GAPS. DO NOT CHANGE.
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
  - Left banner: since `?v=130` (the funk poster) the whole image always shows. Where the column is
    narrower than 1:2 (below about 1530 px wide) it shrinks to the column width and sits at the
    bottom, with the poster's cream (`#F3EEDF`, `.ad-left img` in style.css) above it. That suits
    artwork whose top edge is a flat colour. For artwork that should crop instead, delete that rule:
    then the full height shows and the sides are cut (about 770 px of the 1000 px width shows at
    1440×900, 540 px at 1280×720, 380 px at 1240×800), so **keep text and logos inside the central
    540 px of width.** A poster in another shape: scale it to 1000 px wide, put it at the bottom of
    the 1000 × 2000 canvas, and fill the space above with its top colour.
  - Right banner: it shares its column with the rules card (`?v=126`), so it is shorter and its shape
    changes with the screen. Since `?v=128` the column is 260 px wide on laptops and grows to the
    1:2 width only at about 1920 px wide: about 1:2.3 at 1240×800 (sides cropped to about 840 px),
    about 1:1.9 at 1440×900 and 1:1.8 at 1490×754 (nearly all of it shows), and about 1:1.4 at
    1920×1080, where roughly 285 px are cut off the top and the bottom.
    **Keep text and logos inside the central 640 × 1400 px.**
  - The right slot rotates: since `?v=131` each page load picks one ad at random from the `ads` list
    in the inline script after `.ad-right` in `game.html` (now `banner-hoyre.jpg`, the Facebook ad,
    and `banner-funk.jpg`, "Har du søkt funk?"). To add, drop or swap a right-side ad, edit a
    `[link, image, alt text]` row there; the `<img>` has no `src` in the markup so only the chosen
    image downloads.
  - Each banner links to its own page: the left one to the volunteer sign-up; the right one to
    whatever its `ads` row says. Change the left `href` on `.ad-left` in `game.html` to match a new
    banner. They open in a new tab, and switching tabs pauses a running game.
  - Update the `alt` text to describe the banner.
- **Favicon:** `img/favicon-32.png` (browser tab) and `img/apple-touch-icon.png` (180 px, iPhone
  home screen), linked in the `<head>` of `game.html`, game page only. Both are the **dark** logo
  (navy ring, grey anchor, "NTH 110"), page 2 of the committee's "Logo jub110.pdf", unchanged
  except that the white glass inside the porthole is see-through. The bolt holes stay white. The PDF
  is one flattened image on white, so this was done on the pixels: the ring is the largest navy
  area, the glass the largest area it encloses, and the white outside the ring is transparent. In
  the glass, the navy text and waves keep soft edges (each pixel is read as navy over white) and the
  grey shank pieces stay opaque.
  The tab icon fills the full height on a transparent background; the touch icon sits on white
  with 10 % padding (iOS needs it opaque and rounds the corners). On dark tab bars the navy ring is
  faint, but the white bolt holes and grey anchor still read.
- **Update the contest rules:** edit the paragraphs in `.rules-text` in `game.html`. For each
  contest, replace the two `[dato]` placeholders with the start and end dates. Keep the rules short:
  on screens about 700 px tall or less, every extra line makes the column run further past the frame.
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
