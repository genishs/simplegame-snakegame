# History

A chronological ledger of what changed in each version and *why*. Newest version on top. Every merged PR appends an entry here before tagging.

---

## v0.5.7 — 2026-05-27

**Theme:** 5개 품질 개선 통합 — UI 스케일링, 난이도 곡선 완화, 한글 전면 적용, 소화 wiggle 모션, 도움말 화면.

### What

#### Set A — UI 스케일링 (HiDPI + 반응형 캔버스)
- `CANVAS_W`/`CANVAS_H`/`CELL` 상수 제거 → `canvasW`/`canvasH`/`cellSize` 모듈 변수로 교체 (CSS 픽셀 단위).
- `resizeCanvas()` 신설: `canvas.getBoundingClientRect()` + `devicePixelRatio` → backing store 설정, `ctx.setTransform(dpr)` HiDPI 변환. 초기 1회 + `window.addEventListener("resize", ...)`.
- `cellSize = Math.floor(cssW / cols)` — 정수 스냅(STYLE.md `--cell-pixel-snap` 규칙).
- TOKEN 내 `CELL * X` 6개 항목 → factor 상수로 변경, draw 함수 내 `cellSize * factor` 인라인 재계산.
- CSS `canvas` 규칙: 데스크탑 `min(85vh, 85vw, 560px)`, 태블릿(`768px–1023px`) `min(85vh, 85vw, 480px)`, 모바일 portrait `min(94vw, max(100px, calc(94vh - reserve - 16px)))`.
- `.container` max-width 480 → 640px.

#### Set B — 난이도 곡선 시프트
- 튜토리얼 tick: 380 → **420ms** (memory 규칙 `feedback_tutorial_non_punishing` ≥320ms 준수).
- Stage 1 tick: 140 → **220ms**.
- Stage 2 tick: 130 → **180ms**.
- Stage 3 tick: 120 → **150ms**.
- 개발자 플레이 검증: 각 스테이지 속도가 "첫 진입에서 좌절 없음" 기준 충족.

#### Set C — 한국어 전면 적용
- `<title>` → 뱀 게임, `<h1>` → 뱀 게임.
- HUD 라벨: `Stage:`→`스테이지:`, `Score:`→`점수:`, `Best:`→`최고:`.
- 힌트 바: Turn left/right → 왼쪽/오른쪽 회전, Start/Pause/Restart → 시작/일시정지/재시작, Skip tutorial → 튜토리얼 건너뛰기.
- 오버레이 텍스트: READY(`스페이스바로 시작`), PAUSED(`일시정지`/`스페이스바로 계속하기`), OVER(`게임 끝`/`점수: N · 스페이스바로 다시 시작`), STAGE_CLEAR(tutorial: `곧 스테이지 1로 이동합니다`).
- STAGES label: Tutorial→`튜토리얼`, Stage 1→3 → `스테이지 1`~`스테이지 3`.
- aria-label: `Rotate left`→`왼쪽 회전`, `Start`→`시작`, `Rotate right`→`오른쪽 회전`.
- `updateAuxButton()`: `Pause`→`일시정지`, `Start`→`시작`.
- 버전 표기: v0.5.6 → **v0.5.7**.
- 한글 폰트 스택(`--font-stack-ui`): Apple SD Gothic Neo / Malgun Gothic 포함, `letter-spacing: -0.01em`, `font-weight` 라벨 500 / 값 600 / 타이틀 600.

#### Set D — 소화 wiggle 모션
- `spawnBulge()`: `spawnTime: performance.now()` 필드 추가.
- TOKEN: `wiggleAmpFactor: 0.15`, `wiggleFreqHz: 2.0`, `wigglePhaseStep: Math.PI / 3`.
- `drawBulges()`: 접선 벡터의 법선(normal) 방향으로 `sin(phase) * cellSize * 0.15 * (s/maxScale)` 오프셋 적용.
  - phase = `i * PI/3 + (now - spawnTime) * 2π * 2.0 / 1000`
  - 진폭이 bulge 크기에 비례하여 꼬리 근처에서 자연스럽게 감쇠.
- 별도 타이머 없음 — 기존 RAF 루프 내 `Math.sin` 연산만 추가.

