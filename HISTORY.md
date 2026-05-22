# History

A chronological ledger of what changed in each version and *why*. Newest version on top. Every merged PR appends an entry here before tagging.

---

## v0.5.1 — 2026-05-23

**Theme:** easier on-ramp, real stages start arriving.

### What
- Tutorial tick slowed from 350ms to **380ms**.
- Stage 1 tick slowed from 110ms to **140ms**; `clearAfterApples` set to **5** (was `null`).
- **Stage 2 added:** 20×20, 130ms tick, `clearAfterApples: 5` — clears after 5 apples, transitions to Stage 3.
- **Stage 3 added:** 20×20, 120ms tick, `clearAfterApples: null` — endless mode, no further transition.
- `enterStageClear()` now generates the stage clear overlay text dynamically from `stage.label` and the next stage's `label`, rather than hardcoding "튜토리얼 클리어!" for every stage.

### Why
The "stages 1–3 must feel very easy" project rule (memory: project_stage_difficulty) required both a slower tick for Stage 1 and actual Stage 2/3 data to exist. Without `clearAfterApples` on Stage 1, Stage 2 and Stage 3 were permanently dead code — no code path could ever reach them, making any future testing or balancing impossible. Activating the transition via data alone (no new logic) matches the "stages are data, transitions are logic" design principle established in v0.4.

### Decisions worth recording
- **(Decision A) Data-only transition activation.** `advanceStage()` already handles the array-index walk and the `stageIndex >= STAGES.length` endless guard. Adding Stage 2/3 entries to `STAGES[]` and assigning `clearAfterApples` values is sufficient; no new control flow was introduced.
- **Dynamic clear message.** `enterStageClear()` now reads `stage.label` and `STAGES[stageIndex + 1].label` at runtime. Hardcoding the tutorial message for all stages was a regression waiting to happen as more stages were added.
- **Stage 3 endless via `clearAfterApples: null`.** The existing `stage.clearAfterApples != null` guard in `tick()` naturally skips `enterStageClear()` when the field is `null`, so Stage 3 runs indefinitely with no extra logic.

### Verification
- Tutorial → Stage 1 auto-transition at 3 apples; Stage 1 → Stage 2 at 5 apples; Stage 2 → Stage 3 at 5 apples.
- Tick feel is noticeably more relaxed in Tutorial (380ms) and Stage 1 (140ms) vs. previous.
- Stage 3 runs indefinitely — eating more than 5 apples does not trigger a stage change.
- Each stage clear shows the correct stage name in the overlay (e.g. "Stage 1 클리어! / 곧 Stage 2로 이동합니다").
- Tutorial Esc skip still works; Stage 1 wall collision still triggers game over.

---

## v0.5 — 2026-05-20

**Theme:** the tutorial actually teaches.

### What
- Tutorial tick slowed from 200ms to **350ms** (75% slower).
- New `noFailOnHit` flag on stage data; the tutorial is the only stage that has it.
- New `STATE.BLOCKED`: when a tutorial move would hit a wall or self, the move is cancelled, the snake stops, and an overlay reads "잠깐! 다른 방향을 눌러주세요  ↑ ↓ ← →".
- BLOCKED is exited by pressing a *safe* direction key. Unsafe direction (reverse or still-colliding) keeps BLOCKED. Space is inert in BLOCKED.
- **Tutorial skip:** `Esc` while on the tutorial jumps straight to Stage 1 (preserves score, no clear message).
- Updated controls hint to mention Esc; README controls table updated.

### Why
v0.4 shipped the tutorial structure but the tutorial was finishing in under 10 seconds and a single misstep dropped the player back to the start. That defeats the entire reason for having a tutorial in the first place. The fix: slow it down enough to *read* the board, and never punish — only nudge.

Skip was added because experienced players (anyone replaying) shouldn't be forced through the tutorial every time. The first run leaves the tutorial as the only path; from the second run onward, Esc gives an out.

