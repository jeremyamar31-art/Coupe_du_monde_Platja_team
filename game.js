let score = 0;
let bestScore = localStorage.getItem("bestScore") || 0;

const scoreDisplay = () => {
  document.getElementById("score").innerText = score;
  document.getElementById("bestScore").innerText = bestScore;
};

function moveBall() {
  const gameArea = document.getElementById("gameArea");
  const ball = document.getElementById("ball");

  const maxX = gameArea.clientWidth - 60;
  const maxY = gameArea.clientHeight - 60;

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  ball.style.left = x + "px";
  ball.style.top = y + "px";
}

function hitBall() {
  score++;

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("bestScore", bestScore);
  }

  scoreDisplay();

  moveBall();

  const ball = document.getElementById("ball");

  const size = Math.max(35, 60 - score * 0.5);
  ball.style.width = size + "px";
  ball.style.height = size + "px";
}

function resetGame() {
  score = 0;

  const ball = document.getElementById("ball");
  ball.style.width = "60px";
  ball.style.height = "60px";

  scoreDisplay();
  moveBall();
}

window.addEventListener("load", () => {
  scoreDisplay();
  moveBall();
});