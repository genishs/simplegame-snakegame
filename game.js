const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");

const CELL = 20;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;
const TICK_MS = 110;

const TOKEN = {
  bgBoard: "#fff4dc",
  gridLine: "rgba(120, 90, 60, 0.06)",
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

const STATE = { READY: "ready", PLAYING: "playing", PAUSED: "paused", OVER: "over" };

let snake, dir, nextDir, food, score, best, state;
let tickAccum = 0;
let lastFrame = 0;
let eatStart = -Infinity;

function init() {
  snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  best = Number(localStorage.getItem("snake-best") || 0);
  state = STATE.READY;
  tickAccum = 0;
  eatStart = -Infinity;
  placeFood();
  updateHud();
  showOverlay("Press Space to Start", "Arrow keys or WASD to move");
}

function placeFood() {
  while (true) {
    const f = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
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

function tick() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return gameOver();
  if (snake.some((s, i) => i < snake.length - 1 && s.x === head.x && s.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    updateHud();
    eatStart = performance.now();
    placeFood();
  } else {
    snake.pop();
  }
}

function drawBackground() {
  ctx.fillStyle = TOKEN.bgBoard;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = TOKEN.gridLine;
  ctx.lineWidth = 1;
  for (let i = 1; i < COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL + 0.5, 0);
    ctx.lineTo(i * CELL + 0.5, canvas.height);
    ctx.stroke();
  }
  for (let j = 1; j < ROWS; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * CELL + 0.5);
    ctx.lineTo(canvas.width, j * CELL + 0.5);
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
  const px = cellX * CELL + 1.5;
  const py = cellY * CELL + 1.5;
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

  const baseSize = CELL - 3;
  const size = baseSize * scale;
  const cx = cellX * CELL + CELL / 2;
  const cy = cellY * CELL + CELL / 2;
  const px = cx - size / 2;
  const py = cy - size / 2;

  ctx.fillStyle = TOKEN.snakeHead;
  roundedRect(px, py, size, size, TOKEN.radiusCell);
  ctx.fill();

  // eyes — placed on the leading face per direction
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
  const wobble = Math.sin((now / TOKEN.wobblePeriod) * Math.PI * 2) * TOKEN.wobbleAmp;
  const cx = cellX * CELL + CELL / 2;
  const cy = cellY * CELL + CELL / 2 + wobble;
  const r = CELL * 0.42;

  // stem
  ctx.fillStyle = TOKEN.appleStem;
  ctx.fillRect(cx - 0.75, cy - r - 2, 1.5, 3);

  // leaf
  ctx.fillStyle = TOKEN.appleLeaf;
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy - r - 0.5, 3, 1.8, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // body
  ctx.fillStyle = TOKEN.appleBody;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // highlight
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
    while (tickAccum >= TICK_MS) {
      tick();
      tickAccum -= TICK_MS;
      if (state !== STATE.PLAYING) break;
    }
  }
  draw(now);
  requestAnimationFrame(frame);
}

function setDirection(dx, dy) {
  if (dx === -dir.x && dy === -dir.y) return;
  nextDir = { x: dx, y: dy };
}

document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === " " || key === "Spacebar") {
    e.preventDefault();
    if (state === STATE.PLAYING) pause();
    else start();
    return;
  }
  if (state !== STATE.PLAYING) return;
  switch (key) {
    case "ArrowUp": case "w": case "W": setDirection(0, -1); break;
    case "ArrowDown": case "s": case "S": setDirection(0, 1); break;
    case "ArrowLeft": case "a": case "A": setDirection(-1, 0); break;
    case "ArrowRight": case "d": case "D": setDirection(1, 0); break;
  }
});

init();
lastFrame = performance.now();
requestAnimationFrame(frame);
