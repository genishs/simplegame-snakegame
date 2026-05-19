# History

A chronological ledger of what changed in each version and *why*. Newest version on top. Every merged PR appends an entry here before tagging.

---

## v0.3 — 2026-05-19

**Theme:** the game starts to look like itself — 아기자기 (cute, cozy) graphic identity, first pass.

### What
- Replaced the red square food with a hand-drawn apple (red body, green leaf, gloss highlight, brown stem). All canvas-primitives, no external assets.
- Replaced the green square snake with rounded sage-green segments. The head is one shade richer and carries two eyes that rotate to face the direction of travel.
- Added a soft idle wobble to the apple (±1.5px sine, 1.2s period) so the board is never visually static.
- Added a 150 ms "eat pulse" — the head briefly scales to 110% when the snake lands on the apple.
- Introduced `requestAnimationFrame` so animation runs at display refresh while game logic still ticks at 110 ms. The two are now decoupled.
- Re-skinned the page chrome: warm cream background, soft butter board, warm-orange accent on the title. Overlay card matches the palette.
- New `docs/design/STYLE.md` — single source of truth for every color, radius, and motion value used in this version.

### Why
v0.2 proved the pipeline worked but the game looked like a programmer's first canvas test. The user set the brand: **아기자기** (cute, cozy). v0.3 is the first version that actually delivers that promise, and it does so without changing any gameplay rule, so the change is purely about how the game *feels* to look at.

### Decisions worth recording
- Canvas-drawn apple over inline SVG: keeps the rendering path uniform, no DOM nodes overlapping the canvas, easier to animate per-frame in `drawApple(now)`.
- Tokens mirrored in JS (`TOKEN = {...}`) instead of read from CSS via `getComputedStyle`. Canvas drawing is hot path; the mirror is a one-line edit if a value changes and `STYLE.md` documents the authoritative source.
- Decoupled animation tick from game tick — the apple wobble would have looked janky if it only redrew every 110 ms.
- 180° turn-in-one-tick robustness still deferred. The bug exists from v0.1; it's rare in normal play, and addressing it now would expand the scope past visuals-only.

### Verification
- Manual play-through in browser: start, eat (head pulses), pause, game over, restart. All paths preserved.
- Visual: apple wobble visible at idle; eyes rotate when changing direction; segments have rounded corners.
- Payload: total still under the 50 KB budget.

---

## v0.2 — 2026-05-19

**Theme:** verification.

### What
- Bumped `VERSION` from `0.1` to `0.2`
- Updated the visible version string in `index.html`
- No gameplay changes

### Why
The v0.1 deploy went through cleanly and the game played end-to-end, so we cut a verification tag before introducing real feature work. v0.2 is the moment the pipeline (push → Actions → Pages) was treated as trustworthy.

### Verification
- `index.html`, `style.css`, `game.js` served with HTTP 200 from Pages
- File sizes on Pages matched local copies (game.js 3637, index.html 884, style.css 1353)
- Manual play-through: start, eat, pause, game-over, restart all worked

### Deferred / known limitations
- 180° turn within a single tick is technically still possible if two keys land in the same frame; rare in normal play, parked for later
- No stage progression yet — landing in v0.x

---

## v0.1 — 2026-05-19

**Theme:** something that runs.

### What
- Initial Canvas-based snake (20×20 grid, 400×400 canvas)
- HUD with score and best (best persisted in `localStorage`)
- Arrow keys + WASD movement
- Space to start, pause, restart
- Death on wall or self-collision
- `.github/workflows/deploy.yml` publishing the static site to GitHub Pages on push to `main`
- Pages site enabled with `build_type=workflow`

### Why
Goal was the smallest playable thing wired to a deploy pipeline, so every subsequent slice could be tested live with no extra plumbing.

### Stack decisions
- No build tooling. The whole game is three static files served straight from the repo
- Vanilla JS — no framework. Keeps the surface area small enough that learning is the point
- localStorage for persistence — no server, no backend

### Verification
- First Actions run on `main` completed in 27 s with status `success`
- Live URL: https://genishs.github.io/simplegame-snakegame/