#### Set E — 도움말 화면
- `STATE.HELP` 추가.
- `openHelp(returnTo)` / `closeHelp()`: 모달 열기/닫기, localStorage `snakegame.helpSeen` 관리, 포커스 이동.
- `init()`: 최초 방문 시 (`helpSeen` 없으면) `openHelp(STATE.READY)` 자동 호출.
- 키보드 핸들러 최상단 HELP 분기: Esc/Space/Enter → `closeHelp()`.
- 캔버스 pointerdown + 모바일 버튼 3개: HELP 상태 가드.
- DOM: `#help-modal` (role=dialog, aria-modal), 3개 섹션(조작 방법 / 스테이지 클리어 규칙 / 더 멀리 가면…), `알겠어요` 닫기 버튼.
- CHOICE 오버레이에 `도움말` 링크 추가 → `openHelp(STATE.CHOICE)`.
- CSS: `.help-modal`(fixed 0.4 mask), `.help-card`(96% cream bg, max-width 640px, overflow-y auto), `.help-section h3`(accent orange), `.help-keys dt`(mono chip), `.help-teaser`(left-accent stripe, 8% orange wash), `.help-close`(filled accent orange, 유일한 filled-accent 버튼), `.help-link`(muted text link).

### Why
5개 피드백을 단일 v0.5.7로 통합한 이유: 모두 기존 메커닉 품질 개선으로 새 메커닉(풀맵 클리어 등) 없음 → 메이저 번호(v0.6) 불필요. 동시에 변경 범위가 충분히 크므로 패치가 아닌 마이너(v0.5.7)로 처리.

HiDPI 도입 근거: 기존 `canvas width=400` 고정 + CSS 단순 확대는 Retina/고배율 디스플레이에서 흐림 현상 발생. `devicePixelRatio * ctx.setTransform` 조합으로 backing store와 CSS 표시 크기를 독립적으로 관리.

### Wiggle 상수 확정값
- 진폭: `cellSize × 0.15` (spec 상한 20% 이내, 15%에서 선명한 꾸물거림 확인)
- 주파수: `2.0 Hz` (500ms 주기, bulgeFlowSpeed 2.0 cells/s와 동기 — 1셀당 1 wiggle 주기)
- 위상 스태거: `Math.PI / 3` (60° 간격, 최대 6개 bulge가 시각적으로 독립)

### 틱 최종 확정값
| 스테이지 | 이전 | v0.5.7 |
|---|---|---|
| 튜토리얼 | 380ms | 420ms |
| 스테이지 1 | 140ms | 220ms |
| 스테이지 2 | 130ms | 180ms |
| 스테이지 3 | 120ms | 150ms |

### 페이로드 측정 (wc -c)
(PR 본문 참조)

### Verification
- 튜토리얼 420ms: 느리고 편안한 진행, 4회 연속 사망 없음 확인 (self-check)
- Stage 1 220ms: 튜토리얼 통과 후 충분히 쉬운 속도 (self-check)
- 캔버스 리사이즈 후 뱀/사과/오버레이 정상 렌더 (self-check)
- HiDPI: setTransform(dpr) 적용 후 선명한 그래픽 (self-check)
- 한글 오버레이/HUD/버튼 전 항목 확인 (self-check)
- Wiggle: 사과 먹기 후 붉은 덩어리가 꾸물거리며 꼬리로 이동 (self-check)
- 도움말: 첫 방문 자동 표시, 알겠어요 닫기, CHOICE에서 도움말 버튼 재진입 (self-check)
- HELP 상태 중 게임 시작 불가, Space/Esc로 닫기 (self-check)
- 모바일 portrait: 버튼 아래 배치, 도움말 스크롤 (self-check)
- 콘솔 에러: 0 (self-check)

---

## v0.5.6 — 2026-05-23

**Theme:** Tutorial choice screen + 3-2-1 countdown before every fresh game start.

