let score = 0;
let bestScore = localStorage.getItem("bestScore") || 0;

let timeLeft = 15;
let gameActive = false;
let timer;

const scoreDisplay = () => {
  document.getElementById("score").innerText = score;
  document.getElementById("bestScore").innerText = bestScore;
  document.getElementById("time").innerText = timeLeft;
};

function moveBall() {
  const gameArea = document.getElementById("gameArea");
  const ball = document.getElementById("ball");

  const maxX = gameArea.offsetWidth - 60;
  const maxY = gameArea.offsetHeight - 60;

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  ball.style.left = x + "px";
  ball.style.top = y + "px";
}

function startGame() {
  score = 0;
  timeLeft = 15;
  gameActive = true;

  scoreDisplay();
  moveBall();

  timer = setInterval(() => {
    timeLeft--;
    scoreDisplay();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameActive = false;
  clearInterval(timer);

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("bestScore", bestScore);
  }

  alert("⏱️ Fin du jeu ! Ton score : " + score);
}

function hitBall() {
  if (!gameActive) return;

  score++;

  moveBall();

  const ball = document.getElementById("ball");

  const size = Math.max(35, 60 - score * 0.5);
  ball.style.width = size + "px";
  ball.style.height = size + "px";

  scoreDisplay();
}

function resetGame() {
  clearInterval(timer);
  startGame();
}

window.addEventListener("load", () => {
  scoreDisplay();
  startGame();
});
