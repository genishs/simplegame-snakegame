const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const stageEl = document.getElementById("stage");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");

// TODO 7 — mobile button DOM references
const btnRotLeft  = document.getElementById("btn-rot-left");
const btnRotRight = document.getElementById("btn-rot-right");
const btnAux      = document.getElementById("btn-aux");

// TODO 10 — choice button DOM references
const choiceButtonsEl  = document.getElementById("choice-buttons");
const btnChoiceTutorial = document.getElementById("btn-choice-tutorial");
const btnChoiceSkip    = document.getElementById("btn-choice-skip");

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
  // v0.5.3 digestion bulge tokens
  bulgeFlowSpeed: 2.0,
  bulgeMaxScale: 0.80,
  bulgeMinScale: 0.60,
  bulgeFadeMs: 200,
  bulgeFill: "#d76461",
  bulgeAspect: 1.15,
  bulgeWidthCapFactor: 0.86 * 0.95, // actual = cellSize * factor
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
  // TODO 2 — v0.5.6 countdown tokens
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
// St3 fruitMoves=true는 라이브 검증용 잠정 플래그(Decision D), St7이 정식 엔드리스+이동.
const STAGES = [
  { id: "tutorial", label: "튜토리얼", cols: 5,  rows: 5,  tick: 420, snakeLen: 2, clearAfterApples: 3,    spawnCount: 1,  fruitMoves: false, noFailOnHit: true  },
  { id: 1,          label: "스테이지 1",  cols: 20, rows: 20, tick: 220, snakeLen: 3, clearAfterApples: 5,    spawnCount: 1,  fruitMoves: false, noFailOnHit: false },
  { id: 2,          label: "스테이지 2",  cols: 20, rows: 20, tick: 180, snakeLen: 3, clearAfterApples: 5,    spawnCount: 1,  fruitMoves: false, noFailOnHit: false },
  { id: 3,          label: "스테이지 3",  cols: 20, rows: 20, tick: 150, snakeLen: 3, clearAfterApples: 5,    spawnCount: 1,  fruitMoves: true,  noFailOnHit: false },
  { id: 4,          label: "스테이지 4",  cols: 20, rows: 20, tick: 140, snakeLen: 3, clearAfterApples: 6,    spawnCount: 5,  fruitMoves: false, noFailOnHit: false },
  { id: 5,          label: "스테이지 5",  cols: 20, rows: 20, tick: 130, snakeLen: 3, clearAfterApples: 8,    spawnCount: 10, fruitMoves: false, noFailOnHit: false },
  { id: 6,          label: "스테이지 6",  cols: 20, rows: 20, tick: 120, snakeLen: 3, clearAfterApples: 10,   spawnCount: 10, fruitMoves: false, noFailOnHit: false },
  { id: 7,          label: "스테이지 7",  cols: 20, rows: 20, tick: 120, snakeLen: 3, clearAfterApples: null, spawnCount: 10, fruitMoves: true,  noFailOnHit: false },
];

// TODO 1 — STATE 2개 추가 + v0.5.7 HELP
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

// TODO 5 — touch zone hint module-scope state
let hintDismissed = false;
let hintReadyAt = 0;
let hintFadeOutStart = 0;
const HINT_DELAY_MS = 300;
const HINT_FADE_IN_MS = 400;
const HINT_FADE_OUT_MS = 200;
const HINT_PEAK_ALPHA = 0.08;

// TODO 7 — SVG constants for aux button
const SVG_PLAY = `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="8 5 19 12 8 19 8 5" fill="currentColor" stroke="none"/></svg>`;
const SVG_PAUSE = `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/></svg>`;

// TODO 3 — 모듈 스코프 상태 변수
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

function snapshotSnake() {
  prevSnake = snake.map((s) => ({ x: s.x, y: s.y }));
}

