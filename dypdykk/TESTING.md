# Dypdykk 110: testing

The game is used for score contests. Every change must be checked two ways: **gameplay didn't
change**, and **it still looks and works right**. There is no test suite; this is how it was
verified during the reskin, written down so it can be repeated.

## Manual check (always)

```bash
python -m http.server 8000      # from the repo root
# open http://localhost:8000/game.html
```

The page must be served over HTTP; opening the file directly breaks the ES modules and
Firebase.

- **Start:** a tap on the start screen, the button, Enter and Space all start a run once a
  name is typed. Space inside the name field types a space ("Ola Nordmann") and doesn't start.
  An empty name makes the input shake.
- **Play:** the score goes up by 1 per obstacle. Touching the crate (bottle caps included), a
  container's roof, or the centred rope (flying too high) is a crash. Flying above the crate
  is allowed until the ROV reaches the rope.
- **Difficulty step:** shortly after the colour change at 20, the openings get narrower
  (155 px instead of 170). Obstacles already on screen at 20 keep the wide gap.
- **Depth:** the colours fade slowly at 10, 20 and 30, and return to light blue at 40.
- **Crash:** "Kræsj!" appears, "Prøv igjen" and "Meny"
  work, and a new best shows up live in the Toppliste, where its row glows brass twice.
  The top three ranks sit on brass, silver and bronze medallions.
- **Pause:** switching tabs in the middle of a run shows "Pause"; a tap or Space continues.
- **DevTools:**
  - Device toolbar at phone width: the frame fits and the leaderboard sits below. Also iPad
    portrait (768, 820): leaderboard below at frame width. Phone landscape (844×390, 667×375):
    no emblem, and the start button, "Prøv igjen" and "Meny" are fully visible.
  - Rendering → "prefers-reduced-motion: reduce": fewer snow specks, the rays stop swaying,
    the distant fish and jellyfish stop wiggling and pulsing, and the leaderboard glow is a
    single fade.
  - Performance with 4× CPU throttle: steady 60 fps.
- **Speed:** on a 120 Hz screen, fall speed and pipe spacing match a 60 Hz screen.

⚠️ **Manual testing writes real scores** to the live `floppy-boland` leaderboard. Use an
obviously fake name, or use the automated setup below, which stubs Firebase.

## Automated check that gameplay didn't change

The idea: run the game headless with a fixed random seed and a deterministic autopilot, dump
the full game state at step 600, and compare it **before and after** your change. If the state
is identical, the physics, spawning and scoring didn't change.

Build a throwaway **test copy** in a temp folder; never edit the real files:

1. Copy `game.html` and `dypdykk/` into a temp folder.
2. **Seed `Math.random`:** insert this before `</head>` in the copy's `game.html`:
   ```html
   <script>(function(){let a=12345;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})();</script>
   ```
3. **Stub Firebase** so nothing reaches the real leaderboard. In the copy's
   `dypdykk/js/scoreboard.js`, replace the two `import … firebase …` lines with:
   ```js
   const initializeApp=()=>({}),getDatabase=()=>({}),ref=()=>({}),get=async()=>({exists:()=>false}),set=async()=>{},onValue=()=>{},query=x=>x,orderByChild=()=>{};
   ```
4. **Patch the copy's `dypdykk/js/main.js`:**
   - At the very top, add
     `const requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),1000/60);`.
     Headless Chrome throttles the real one to a few frames per second.
   - Change `function step(){` to `function step(){ __pilot();`.
   - Just before the last `requestAnimationFrame(loop);`, insert:
     ```js
     // Deterministic autopilot: decides inside step(), so the result doesn't depend on frame timing.
     function __pilot(){
       if(simStep===600) document.title=JSON.stringify({score,y:+bird.y.toFixed(4),vy:+bird.vy.toFixed(4),pipes:pipes.map(p=>[p.x,+p.topH.toFixed(4)])});
       const p=pipes.find(p=>p.x+PW+6>bird.x-14); const target=p?p.topH+p.gap/2+15:H/2;
       if(bird.y>target&&bird.vy>0) flap();
     }
     document.getElementById('player-name').value='Test'; flap();
     ```
