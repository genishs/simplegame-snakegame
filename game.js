const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const stageEl = document.getElementById("stage");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");

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
  loadStage(stageIndex);
  updateHud();
  showOverlay("Press Space to Start", "Arrow keys or WASD to move");
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
  placeFood();
  updateHud();
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
}

function pause() {
  if (state !== STATE.PLAYING) return;
  state = STATE.PAUSED;
  showOverlay("Paused", "Press Space to resume");
}

function gameOver() {
  state = STATE.OVER;
  if (score > best) {
    best = score;
    localStorage.setItem("snake-best", String(best));
    updateHud();
  }
  showOverlay("Game Over", `Score: ${score} · Press Space to restart`);
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
}

function advanceStage() {
  stageIndex += 1;
  if (stageIndex >= STAGES.length) {
    // No more stages defined; stay on the last stage as endless mode
    stageIndex = STAGES.length - 1;
  }
  loadStage(stageIndex);
  state = STATE.PLAYING;
  hideOverlay();
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
  showOverlay("잠깐!", "다른 방향을 눌러주세요  ↑ ↓ ← →");
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
  // ease-out first half (lunge), ease-in second half (settle)
  const eased = t < 0.5
    ? 2 * t * t                      // ease-in (fast lunge from 0)
    : 1 - 2 * (1 - t) * (1 - t);    // ease-out (slow settle to 1)
  // peak at t=1.0 of eased → blend from 1.0 to peak then back
  // use a triangle on eased: peak at eased = 1 when t = 0.5
  const tri = t < 0.5 ? t * 2 : (1 - t) * 2;
  const sx = 1 + (TOKEN.eatSquashX - 1) * tri;
  const sy = 1 + (TOKEN.eatSquashY - 1) * tri;
  return [sx, sy];
}

// drawSnakeBody: draws body segments [1..len-1] as a single capsule stroke
function drawSnakeBody(snake) {
  const len = snake.length;
  if (len < 2) return;

  const off = getStageOffset();

  // Helper: pixel center of a cell
  function px(seg) { return off.x + seg.x * CELL + CELL / 2; }
  function py(seg) { return off.y + seg.y * CELL + CELL / 2; }

  // Helper: midpoint between two cell centers
  function midX(a, b) { return (px(a) + px(b)) / 2; }
  function midY(a, b) { return (py(a) + py(b)) / 2; }

  function strokeBody(lineW, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Start at the midpoint between head (index 0) and first body segment (index 1)
    ctx.moveTo(midX(snake[0], snake[1]), midY(snake[0], snake[1]));

    for (let i = 1; i < len; i++) {
      const seg = snake[i];
      const cx = px(seg);
      const cy = py(seg);

      // Determine whether this segment is a corner:
      // Interior segments only (i in [2..len-3]), not tail (len-1), not tail-adjacent (len-2)
      const isInterior = i >= 2 && i <= len - 3;
      let isCorner = false;
      if (isInterior) {
        const prev = snake[i - 1];
        const next = snake[i + 1];
        const pdx = seg.x - prev.x;
        const pdy = seg.y - prev.y;
        const ndx = next.x - seg.x;
        const ndy = next.y - seg.y;
        isCorner = (pdx !== ndx || pdy !== ndy);
      }

      if (isCorner) {
        // quadraticCurveTo: control point = cell center, end = midpoint to next segment
        const next = snake[i + 1];
        ctx.quadraticCurveTo(cx, cy, midX(seg, next), midY(seg, next));
      } else if (i === len - 1) {
        // Tail: straight to tail center; round lineCap handles the end
        ctx.lineTo(cx, cy);
      } else {
        // Straight segment or tail-adjacent: lineTo center
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
  const off = getStageOffset();
  const cx = off.x + head.x * CELL + CELL / 2;
  const cy = off.y + head.y * CELL + CELL / 2;

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

function draw(now) {
  drawBackground();
  drawApple(food.x, food.y, now);
  drawSnakeBody(snake);
  drawSnakeHead(snake[0], dir, now);
}

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

  draw(now);
  requestAnimationFrame(frame);
}

function setDirection(dx, dy) {
  if (dx === -dir.x && dy === -dir.y) return;
  nextDir = { x: dx, y: dy };
}

function tryUnblock(dx, dy) {
  if (!isSafeDir(dx, dy)) return;
  dir = { x: dx, y: dy };
  nextDir = dir;
  state = STATE.PLAYING;
  tickAccum = 0;
  hideOverlay();
}

function dirFromKey(key) {
  switch (key) {
    case "ArrowUp": case "w": case "W": return { x: 0, y: -1 };
    case "ArrowDown": case "s": case "S": return { x: 0, y: 1 };
    case "ArrowLeft": case "a": case "A": return { x: -1, y: 0 };
    case "ArrowRight": case "d": case "D": return { x: 1, y: 0 };
    default: return null;
  }
}

document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === " " || key === "Spacebar") {
    e.preventDefault();
    if (state === STATE.PLAYING) pause();
    else if (state === STATE.BLOCKED) { /* Space is inert while blocked */ }
    else if (state !== STATE.STAGE_CLEAR) start();
    return;
  }
  if (key === "Escape" || key === "Esc") {
    e.preventDefault();
    if (state === STATE.PLAYING || state === STATE.BLOCKED) {
      if (stage.id === "tutorial") advanceStage();
    }
    return;
  }
  const d = dirFromKey(key);
  if (!d) return;
  if (state === STATE.PLAYING) {
    setDirection(d.x, d.y);
  } else if (state === STATE.BLOCKED) {
    tryUnblock(d.x, d.y);
  }
});

init();
lastFrame = performance.now();
requestAnimationFrame(frame);
