let lifeLeft = 100;
let lifeRight = 100;

let currentQuestion = generateQuestion();

function getConnectedPseudo() {
  const rawUser = localStorage.getItem("currentUser");
  if (!rawUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(rawUser);
    const pseudo = parsedUser?.profile?.pseudo;
    if (pseudo && typeof pseudo === "string") {
      return pseudo;
    }
  } catch {
    return null;
  }

  return null;
}

function updatePlayerName() {
  const playerNameLeftEl = document.getElementById("playerNameLeft");
  if (!playerNameLeftEl) {
    return;
  }

  const pseudo = getConnectedPseudo();
  if (pseudo) {
    playerNameLeftEl.textContent = `🦆 ${pseudo}`;
  }
}

// QUESTION
function generateQuestion() {
  let a = Math.floor(Math.random() * 10);
  let b = Math.floor(Math.random() * 10);

  return {
    text: `${a} × ${b}`,
    answer: a * b
  };
}

// AFFICHER QUESTION
function updateQuestion() {
  document.getElementById("questionLeft").textContent =
    currentQuestion.text + " = ?";

  document.getElementById("questionRight").textContent =
    currentQuestion.text + " = ?";
}

// MAJ VIE
function updateLife() {
  document.getElementById("lifeLeft").textContent = lifeLeft + " ❤️";
  document.getElementById("lifeRight").textContent = lifeRight + " ❤️";
}

// CALCULATRICE
function press(player, value) {
  let display = document.getElementById(
    player === "left" ? "displayLeft" : "displayRight"
  );

  display.value += value;
}

function clearDisplay(player) {
  let display = document.getElementById(
    player === "left" ? "displayLeft" : "displayRight"
  );

  display.value = "";
}

// COMBAT
function submitAnswer(player) {
  let display = document.getElementById(
    player === "left" ? "displayLeft" : "displayRight"
  );

  let value = parseInt(display.value);

  if (value === currentQuestion.answer) {
    // BONNE RÉPONSE → attaque
    if (player === "left") {
      lifeRight -= 10;
    } else {
      lifeLeft -= 10;
    }
  } else {
    // MAUVAISE → tu prends
    if (player === "left") {
      lifeLeft -= 10;
    } else {
      lifeRight -= 10;
    }
  }

  updateLife();
  checkGameOver();

  clearDisplay("left");
  clearDisplay("right");

  currentQuestion = generateQuestion();
  updateQuestion();
}

// FIN
function checkGameOver() {
  if (lifeLeft <= 0) {
    alert("🐰 Le lapin gagne !");
    restartGame();
  }

  if (lifeRight <= 0) {
    alert("🦆 Le canard gagne !");
    restartGame();
  }
}

// RESET
function restartGame() {
  lifeLeft = 100;
  lifeRight = 100;

  updateLife();

  currentQuestion = generateQuestion();
  updateQuestion();
}

// CRÉER CALCULATRICE
function createCalculator(player, containerId) {
  let container = document.getElementById(containerId);

  for (let i = 1; i <= 9; i++) {
    let btn = document.createElement("button");
    btn.textContent = i;
    btn.onclick = () => press(player, i);
    container.appendChild(btn);
  }

  let clearBtn = document.createElement("button");
  clearBtn.textContent = "C";
  clearBtn.onclick = () => clearDisplay(player);

  let zeroBtn = document.createElement("button");
  zeroBtn.textContent = "0";
  zeroBtn.onclick = () => press(player, 0);

  let goBtn = document.createElement("button");
  goBtn.textContent = "GO";
  goBtn.onclick = () => submitAnswer(player);

  container.appendChild(clearBtn);
  container.appendChild(zeroBtn);
  container.appendChild(goBtn);
}

// INIT
updatePlayerName();
createCalculator("left", "calcLeft");
createCalculator("right", "calcRight");

updateQuestion();
updateLife();