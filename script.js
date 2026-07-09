// Game configuration and state variables
const GOAL_CANS = 20;
let currentCans = 0;
let gameActive = false;
let spawnInterval;
let timerInterval;
let timeLeft = 30;
const TOTAL_TIME = 30;

const winMessages = [
  "You did it! Clean water for all! 💧",
  "Amazing work! You crushed your goal!",
  "Incredible! You're a water hero!"
];

const loseMessages = [
  "So close! Give it another shot.",
  "Almost there! Try again to hit the goal.",
  "Keep going! Every can counts."
];

function createGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    grid.appendChild(cell);
  }
}

createGrid();

function spawnWaterCan() {
  if (!gameActive) return;
  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => (cell.innerHTML = ''));

  const randomCell = cells[Math.floor(Math.random() * cells.length)];
  const isDirty = Math.random() < 0.25;

  randomCell.innerHTML = `
    <div class="water-can-wrapper">
      <div class="water-can ${isDirty ? 'dirty' : 'clean'}"></div>
    </div>
  `;

  const can = randomCell.querySelector('.water-can');
  can.addEventListener('click', () => collectCan(isDirty, randomCell));
}

function showFloatFeedback(cell, text, isPositive) {
  const feedback = document.createElement('div');
  feedback.className = `float-feedback ${isPositive ? 'positive' : 'negative'}`;
  feedback.textContent = text;
  cell.appendChild(feedback);
  setTimeout(() => feedback.remove(), 800);
}

function collectCan(isDirty, cell) {
  if (!gameActive) return;

  if (isDirty) {
    currentCans = Math.max(0, currentCans - 1);
    cell.classList.add('shake');
    showFloatFeedback(cell, '-1', false);
    setTimeout(() => cell.classList.remove('shake'), 350);
  } else {
    currentCans++;
    showFloatFeedback(cell, '+1', true);
  }

  document.getElementById('current-cans').textContent = currentCans;
  // Small delay so the floating feedback is visible before the cell clears
  setTimeout(() => {
    document.querySelectorAll('.grid-cell').forEach(c => {
      const wrapper = c.querySelector('.water-can-wrapper');
      if (wrapper) wrapper.remove();
    });
  }, 50);
}

function tickTimer() {
  timeLeft--;
  document.getElementById('timer').textContent = timeLeft;
  const pct = Math.max(0, (timeLeft / TOTAL_TIME) * 100);
  document.getElementById('timer-fill').style.width = pct + '%';
  if (timeLeft <= 0) {
    endGame();
  }
}

function startGame() {
  if (gameActive) return;
  gameActive = true;
  currentCans = 0;
  timeLeft = TOTAL_TIME;
  document.getElementById('current-cans').textContent = currentCans;
  document.getElementById('timer').textContent = timeLeft;
  document.getElementById('timer-fill').style.width = '100%';
  document.getElementById('achievements').textContent = '';

  createGrid();
  spawnInterval = setInterval(spawnWaterCan, 1000);
  timerInterval = setInterval(tickTimer, 1000);
}

function endGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  document.querySelector('.game-grid').innerHTML = '';

  const won = currentCans >= GOAL_CANS;
  const messages = won ? winMessages : loseMessages;
  const chosenMessage = messages[Math.floor(Math.random() * messages.length)];
  document.getElementById('achievements').textContent = chosenMessage;

  if (won) launchConfetti();
}

function resetGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  currentCans = 0;
  timeLeft = TOTAL_TIME;
  document.getElementById('current-cans').textContent = currentCans;
  document.getElementById('timer').textContent = timeLeft;
  document.getElementById('timer-fill').style.width = '100%';
  document.getElementById('achievements').textContent = '';
  createGrid();
}

function launchConfetti() {
  const colors = ['#FFC907', '#77A8BB', '#003366', '#FED8C1', '#BF6C46'];
  for (let i = 0; i < 45; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
}

// Ripple effect on button click
function addRipple(e) {
  const button = e.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  button.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

document.querySelectorAll('.btn').forEach(btn => btn.addEventListener('click', addRipple));

document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('reset-game').addEventListener('click', resetGame);