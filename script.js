// Game configuration and state variables
// Game configuration and state variables
const DIFFICULTY_SETTINGS = {
  easy:   { goal: 8,  time: 40, spawnSpeed: 1100, dirtyChance: 0.12 },
  normal: { goal: 12, time: 35, spawnSpeed: 900,  dirtyChance: 0.20 },
  hard:   { goal: 18, time: 30, spawnSpeed: 650,  dirtyChance: 0.30 }
};
let currentDifficulty = 'normal';
// ---- Sound effects (generated tones, no audio files needed) ----
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(frequency, duration, type = 'sine', volume = 0.15) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = volume;
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  oscillator.stop(audioCtx.currentTime + duration);
}

function playCleanSound() { playTone(880, 0.15, 'sine'); }
function playDirtySound() { playTone(160, 0.25, 'sawtooth'); }
function playWinSound() {
  [523, 659, 784, 1047].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'triangle'), i * 120);
  });
}
function playLoseSound() { playTone(220, 0.4, 'square', 0.1); }

let GOAL_CANS = DIFFICULTY_SETTINGS[currentDifficulty].goal;
let currentCans = 0;
let gameActive = false;
let spawnInterval;
let timerInterval;
let TOTAL_TIME = DIFFICULTY_SETTINGS[currentDifficulty].time;
let timeLeft = TOTAL_TIME;

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

const MILESTONES = [
  { fraction: 0.25, message: "🚰 Nice start — 25% there!" },
  { fraction: 0.5,  message: "💧 Halfway to clean water!" },
  { fraction: 0.75, message: "🔥 Almost there — 75%!" },
  { fraction: 1,    message: "🏆 Goal reached — keep going!" }
];
let milestonesShown = [];

function checkMilestones() {
  const progress = currentCans / GOAL_CANS;
  MILESTONES.forEach((milestone, i) => {
    if (progress >= milestone.fraction && !milestonesShown.includes(i)) {
      milestonesShown.push(i);
      const achievementBox = document.getElementById('achievements');
      achievementBox.textContent = milestone.message;
      setTimeout(() => {
        if (gameActive) achievementBox.textContent = '';
      }, 1500);
    }
  });
}

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
  const isDirty = Math.random() < DIFFICULTY_SETTINGS[currentDifficulty].dirtyChance;

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
    playDirtySound();
    setTimeout(() => cell.classList.remove('shake'), 350);
  } else {
    currentCans++;
    showFloatFeedback(cell, '+1', true);
    playCleanSound();
    checkMilestones();
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
  const settings = DIFFICULTY_SETTINGS[currentDifficulty];
  GOAL_CANS = settings.goal;
  TOTAL_TIME = settings.time;

  gameActive = true;
  currentCans = 0;
  milestonesShown = [];
  timeLeft = TOTAL_TIME;
  document.getElementById('current-cans').textContent = currentCans;
  document.getElementById('goal-cans').textContent = GOAL_CANS;
  document.getElementById('timer').textContent = timeLeft;
  document.getElementById('timer-fill').style.width = '100%';
  document.getElementById('achievements').textContent = '';

  setDifficultyLocked(true);
  createGrid();
  spawnInterval = setInterval(spawnWaterCan, settings.spawnSpeed);
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

  if (won) {
    launchConfetti();
    playWinSound();
  } else {
    playLoseSound();
  }

  setDifficultyLocked(false);
}

function resetGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  currentCans = 0;
  TOTAL_TIME = DIFFICULTY_SETTINGS[currentDifficulty].time;
  timeLeft = TOTAL_TIME;
  document.getElementById('current-cans').textContent = currentCans;
  document.getElementById('goal-cans').textContent = DIFFICULTY_SETTINGS[currentDifficulty].goal;
  document.getElementById('timer').textContent = timeLeft;
  document.getElementById('timer-fill').style.width = '100%';
  document.getElementById('achievements').textContent = '';
  setDifficultyLocked(false);
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

function setDifficultyLocked(locked) {
  document.querySelectorAll('.diff-btn').forEach(btn => (btn.disabled = locked));
}

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (gameActive) return;
    currentDifficulty = btn.dataset.difficulty;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

   const settings = DIFFICULTY_SETTINGS[currentDifficulty];
    document.getElementById('goal-cans').textContent = settings.goal;
    document.getElementById('timer').textContent = settings.time;
  });
});
document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('reset-game').addEventListener('click', resetGame);