5. Serve the temp folder (`python -m http.server 8765`) and dump the state:
   ```bash
   chrome --headless=new --disable-gpu --virtual-time-budget=11000 --dump-dom http://127.0.0.1:8765/game.html | grep -o '<title>[^<]*'
   ```
   On Windows the binary is `C:/Program Files/Google/Chrome/Application/chrome.exe`.
6. Do steps 1–5 on the commit **before** your change and on your change. The titles must be
   identical. Run each twice first to confirm the run is deterministic.

For reference, commit `4a248a6` gives:
`{"score":5,"y":148.52,"vy":-5.42,"pipes":[[22,90.933],[313,253.2787]]}`
(unchanged by the centred-rope hitbox in `?v=112`).

**If you change a hitbox:** the step-600 dump only covers one autopilot path that stays in
the gaps. Also copy `step()`, `makePipe()` and both versions of `collides()` into a Node
script, play ~100 000 seeded runs with random and noisy-autopilot flaps under each version,
and compare the final score of every run. For the centred rope (`?v=112`) all 100 000 scores
matched. 1.6 % of runs crashed a few steps later (at the rope instead of the old column
edge), and none crashed earlier.

**The difficulty step at 20** is out of reach of the step-600 dump (score 5). To check it, start
the test copy at 19 in `__pilot` (`if(simStep===lastPipe+1&&score===0){score=19;updScore(score);}`),
log `[score, p.gap]` the first time each pipe appears, and run for about 45 s of virtual time.
Pipes that appear at 19 must have gap 170, and every pipe after that 155. In `?v=119` the pilot above
cleared 27 narrow gaps (score 19 → 46) without crashing.

**Pitfall: pipe heights come from the shared `Math.random`.** Any code that calls
`Math.random` before or between pipe spawns shifts the heights, even if the physics is
untouched. Bubbles call it, and so did the old star field. If only `topH` values differ while
`score`, `x` and timing match, suspect that first. To confirm, consume the same number of
randoms in the test copy, or give `makePipe` its own seeded generator in the test copy.
Scenery uses its own seeded generator (`seeded()` in render/util.js) for exactly this reason.
Keep new visual randomness off `Math.random` where you can.

## Screenshots and other checks

- **Screenshots:**
  `chrome --headless=new --disable-gpu --hide-scrollbars --window-size=900,760 --virtual-time-budget=5000 --screenshot=out.png <url>`.
  Use the rAF stub from step 4, or the game barely advances.
- **Other depth stages:** in the test copy's `__pilot`, set the score on the first step, e.g.
  `if(simStep===lastPipe+1&&score===0){score=30;updScore(score);}`. Screenshot after about
  8 s, since the fade takes 4 s.
- **Phone width:** headless Chrome won't make a window narrower than about 500 px. Put the game
  in a 390×844 `<iframe>` on a wrapper page and screenshot that. Add
  `--force-device-scale-factor=3` for high DPI.
- **Leaderboard:** to see the medallions and the update glow, make the stubbed `onValue` call
  back with a few fake rows, then again ~3 s later with one score raised. Only that row should
  glow. Screenshot about 0.3 s after the second call.
- **Pause:** `document.hidden` can't be faked headless. Call `pause()` from `__pilot` at some
  step, then send a `pointerdown` to `#pause-screen` to resume.
- **Performance:** `--virtual-time-budget` freezes `performance.now()` inside a frame, so
  timings read 0. Time `render()` with real time instead. The reskin was measured by driving
  Chrome over the DevTools protocol from Node 22 (built-in `WebSocket`, `--remote-debugging-port`)
  with `Emulation.setCPUThrottlingRate`.
