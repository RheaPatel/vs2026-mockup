// snake.js

const canvas = document.getElementById('snake-canvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
const tileCount = 20;
let snake = [{ x: 10, y: 10 }];
let direction = { x: 0, y: 0 };
let food = { x: 5, y: 5 };
let gameOver = false;
let score = 0;

function drawTile(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
}

function draw() {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  snake.forEach((segment, idx) => {
    drawTile(segment.x, segment.y, idx === 0 ? '#4ec9b0' : '#0078d4');
  });
  drawTile(food.x, food.y, '#dcdcaa');

  ctx.fillStyle = '#fff';
  ctx.font = '16px Segoe UI';
  ctx.fillText('Score: ' + score, 10, canvas.height - 10);
}

function update() {
  if (gameOver) return;

  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // Wall collision
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    gameOver = true;
    return;
  }

  // Self collision
  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    gameOver = true;
    return;
  }

  snake.unshift(head);

  // Food collision
  if (head.x === food.x && head.y === food.y) {
    score++;
    placeFood();
  } else {
    snake.pop();
  }
}

function placeFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
  food = newFood;
}

function loop() {
  update();
  draw();
  if (!gameOver) {
    setTimeout(loop, 100);
  } else {
    ctx.fillStyle = '#f44747';
    ctx.font = '24px Segoe UI';
    ctx.fillText('Game Over', canvas.width / 2 - 60, canvas.height / 2);
  }
}

window.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp': if (direction.y !== 1) direction = { x: 0, y: -1 }; break;
    case 'ArrowDown': if (direction.y !== -1) direction = { x: 0, y: 1 }; break;
    case 'ArrowLeft': if (direction.x !== 1) direction = { x: -1, y: 0 }; break;
    case 'ArrowRight': if (direction.x !== -1) direction = { x: 1, y: 0 }; break;
  }
});

function startSnakeGame() {
  snake = [{ x: 10, y: 10 }];
  direction = { x: 0, y: 0 };
  score = 0;
  gameOver = false;
  placeFood();
  loop();
}

window.startSnakeGame = startSnakeGame;

// Auto-start for demo
setTimeout(startSnakeGame, 500);