function init() {
  stageIndex = 0;
  score = 0;
  best = Number(localStorage.getItem("snake-best") || 0);
  applesEaten = 0;
  state = STATE.READY;
  tickAccum = 0;
  eatStart = -Infinity;
  // v0.5.9 — reset head ambient state
  tongueFlickAt = -Infinity;
  lastTurnAt = -Infinity;
  yawnAt = -Infinity;
  bulges.length = 0;
  // TODO 5 — reset hint state
  hintDismissed = false;
  hintReadyAt = performance.now();
  hintFadeOutStart = 0;
  loadStage(stageIndex);
  resizeCanvas();
  updateHud();
  showOverlay("스페이스바로 시작", "← → 또는 A D — 회전 · 스페이스 — 시작/일시정지/재시작");
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
  tickAccum = 0;
  fruitMoveAccum = 0; // v0.6.0 — reset moving-fruit drift timer per stage
  bulges.length = 0;
  // TODO 5 — reset hint state on stage load
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

// v0.6.0 — (re)fill the board to stageSpawnCount() fruits. Clears existing fruit first,
// then spawns up to spawnCount on distinct empty cells. If the board lacks enough empty
// cells, spawns as many as fit and skips the rest (no infinite loop).
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
  if (state !== STATE.PLAYING) return;
  state = STATE.PAUSED;
  showOverlay("일시정지", "스페이스바로 계속하기");
  updateAuxButton();
}

function gameOver() {
  state = STATE.OVER;
  bulges.length = 0;
  if (score > best) {
    best = score;
    localStorage.setItem("snake-best", String(best));
    updateHud();
  }
  showOverlay("게임 끝", `점수: ${score} · 스페이스바로 다시 시작`);
  updateAuxButton();
}

function enterStageClear() {
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
  showOverlay("잠깐!", "← → 또는 A D로 회전해주세요");
  updateAuxButton();
}

// TODO 6 — CHOICE 진입/이탈 함수
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
  if (choiceHighlight === 0) {
    btnChoiceTutorial.classList.add("is-highlighted");
    btnChoiceSkip.classList.remove("is-highlighted");
  } else {
    btnChoiceTutorial.classList.remove("is-highlighted");
    btnChoiceSkip.classList.add("is-highlighted");
  }
}

function confirmChoice(idx) {
  choiceButtonsEl.classList.add("hidden");
  pendingStageIdx = idx;
  enterCountdown();
}