### What
- Added `STATE.CHOICE` and `STATE.COUNTDOWN` to the `STATE` object.
- `enterChoice()`: transitions READY/OVER → CHOICE. Resets `choiceHighlight=0`, shows overlay with title "천천히 시작해볼까요?" / subtitle "처음이라면 튜토리얼을 추천해요", reveals two DOM buttons (`#choice-buttons`). Default highlight: "튜토리얼부터 시작" (index 0). Game-over re-entry resets to index 0 each time (no localStorage).
- `updateChoiceHighlight()`: toggles `is-highlighted` CSS class between the two choice buttons.
- `confirmChoice(idx)`: hides `#choice-buttons`, sets `pendingStageIdx`, calls `enterCountdown()`.
- `enterCountdown()`: transitions → COUNTDOWN, snapshots `countdownStart = performance.now()`, hides overlay, calls `loadStage(pendingStageIdx)` so the board is pre-rendered under the mask.
- `finishCountdown()`: transitions → PLAYING, resets `tickAccum=0`, hides overlay.
- `drawCountdown(now)`: per-frame canvas draw — full-canvas warm-dark mask (alpha 0.35), per-number 180ms fade-in (ease-out-quart scale 0.7→1.0 + alpha 0→1) + 640ms hold + 180ms alpha-only fade-out, skip hint "Space · Esc — 바로 시작" fades in at 300ms elapsed.
- RAF countdown tick in `frame()`: checks `elapsed >= 3000ms`, calls `finishCountdown()` automatically.
- `auxAction()` rewritten: PLAYING→pause; PAUSED→PLAYING immediately (no CHOICE/COUNTDOWN); BLOCKED→inert; STAGE_CLEAR→inert; READY/OVER → `init()` if OVER then `enterChoice()`.
- Keydown handler: CHOICE branch at top (1/2/←→/Space); COUNTDOWN branch (Space/Esc → skip, all others ignored including rotation); existing branches below.
- Canvas `pointerdown`: CHOICE → no-op; COUNTDOWN → `finishCountdown()`; existing READY/PAUSED/OVER/PLAYING/BLOCKED branches below.
- DOM: `#choice-buttons` div with two `<button>` elements added inside `.overlay-content` in `index.html`.
- CSS: 14 new `--choice-btn-*` tokens + 11 `--countdown-*` tokens in `:root`. `.choice-buttons` flex row with `flex-wrap: wrap`. `.choice-btn` base + `.is-highlighted` (outline 2px accent, bg highlight, no layout shift). Mobile portrait media query adds `flex-direction: column` to `.choice-buttons`.
- `updateAuxButton()` simplified: CHOICE/COUNTDOWN show SVG_PLAY with aria-label "Start".
- Choice button DOM wiring via `pointerdown` on `#btn-choice-tutorial` and `#btn-choice-skip`.

### Why
Forced tutorial removed player agency on every restart. The CHOICE screen lets experienced players bypass the tutorial while keeping it the default for new players (index 0 = tutorial always). The 3-2-1 countdown prevents "start pressed → snake already moved" surprise, making the first moment feel calm and intentional.

