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

const CELL = 20;
const CANVAS_W = canvas.width;
const CANVAS_H = canvas.height;

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
  // v0.5.2 head geometry tokens
  headLength: CELL * 1.10,
  headWidth: CELL * 0.92,
  headEyeOffsetForward: CELL * 0.18,
  headEyeOffsetSide: CELL * 0.22,
  headPupilColor: "#2a2018",
  // v0.5.2 tongue tokens
  headTongueColor: "#ef9aa6",
  headTongueLength: 3,
  headTonguePeriod: 1600,
  headTongueOn: 120,
  // v0.5.2 body token
  bodyThickness: CELL * 0.86,
  // v0.5.3 digestion bulge tokens
  bulgeFlowSpeed: 2.0,
  bulgeMaxScale: 0.80,
  bulgeMinScale: 0.60,
  bulgeFadeMs: 200,
  bulgeFill: "#d76461",
  bulgeAspect: 1.15,
  bulgeWidthCap: CELL * 0.86 * 0.95,
};

const STAGES = [
  { id: "tutorial", label: "Tutorial", cols: 5, rows: 5, tick: 380, snakeLen: 2, clearAfterApples: 3, noFailOnHit: true },
  { id: 1,          label: "Stage 1",  cols: 20, rows: 20, tick: 140, snakeLen: 3, clearAfterApples: 5, noFailOnHit: false },
  { id: 2,          label: "Stage 2",  cols: 20, rows: 20, tick: 130, snakeLen: 3, clearAfterApples: 5, noFailOnHit: false },
  { id: 3,          label: "Stage 3",  cols: 20, rows: 20, tick: 120, snakeLen: 3, clearAfterApples: null, noFailOnHit: false },
];

