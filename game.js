// Single source of truth for the version (issue #26). The page's version label is
// filled from this, and android/app/build.gradle.kts parses this exact line to
// derive versionName/versionCode — keep the `const GAME_VERSION = 'X.Y.Z';` form.
const GAME_VERSION = '0.7.0';

const versionEl = document.getElementById("version");
if (versionEl) versionEl.textContent = `v${GAME_VERSION}`;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const stageEl = document.getElementById("stage");
// v0.7.0 (#50) — "남은 칸" HUD item, shown only on fillBoard stages
const cellsWrapEl = document.getElementById("cells-wrap");
const cellsLeftEl = document.getElementById("cells-left");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");

// mobile button DOM references
const btnRotLeft  = document.getElementById("btn-rot-left");
const btnRotRight = document.getElementById("btn-rot-right");
const btnAux      = document.getElementById("btn-aux");

// choice button DOM references
const choiceButtonsEl  = document.getElementById("choice-buttons");
const btnChoiceTutorial = document.getElementById("btn-choice-tutorial");
const btnChoiceSkip    = document.getElementById("btn-choice-skip");
const btnChoiceFill    = document.getElementById("btn-choice-fill"); // v0.7.0 (#50)
const choiceBtns = [btnChoiceTutorial, btnChoiceSkip, btnChoiceFill];

// v0.5.7 — help modal DOM references
const helpModal    = document.getElementById("help-modal");
const btnHelpClose = document.getElementById("btn-help-close");
const btnHelpOpen  = document.getElementById("btn-help-open");

// v0.5.7 — dynamic canvas sizing (HiDPI + responsive)
// CANVAS_W/CANVAS_H/CELL replaced by module vars canvasW/canvasH/cellSize
let canvasW = 400;
let canvasH = 400;
let cellSize = 20;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr  = window.devicePixelRatio || 1;
  const cssW = rect.width  || 400;
  const cssH = rect.height || 400;

  canvas.width  = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);

  canvasW = cssW;  // store in CSS pixels for coordinate math
  canvasH = cssH;

  // Integer-snap cell size in CSS pixels (STYLE.md --cell-pixel-snap rule)
  const logicalCols = (stage && stage.cols) ? stage.cols : 20;
  cellSize = Math.max(1, Math.floor(cssW / logicalCols));

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);

// v0.6.5 (#40) — CSS sizes the board for a one-line HUD; if it wraps, pass the extra
// height as --hud-extra so the board shrinks instead of the page scrolling.
const hudEl = document.querySelector(".hud");
let hudExtra = 0;
function syncHudExtra() {
  const one = parseFloat(getComputedStyle(hudEl).lineHeight) || 0;
  const h = hudEl.getBoundingClientRect().height;
  const extra = one > 0 && h > one * 1.5 ? Math.ceil(h - one) : 0;
  if (extra === hudExtra) return;
  hudExtra = extra;
  document.documentElement.style.setProperty("--hud-extra", extra + "px");
  resizeCanvas();
}
if (hudEl && typeof ResizeObserver === "function") new ResizeObserver(syncHudExtra).observe(hudEl);

const TOKEN = {
  bgBoard: "#fff4dc",
  gridLine: "rgba(120, 90, 60, 0.06)",
  maskOutside: "rgba(120, 90, 60, 0.18)",
  snakeBody: "#7cc47c",
  snakeHead: "#6bb96b",
  snakeShadow: "rgba(60, 100, 60, 0.18)",
  appleBody: "#ef6f6c",
  appleHighlight: "rgba(255, 255, 255, 0.55)",
  appleLeaf: "#7ac74f",
  appleStem: "#5d3a1c",
  radiusCell: 5,
  wobblePeriod: 1200,
  wobbleAmp: 1.5,
  eatPulseDur: 150,
  eatPulseScale: 1.10,
  // v0.5.2 eat squash tokens
  eatSquashX: 1.18,
  eatSquashY: 0.88,
  eatSquashDur: 180,
  // v0.5.2 head geometry (CELL-relative — computed inline in draw using cellSize)
  headLengthFactor: 1.10,
  headWidthFactor: 0.92,
  headEyeOffsetForwardFactor: 0.18,
  headEyeOffsetSideFactor: 0.22,
  headPupilColor: "#2a2018",
  // v0.5.2 tongue tokens
  headTongueColor: "#ef9aa6",
  headTongueLength: 3,
  headTonguePeriod: 1600,
  headTongueOn: 120,
  // v0.5.2 body token (factor; actual = cellSize * 0.86)
  bodyThicknessFactor: 0.86,
  // v0.6.4 rounded path: a late turn press still bends in over at least this many ticks
  bendMinTicks: 0.4,
  // Corner arc radius in cells (≤ 1). Auto-clamped to 0.5 where two corners are
  // adjacent, so back-to-back turns never overlap.
  cornerRadiusFactor: 0.65,
  // v0.5.3 digestion bulge tokens
  bulgeFlowSpeed: 2.0,
  bulgeFadeMs: 200,
  bulgeFill: "#d76461",
  bulgeAspect: 1.15,
  // v0.6.4 swelling lump (cell-relative; replaces bulgeMax/MinScale + WidthCapFactor)
  bulgeSwellStart: 0.17,   // extra half-width at the head → 1.20 cells wide (body 0.86)
  bulgeSwellEnd: 0.05,     // extra half-width at the tail → 0.96 cells wide
  bulgeSwellHalfLen: 0.8,  // swell reach along the body, each side, in cells
  bulgeTintRadius: 0.30,   // fruit seen inside: half-height at spawn (×cell)
  bulgeTintEndScale: 0.6,  // fruit size at the tail, relative to spawn
  bulgeTintAlphaStart: 0.9,
  bulgeTintAlphaEnd: 0.12,
  // v0.5.7 wiggle tokens (v0.5.9: 절제 — 토큰 값만 하향, drawBulges 구조 불변)
  wiggleAmpFactor: 0.07,    // was 0.15 — amplitude = cellSize * 0.07 (~1.4px peak)
  wiggleFreqHz: 1.5,        // was 2.0 — 속도 절제 (full cycle 667ms)
  wigglePhaseStep: Math.PI / 3, // 유지 (anti-sync), 절제 대상 아님
  // v0.5.9 tongue flick tokens (idle headTongue* 재사용, 신규 색 없음)
  tongueFlickDur: 200,           // ms — idle 120ms보다 길게 = 차별화
  tongueFlickLengthScale: 1.6,   // headTongueLength * 1.6 peak (~4.8px)
  // v0.5.9 yawn tokens (머리 squash 변형 재사용, 신규 색 없음)
  yawnAfterMs: 5000,       // 연속 직진 임계
  yawnCooldownMs: 8000,    // 재트리거 쿨다운
  yawnDur: 900,            // 1회 모션 지속(느린 하품)
  yawnFacingScale: 1.08,   // facing축 peak scale (미세)
  yawnPerpScale: 0.96,     // perp축 peak scale (면적 ≈ 보존)
  // v0.5.6 countdown tokens
  countdownMaskColor: "#3b2a1a",
  countdownMaskAlpha: 0.35,
  countdownNumSize: 120,
  countdownNumColor: "#3b2a1a",
  countdownFadeIn: 180,
  countdownHold: 640,
  countdownFadeOut: 180,
  countdownScaleFrom: 0.7,
  countdownTotalPerNum: 1000,
  countdownSkipFontSize: 12,
  countdownSkipColor: "#8a7460",
};

