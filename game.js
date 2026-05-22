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

function drawSegment(cellX, cellY) {
  const off = getStageOffset();
  const px = off.x + cellX * CELL + 1.5;
  const py = off.y + cellY * CELL + 1.5;
  const size = CELL - 3;
  ctx.fillStyle = TOKEN.snakeBody;
  roundedRect(px, py, size, size, TOKEN.radiusCell);
  ctx.fill();
  ctx.fillStyle = TOKEN.snakeShadow;
  roundedRect(px + 1, py + size - 3, size - 2, 2, 2);
  ctx.fill();
}

function drawSnakeHead(cellX, cellY, direction, now) {
  let scale = 1;
  const since = now - eatStart;
  if (since >= 0 && since < TOKEN.eatPulseDur) {
    const t = since / TOKEN.eatPulseDur;
    const tri = t < 0.5 ? t * 2 : (1 - t) * 2;
    scale = 1 + (TOKEN.eatPulseScale - 1) * tri;
  }

  const off = getStageOffset();
  const baseSize = CELL - 3;
  const size = baseSize * scale;
  const cx = off.x + cellX * CELL + CELL / 2;
  const cy = off.y + cellY * CELL + CELL / 2;
  const px = cx - size / 2;
  const py = cy - size / 2;

  ctx.fillStyle = TOKEN.snakeHead;
  roundedRect(px, py, size, size, TOKEN.radiusCell);
  ctx.fill();

  const eyeOffset = size * 0.22;
  const eyeForward = size * 0.28;
  let e1x, e1y, e2x, e2y;
  if (direction.x === 1) {
    e1x = cx + eyeForward; e1y = cy - eyeOffset;
    e2x = cx + eyeForward; e2y = cy + eyeOffset;
  } else if (direction.x === -1) {
    e1x = cx - eyeForward; e1y = cy - eyeOffset;
    e2x = cx - eyeForward; e2y = cy + eyeOffset;
  } else if (direction.y === -1) {
    e1x = cx - eyeOffset; e1y = cy - eyeForward;
    e2x = cx + eyeOffset; e2y = cy - eyeForward;
  } else {
    e1x = cx - eyeOffset; e1y = cy + eyeForward;
    e2x = cx + eyeOffset; e2y = cy + eyeForward;
  }
  const eyeR = 2.5 * scale;
  const pupilR = 1.2 * scale;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath(); ctx.arc(e1x, e1y, pupilR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(e2x, e2y, pupilR, 0, Math.PI * 2); ctx.fill();
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
  for (let i = snake.length - 1; i >= 1; i--) drawSegment(snake[i].x, snake[i].y);
  drawSnakeHead(snake[0].x, snake[0].y, dir, now);
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