function enterCountdown() {
  state = STATE.COUNTDOWN;
  countdownStart = performance.now();
  hideOverlay();
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
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (wouldHit(head)) {
    if (stage.noFailOnHit) return enterBlocked();
    return gameOver();
  }

  snake.unshift(head);
  // v0.6.0 — multi-fruit eat: find the first fruit on the head cell (at most one per
  // tick — even if two fruits share the head cell, only one is eaten; the rest wait
  // for the next tick, keeping the bulge/growth +1 invariant). Eating effects remain
  // the sole responsibility of tick() (planner risk #3): fruit drift never eats/grows.
  const eatIdx = foods.findIndex((f) => f.x === head.x && f.y === head.y);
  if (eatIdx !== -1) {
    foods.splice(eatIdx, 1); // remove the eaten fruit
    score += 10;
    applesEaten += 1;
    updateHud();
    eatStart = performance.now();
    tongueFlickAt = eatStart; // v0.5.9 — fire a one-shot tongue flick on eat
    // v0.5.7.2 (Issue #14): eating grows the snake (unshift without pop), so every
    // existing segment index shifts +1. Bulge progress lives in index space, so
    // shift each existing bulge +1 to keep tracking the same absolute segment
    // (prevents the digestion lump from jumping a cell). spawnLen +1 too: the snake
    // is one segment longer, and it keeps the updateBulges fade trigger
    // (progress >= spawnLen - 1) from firing prematurely.
    for (let bi = 0; bi < bulges.length; bi++) {
      bulges[bi].progress += 1;
      bulges[bi].spawnLen += 1;
    }
    spawnBulge();
    // Clear judged on cumulative applesEaten (Set D). On clear, skip respawn — the
    // stage transitions immediately so a fresh fruit would be a ghost (planner risk #3).
    if (stage.clearAfterApples != null && applesEaten >= stage.clearAfterApples) {
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

// v0.6.0 — advance moving fruit one grid step toward the head (greedy Manhattan, 1 axis).
// PLAYING-only (gated by caller). px/py snapshot the pre-move cell for render interp.
// IMPORTANT: this only changes fruit *position* — never eats/grows/scores. If a fruit
// drifts onto a stationary head, the eat is consumed by the next tick()'s eat path
// (≤1 tick delay, imperceptible), preserving the v0.5.8 prevSnake invariant.
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

// Task 1 — module-scope cell center helpers
// v0.5.8 — optional index `i` lerps the grid coord from prevSnake[i] → snake[i] by
// renderT. Falls back to the static coord when i is omitted, renderT is 0, or
// either snapshot is missing (growth's new tail / length-mismatch frame).
function interpGrid(seg, i, axis) {
  if (renderT <= 0 || i == null) return seg[axis];
  const p = prevSnake[i];
  const c = snake[i];
  if (!p || !c) return seg[axis];
  return p[axis] + (c[axis] - p[axis]) * renderT;
}

function cellCenterX(seg, i) {
  const off = getStageOffset();
  return off.x + interpGrid(seg, i, "x") * cellSize + cellSize / 2;
}

function cellCenterY(seg, i) {
  const off = getStageOffset();
  return off.y + interpGrid(seg, i, "y") * cellSize + cellSize / 2;
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

// Task 4 — evalBulgePoint: simple linear lerp (corner Bezier deferred)
function evalBulgePoint(progress, snakeArr) {
  const len = snakeArr.length;
  let i = Math.floor(progress);
  const t = progress - i;

  // clamp to last valid pair
  if (i >= len - 1) i = len - 2;

  const x0 = cellCenterX(snakeArr[i], i);
  const y0 = cellCenterY(snakeArr[i], i);

  // If only one segment, return it
  if (i + 1 >= len) {
    return { x: x0, y: y0, tx: 1, ty: 0 };
  }

  const x1 = cellCenterX(snakeArr[i + 1], i + 1);
  const y1 = cellCenterY(snakeArr[i + 1], i + 1);

  return {
    x: x0 + (x1 - x0) * t,
    y: y0 + (y1 - y0) * t,
    tx: x1 - x0,
    ty: y1 - y0,
  };
}

// Task 5 — drawBulges (v0.5.7: wiggle added)
function drawBulges(now) {
  const bulgeWidthCap = cellSize * TOKEN.bulgeWidthCapFactor;

  for (let i = 0; i < bulges.length; i++) {
    const b = bulges[i];
    const pt = evalBulgePoint(b.progress, snake);

    const progressFrac = b.spawnLen > 1
      ? b.progress / (b.spawnLen - 1)
      : 1;

    const s = b.fading
      ? TOKEN.bulgeMinScale
      : TOKEN.bulgeMaxScale + (TOKEN.bulgeMinScale - TOKEN.bulgeMaxScale) * progressFrac;

    const alpha = b.fading
      ? Math.max(0, 1 - (now - b.fadeStart) / TOKEN.bulgeFadeMs)
      : 1.0;

    const shortAxis = bulgeWidthCap * s;
    const longAxis = shortAxis * TOKEN.bulgeAspect;

    // v0.5.7 wiggle: perpendicular sine offset
    // normal vector is perpendicular to tangent (tx, ty): (-ty, tx)
    const tLen = Math.sqrt(pt.tx * pt.tx + pt.ty * pt.ty) || 1;
    const nx = -pt.ty / tLen;
    const ny =  pt.tx / tLen;

    const phase = i * TOKEN.wigglePhaseStep + (now - b.spawnTime) * 2 * Math.PI * TOKEN.wiggleFreqHz / 1000;
    const wiggleAmp = cellSize * TOKEN.wiggleAmpFactor * (s / TOKEN.bulgeMaxScale);
    const wiggleOffset = Math.sin(phase) * wiggleAmp;

    const drawX = pt.x + nx * wiggleOffset;
    const drawY = pt.y + ny * wiggleOffset;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = TOKEN.bulgeFill;
    ctx.translate(drawX, drawY);
    ctx.rotate(Math.atan2(pt.ty, pt.tx));
    ctx.beginPath();
    ctx.ellipse(0, 0, longAxis / 2, shortAxis / 2, 0, 0, Math.PI * 2);
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

// angleFromDir: direction vector → rotation angle in radians
// No per-call allocation; uses direct lookup on fields.
function angleFromDir(dir) {
  if (dir.x === 1)  return 0;
  if (dir.x === -1) return Math.PI;
  if (dir.y === 1)  return Math.PI * 0.5;
  return Math.PI * 1.5; // dir.y === -1
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

// drawSnakeBody: draws body segments [1..len-1] as a single capsule stroke
// Uses module-scope cellCenterX / cellCenterY helpers (Task 1)
function drawSnakeBody(snakeArr) {
  const len = snakeArr.length;
  if (len < 2) return;

  const bodyThickness = cellSize * TOKEN.bodyThicknessFactor;

  // Helper: midpoint between two cell centers (by index, so the tween applies)
  function midX(ia, ib) { return (cellCenterX(snakeArr[ia], ia) + cellCenterX(snakeArr[ib], ib)) / 2; }
  function midY(ia, ib) { return (cellCenterY(snakeArr[ia], ia) + cellCenterY(snakeArr[ib], ib)) / 2; }

  function strokeBody(lineW, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Start at the midpoint between head (index 0) and first body segment (index 1)
    ctx.moveTo(midX(0, 1), midY(0, 1));

    for (let i = 1; i < len; i++) {
      const seg = snakeArr[i];
      const cx = cellCenterX(seg, i);
      const cy = cellCenterY(seg, i);

      // Determine whether this segment is a corner:
      // Interior segments only (i in [2..len-3]), not tail (len-1), not tail-adjacent (len-2)
      const isInterior = i >= 2 && i <= len - 3;
      let isCorner = false;
      if (isInterior) {
        const prev = snakeArr[i - 1];
        const next = snakeArr[i + 1];
        const pdx = seg.x - prev.x;
        const pdy = seg.y - prev.y;
        const ndx = next.x - seg.x;
        const ndy = next.y - seg.y;
        isCorner = (pdx !== ndx || pdy !== ndy);
      }

      if (isCorner) {
        // quadraticCurveTo: control point = cell center, end = midpoint to next segment
        ctx.quadraticCurveTo(cx, cy, midX(i, i + 1), midY(i, i + 1));
      } else {
        // Straight segment, tail-adjacent, or tail: lineTo center
        ctx.lineTo(cx, cy);
      }
    }

    ctx.stroke();
  }

  // Shadow pass: slightly wider, offset down by 1px
  ctx.save();
  ctx.translate(0, 1);
  strokeBody(bodyThickness + 2, TOKEN.snakeShadow);
  ctx.restore();

  // Main body stroke
  strokeBody(bodyThickness, TOKEN.snakeBody);
}

// drawSnakeHead: egg-shape ellipse head with eyes and tongue
function drawSnakeHead(head, direction, now) {
  // v0.5.8 — head position (index 0) tweens; rotation stays an instant switch on dir.
  const cx = cellCenterX(head, 0);
  const cy = cellCenterY(head, 0);

  const pulse = computePulse(now);
  const [sx, sy] = computeSquash(now);
  const [yx, yy] = computeYawn(now); // v0.5.9 — yawn stretch, composed multiplicatively

  const headLength = cellSize * TOKEN.headLengthFactor;
  const headWidth  = cellSize * TOKEN.headWidthFactor;
  const headEyeOffsetForward = cellSize * TOKEN.headEyeOffsetForwardFactor;
  const headEyeOffsetSide    = cellSize * TOKEN.headEyeOffsetSideFactor;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angleFromDir(direction));
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

// TODO 5 — dismissHint
function dismissHint() {
  if (hintDismissed) return;
  if (hintFadeOutStart === 0) hintFadeOutStart = performance.now();
}

// TODO 5 — drawTouchHint: shown only in STATE.READY, with fade-in/out
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

// TODO 12 — drawCountdown: overlaid on top of the pre-rendered board
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
    ctx.fillText("Space · Esc — 바로 시작", canvasW / 2, canvasH - 24);
    ctx.restore();
  }
}

// draw order: background → apple → body → bulges → head → touch hint → countdown
function draw(now) {
  drawBackground();
  // v0.6.0 — multi-fruit: draw each fruit (drawApple reused, no new asset/color).
  // Moving fruit lerps prev cell (px/py) → current cell (x/y) by fruitMoveAccum/stepMs,
  // PLAYING only; otherwise pinned to the grid cell (v0.5.8 PLAYING-gating convention).
  const interp = (state === STATE.PLAYING && stageFruitMoves())
    ? Math.min(1, Math.max(0, fruitMoveAccum / fruitMoveMs()))
    : 1;
  for (let i = 0; i < foods.length; i++) {
    const f = foods[i];
    const fx = f.px + (f.x - f.px) * interp;
    const fy = f.py + (f.y - f.py) * interp;
    drawApple(fx, fy, now, i * 0.7); // per-fruit wobble phase offset (anti-sync)
  }
  drawSnakeBody(snake);
  drawBulges(now);
  drawSnakeHead(snake[0], dir, now);
  drawTouchHint(now);
  // TODO 12 — draw countdown overlay
  if (state === STATE.COUNTDOWN) drawCountdown(now);
}

// frame: call updateBulges before draw
function frame(now) {
  const dt = now - lastFrame;
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
    // v0.6.0 — moving-fruit drift: separate dt accumulator, PLAYING only. One greedy
    // grid step per fruitMoveMs(). Skip entirely on non-moving stages so fruitMoveAccum
    // does not build up. Guard state again (tick() above may have left PLAYING).
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
    // TODO 11 — countdown RAF tick
    const elapsed = now - countdownStart;
    if (elapsed >= 3 * TOKEN.countdownTotalPerNum) {
      finishCountdown();
    }
  }

  // v0.5.8 — tween progress from the *residual* tickAccum (post-consume, so multi-
  // tick frames don't jump), clamped to [0,1] (no overshoot on slow frames). Gated
  // on PLAYING only: every other state renders at t=0, pinning the snake to its grid
  // cell (no drifting into walls while stopped). Doesn't rely on tickAccum being 0.
  renderT = state === STATE.PLAYING
    ? Math.min(1, Math.max(0, tickAccum / stage.tick))
    : 0;

  updateBulges(dt, now);
  draw(now);
  requestAnimationFrame(frame);
}

// TODO 1 — setDirection: 180° guard removed
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

// TODO 1 — rotateLeft / rotateRight helpers
function rotateLeft(d)  { return { x:  d.y, y: -d.x }; }
function rotateRight(d) { return { x: -d.y, y:  d.x }; }

// TODO 1 — applyTurn: wraps rotation logic for keyboard, canvas click, and buttons
function applyTurn(rot) {
  const base = nextDir || dir;
  const r = rot(base);
  if (state === STATE.PLAYING)      setDirection(r.x, r.y);
  else if (state === STATE.BLOCKED) tryUnblock(r.x, r.y);
  dismissHint();
}

// TODO 7 — auxAction: rewritten for v0.5.6
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

// TODO 13 — updateAuxButton: CHOICE/COUNTDOWN show SVG_PLAY
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

// TODO 8 — keydown handler with CHOICE/COUNTDOWN branches
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
    if (key === "ArrowLeft" || key === "a" || key === "A") { choiceHighlight = 0; updateChoiceHighlight(); e.preventDefault(); return; }
    if (key === "ArrowRight" || key === "d" || key === "D") { choiceHighlight = 1; updateChoiceHighlight(); e.preventDefault(); return; }
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

// TODO 9 — canvas pointerdown with CHOICE/COUNTDOWN branches at top
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

// TODO 7 — mobile button wiring
if (btnRotLeft) {
  btnRotLeft.addEventListener("pointerdown", (e) => { e.preventDefault(); if (state === STATE.HELP) return; applyTurn(rotateLeft); });
}
if (btnRotRight) {
  btnRotRight.addEventListener("pointerdown", (e) => { e.preventDefault(); if (state === STATE.HELP) return; applyTurn(rotateRight); });
}
if (btnAux) {
  btnAux.addEventListener("pointerdown", (e) => { e.preventDefault(); if (state === STATE.HELP) return; auxAction(); });
}

// TODO 10 — choice button wiring
btnChoiceTutorial.addEventListener("pointerdown", (e) => { e.preventDefault(); confirmChoice(0); });
btnChoiceSkip.addEventListener("pointerdown", (e) => { e.preventDefault(); confirmChoice(1); });

// v0.5.7 — help modal wiring
if (btnHelpClose) {
  btnHelpClose.addEventListener("click", () => closeHelp());
}
if (btnHelpOpen) {
  btnHelpOpen.addEventListener("click", () => openHelp(STATE.CHOICE));
}

init();
lastFrame = performance.now();
requestAnimationFrame(frame);