### Decisions worth recording
- **`noFailOnHit` is per-stage, not a global mode.** Stage 1+ still ends on collision; the actual game is unchanged.
- **`wouldHit()` is the single source of truth** for collision pre-check (both `tick()` and `isSafeDir()` use it). Eliminates the risk of these two paths drifting.
- **`isSafeDir()` excludes the reverse direction** so reversing a 1-cell snake doesn't appear "safe". Mirrors the existing 180°-turn gate in `setDirection()`.
- **BLOCKED resets `tickAccum`** on unblock so the next tick fires after a full interval, not immediately. Otherwise the snake snaps a step the instant the player presses a key, which feels twitchy.
- **Skip doesn't run STAGE_CLEAR's 800ms hold.** When you choose to skip, the friendly delay is the opposite of what you want.

### Verification
- Walking the snake into a wall in tutorial: snake stops, hint appears, picking a safe direction resumes play.
- Walking into self (would require longer snake): same behavior.
- Skip via Esc from tutorial jumps to Stage 1, tutorial score preserved.
- Stage 1 wall hit: still triggers game over (unchanged).
- Reverse direction key in BLOCKED is rejected (stays BLOCKED).

---

## v0.4 — 2026-05-20

**Theme:** the game gains a sense of *progression*. First "stage" enters the model.

### What
- New `STAGES` data structure with two entries:
  - **Tutorial:** 5×5 grid, 200ms tick, snake length 2, clears after eating 3 apples
  - **Stage 1:** 20×20 grid, 110ms tick, snake length 3 (the previous default)
- Game now starts on the tutorial stage. After clearing, a brief "튜토리얼 클리어!" message holds for 800ms, then the game transitions to Stage 1. Score persists across the transition.
- HUD gains a "Stage: ..." label alongside Score and Best.
- Canvas pixel area unchanged (400×400). When a stage is smaller than the canvas, the active area is centered and the surrounding cells are masked with a low-opacity warm tone — a spotlight effect, no DOM change, no canvas resize.
- Grid lines now only draw inside the active stage area.
- New design tokens: `--mask-outside` for the spotlight surround, `--stage-label` for the HUD label.
- Game-over → restart returns to the tutorial stage (intentional — the tutorial is short and forgiving).

### Why
The game promised "아기자기" — but a single endless 20×20 board doesn't feel inviting to a first-time player. A small, slow tutorial gives a new player room to learn the controls before being asked to make decisions on a larger board. It also lets us introduce the *concept* of stages now, so later difficulty work can plug into the same data shape without a refactor.

This version satisfies the standing rule that **stages 1–3 must feel very easy** — the tutorial is intentionally even easier than Stage 1, and Stage 1 remains the same forgiving speed it has been since v0.1.

### Decisions worth recording
- **Stages as data, not control flow.** `STAGES[]` is an array of plain config; transitioning is just `stageIndex += 1; loadStage(...)`. Future difficulty curves slot into the same array.
- **Spotlight via overlay rectangles, not canvas resize.** Resizing the canvas would have forced layout shifts and broken existing draw helpers; an overlay mask preserves all geometry and just dims the inactive cells.
- **Stage transition timed against `performance.now()`, not `setTimeout`.** Keeps everything inside the existing RAF loop — no stray timers to clean up on pause/restart.
- **Restart returns to tutorial** rather than to the stage where you died. The tutorial is so short that this is more friendly than punishing.

### Verification
- Tutorial board renders centered with the spotlight surround.
- Eating 3 apples in the tutorial triggers the clear message; after ~0.8s the board expands to 20×20 and the snake resets cleanly.
- Score from the tutorial carries over (e.g. 30 from the tutorial → starts Stage 1 at 30).
- Direction reset works on stage transition (head moves rightward at the new board's center).
- HUD shows "Tutorial" or "Stage 1" in real time.
- Visual identity from v0.3 (cute snake + apple, eat pulse, wobble) preserved on both stages.

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
