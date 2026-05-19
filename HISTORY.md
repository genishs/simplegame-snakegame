# History

A chronological ledger of what changed in each version and *why*. Newest version on top. Every merged PR appends an entry here before tagging.

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