const STATE = {
  READY: "ready",
  PLAYING: "playing",
  PAUSED: "paused",
  BLOCKED: "blocked",
  STAGE_CLEAR: "stage_clear",
  OVER: "over",
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

let stageIndex;
let stage;
let snake, dir, nextDir, food, score, best, state;
let applesEaten;
let tickAccum = 0;
let lastFrame = 0;
let eatStart = -Infinity;
let stageClearAt = 0;

function init() {
  stageIndex = 0;
  score = 0;
  best = Number(localStorage.getItem("snake-best") || 0);
  applesEaten = 0;
  state = STATE.READY;
  tickAccum = 0;
  eatStart = -Infinity;
  bulges.length = 0;
  // TODO 5 — reset hint state
  hintDismissed = false;
  hintReadyAt = performance.now();
  hintFadeOutStart = 0;
  loadStage(stageIndex);
  updateHud();
  showOverlay("Press Space to Start", "← → 또는 A D — 회전 · Space — 시작/일시정지/재시작");
  updateAuxButton();
}

function loadStage(idx) {
  stage = STAGES[idx];
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
  bulges.length = 0;
  // TODO 5 — reset hint state on stage load
  hintDismissed = false;
  hintReadyAt = performance.now();
  hintFadeOutStart = 0;
  placeFood();
  updateHud();
  updateAuxButton();
}

function placeFood() {
  while (true) {
    const f = {
      x: Math.floor(Math.random() * stage.cols),
      y: Math.floor(Math.random() * stage.rows),
    };
    if (!snake.some((s) => s.x === f.x && s.y === f.y)) {
      food = f;
      return;
    }
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
  showOverlay("Paused", "Press Space to resume");
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
  showOverlay("Game Over", `Score: ${score} · Press Space to restart`);
  updateAuxButton();
}

function enterStageClear() {
  state = STATE.STAGE_CLEAR;
  stageClearAt = performance.now();
  const next = STAGES[stageIndex + 1];
  if (stage.id === "tutorial") {
    showOverlay("튜토리얼 클리어!", "곧 Stage 1으로 이동합니다");
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

function tick() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (wouldHit(head)) {
    if (stage.noFailOnHit) return enterBlocked();
    return gameOver();
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    applesEaten += 1;
    updateHud();
    eatStart = performance.now();
    spawnBulge();
    if (stage.clearAfterApples != null && applesEaten >= stage.clearAfterApples) {
      return enterStageClear();
    }
    placeFood();
  } else {
    snake.pop();
  }
}

function getStageOffset() {
  return {
    x: (CANVAS_W - stage.cols * CELL) / 2,
    y: (CANVAS_H - stage.rows * CELL) / 2,
  };
}

// Task 1 — module-scope cell center helpers
function cellCenterX(seg) {
  const off = getStageOffset();
  return off.x + seg.x * CELL + CELL / 2;
}

function cellCenterY(seg) {
  const off = getStageOffset();
  return off.y + seg.y * CELL + CELL / 2;
}

// Task 2 — spawnBulge
function spawnBulge() {
  if (bulges.length >= BULGE_MAX) bulges.shift();
  if (snake.length <= 2) {
    bulges.push({ progress: 0, spawnLen: snake.length, fading: true, fadeStart: performance.now() });
  } else {
    bulges.push({ progress: 0, spawnLen: snake.length, fading: false, fadeStart: 0 });
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

  const x0 = cellCenterX(snakeArr[i]);
  const y0 = cellCenterY(snakeArr[i]);

  // If only one segment, return it
  if (i + 1 >= len) {
    return { x: x0, y: y0, tx: 1, ty: 0 };
  }

  const x1 = cellCenterX(snakeArr[i + 1]);
  const y1 = cellCenterY(snakeArr[i + 1]);

  return {
    x: x0 + (x1 - x0) * t,
    y: y0 + (y1 - y0) * t,
    tx: x1 - x0,
    ty: y1 - y0,
  };
}

// Task 5 — drawBulges
function drawBulges(now) {
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

    const shortAxis = TOKEN.bulgeWidthCap * s;
    const longAxis = shortAxis * TOKEN.bulgeAspect;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = TOKEN.bulgeFill;
    ctx.translate(pt.x, pt.y);
    ctx.rotate(Math.atan2(pt.ty, pt.tx));
    ctx.beginPath();
    ctx.ellipse(0, 0, longAxis / 2, shortAxis / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBackground() {
  ctx.fillStyle = TOKEN.bgBoard;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const off = getStageOffset();
  const w = stage.cols * CELL;
  const h = stage.rows * CELL;

  // mask outside the active stage area (if stage is smaller than canvas)
  if (off.x > 0 || off.y > 0) {
    ctx.fillStyle = TOKEN.maskOutside;
    // top
    if (off.y > 0) ctx.fillRect(0, 0, CANVAS_W, off.y);
    // bottom
    if (off.y > 0) ctx.fillRect(0, off.y + h, CANVAS_W, CANVAS_H - (off.y + h));
    // left
    if (off.x > 0) ctx.fillRect(0, off.y, off.x, h);
    // right
    if (off.x > 0) ctx.fillRect(off.x + w, off.y, CANVAS_W - (off.x + w), h);
  }

  // grid lines inside active area only
  ctx.strokeStyle = TOKEN.gridLine;
  ctx.lineWidth = 1;
  for (let i = 1; i < stage.cols; i++) {
    ctx.beginPath();
    ctx.moveTo(off.x + i * CELL + 0.5, off.y);
    ctx.lineTo(off.x + i * CELL + 0.5, off.y + h);
    ctx.stroke();
  }
  for (let j = 1; j < stage.rows; j++) {
    ctx.beginPath();
    ctx.moveTo(off.x, off.y + j * CELL + 0.5);
    ctx.lineTo(off.x + w, off.y + j * CELL + 0.5);
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

// drawSnakeBody: draws body segments [1..len-1] as a single capsule stroke
// Uses module-scope cellCenterX / cellCenterY helpers (Task 1)
function drawSnakeBody(snakeArr) {
  const len = snakeArr.length;
  if (len < 2) return;

  // Helper: midpoint between two cell centers
  function midX(a, b) { return (cellCenterX(a) + cellCenterX(b)) / 2; }
  function midY(a, b) { return (cellCenterY(a) + cellCenterY(b)) / 2; }

  function strokeBody(lineW, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Start at the midpoint between head (index 0) and first body segment (index 1)
    ctx.moveTo(midX(snakeArr[0], snakeArr[1]), midY(snakeArr[0], snakeArr[1]));

    for (let i = 1; i < len; i++) {
      const seg = snakeArr[i];
      const cx = cellCenterX(seg);
      const cy = cellCenterY(seg);

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
        const next = snakeArr[i + 1];
        ctx.quadraticCurveTo(cx, cy, midX(seg, next), midY(seg, next));
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
  strokeBody(TOKEN.bodyThickness + 2, TOKEN.snakeShadow);
  ctx.restore();

  // Main body stroke
  strokeBody(TOKEN.bodyThickness, TOKEN.snakeBody);
}

// drawSnakeHead: egg-shape ellipse head with eyes and tongue
function drawSnakeHead(head, direction, now) {
  const cx = cellCenterX(head);
  const cy = cellCenterY(head);

  const pulse = computePulse(now);
  const [sx, sy] = computeSquash(now);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angleFromDir(direction));
  ctx.scale(pulse * sx, pulse * sy);

  const hl = TOKEN.headLength / 2;  // half-length (facing axis radius)
  const hw = TOKEN.headWidth / 2;   // half-width (perpendicular axis radius)

  // Head ellipse
  ctx.fillStyle = TOKEN.snakeHead;
  ctx.beginPath();
  ctx.ellipse(0, 0, hl, hw, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes: forward = headEyeOffsetForward (local +x = facing), side = ±headEyeOffsetSide
  const ef = TOKEN.headEyeOffsetForward;
  const es = TOKEN.headEyeOffsetSide;
  const eyeR = 2.5;
  const pupilR = 1.2;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(ef, -es, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ef,  es, eyeR, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = TOKEN.headPupilColor;
  ctx.beginPath(); ctx.arc(ef, -es, pupilR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ef,  es, pupilR, 0, Math.PI * 2); ctx.fill();

  // Tongue: visible for headTongueOn ms out of every headTonguePeriod ms
  if (now % TOKEN.headTonguePeriod < TOKEN.headTongueOn) {
    ctx.fillStyle = TOKEN.headTongueColor;
    ctx.beginPath();
    ctx.ellipse(hl + TOKEN.headTongueLength / 2, 0, TOKEN.headTongueLength / 2, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawApple(cellX, cellY, now) {
  const off = getStageOffset();
  const wobble = Math.sin((now / TOKEN.wobblePeriod) * Math.PI * 2) * TOKEN.wobbleAmp;
  const cx = off.x + cellX * CELL + CELL / 2;
  const cy = off.y + cellY * CELL + CELL / 2 + wobble;
  const r = CELL * 0.42;

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
  ctx.fillRect(0, 0, CANVAS_W / 2, CANVAS_H);
  // Right half
  ctx.fillRect(CANVAS_W / 2, 0, CANVAS_W / 2, CANVAS_H);
  ctx.restore();
}

// draw order: background → apple → body → bulges → head → touch hint
function draw(now) {
  drawBackground();
  drawApple(food.x, food.y, now);
  drawSnakeBody(snake);
  drawBulges(now);
  drawSnakeHead(snake[0], dir, now);
  drawTouchHint(now);
}

// frame: call updateBulges before draw
function frame(now) {
  const dt = now - lastFrame;
  lastFrame = now;

  if (state === STATE.PLAYING) {
    tickAccum += dt;
    while (tickAccum >= stage.tick) {
      tick();
      tickAccum -= stage.tick;
      if (state !== STATE.PLAYING) break;
    }
  } else if (state === STATE.STAGE_CLEAR) {
    if (now - stageClearAt >= STAGE_CLEAR_HOLD_MS) {
      advanceStage();
    }
  }

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

// TODO 7 — auxAction: Space-equivalent action
function auxAction() {
  if (state === STATE.PLAYING) pause();
  else if (state === STATE.BLOCKED) { /* inert */ }
  else if (state !== STATE.STAGE_CLEAR) start();
  dismissHint();
}

// TODO 7 — updateAuxButton: sync aria-label and SVG icon to current state
function updateAuxButton() {
  if (!btnAux) return;
  if (state === STATE.PLAYING) {
    btnAux.setAttribute("aria-label", "Pause");
    btnAux.innerHTML = SVG_PAUSE;
  } else {
    btnAux.setAttribute("aria-label", state === STATE.PAUSED ? "Resume" : "Start");
    btnAux.innerHTML = SVG_PLAY;
  }
}

// TODO 2 — keydown handler rewritten
document.addEventListener("keydown", (e) => {
  const key = e.key;
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
  // TODO 2 — left/right rotation keys (no preventDefault — preserve page scroll)
  if (key === "ArrowLeft" || key === "a" || key === "A")  { applyTurn(rotateLeft);  return; }
  if (key === "ArrowRight" || key === "d" || key === "D") { applyTurn(rotateRight); return; }
  // ↑ ↓ W S — ignored (fall-through, no action)
});

// TODO 6 — canvas pointerdown: left-half = rotateLeft, right-half = rotateRight
// v0.5.5: READY/PAUSED/OVER states route to auxAction() as a fallback for mobile users
canvas.addEventListener("pointerdown", (e) => {
  if (state === STATE.READY || state === STATE.PAUSED || state === STATE.OVER) {
    auxAction();
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const pixelX = (e.clientX - rect.left) / rect.width * 400;
  applyTurn(pixelX < 200 ? rotateLeft : rotateRight);
});

// TODO 7 — mobile button wiring
if (btnRotLeft) {
  btnRotLeft.addEventListener("pointerdown", (e) => { e.preventDefault(); applyTurn(rotateLeft); });
}
if (btnRotRight) {
  btnRotRight.addEventListener("pointerdown", (e) => { e.preventDefault(); applyTurn(rotateRight); });
}
if (btnAux) {
  btnAux.addEventListener("pointerdown", (e) => { e.preventDefault(); auxAction(); });
}

init();
lastFrame = performance.now();
requestAnimationFrame(frame);