// v0.6.0 — spawnCount: 동시 스폰 과일 수, fruitMoves: 머리로 드리프트하는 이동 과일.
// 미정의 필드는 코드에서 기본값(spawnCount=1, fruitMoves=false)으로 폴백한다(Decision G).
// v0.7.0 (#50) — tick = round(STAGE_TICK_BASE × STAGE_TICK_STEP^(n−1)): 1% faster per
// stage. 1–10 clear on apples (5→20); 11–13 (fillBoard, even boards) clear when the snake
// fills every cell, and 13 ends the run. #30: St3 fruit stays still, 7–10 move.
const STAGE_TICK_BASE = 220;
const STAGE_TICK_STEP = 0.99;
function stageTick(n) { return Math.round(STAGE_TICK_BASE * Math.pow(STAGE_TICK_STEP, n - 1)); }
// st(n, board size, apples to clear | null = fill the board, fruits at once, fruit moves)
const st = (n, k, apples, spawnCount, fruitMoves) => ({ id: n, label: "스테이지 " + n, cols: k, rows: k,
  tick: stageTick(n), snakeLen: 3, clearAfterApples: apples, fillBoard: apples == null, spawnCount, fruitMoves, noFailOnHit: false });
const STAGES = [
  { id: "tutorial", label: "튜토리얼", cols: 5, rows: 5, tick: 420, snakeLen: 2, clearAfterApples: 3, spawnCount: 1, fruitMoves: false, noFailOnHit: true },
  st(1, 20, 5, 1, false), st(2, 20, 6, 1, false), st(3, 20, 7, 1, false), st(4, 20, 8, 3, false),
  st(5, 20, 10, 3, false), st(6, 20, 12, 5, false), st(7, 20, 14, 5, true), st(8, 20, 16, 5, true),
  st(9, 20, 18, 8, true), st(10, 20, 20, 8, true),
  st(11, 6, null, 1, false), st(12, 8, null, 1, false), st(13, 10, null, 1, false),
];
// 시작 메뉴 선택지 → STAGES 인덱스 (튜토리얼 / 바로 시작 / 11 스테이지부터)
const CHOICE_STAGES = [0, 1, 11];

// STATE 2개 추가 + v0.5.7 HELP
const STATE = {
  READY: "ready",
  PLAYING: "playing",
  PAUSED: "paused",
  BLOCKED: "blocked",
  STAGE_CLEAR: "stage_clear",
  OVER: "over",
  CHOICE: "choice",
  COUNTDOWN: "countdown",
  HELP: "help",
};

const STAGE_CLEAR_HOLD_MS = 800;

// v0.5.3 bulge array — module scope, max 8
const bulges = [];
const BULGE_MAX = 8;

// touch zone hint module-scope state
let hintDismissed = false;
let hintReadyAt = 0;
let hintFadeOutStart = 0;
const HINT_DELAY_MS = 300;
const HINT_FADE_IN_MS = 400;
const HINT_FADE_OUT_MS = 200;
const HINT_PEAK_ALPHA = 0.08;

// SVG constants for aux button
const SVG_PLAY = `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="8 5 19 12 8 19 8 5" fill="currentColor" stroke="none"/></svg>`;
const SVG_PAUSE = `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/></svg>`;

// 모듈 스코프 상태 변수
let choiceHighlight = 0;
let pendingStageIdx = 0;
let countdownStart = 0;

let stageIndex;
let stage;
// v0.6.0 — single `food` generalized to `foods` array. Each element:
// { x, y, px, py } where px/py is the previous grid cell for render interpolation
// (moving fruit). Static fruit keeps px===x, py===y.
let foods = [];
let snake, dir, nextDir, score, best, state;
let applesEaten;
// v0.6.0 — moving-fruit drift timer (RAF dt accumulator; PLAYING only).
let fruitMoveAccum = 0;
let tickAccum = 0;
let lastFrame = 0;
let eatStart = -Infinity;
let stageClearAt = 0;

// v0.5.9 head ambient state (render-only; never affects logic/collision/score)
let tongueFlickAt = -Infinity; // timestamp of last apple-eat tongue flick
let lastTurnAt = -Infinity;    // timestamp of last applied heading change (straight-run anchor)
let yawnAt = -Infinity;        // timestamp of last yawn trigger (drives duration + cooldown)

// v0.5.8 — render-only tween: prevSnake snapshots grid positions before tick()
// mutates snake; renderT is the [0,1] progress within the tick (PLAYING only).
let prevSnake = [];
let renderT = 0;
let prevState = null;
let hostKeepAwake = null; // v0.6.2 (#28) — last value sent to Android.setKeepScreenOn

// v0.6.4 — rounded-path render state. tailTrail = the cell the tail sat in before its
// current one, so the last body cell can round its corner too (render-only).
let tailCell = null;
let tailTrail = null;

function snapshotSnake() {
  prevSnake = snake.map((s) => ({ x: s.x, y: s.y }));
  const t = snake[snake.length - 1];
  if (tailCell && (tailCell.x !== t.x || tailCell.y !== t.y)) tailTrail = tailCell;
  tailCell = { x: t.x, y: t.y };
}

function init() {
  stageIndex = 0;
  score = 0;
  best = Number(localStorage.getItem("snake-best") || 0);
  // v0.6.5 (#35) — the Android shell's copy survives a kill right after game over
  // (WebView localStorage writes lazily); take the higher.
  try {
    if (typeof Android !== "undefined" && Android.getBest) best = Math.max(best, Number(Android.getBest()) || 0);
  } catch (_) {}
  applesEaten = 0;
  state = STATE.READY;
  tickAccum = 0;
  eatStart = -Infinity;
  // v0.5.9 — reset head ambient state
  tongueFlickAt = -Infinity;
  lastTurnAt = -Infinity;
  yawnAt = -Infinity;
  bulges.length = 0;
  // reset hint state
  hintDismissed = false;
  hintReadyAt = performance.now();
  hintFadeOutStart = 0;
  loadStage(stageIndex);
  resizeCanvas();
  updateHud();
  showOverlay(
    uiText("스페이스바로 시작", "화면을 탭해서 시작"),
    uiText("← → 또는 A D — 회전 · 스페이스 — 시작/일시정지/재시작", "회전 버튼이나 화면 왼쪽·오른쪽 탭 — 회전"),
  );
  updateAuxButton();
  // v0.5.7 — auto-show help on first visit
  try {
    if (!localStorage.getItem("snakegame.helpSeen")) openHelp(STATE.READY);
  } catch (_) {}
}

function loadStage(idx) {
  stage = STAGES[idx];
  // v0.5.7.1 (Issue #12) — recompute cellSize for the new stage's grid before
  // placing food / drawing, so stage transitions (e.g. 5x5 tutorial → 20x20)
  // rescale instead of keeping the previous stage's cell size.
  resizeCanvas();
  applesEaten = 0;
  const startX = Math.floor(stage.cols / 2) - Math.floor(stage.snakeLen / 2);
  const startY = Math.floor(stage.rows / 2);
  snake = [];
  for (let i = 0; i < stage.snakeLen; i++) {
    snake.push({ x: startX + (stage.snakeLen - 1 - i), y: startY });
  }
  dir = { x: 1, y: 0 };
  nextDir = dir;
  tailCell = tailTrail = null; // v0.6.4
  tickAccum = 0;
  fruitMoveAccum = 0; // v0.6.0 — reset moving-fruit drift timer per stage
  bulges.length = 0;
  // reset hint state on stage load
  hintDismissed = false;
  hintReadyAt = performance.now();
  hintFadeOutStart = 0;
  placeFood();
  updateHud();
  updateAuxButton();
}

// v0.6.0 — stage field accessors with safe defaults (Decision G).
function stageSpawnCount() { return stage.spawnCount || 1; }   // 0/falsy -> 1
function stageFruitMoves() { return stage.fruitMoves === true; }

// v0.6.0 — collect grid cells occupied by neither the snake body nor existing fruit.
// Empty-cell-list approach (not while(true) random retry) so a near-full board cannot
// loop forever; worst case is one O(cols*rows) pass (Set C safety).
function emptyCells() {
  const occupied = new Set();
  for (const s of snake) occupied.add(s.y * stage.cols + s.x);
  for (const f of foods) occupied.add(f.y * stage.cols + f.x);
  const cells = [];
  for (let y = 0; y < stage.rows; y++) {
    for (let x = 0; x < stage.cols; x++) {
      if (!occupied.has(y * stage.cols + x)) cells.push({ x, y });
    }
  }
  return cells;
}

