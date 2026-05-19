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

const STATE = { READY: "ready", PLAYING: "playing", PAUSED: "paused", OVER: "over" };

let snake, dir, nextDir, food, score, best, state, timer;

function init() {
  snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  best = Number(localStorage.getItem("snake-best") || 0);
  state = STATE.READY;
  placeFood();
  updateHud();
  showOverlay("Press Space to Start", "Arrow keys or WASD to move");
  draw();
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
  if (state === STATE.OVER) {
    init();
  }
  state = STATE.PLAYING;
  hideOverlay();
  clearInterval(timer);
  timer = setInterval(tick, TICK_MS);
}

function pause() {
  if (state !== STATE.PLAYING) return;
  state = STATE.PAUSED;
  clearInterval(timer);
  showOverlay("Paused", "Press Space to resume");
}

function gameOver() {
  state = STATE.OVER;
  clearInterval(timer);
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

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    return gameOver();
  }
  if (snake.some((s, i) => i < snake.length - 1 && s.x === head.x && s.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    updateHud();
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ef4444";
  drawCell(food.x, food.y);

  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? "#34d399" : "#10b981";
    drawCell(seg.x, seg.y);
  });
}

function drawCell(x, y) {
  ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
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