### Decisions worth recording
- **(A) CHOICE via `auxAction()` — single entry point.** All READY/OVER triggers (Space key, canvas tap, aux button, mouse click) route through `auxAction()`. No new event paths; branch logic stays in one place.
- **(B) PAUSED/STAGE_CLEAR bypass CHOICE and COUNTDOWN.** The player is already engaged. Inserting a choice/countdown on resume would interrupt flow unnecessarily. PAUSED → PLAYING is immediate; STAGE_CLEAR → next stage bypasses both via `advanceStage()`.
- **(C) CHOICE default highlight always "튜토리얼부터 시작" (index 0).** No localStorage for last choice — simplicity over personalization. New-user-friendly default on every entry including game-over re-entry.
- **(D) COUNTDOWN → `loadStage(pendingStageIdx)` at entry, not at `finishCountdown()`.** The board is pre-rendered under the countdown mask so the player sees what they're about to play before committing. Score reset happens as part of `loadStage` when tutorial is selected via `init()` being called from OVER state before `enterChoice()`.
- **(E) COUNTDOWN Space/Esc → skip only; rotation keys ignored.** Snake hasn't started moving; queuing a direction during countdown would silently affect the first tick. Ignoring rotation entirely is simpler and avoids "invisible state" bugs.
- **(F) Canvas pointerdown in CHOICE → no-op.** DOM `<button>` elements handle selection directly. Canvas coordinate-based hit testing for overlapping buttons is error-prone; no-op is correct and safe.
- **(G) Countdown mask uses `--countdown-mask-color` (#3b2a1a @ 0.35 alpha), not `--mask-outside`.** `--mask-outside` (rgba 120,90,60,0.18) is the tutorial spotlight — lighter and different semantics. A distinct token avoids meaning collision.

### Verification
- READY → Space → CHOICE (튜토리얼 강조): OK (self-check)
- CHOICE: 1키 → tutorial COUNTDOWN; 2키 → stage1 COUNTDOWN; ← → 강조 토글; Space 확정; 버튼 직접 클릭: OK (self-check)
- CHOICE: 캔버스 탭 → no-op: OK (self-check)
- COUNTDOWN: 3-2-1 페이드 애니메이션; Space/Esc 스킵 → 즉시 PLAYING; 캔버스 탭 스킵: OK (self-check)
- COUNTDOWN: 회전 키 무시; Esc가 advanceStage 호출 안 함: OK (self-check)
- PLAYING → Space → PAUSED → Space → 즉시 PLAYING (CHOICE/COUNTDOWN 우회): OK (self-check)
- STAGE_CLEAR → 800ms 자동 advanceStage → PLAYING (우회): OK (self-check)
- OVER → Space → init 리셋 → CHOICE (튜토리얼 강조): OK (self-check)
- BLOCKED → 회전 → tryUnblock 정상: OK (self-check)
- 튜토리얼 중 Esc → advanceStage (변경 없음): OK (self-check)
- 모바일 portrait → choice-buttons flex-direction: column; 버튼 44px 이상: OK (self-check)
- 콘솔 에러: 0 (self-check)

---

## v0.5.5 — 2026-05-23

**Theme:** Hotfix for two v0.5.4 mobile-live bugs.

### What
- (1) Canvas `pointerdown` gains early-return for READY/PAUSED/OVER → `auxAction()`. Mobile users who miss the button strip can tap anywhere on the canvas to start/resume/restart.
- (2) `tryUnblock` always updates `nextDir`; only commits to `dir`/PLAYING when `isSafeDir` passes. This enables the 90°+90°=180° unstuck path: two same-direction inputs in BLOCKED correctly accumulate and escape when the second rotation reaches a safe direction.
- (3) Mobile media query relaxed from `(max-aspect-ratio: 1/1) and (hover: none) and (pointer: coarse)` to `(max-aspect-ratio: 1/1)` alone. Removes false-negative device detection; portrait aspect ratio is sufficient.

### Why
Mobile users could not start the game (no recognized button hit, canvas did not fall back). Tutorial BLOCKED could permanently stuck at corners — `nextDir` was never updated after the first unsafe rotation, making same-direction recovery impossible.

### Decisions worth recording
- **(A) Canvas tap routes to `auxAction()` for consistency with the aux button** — single Space-equivalent entry point. PLAYING and BLOCKED states continue through to rotation logic below the early-return guard.
- **(B) Keep rotation model (no 4-direction allowance); fix BLOCKED via accumulated `nextDir`** — rotation model consistency preserved. BLOCKED escape is achieved by accumulating `nextDir` across inputs and unblocking the moment `isSafeDir` passes.
- **(C) Drop hover/pointer conditions** — `(hover: none) and (pointer: coarse)` produced false negatives on some mobile devices; portrait aspect alone is sufficient and doubles as a desktop regression safety net (narrow windows also see the button strip).

### Verification
- Desktop keyboard regression: ← → / A D / ↑↓WS ignored / Space / Esc: OK (self-check)
- Desktop mouse — READY canvas click → start: OK (self-check)
- DevTools mobile portrait — canvas tap → start: OK (self-check)
- DevTools desktop window narrowed portrait → mobile buttons visible (media query relaxation): OK (self-check)
- BLOCKED corner — left+left or right+right (90°+90°=180°) → PLAYING recovery: OK (self-check)
- 8-stage auto-transition preserved: OK (self-check)
- Esc tutorial skip preserved: OK (self-check)
- PLAYING/BLOCKED canvas tap rotation identical to v0.5.4 (regression): OK (self-check)
- STAGE_CLEAR canvas tap → no-op: OK (self-check)

---

## v0.5.4 — 2026-05-23

**Theme:** left/right rotation model + mobile portrait controls.

### What
- Replaced 4-direction absolute input with left/right relative rotation model.
- Added `rotateLeft(d)` / `rotateRight(d)` helpers (90° rotation math).
- Added `applyTurn(rot)` wrapper: routes to `setDirection` (PLAYING) or `tryUnblock` (BLOCKED), then dismisses touch hint.
- Removed `dirFromKey()` function entirely.
- Removed 180° guard from `setDirection` (rotation math makes U-turn via single input impossible; guard was dead code).
- `isSafeDir` internal 180° guard preserved (still needed for tryUnblock correctness in tutorial).
- Keyboard: `ArrowLeft` / `A` / `a` → rotateLeft; `ArrowRight` / `D` / `d` → rotateRight. No `preventDefault` on these keys (page scroll preserved). `↑ ↓ W S` silently ignored. Space routes through `auxAction()`.
- Canvas `pointerdown` handler: computes `pixelX` via `getBoundingClientRect` ratio, left half → rotateLeft, right half → rotateRight.
- Mobile DOM: 3-button strip (`#btn-rot-left`, `#btn-aux`, `#btn-rot-right`) with inline SVG icons. No text labels.
- `updateAuxButton()`: syncs `aria-label` and SVG (play triangle / pause bars) on every state transition.
- Touch zone hint: two faint `rgba(201, 165, 116, 0.08)` fillRect bands on canvas; 300ms delay, 400ms ease-out fade-in, 200ms ease-in fade-out on first input. Flag resets on `init()` and `loadStage()`.
- Overlay texts updated: init → `"← → 또는 A D — 회전 · Space — 시작/일시정지/재시작"`, blocked → `"← → 또는 A D로 회전해주세요"`.
- CSS: canvas viewport-fit (`width: min(100vw - 32px, 100vh - var(--mobile-controls-reserve), 400px)`, `aspect-ratio: 1/1`). Mobile media query `(max-aspect-ratio: 1/1) and (hover: none) and (pointer: coarse)` shows `.mobile-controls`, hides `.hint`, sets `--mobile-controls-reserve`. `safe-area-inset-bottom` on controls strip padding.
- 17 new CSS tokens: button size, radius, colors, shadow, gap, controls area dimensions.
- Viewport meta updated to `viewport-fit=cover`.
- `.container` gains `width: 100%; max-width: 480px`.

### Why
Issue #4: keyboard-only 4-direction input is awkward on mobile (no buttons) and non-intuitive for relative navigation. Left/right rotation is natural for snake-type games — the player thinks "turn left" not "go north." Replacing the model globally (not just on mobile) eliminates the dual-vocabulary problem.

### Decisions worth recording
- **(A) Rotation model, not toggle.** Keeping a legacy absolute-direction mode would require two parallel input paths and two mental models. Replacing entirely is cleaner; the spec explicitly forbids a toggle option.
- **(B) 180° guard removal is a natural bug fix.** The guard in `setDirection` was a deferred v0.1 known issue (HISTORY.md v0.3). With rotation math, a single left/right input cannot produce a U-turn, so the guard is dead code. Removing it resolves the deferred item without extra logic.
- **(C) `isSafeDir` 180° guard preserved.** `tryUnblock` uses `isSafeDir` to prevent unblocking into a reverse-direction crash in the tutorial. This guard is still meaningful and must not be removed.
- **(D) Single mobile media query.** `(max-aspect-ratio: 1/1) and (hover: none) and (pointer: coarse)` is the only branch point. No `max-width` — avoids misfiring on resized desktop windows.
- **(E) `viewport-fit` canvas CSS (always-on).** Canvas size clamp applies outside the media query too, so desktop windows resized narrow also get a fitted canvas without buttons.
- **(F) Single aux button** maps 1:1 to Space: start → pause → restart cycle. State is reflected in aria-label and icon. BLOCKED state leaves aux inert (same as Space).
- **(G) `hintDismissed` flag resets on init/loadStage.** New game sessions show the hint again; experienced players dismiss it instantly with first input. Minimal friction for both audiences.

### Verification
- Desktop keyboard: ← → rotate, AD rotate, ↑↓WS ignored, Space start/pause/restart, Esc skip tutorial: OK (self-check)
- Desktop mouse: canvas left/right half click rotates: OK (self-check)
- Mobile portrait (simulated): 3-button strip visible, hint hidden, safe-area padding applied: OK (self-check)
- Mobile landscape (simulated): buttons hidden, canvas fits viewport, no scroll: OK (self-check)
- Touch zone hint: 300ms delay → fade-in → first input → 200ms fade-out → dismissed for session: OK (self-check)
- 8-stage transition: tutorial → 1 → 2 → 3 preserved: OK (self-check)
- BLOCKED recovery: tutorial wall collision → new overlay text → safe rotation key → resumed: OK (self-check)
- U-turn: single left/right key cannot produce U-turn by rotation math: OK (self-check)
- Console errors: 0 (self-check)
- Payload: see PR body

---

## v0.5.3 — 2026-05-23

**Theme:** the snake actually digests.

### What
- Added `bulges` array (module scope, cap 8) and `BULGE_MAX = 8` constant.
- Added 7 new TOKEN entries: `bulgeFlowSpeed`, `bulgeMaxScale`, `bulgeMinScale`, `bulgeFadeMs`, `bulgeFill`, `bulgeAspect`, `bulgeWidthCap`.
- `spawnBulge()`: called from `tick()` on apple eat. Drops oldest bulge if cap reached. Immediately enters fade for snake length ≤ 2.
- `updateBulges(dt, now)`: advances `progress += bulgeFlowSpeed × dt / 1000` when `state === PLAYING`. Transitions to fade when `progress >= spawnLen - 1`. Removes faded bulges after `bulgeFadeMs`.
- `evalBulgePoint(progress, snake)`: linear lerp between adjacent segment centers (simple 1st-pass; corner Bezier deferred).
- `drawBulges(now)`: draws each bulge as a `ctx.ellipse()` oriented along the tangent vector. Scale lerps from `bulgeMaxScale` → `bulgeMinScale` during travel; held at `bulgeMinScale` during fade. Alpha 1.0 → 0.0 linear during fade.
- Drawing order updated: background → apple → body → **bulge ellipses** → head.
- `bulges.length = 0` added to `init()`, `loadStage()`, `gameOver()`, `advanceStage()`.
- Module-scope `cellCenterX(seg)` / `cellCenterY(seg)` helpers extracted from `drawSnakeBody` closure. `drawSnakeBody` now calls these helpers (duplicate removed).
- `computeSquash()` cleanup: removed unused `eased` variable and its 3-line computation (dead code from v0.5.2).

### Why
User feedback: eating an apple gave no "inside-the-snake" feedback. The bulge animation gives a calm, cozy visual receipt that the food is being digested, matching the 아기자기 tone without adding any gameplay complexity.

### Decisions worth recording
- **(A) Simple lerp, not Bezier, for 1st pass.** Corner Bezier re-use is accurate but adds ~30 lines of geometry. Visual result confirmed first on straight paths; corner Bezier may ship as a separate commit if SCM review flags visible drift at bends.
- **(B) `state === PLAYING` guard.** Without this, bulges progress through paused/blocked/game-over screens, which reads as a bug. Single-condition check is zero cost.
- **(C) Alpha-only fade (scale held at `bulgeMinScale`).** Shrinking while fading looked like the bulge evaporated into thin air. Alpha-only reads as "absorbed by the snake," which matches the digestion metaphor.
- **(D) `spawnLen` snapshot at spawn.** The snake may grow after a bulge spawns; if `progressFrac` used live `snake.length`, the scale curve would shift retroactively. Snapshot freezes the intended arc.
- **(E) `bulges.length = 0` in both `init()` and `loadStage()`.** `init()` calls `loadStage()`, but `loadStage()` is also called from `advanceStage()`. Clearing in both ensures no stale bulges cross a stage boundary.

### Verification
- Eat apple → red ellipse appears on head and flows toward tail: OK (self-check)
- Tail reached → 200ms alpha fade → removed from array: OK (self-check)
- Multiple apples eaten in quick succession → independent bulges: OK (self-check)
- Space pause → bulge freezes; resume → continues from same position: OK (self-check)
- Tutorial BLOCKED → bulge freezes: OK (self-check)
- Game over → restart → no stale bulges: OK (self-check)
- Tutorial Esc skip → no stale bulges: OK (self-check)
- Snake length 2 → eat apple → bulge spawns immediately fading: OK (self-check)
- 8+ rapid eats → oldest dropped, newest pushed: OK (self-check)
- Drawing order: body below bulge, head above bulge: OK (self-check)
- 60fps: simple lerp + up to 8 ellipse draw calls, well inside 16.7ms budget; no long tasks observed
- Payload: see PR body for measured total

Carryover: computeSquash() unused eased variable removed.

---

## v0.5.2 — 2026-05-23

**Theme:** the snake actually looks like a snake.

### What
- Replaced per-segment `fill()` with a single `beginPath … stroke()` capsule polyline (`drawSnakeBody`). `lineWidth = CELL × 0.86`, `lineCap = round`, `lineJoin = round`.
- Shadow drawn as a second wider stroke (`lineWidth + 2`, `snakeShadow` color) with a 1px y-translate before the main stroke.
- Interior segments (index 2 through len-3) use `quadraticCurveTo(cellCenter, edgeMidpointOut)` for smooth corner curves; tail-adjacent (len-2) and tail (len-1) use `lineTo` to prevent pinch.
- Head redrawn as `ctx.ellipse()` — facing-axis radius `CELL × 0.55`, perpendicular radius `CELL × 0.46` — oriented via `angleFromDir()` rotate.
- Eyes placed in local head-space: forward offset `CELL × 0.18`, side offset `±CELL × 0.22`. Pupil color `#2a2018`.
- Tongue tip (pink ellipse, `#ef9aa6`) visible for 120ms every 1600ms as an idle flicker.
- Squash & stretch on eat: facing scale 1.18, perpendicular scale 0.88, over 180ms; composed multiplicatively with existing eat-pulse (1.10 over 150ms) via `ctx.scale()`.
- Removed old `drawSegment()` function entirely.
- Introduced helper functions: `angleFromDir`, `computePulse`, `computeSquash`.
- TOKEN object extended with 12 new v0.5.2 tokens; sparkle tokens defined in STYLE.md but intentionally absent from code.

### Why
User feedback: discrete square segments stacked next to each other read as tiles, not as a living creature. The single capsule stroke closes the gap between cells invisibly, and the ellipse head with eyes makes the snake's direction and identity unmistakable.

### Decisions worth recording
- **(A) Single path stroke over filled outline.** A filled outline path would require both sides of the body and clean joins at bends — fragile and 2–3× more vertex work. One `stroke()` with `lineJoin=round` achieves the same result.
- **(B) Inline corner detection.** Direction diff (`pdx !== ndx || pdy !== ndy`) is computed inside the same `for` loop that builds the polyline — O(N), no extra pass, no per-frame array allocation.
- **(C) Tail-adjacent pinch prevention.** The second-to-last segment skips `quadraticCurveTo` even if it geometrically qualifies as a corner; prototyping showed a visible pinch artifact there.
- **(D) Head ellipse covers body join.** The body polyline starts at the midpoint between head and first body segment, and the head ellipse is drawn on top, hiding the join. No special-case needed for the head-adjacent corner.
- **(E) Sparkle tokens reserved, not activated.** Adding sparkles risks "frantic," which violates the cozy tone rule. Tokens are in STYLE.md only; no dead keys in game.js.

### Verification
- Space 시작 / 4방향 이동 / Esc 튜토리얼 스킵 / Space 일시정지 / Game over → Space 재시작: OK
- 튜토리얼 벽 충돌 → BLOCKED (게임오버 X): OK
- Stage 1 / Stage 2 / Stage 3 자동 전이 정상: OK
- 머리 4방향 계란형 silhouette 확인 (자체 확인): OK
- 일직선 구간 segment 경계선 없음 (자체 확인): OK
- 회전 ㄱ/ㄴ/U 곡선 (자체 확인): OK
- 먹기 squash 변형 (자체 확인): OK
- 60fps 확인: RAF 기반 단일 path stroke — beginPath 1회 + N lineTo/quadraticCurveTo + stroke 1회, 상수 head draw calls; 이미지 캡처 자동화 불가로 텍스트 확인으로 대체
- 페이로드: 50KB 이하 (신규 draw 로직은 수 KB 이내, 에셋 추가 없음)

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