// v0.6.0 — spawn one fruit on a random empty cell. Returns true if placed, false if
// the board has no free cell (safe no-op, no crash/hang). Each new fruit starts with
// px/py === x/y so it renders static until it first moves.
function spawnFood() {
  const cells = emptyCells();
  if (cells.length === 0) return false;
  const c = cells[Math.floor(Math.random() * cells.length)];
  foods.push({ x: c.x, y: c.y, px: c.x, py: c.y });
  return true;
}

// v0.6.0 — refill to spawnCount fruits on distinct empty cells (stops if the board is full).
function placeFood() {
  foods = [];
  const want = stageSpawnCount();
  for (let i = 0; i < want; i++) {
    if (!spawnFood()) break; // board full — stop safely
  }
}

function updateHud() {
  scoreEl.textContent = score;
  bestEl.textContent = best;
  stageEl.textContent = stage.label;
  cellsWrapEl.hidden = !stage.fillBoard;
  if (stage.fillBoard) cellsLeftEl.textContent = stage.cols * stage.rows - snake.length;
}

// v0.6.2 (#25) — touch-first devices (phones, tablets, the Android app) get touch
// wording instead of keyboard instructions. A MediaQueryList's `matches` is live, so a
// tablet that gains a mouse/keyboard as its primary pointer follows along.
const coarsePointerMq = typeof window.matchMedia === "function"
  ? window.matchMedia("(pointer: coarse)")
  : null;

function isTouchUi() {
  return !!(coarsePointerMq && coarsePointerMq.matches);
}

function uiText(keyboard, touch) {
  return isTouchUi() ? touch : keyboard;
}

