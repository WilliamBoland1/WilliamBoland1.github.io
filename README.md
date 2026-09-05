# WilliamBoland1.github.io

A dumping ground for my unserious projects. Nothing here is production software — it's
stuff I built to learn, to apply for something, or to give away as a present. Everything
is plain HTML, CSS and JavaScript with no build step, no package manager and no framework,
served straight off GitHub Pages.

Live at **[williamboland1.github.io](https://williamboland1.github.io)**.

## Projects

| Page | What it is | Status |
| --- | --- | --- |
| [`application.html`](application.html) | My application for a volunteer position (verv) in the jubilee committee, written as a 90s infomercial | Done, and delivered |
| [`game.html`](game.html) | A Flappy Bird prototype with an online leaderboard | Playable |
| [`globe.html`](globe.html) | An interactive 3D globe, meant as a gift for my girlfriend | Unfinished |
| [`index.html`](index.html) / [`home.html`](home.html) | Landing page | Placeholder text, work in progress |

### `application.html` — "RING NÅ! – Vibe Coder til Jubileet"

A one-page pitch for a volunteer position, styled as a late-night TV commercial:
gold-and-cream retro palette, a hero with a fake limited-time offer, a skills grid with
progress bars, testimonials and a call to action. Norwegian copy, deliberately
over-the-top. Fonts are Passion One, Oswald and Special Elite from Google Fonts.
The `loadImage()` helper lets you swap the profile photo from a file picker.

### `game.html` — "Flakse Fugl"

A Flappy Bird clone on a 360×540 `<canvas>`. Gravity, one-button flap, procedurally
placed pipes, and a score counter. The tuning constants live in one line near the top of
the script if you want to make it easier or harder:

```js
const GH=55, PW=58, GAP=170, GR=0.44, JP=-8.5, PS=3, PINT=1600;
//                              gravity  jump   pipe speed
```

The leaderboard is a Firebase Realtime Database (project `floppy-boland`, europe-west1).
Scores are written under `scores/<name>` and only overwrite an existing entry if the new
score is higher; player names are lowercased and stripped to alphanumerics so they're safe
as database keys. The board updates live for everyone via an `onValue()` listener. The
Firebase SDK is loaded as an ES module from the CDN, so the page needs to be served over
HTTP — opening the file directly with `file://` will break the leaderboard.

### `globe.html` — "William's World"

A rotating Earth built with Three.js (r128, from cdnjs). The texture is drawn
procedurally onto a 2D canvas rather than loaded from an image, with a translucent
atmosphere shell and a directional "sun" light on top. Click anywhere on the globe to drop
a pin, give it a name, and mark it either **Been There** or **Wish List**; the sidebar
lists them and clicking one flies the camera to it. Pins are stored in `localStorage`
under `wb_pins`, which is exactly as far as I got — they live in one browser on one
machine and there's no way to share a map with anyone. That's the part that would need
finishing before this is actually giftable.

## Running it locally

There's nothing to install and nothing to build. Serve the folder and open a page:

```bash
python -m http.server 8000
# or
npx serve .
```

Then visit `http://localhost:8000/game.html`, `/globe.html`, and so on. Use a server
rather than double-clicking the files — the game's Firebase module import needs it.

## Repo layout

```
application.html   jubilee committee application
game.html          Flappy Bird clone + Firebase leaderboard
globe.html         Three.js globe with pins
index.html         landing page (placeholder)
home.html          landing page draft (placeholder)
images/            image.jpg (bird texture), image2.jpg, image3.jpg
main.py            empty, ignore it
```