function showOverlay(title, msg) {
  overlayTitle.textContent = title;
  overlayMsg.textContent = msg;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function start() {
  if (state === STATE.PLAYING) return;
  if (state === STATE.OVER) init();
  state = STATE.PLAYING;
  hideOverlay();
  updateAuxButton();
}

function pause() {
  // v0.6.2 (#22) — COUNTDOWN can pause too: it runs on wall-clock time, so leaving it
  // running while the page is hidden would finish it unseen and start play on return.
  if (state !== STATE.PLAYING && state !== STATE.COUNTDOWN) return;
  state = STATE.PAUSED;
  showOverlay("일시정지", uiText("스페이스바로 계속하기", "탭해서 계속하기"));
  updateAuxButton();
}

// v0.6.2 (#22) — leaving the page never costs a life (visibilitychange / SnakeHost.onPause).
function suspendGame() {
  // The 800 ms clear hold would expire while away and auto-start the next stage on
  // return — advance now so the player comes back to a paused, fresh stage instead.
  if (state === STATE.STAGE_CLEAR) advanceStage();
  pause();
  syncHostKeepAwake();
}

// v0.6.2 (#28) — the Android shell keeps the screen awake only while a run is in
// progress (it used to for the whole session). Synced from frame() on every state
// change; Android.setKeepScreenOn is absent in browsers.
function syncHostKeepAwake() {
  const want = state === STATE.PLAYING || state === STATE.COUNTDOWN || state === STATE.STAGE_CLEAR;
  if (want === hostKeepAwake) return;
  hostKeepAwake = want;
  if (typeof Android !== "undefined" && Android.setKeepScreenOn) Android.setKeepScreenOn(want);
}

// allCleared (v0.7.0 #50): the last stage was filled — same end of run, no fail buzz.
function gameOver(allCleared) {
  // v0.6.1 — Android shell haptic bridge (no-op in a plain browser).
  if (!allCleared && typeof Android !== "undefined" && Android.vibrate) Android.vibrate(100);
  state = STATE.OVER;
  bulges.length = 0;
  if (score > best) {
    best = score;
    // v0.6.5 (#35) — shell first: it is on disk when the call returns.
    try {
      if (typeof Android !== "undefined" && Android.saveBest) Android.saveBest(best);
    } catch (_) {}
    localStorage.setItem("snake-best", String(best));
    updateHud();
  }
  showOverlay(allCleared ? "모든 스테이지 클리어!" : "게임 끝",
    `점수: ${score} · ${uiText("스페이스바로 다시 시작", "탭해서 다시 시작")}`);
  updateAuxButton();
}

function enterStageClear() {
  // v0.7.0 (#50) — clearing the last stage ends the run like a game over (best is
  // recorded, restart goes to the start menu), with its own overlay.
  if (stageIndex >= STAGES.length - 1) return gameOver(true);
  state = STATE.STAGE_CLEAR;
  stageClearAt = performance.now();
  const next = STAGES[stageIndex + 1];
  if (stage.id === "tutorial") {
    showOverlay("튜토리얼 클리어!", "곧 스테이지 1로 이동합니다");
  } else if (next) {
    showOverlay(`${stage.label} 클리어!`, `곧 ${next.label}로 이동합니다`);
  } else {
    showOverlay(`${stage.label} 클리어!`, "");
  }
  updateAuxButton();
}

function advanceStage() {
  bulges.length = 0;
  stageIndex += 1;
  if (stageIndex >= STAGES.length) {
    // No more stages defined; stay on the last stage as endless mode
    stageIndex = STAGES.length - 1;
  }
  loadStage(stageIndex);
  state = STATE.PLAYING;
  hideOverlay();
  updateAuxButton();
}

function wouldHit(head) {
  if (head.x < 0 || head.x >= stage.cols || head.y < 0 || head.y >= stage.rows) return true;
  // exclude tail tip — it will move out of the way unless the snake is also growing
  return snake.some((s, i) => i < snake.length - 1 && s.x === head.x && s.y === head.y);
}

function isSafeDir(dx, dy) {
  if (dx === -dir.x && dy === -dir.y) return false;
  const probe = { x: snake[0].x + dx, y: snake[0].y + dy };
  return !wouldHit(probe);
}

function enterBlocked() {
  state = STATE.BLOCKED;
  showOverlay("잠깐!", uiText("← → 또는 A D로 회전해주세요", "회전 버튼으로 방향을 바꿔주세요"));
  updateAuxButton();
}

// CHOICE 진입/이탈 함수
function enterChoice() {
  state = STATE.CHOICE;
  choiceHighlight = 0;
  showOverlay("천천히 시작해볼까요?", "처음이라면 튜토리얼을 추천해요");
  choiceButtonsEl.classList.remove("hidden");
  overlay.classList.remove("hidden");
  updateChoiceHighlight();
  updateAuxButton();
}

// v0.5.7 — help screen functions
let helpReturnState = STATE.READY;
let helpReturnFocus = null;

function openHelp(returnTo) {
  helpReturnState = returnTo || STATE.READY;
  helpReturnFocus = document.activeElement;
  state = STATE.HELP;
  helpModal.classList.remove("hidden");
  btnHelpClose.focus();
}

function closeHelp() {
  helpModal.classList.add("hidden");
  try { localStorage.setItem("snakegame.helpSeen", "true"); } catch (_) {}
  state = helpReturnState;
  if (helpReturnFocus && helpReturnFocus.focus) {
    helpReturnFocus.focus();
  }
}

function updateChoiceHighlight() {
  choiceBtns.forEach((b, i) => b.classList.toggle("is-highlighted", i === choiceHighlight));
}

function confirmChoice(idx) {
  choiceButtonsEl.classList.add("hidden");
  pendingStageIdx = CHOICE_STAGES[idx]; // v0.7.0 — choice 2 = stage 11
  enterCountdown();
}

function enterCountdown() {
  state = STATE.COUNTDOWN;
  countdownStart = performance.now();
  hideOverlay();
  // v0.6.2 — keep stageIndex in step with the stage actually loaded. "바로 게임 시작"
  // loads stage 1 while stageIndex stayed 0 (tutorial), so clearing stage 1 announced
  // and replayed stage 1 instead of moving on to stage 2.
  stageIndex = pendingStageIdx;
  loadStage(pendingStageIdx);
  updateAuxButton();
}

function finishCountdown() {
  state = STATE.PLAYING;
  tickAccum = 0;
  hideOverlay();
  updateAuxButton();
}

function tick() {
  snapshotSnake(); // v0.5.8 — capture pre-move grid positions for the render tween
  // v0.5.9 — anchor straight-run tracking when heading actually changes (yawn input)
  if (nextDir.x !== dir.x || nextDir.y !== dir.y) lastTurnAt = performance.now();
  dir = nextDir;
  const prevHead = snake[0]; // v0.6.1 — head cell about to be vacated (for swap eat)
  const head = { x: prevHead.x + dir.x, y: prevHead.y + dir.y };

  if (wouldHit(head)) {
    if (stage.noFailOnHit) return enterBlocked();
    return gameOver();
  }

  snake.unshift(head);
  // At most one fruit eaten per tick (v0.6.0); fruit drift never eats.
  let eatIdx = foods.findIndex((f) => f.x === head.x && f.y === head.y);
  // v0.6.1 — a fruit swapping cells with the head counts as eaten (pass-through fix).
  if (eatIdx === -1) {
    eatIdx = foods.findIndex((f) => f.x === prevHead.x && f.y === prevHead.y);
  }
  if (eatIdx !== -1) {
    foods.splice(eatIdx, 1); // remove the eaten fruit
    score += 10;
    applesEaten += 1;
    updateHud();
    eatStart = performance.now();
    tongueFlickAt = eatStart; // v0.5.9 — fire a one-shot tongue flick on eat
    // v0.6.1 — Android shell haptic bridge (no-op in a plain browser).
    if (typeof Android !== "undefined" && Android.vibrate) Android.vibrate(20);
    // v0.5.7.2 (#14) — growth shifts index-space bulges +1.
    for (let bi = 0; bi < bulges.length; bi++) {
      bulges[bi].progress += 1;
      bulges[bi].spawnLen += 1;
    }
    spawnBulge();
    // Clear on apples (Set D) or, on fillBoard stages, a full board; no respawn on clear.
    if (stage.fillBoard ? snake.length >= stage.cols * stage.rows
      : stage.clearAfterApples != null && applesEaten >= stage.clearAfterApples) {
      return enterStageClear();
    }
    // respawn: keep the board at spawnCount fruits (safe no-op if board is full).
    spawnFood();
  } else {
    snake.pop();
  }
}

// v0.6.0 — moving fruit. Drift interval ≈ stage.tick * 4 (snake 4 ticks per fruit cell)
// so fruit creeps noticeably slower than the snake (Open Q resolved: tick*4).
function fruitMoveMs() { return stage.tick * 4; }

// v0.6.0 — moving fruit: one greedy step toward the head; never eats (see tick).
function moveFruits() {
  const head = snake[0];
  for (const f of foods) {
    f.px = f.x;
    f.py = f.y;
    const dx = head.x - f.x;
    const dy = head.y - f.y;
    if (dx === 0 && dy === 0) continue; // already on the head cell — eaten next tick
    let nx = f.x;
    let ny = f.y;
    // Greedy: step along the axis with the larger |delta|. Tie (|dx|===|dy|) -> x-axis
    // first (Decision: x priority). Body pass-through is harmless (no body collision).
    if (Math.abs(dx) >= Math.abs(dy)) {
      nx += Math.sign(dx);
    } else {
      ny += Math.sign(dy);
    }
    // Board clamp (safety — greedy approach normally stays in-bounds).
    f.x = Math.max(0, Math.min(stage.cols - 1, nx));
    f.y = Math.max(0, Math.min(stage.rows - 1, ny));
  }
}

function getStageOffset() {
  return {
    x: (canvasW - stage.cols * cellSize) / 2,
    y: (canvasH - stage.rows * cellSize) / 2,
  };
}

// v0.6.4 (#45) — rounded body path (STYLE.md v0.6.4). Chain cells from index 1; reused buffers.
let chX = new Int16Array(64);
let chY = new Int16Array(64);
let chR = new Float32Array(64); // per-cell corner radius in cells, 0 = straight
let chM = 0;        // last chain cell index
let pathBeta = 1;   // how far the head cell has bent toward a pending turn (0..1)
let pathUH = 0;     // head-end u
let pathUT = 0;     // tail-end u
let pathOff = 0;    // u of snake[0] at this frame (index space → path space)
// Pending-turn tracking for pathBeta: the cell that bends, the press point on a
// continuous clock (ticks + renderT), and the ramp length in ticks.
let antX = 1, antY = 0, bendX = -1, bendY = -1, bendP0 = 0, bendSpan = 1;
let pathTicks = 0, pathPrev = null;
const PP = { x: 0, y: 0, tx: 1, ty: 0 }; // pathPt() result, pixels + unit tangent
let pathOX = 0, pathOY = 0; // v0.6.5 (#47) — board offset, once per frame

function buildPath() {
  const n = snake.length;
  const p = prevSnake;
  // moving = a real tick happened since the snapshot (its old head is our neck); a stale
  // snapshot (e.g. the frame a new stage loads) renders static.
  const moving = state === STATE.PLAYING && p.length > 0
    && p[0].x === snake[1].x && p[0].y === snake[1].y;
  const t = moving && renderT > 0 ? renderT : 1;
  const q = p[n - 1];
  const extra = moving && p.length === n
    && Math.abs(q.x - snake[n - 1].x) + Math.abs(q.y - snake[n - 1].y) === 1 ? 1 : 0; // tail leaving q
  const m = n - 1 + extra;
  if (chX.length < m + 3) {
    chX = new Int16Array(m * 2 + 8); chY = new Int16Array(m * 2 + 8);
    chR = new Float32Array(m * 2 + 8);
  }
  for (let k = 0; k < n; k++) { chX[k + 1] = snake[k].x; chY[k + 1] = snake[k].y; }
  if (extra) { chX[n + 1] = p[n - 1].x; chY[n + 1] = p[n - 1].y; }
  // Behind the tail: the cell it came from (so its last corner rounds), else straight.
  const lx = chX[m + 1], ly = chY[m + 1];
  const tr = tailTrail;
  if (tr && Math.abs(tr.x - lx) + Math.abs(tr.y - ly) === 1 && (tr.x !== chX[m] || tr.y !== chY[m])) {
    chX[m + 2] = tr.x; chY[m + 2] = tr.y;
  } else {
    chX[m + 2] = 2 * lx - chX[m]; chY[m + 2] = 2 * ly - chY[m];
  }
  // A pending turn bends the head cell in over pathBeta (bendMinTicks for late presses).
  const dx = chX[1] - chX[2], dy = chY[1] - chY[2];
  const turn = nextDir.x * dx + nextDir.y * dy === 0;
  chX[0] = chX[1] + (turn ? nextDir.x : dx);
  chY[0] = chY[1] + (turn ? nextDir.y : dy);
  if (p !== pathPrev) { pathPrev = p; pathTicks++; }
  const r = moving ? t : renderT;
  const clock = pathTicks + (r >= 1 ? 0.999 : r);
  if (state !== STATE.PLAYING) {
    bendX = -1;
  } else if (nextDir.x !== antX || nextDir.y !== antY) {
    bendX = chX[1]; bendY = chY[1]; bendP0 = clock;
    bendSpan = Math.max(TOKEN.bendMinTicks, 1 - r);
  }
  antX = nextDir.x; antY = nextDir.y;
  pathBeta = Math.min(1, Math.max(0, (clock - bendP0) / bendSpan));
  chM = m;
  pathOX = (canvasW - stage.cols * cellSize) / 2;
  pathOY = (canvasH - stage.rows * cellSize) / 2;
  pathOff = moving ? 1 - t : 0;
  pathUH = pathOff;
  pathUT = moving && extra ? n - t : n - 1;
  // Per-corner radius. A corner's arc owns u ∈ [k − r, k + r], so two of them one cell
  // apart overlap above r = ½ and both pull back to ½; ≥ 2 apart always fit (r ≤ 1).
  const rad = Math.min(1, TOKEN.cornerRadiusFactor);
  for (let k = 0; k <= m; k++) chR[k] = cornerAt(k) ? rad : 0;
  if (rad > 0.5) {
    for (let k = 0; k <= m; k++) {
      if (chR[k] > 0) chR[k] = rad + (0.5 - rad) * Math.max(cornerW(k - 1), cornerW(k + 1));
    }
  }
}

// Is chain cell k a corner (travel turns 90° inside it)?
function cornerAt(k) {
  const j = k + 1;
  const ix = chX[j] - chX[j + 1], iy = chY[j] - chY[j + 1];
  const ox = chX[j - 1] - chX[j], oy = chY[j - 1] - chY[j];
  return (ix || iy) !== 0 && (ox || oy) !== 0 && ix * ox + iy * oy === 0;
}

// Corner k's weight inside the drawn range (0..1) — eases the adjacent-corner clamp.
function cornerW(k) {
  if (k < 0 || k > chM || chR[k] <= 0) return 0;
  const w = 2 - 2 * Math.max(k - pathUT, pathUH - k);
  return w < 0 ? 0 : w > 1 ? 1 : w;
}

// Point + unit tangent (pointing headward) at path param u → PP.
function pathPt(u) {
  let k = Math.round(u);
  if (k < 0) k = 0; else if (k > chM) k = chM;
  // The corner owning u, if any: arcs never overlap and reach at most one cell away.
  let g = -1;
  for (let d = -1; d <= 1; d++) {
    const kk = k + d;
    if (kk < 0 || kk > chM) continue;
    const r = chR[kk];
    if (r > 0 && u > kk - r - 1e-9 && u < kk + r + 1e-9) { g = kk; break; }
  }
  const kc = g < 0 ? k : g;
  const j = kc + 1, cx = chX[j], cy = chY[j];
  const ix = cx - chX[j + 1], iy = cy - chY[j + 1]; // incoming (headward) direction
  const ox = chX[j - 1] - cx, oy = chY[j - 1] - cy; // outgoing (headward) direction
  // Base line: incoming side behind the center, outgoing ahead of it. Inside an arc it
  // is the un-turned incoming line, which a pending turn (pathBeta < 1) blends from.
  const back = g >= 0 || u >= kc;
  const dx = back ? ix : ox, dy = back ? iy : oy;
  let x = cx + (kc - u) * dx, y = cy + (kc - u) * dy, tx = dx, ty = dy;
  if (g >= 0) {
    const r = chR[g];
    const b = cx === bendX && cy === bendY ? pathBeta : 1;
    let w = (g + r - u) / (2 * r); // 0 = incoming tangent point, 1 = outgoing one
    w = w < 0 ? 0 : w > 1 ? 1 : w;
    const f = w * Math.PI / 2, c = Math.cos(f), s = Math.sin(f);
    // arc of radius r about O = center + r·(out − in), tangent to both straights
    x += (cx + r * (ox - ix - ox * c + ix * s) - x) * b;
    y += (cy + r * (oy - iy - oy * c + iy * s) - y) * b;
    tx += (ix * c + ox * s - tx) * b;
    ty += (iy * c + oy * s - ty) * b;
  }
  const tl = Math.sqrt(tx * tx + ty * ty) || 1;
  PP.x = pathOX + (x + 0.5) * cellSize;
  PP.y = pathOY + (y + 0.5) * cellSize;
  PP.tx = tx / tl;
  PP.ty = ty / tl;
}

// Trace u0→u1 into the canvas path: one lineTo per straight run, 6 per quarter arc.
function tracePath(u0, u1) {
  pathPt(u0);
  ctx.moveTo(PP.x, PP.y);
  let u = u0;
  const kEnd = Math.min(chM, Math.ceil(u1));
  for (let k = Math.max(0, Math.floor(u0)); k <= kEnd; k++) {
    const r = chR[k];
    if (r <= 0) continue;
    const a = k - r;
    if (k + r <= u || a >= u1) continue;
    if (a > u) { pathPt(a); ctx.lineTo(PP.x, PP.y); u = a; }
    const e = Math.min(k + r, u1);
    const n = Math.max(1, Math.ceil(6 * (e - u) / (2 * r)));
    for (let i = 1; i <= n; i++) { pathPt(u + (e - u) * i / n); ctx.lineTo(PP.x, PP.y); }
    u = e;
  }
  if (u1 > u + 1e-9) { pathPt(u1); ctx.lineTo(PP.x, PP.y); }
}

// Task 2 — spawnBulge (v0.5.7: spawnTime added for wiggle phase)
function spawnBulge() {
  if (bulges.length >= BULGE_MAX) bulges.shift();
  const spawnTime = performance.now();
  if (snake.length <= 2) {
    bulges.push({ progress: 0, spawnLen: snake.length, fading: true, fadeStart: spawnTime, spawnTime });
  } else {
    bulges.push({ progress: 0, spawnLen: snake.length, fading: false, fadeStart: 0, spawnTime });
  }
}

// Task 3 — updateBulges
function updateBulges(dt, now) {
  if (state !== STATE.PLAYING) return;
  for (let i = bulges.length - 1; i >= 0; i--) {
    const b = bulges[i];
    if (b.fading) {
      if (now - b.fadeStart >= TOKEN.bulgeFadeMs) {
        bulges.splice(i, 1);
      }
    } else {
      b.progress += TOKEN.bulgeFlowSpeed * dt / 1000;
      if (b.progress >= b.spawnLen - 1) {
        b.progress = b.spawnLen - 1;
        b.fading = true;
        b.fadeStart = now;
      }
    }
  }
}

// v0.6.4 — bulge progress is in snake-index space; map it onto the rounded path so the
// lump follows the same curve as the body (was a straight lerp between centers).
function bulgeU(progress) {
  return Math.min(pathUT, Math.max(pathUH, progress + pathOff));
}

// Digestion lump = the body outline swelling (spec v0.6.4, STYLE.md Set B; circle tiers #47).
const BS = { u: 0, swell: 0, size: 1, alpha: 1, wig: 0 };
const swX = new Float64Array(BULGE_MAX * 13);
const swY = new Float64Array(BULGE_MAX * 13);
const swS = new Float64Array(BULGE_MAX * 13);
let swN = 0;

function bulgeShape(b, i, now) {
  const T = TOKEN;
  const frac = b.spawnLen > 1 ? Math.min(1, b.progress / (b.spawnLen - 1)) : 1;
  const k = b.fading ? Math.max(0, 1 - (now - b.fadeStart) / T.bulgeFadeMs) : 1;
  BS.u = bulgeU(b.progress);
  BS.swell = cellSize * (T.bulgeSwellStart + (T.bulgeSwellEnd - T.bulgeSwellStart) * frac) * k;
  BS.size = 1 + (T.bulgeTintEndScale - 1) * frac;
  BS.alpha = (T.bulgeTintAlphaStart + (T.bulgeTintAlphaEnd - T.bulgeTintAlphaStart) * frac) * k;
  BS.wig = Math.sin(i * T.wigglePhaseStep + (now - b.spawnTime) * 2 * Math.PI * T.wiggleFreqHz / 1000)
    * cellSize * T.wiggleAmpFactor * BS.size;
}

// This frame's swell circles → swX/swY (center), swS (extra radius).
function prepareSwell(now) {
  const L = TOKEN.bulgeSwellHalfLen;
  const nb = bulges.length;
  const h = nb <= 2 ? 6 : nb <= 4 ? 4 : 3; // circles per lump = 2h + 1
  swN = 0;
  for (let i = 0; i < nb; i++) {
    bulgeShape(bulges[i], i, now);
    if (BS.swell <= 0) continue;
    for (let j = -h; j <= h; j++) {
      const u = BS.u + L * j / h;
      if (u < pathUH || u > pathUT) continue;
      pathPt(u);
      const c = Math.cos(Math.PI * j / (2 * h));
      swX[swN] = PP.x - PP.ty * BS.wig;
      swY[swN] = PP.y + PP.tx * BS.wig;
      swS[swN++] = BS.swell * c * c;
    }
  }
}

// The prepared circles (base radius `half`) as a fresh canvas path.
function swellPath(half) {
  ctx.beginPath();
  for (let k = 0; k < swN; k++) {
    const x = swX[k], y = swY[k], r = half + swS[k];
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }
}

// The fruit seen through the swollen body (drawn over the body, under the head).
function drawBulges(now) {
  for (let i = 0; i < bulges.length; i++) {
    bulgeShape(bulges[i], i, now);
    if (BS.alpha <= 0) continue;
    pathPt(BS.u);
    const r = cellSize * TOKEN.bulgeTintRadius * BS.size;
    ctx.save();
    ctx.globalAlpha = BS.alpha;
    ctx.fillStyle = TOKEN.bulgeFill;
    ctx.translate(PP.x - PP.ty * BS.wig, PP.y + PP.tx * BS.wig);
    ctx.rotate(Math.atan2(PP.ty, PP.tx));
    ctx.beginPath();
    ctx.ellipse(0, 0, r * TOKEN.bulgeAspect, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBackground() {
  ctx.fillStyle = TOKEN.bgBoard;
  ctx.fillRect(0, 0, canvasW, canvasH);

  const off = getStageOffset();
  const w = stage.cols * cellSize;
  const h = stage.rows * cellSize;

  // mask outside the active stage area (if stage is smaller than canvas)
  if (off.x > 0 || off.y > 0) {
    ctx.fillStyle = TOKEN.maskOutside;
    // top
    if (off.y > 0) ctx.fillRect(0, 0, canvasW, off.y);
    // bottom
    if (off.y > 0) ctx.fillRect(0, off.y + h, canvasW, canvasH - (off.y + h));
    // left
    if (off.x > 0) ctx.fillRect(0, off.y, off.x, h);
    // right
    if (off.x > 0) ctx.fillRect(off.x + w, off.y, canvasW - (off.x + w), h);
  }

  // grid lines inside active area only
  ctx.strokeStyle = TOKEN.gridLine;
  ctx.lineWidth = 1;
  for (let i = 1; i < stage.cols; i++) {
    ctx.beginPath();
    ctx.moveTo(off.x + i * cellSize + 0.5, off.y);
    ctx.lineTo(off.x + i * cellSize + 0.5, off.y + h);
    ctx.stroke();
  }
  for (let j = 1; j < stage.rows; j++) {
    ctx.beginPath();
    ctx.moveTo(off.x, off.y + j * cellSize + 0.5);
    ctx.lineTo(off.x + w, off.y + j * cellSize + 0.5);
    ctx.stroke();
  }
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}


// computePulse: returns eat-pulse scale (1.0 to eatPulseScale triangle)
function computePulse(now) {
  const since = now - eatStart;
  if (since < 0 || since >= TOKEN.eatPulseDur) return 1.0;
  const t = since / TOKEN.eatPulseDur;
  const tri = t < 0.5 ? t * 2 : (1 - t) * 2;
  return 1 + (TOKEN.eatPulseScale - 1) * tri;
}

// computeSquash: returns [sx, sy] facing/perpendicular squash scale
// ease-out lunge → ease-in settle over eatSquashDur
function computeSquash(now) {
  const since = now - eatStart;
  if (since < 0 || since >= TOKEN.eatSquashDur) return [1.0, 1.0];
  const t = since / TOKEN.eatSquashDur;
  // peak at t=0.5 → blend from 1.0 to peak then back
  const tri = t < 0.5 ? t * 2 : (1 - t) * 2;
  const sx = 1 + (TOKEN.eatSquashX - 1) * tri;
  const sy = 1 + (TOKEN.eatSquashY - 1) * tri;
  return [sx, sy];
}

// v0.5.9 computeYawn: returns [yawnSx, yawnSy] facing/perp scale for one yawn.
// Same triangular ease-out→ease-in envelope as computeSquash (peak at midpoint,
// 1.0 at both ends), over yawnDur. Pure render variation — facing axis = +x.
function computeYawn(now) {
  const since = now - yawnAt;
  if (since < 0 || since >= TOKEN.yawnDur) return [1.0, 1.0];
  const t = since / TOKEN.yawnDur;
  const tri = t < 0.5 ? t * 2 : (1 - t) * 2;
  const sx = 1 + (TOKEN.yawnFacingScale - 1) * tri;
  const sy = 1 + (TOKEN.yawnPerpScale - 1) * tri;
  return [sx, sy];
}

// drawSnakeBody: the whole body as one capsule stroke along the rounded path
// (v0.6.4 — every corner rounds, neck and tail included; buildPath() runs first).
function drawSnakeBody(now) {
  const bodyThickness = cellSize * TOKEN.bodyThicknessFactor;
  function strokeBody(lineW, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    tracePath(pathUH, pathUT);
    ctx.stroke();
    // digestion swell in the same pass/colour, so the outline itself bulges
    swellPath(lineW / 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  prepareSwell(now);

  // Shadow pass: slightly wider, offset down by 1px
  ctx.save();
  ctx.translate(0, 1);
  strokeBody(bodyThickness + 2, TOKEN.snakeShadow);
  ctx.restore();

  // Main body stroke
  strokeBody(bodyThickness, TOKEN.snakeBody);
}

// drawSnakeHead: egg-shape ellipse head with eyes and tongue
function drawSnakeHead(now) {
  // v0.6.4 — the head rides the front end of the rounded body path and faces along
  // its tangent, so it turns through a corner instead of snapping 90° on the tick.
  pathPt(pathUH);
  const cx = PP.x;
  const cy = PP.y;

  const pulse = computePulse(now);
  const [sx, sy] = computeSquash(now);
  const [yx, yy] = computeYawn(now); // v0.5.9 — yawn stretch, composed multiplicatively

  const headLength = cellSize * TOKEN.headLengthFactor;
  const headWidth  = cellSize * TOKEN.headWidthFactor;
  const headEyeOffsetForward = cellSize * TOKEN.headEyeOffsetForwardFactor;
  const headEyeOffsetSide    = cellSize * TOKEN.headEyeOffsetSideFactor;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.atan2(PP.ty, PP.tx));
  // facing axis = local +x (post-rotate), so yawn facing scale multiplies x.
  ctx.scale(pulse * sx * yx, pulse * sy * yy);

  const hl = headLength / 2;  // half-length (facing axis radius)
  const hw = headWidth / 2;   // half-width (perpendicular axis radius)

  // Head ellipse
  ctx.fillStyle = TOKEN.snakeHead;
  ctx.beginPath();
  ctx.ellipse(0, 0, hl, hw, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes: forward = headEyeOffsetForward (local +x = facing), side = ±headEyeOffsetSide
  const ef = headEyeOffsetForward;
  const es = headEyeOffsetSide;
  const eyeR = 2.5;
  const pupilR = 1.2;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(ef, -es, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ef,  es, eyeR, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = TOKEN.headPupilColor;
  ctx.beginPath(); ctx.arc(ef, -es, pupilR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ef,  es, pupilR, 0, Math.PI * 2); ctx.fill();

  // Tongue: idle flicker (headTongueOn ms out of every headTonguePeriod ms) OR
  // v0.5.9 flick — forced visible & longer for tongueFlickDur ms after an eat.
  // Same color/shape/draw path as idle (no new token color), only length differs.
  const flickSince = now - tongueFlickAt;
  const flicking = flickSince >= 0 && flickSince < TOKEN.tongueFlickDur;
  const idleTongue = now % TOKEN.headTonguePeriod < TOKEN.headTongueOn;
  if (flicking || idleTongue) {
    let tongueLen = TOKEN.headTongueLength;
    if (flicking) {
      // ease in-out over the flick window: extend to *tongueFlickLengthScale then back
      const ft = flickSince / TOKEN.tongueFlickDur;
      const tri = ft < 0.5 ? ft * 2 : (1 - ft) * 2;
      tongueLen = TOKEN.headTongueLength * (1 + (TOKEN.tongueFlickLengthScale - 1) * tri);
    }
    ctx.fillStyle = TOKEN.headTongueColor;
    ctx.beginPath();
    ctx.ellipse(hl + tongueLen / 2, 0, tongueLen / 2, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// v0.6.0 — cellX/cellY may be fractional (interpolated moving-fruit position).
// phase (radians) offsets the wobble per fruit so multiple apples don't bob in sync.
function drawApple(cellX, cellY, now, phase = 0) {
  const off = getStageOffset();
  const wobble = Math.sin((now / TOKEN.wobblePeriod) * Math.PI * 2 + phase) * TOKEN.wobbleAmp;
  const cx = off.x + cellX * cellSize + cellSize / 2;
  const cy = off.y + cellY * cellSize + cellSize / 2 + wobble;
  const r = cellSize * 0.42;

  ctx.fillStyle = TOKEN.appleStem;
  ctx.fillRect(cx - 0.75, cy - r - 2, 1.5, 3);

  ctx.fillStyle = TOKEN.appleLeaf;
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy - r - 0.5, 3, 1.8, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = TOKEN.appleBody;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = TOKEN.appleHighlight;
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.35, cy - r * 0.35, r * 0.28, r * 0.18, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

// dismissHint
function dismissHint() {
  if (hintDismissed) return;
  if (hintFadeOutStart === 0) hintFadeOutStart = performance.now();
}

// drawTouchHint: shown only in STATE.READY, with fade-in/out
function drawTouchHint(now) {
  if (state !== STATE.READY) return;
  if (hintDismissed) return;

  let alpha = 0;

  if (hintFadeOutStart > 0) {
    // Fading out
    const elapsed = now - hintFadeOutStart;
    if (elapsed >= HINT_FADE_OUT_MS) {
      hintDismissed = true;
      return;
    }
    alpha = HINT_PEAK_ALPHA * (1 - elapsed / HINT_FADE_OUT_MS);
  } else {
    // Fading in (after delay)
    const sinceReady = now - hintReadyAt;
    if (sinceReady < HINT_DELAY_MS) return;
    const fadeIn = sinceReady - HINT_DELAY_MS;
    const t = Math.min(fadeIn / HINT_FADE_IN_MS, 1.0);
    // ease-out: 1 - (1-t)^2
    const eased = 1 - (1 - t) * (1 - t);
    alpha = HINT_PEAK_ALPHA * eased;
  }

  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(201, 165, 116, 1)"; // full color; alpha via globalAlpha
  // Left half
  ctx.fillRect(0, 0, canvasW / 2, canvasH);
  // Right half
  ctx.fillRect(canvasW / 2, 0, canvasW / 2, canvasH);
  ctx.restore();
}

// drawCountdown: overlaid on top of the pre-rendered board
function drawCountdown(now) {
  const elapsed = now - countdownStart;

  // Mask: warm dark overlay over entire canvas
  ctx.save();
  ctx.globalAlpha = TOKEN.countdownMaskAlpha;
  ctx.fillStyle = TOKEN.countdownMaskColor;
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.restore();

  // Determine which number to show: 0→"3", 1→"2", 2→"1"
  const idx = Math.floor(elapsed / TOKEN.countdownTotalPerNum);
  if (idx >= 3) return; // already done (finishCountdown handles transition)

  const num = 3 - idx;
  const t = elapsed - idx * TOKEN.countdownTotalPerNum;

  let alpha = 1;
  let scale = 1.0;

  if (t < TOKEN.countdownFadeIn) {
    // Fade in: ease-out-quart, scale 0.7 → 1.0
    const k = t / TOKEN.countdownFadeIn;
    const eased = 1 - Math.pow(1 - k, 4);
    alpha = eased;
    scale = TOKEN.countdownScaleFrom + (1.0 - TOKEN.countdownScaleFrom) * eased;
  } else if (t < TOKEN.countdownFadeIn + TOKEN.countdownHold) {
    // Hold
    alpha = 1;
    scale = 1.0;
  } else {
    // Fade out: alpha only, scale stays 1.0
    const fadeStart = TOKEN.countdownFadeIn + TOKEN.countdownHold;
    const k = (t - fadeStart) / TOKEN.countdownFadeOut;
    alpha = Math.max(0, 1 - k);
    scale = 1.0;
  }

  // Draw the number centered on canvas
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(canvasW / 2, canvasH / 2);
  ctx.scale(scale, scale);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = TOKEN.countdownNumColor;
  ctx.font = `700 ${TOKEN.countdownNumSize}px "Segoe UI Rounded","SF Pro Rounded","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif`;
  ctx.fillText(String(num), 0, 0);
  ctx.restore();

  // Skip hint: fades in after 300ms, max alpha 0.85
  if (elapsed >= 300) {
    const hintFadeElapsed = elapsed - 300;
    const hintAlpha = Math.min(hintFadeElapsed / 400, 1.0) * 0.85;
    ctx.save();
    ctx.globalAlpha = hintAlpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = TOKEN.countdownSkipColor;
    ctx.font = `${TOKEN.countdownSkipFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(uiText("Space · Esc — 바로 시작", "화면을 탭하면 바로 시작"), canvasW / 2, canvasH - 24);
    ctx.restore();
  }
}

// draw order: background → apple → body → bulges → head → touch hint → countdown
function draw(now) {
  drawBackground();
  // v0.6.0 — fruits; moving ones lerp px/py → x/y while PLAYING.
  const interp = (state === STATE.PLAYING && stageFruitMoves())
    ? Math.min(1, Math.max(0, fruitMoveAccum / fruitMoveMs()))
    : 1;
  for (let i = 0; i < foods.length; i++) {
    const f = foods[i];
    const fx = f.px + (f.x - f.px) * interp;
    const fy = f.py + (f.y - f.py) * interp;
    drawApple(fx, fy, now, i * 0.7); // per-fruit wobble phase offset (anti-sync)
  }
  buildPath(); // v0.6.4 — once per frame, shared by body, bulges and head
  drawSnakeBody(now);
  drawBulges(now);
  drawSnakeHead(now);
  drawTouchHint(now);
  // draw countdown overlay
  if (state === STATE.COUNTDOWN) drawCountdown(now);
}

// v0.6.2 (#22) — cap one frame's simulated time (long gaps after hidden are dropped).
const MAX_FRAME_DT = 250;

// frame: call updateBulges before draw
function frame(now) {
  // Clamped to [0, MAX_FRAME_DT]: also absorbs the first frame's rAF timestamp
  // landing slightly before the initial performance.now() seed (negative dt).
  const dt = Math.max(0, Math.min(now - lastFrame, MAX_FRAME_DT));
  lastFrame = now;

  // v0.5.8 — seed prevSnake on every transition into PLAYING so the first partial
  // tick renders static (lerp(snake,snake,t)) rather than from a stale snapshot.
  if (state === STATE.PLAYING && prevState !== STATE.PLAYING) {
    snapshotSnake();
    // v0.5.9 — re-anchor straight-run on every PLAYING entry (fresh start, countdown
    // end, pause resume, unblock) so time spent stopped never counts toward a yawn.
    lastTurnAt = now;
  }
  prevState = state;

  // v0.5.9 — yawn trigger: PLAYING only. After yawnAfterMs of unbroken straight
  // travel, fire one yawn; cooldown (yawnCooldownMs from the last yawn) blocks
  // re-trigger. Pure render state — never touches logic/collision/score.
  if (state === STATE.PLAYING
      && now - lastTurnAt >= TOKEN.yawnAfterMs
      && now - yawnAt >= TOKEN.yawnCooldownMs) {
    yawnAt = now;
  }

  if (state === STATE.PLAYING) {
    tickAccum += dt;
    while (tickAccum >= stage.tick) {
      tick();
      tickAccum -= stage.tick;
      if (state !== STATE.PLAYING) break;
    }
    // v0.6.0 — moving-fruit drift timer, PLAYING + moving stages only.
    if (state === STATE.PLAYING && stageFruitMoves()) {
      fruitMoveAccum += dt;
      const stepMs = fruitMoveMs();
      while (fruitMoveAccum >= stepMs) {
        moveFruits();
        fruitMoveAccum -= stepMs;
      }
    } else {
      fruitMoveAccum = 0;
    }
  } else if (state === STATE.STAGE_CLEAR) {
    if (now - stageClearAt >= STAGE_CLEAR_HOLD_MS) {
      advanceStage();
    }
  } else if (state === STATE.COUNTDOWN) {
    // countdown RAF tick
    const elapsed = now - countdownStart;
    if (elapsed >= 3 * TOKEN.countdownTotalPerNum) {
      finishCountdown();
    }
  }

  // v0.5.8 — render tween from residual tickAccum, PLAYING only.
  renderT = state === STATE.PLAYING
    ? Math.min(1, Math.max(0, tickAccum / stage.tick))
    : 0;

  updateBulges(dt, now);
  draw(now);
  syncHostKeepAwake(); // v0.6.2 (#28) — no-op unless the state's awake-ness changed
  requestAnimationFrame(frame);
}

// setDirection: 180° guard removed
function setDirection(dx, dy) {
  nextDir = { x: dx, y: dy };
}

function tryUnblock(dx, dy) {
  nextDir = { x: dx, y: dy };
  if (!isSafeDir(dx, dy)) return;
  dir = nextDir;
  // v0.5.9 — resuming from BLOCKED restarts the straight run from now (a stopped
  // snake was not "going straight"); anchor so yawn timing stays consistent.
  lastTurnAt = performance.now();
  state = STATE.PLAYING; tickAccum = 0; hideOverlay();
  updateAuxButton();
}

// rotateLeft / rotateRight helpers
function rotateLeft(d)  { return { x:  d.y, y: -d.x }; }
function rotateRight(d) { return { x: -d.y, y:  d.x }; }

// applyTurn: wraps rotation logic for keyboard, canvas click, and buttons
function applyTurn(rot) {
  const base = nextDir || dir;
  const r = rot(base);
  if (state === STATE.PLAYING)      setDirection(r.x, r.y);
  else if (state === STATE.BLOCKED) tryUnblock(r.x, r.y);
  dismissHint();
}

// auxAction: rewritten for v0.5.6
function auxAction() {
  if (state === STATE.PLAYING) pause();
  else if (state === STATE.PAUSED) { state = STATE.PLAYING; hideOverlay(); updateAuxButton(); }
  else if (state === STATE.BLOCKED) { /* inert */ }
  else if (state === STATE.STAGE_CLEAR) { /* inert */ }
  else if (state === STATE.READY || state === STATE.OVER) {
    if (state === STATE.OVER) init();
    enterChoice();
  }
  dismissHint();
}

// updateAuxButton: CHOICE/COUNTDOWN show SVG_PLAY
function updateAuxButton() {
  if (!btnAux) return;
  if (state === STATE.PLAYING) {
    btnAux.setAttribute("aria-label", "일시정지");
    btnAux.innerHTML = SVG_PAUSE;
  } else {
    btnAux.setAttribute("aria-label", "시작");
    btnAux.innerHTML = SVG_PLAY;
  }
}

// keydown handler with CHOICE/COUNTDOWN branches
document.addEventListener("keydown", (e) => {
  const key = e.key;

  // HELP state: Esc/Space/Enter closes help
  if (state === STATE.HELP) {
    if (key === "Escape" || key === "Esc" || key === " " || key === "Spacebar" || key === "Enter") {
      e.preventDefault();
      closeHelp();
    }
    return;
  }

  // CHOICE state: handle selection keys
  if (state === STATE.CHOICE) {
    if (key === "1") { confirmChoice(0); e.preventDefault(); return; }
    if (key === "2") { confirmChoice(1); e.preventDefault(); return; }
    if (key === "3") { confirmChoice(2); e.preventDefault(); return; }
    // v0.7.0 — three choices: ← → step through them (clamped at the ends)
    if (key === "ArrowLeft" || key === "a" || key === "A") { choiceHighlight = Math.max(0, choiceHighlight - 1); updateChoiceHighlight(); e.preventDefault(); return; }
    if (key === "ArrowRight" || key === "d" || key === "D") { choiceHighlight = Math.min(choiceBtns.length - 1, choiceHighlight + 1); updateChoiceHighlight(); e.preventDefault(); return; }
    if (key === " " || key === "Spacebar") { confirmChoice(choiceHighlight); e.preventDefault(); return; }
    return;
  }

  // COUNTDOWN state: Space/Esc skip only
  if (state === STATE.COUNTDOWN) {
    if (key === " " || key === "Spacebar" || key === "Escape" || key === "Esc") {
      finishCountdown(); e.preventDefault(); return;
    }
    return;
  }

  // Remaining states — existing branches
  if (key === " " || key === "Spacebar") {
    e.preventDefault();
    auxAction();
    return;
  }
  if (key === "Escape" || key === "Esc") {
    e.preventDefault();
    if (state === STATE.PLAYING || state === STATE.BLOCKED) {
      if (stage.id === "tutorial") advanceStage();
    }
    return;
  }
  // left/right rotation keys
  if (key === "ArrowLeft" || key === "a" || key === "A")  { applyTurn(rotateLeft);  return; }
  if (key === "ArrowRight" || key === "d" || key === "D") { applyTurn(rotateRight); return; }
  // ↑ ↓ W S — ignored (fall-through, no action)
});

// canvas pointerdown with CHOICE/COUNTDOWN branches at top
canvas.addEventListener("pointerdown", (e) => {
  if (state === STATE.HELP) return;
  if (state === STATE.CHOICE) return;
  if (state === STATE.COUNTDOWN) { finishCountdown(); return; }
  if (state === STATE.READY || state === STATE.PAUSED || state === STATE.OVER) {
    auxAction();
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const pixelX = e.clientX - rect.left;
  applyTurn(pixelX < rect.width / 2 ? rotateLeft : rotateRight);
});

// mobile button wiring
if (btnRotLeft) {
  btnRotLeft.addEventListener("pointerdown", (e) => { e.preventDefault(); if (state === STATE.HELP) return; applyTurn(rotateLeft); });
}
if (btnRotRight) {
  btnRotRight.addEventListener("pointerdown", (e) => { e.preventDefault(); if (state === STATE.HELP) return; applyTurn(rotateRight); });
}
if (btnAux) {
  btnAux.addEventListener("pointerdown", (e) => { e.preventDefault(); if (state === STATE.HELP) return; auxAction(); });
}

// choice button wiring
btnChoiceTutorial.addEventListener("pointerdown", (e) => { e.preventDefault(); confirmChoice(0); });
btnChoiceSkip.addEventListener("pointerdown", (e) => { e.preventDefault(); confirmChoice(1); });
btnChoiceFill.addEventListener("pointerdown", (e) => { e.preventDefault(); confirmChoice(2); });

// v0.5.7 — help modal wiring
if (btnHelpClose) {
  btnHelpClose.addEventListener("click", () => closeHelp());
}
if (btnHelpOpen) {
  // v0.6.2 (#34) — help returns to the state it was opened from.
  btnHelpOpen.addEventListener("click", () => {
    // Never record HELP as its own return state — closeHelp() would restore HELP forever.
    if (state === STATE.HELP) return;
    // STAGE_CLEAR would expire under help: settle it like suspendGame().
    if (state === STATE.STAGE_CLEAR) { advanceStage(); pause(); }
    openHelp(state);
  });
}

// v0.6.2 (#22) — pause when the page is hidden (tab switch, minimise, screen off).
document.addEventListener("visibilitychange", () => {
  if (document.hidden) suspendGame();
});

// v0.6.2 — the only entry points the Android shell (MainActivity) calls. Keeping the
// contract here means the shell never depends on game.js internals. Unused in browsers.
window.SnakeHost = {
  // Activity left the foreground (#22).
  onPause() { suspendGame(); },
  // System back (#28). "handled" = the game used the press; "exit" = the shell should
  // leave (it backgrounds the app). The shell treats any other result as "exit".
  onBack() {
    if (state === STATE.HELP) { closeHelp(); return "handled"; }
    if (state === STATE.PLAYING || state === STATE.COUNTDOWN) { pause(); return "handled"; }
    return "exit";
  },
};

init();
lastFrame = performance.now();
requestAnimationFrame(frame);
