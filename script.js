const SUPABASE_URL = "https://jsiwbxlvrmpwovfcntau.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzaXdieGx2cm1wd292ZmNudGF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjkzNTMsImV4cCI6MjA5MDQwNTM1M30.ly1hiDO25kaSd5S8sIpZ-fC-n3mM_v9bCHPXqOUeuU8";
const ROOM_PREFIX = "duel-room-";

const connectedPseudoEl = document.getElementById("connectedPseudo");
const createRoomBtnEl = document.getElementById("createRoomBtn");
const copyCodeBtnEl = document.getElementById("copyCodeBtn");
const joinRoomBtnEl = document.getElementById("joinRoomBtn");
const leaveRoomBtnEl = document.getElementById("leaveRoomBtn");
const activeRoomCodeEl = document.getElementById("activeRoomCode");
const friendStatusEl = document.getElementById("friendStatus");
const multiplayerStatusEl = document.getElementById("multiplayerStatus");
const joinCodeModalEl = document.getElementById("joinCodeModal");
const joinCodeFormEl = document.getElementById("joinCodeForm");
const joinCodeInputEl = document.getElementById("joinCodeInput");
const joinCodeErrorEl = document.getElementById("joinCodeError");
const cancelJoinBtnEl = document.getElementById("cancelJoinBtn");

const myRoleTitleEl = document.getElementById("myRoleTitle");
const questionSelfEl = document.getElementById("questionSelf");
const displaySelfEl = document.getElementById("displaySelf");
const calcSelfEl = document.getElementById("calcSelf");
const nameLeftEl = document.getElementById("nameLeft");
const nameRightEl = document.getElementById("nameRight");
const lifeLeftEl = document.getElementById("lifeLeft");
const lifeRightEl = document.getElementById("lifeRight");

let supabaseClient = null;
let roomChannel = null;
let isHost = false;
let mySide = null;
let roomCode = null;
let connectedPseudo = "joueur";
let roomExpiryTimer = null;

const ROOM_INACTIVITY_MS = 120000;

let gameState = {
  version: 1,
  lifeLeft: 100,
  lifeRight: 100,
  question: generateQuestion(),
  players: {
    left: "Canard",
    right: "Lapin",
  },
};

function getConnectedPseudo() {
  const rawUser = localStorage.getItem("currentUser");
  if (!rawUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(rawUser);
    return parsedUser?.profile?.pseudo || parsedUser?.pseudo || null;
  } catch {
    return null;
  }
}

function normalizeCode(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

function createCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  window.crypto.getRandomValues(bytes);

  let code = "";
  for (let i = 0; i < bytes.length; i += 1) {
    code += chars[bytes[i] % chars.length];
  }

  return code;
}

function generateQuestion() {
  const a = Math.floor(Math.random() * 10);
  const b = Math.floor(Math.random() * 10);
  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    text: `${a} × ${b}`,
    answer: a * b,
  };
}

function setStatus(message) {
  multiplayerStatusEl.textContent = message;
}

function setJoinCodeError(message = "") {
  if (!joinCodeErrorEl) {
    return;
  }

  joinCodeErrorEl.textContent = message;
}

function openJoinCodeModal() {
  if (!joinCodeModalEl || !joinCodeInputEl) {
    return;
  }

  joinCodeModalEl.classList.remove("hidden");
  setJoinCodeError("");
  joinCodeInputEl.value = "";
  joinCodeInputEl.focus();
}

function closeJoinCodeModal() {
  if (!joinCodeModalEl) {
    return;
  }

  joinCodeModalEl.classList.add("hidden");
}

function setFriendStatus(online) {
  if (!friendStatusEl) {
    return;
  }

  friendStatusEl.textContent = online ? "Ami: connecté" : "Ami: hors ligne";
  friendStatusEl.classList.toggle("online", online);
}

function clearRoomExpiryTimer() {
  if (!roomExpiryTimer) {
    return;
  }

  clearTimeout(roomExpiryTimer);
  roomExpiryTimer = null;
}

function resetRoomExpiryTimer() {
  clearRoomExpiryTimer();

  if (!isHost || !roomChannel) {
    return;
  }

  roomExpiryTimer = setTimeout(async () => {
    await leaveRoom("Salle expirée après inactivité. Génère un nouveau code.");
  }, ROOM_INACTIVITY_MS);
}

function updateRoleTitle() {
  if (mySide === "left") {
    myRoleTitleEl.textContent = "Ton camp: 🦆 Canard";
    return;
  }

  if (mySide === "right") {
    myRoleTitleEl.textContent = "Ton camp: 🐰 Lapin";
    return;
  }

  myRoleTitleEl.textContent = "Ton côté";
}

function renderState() {
  questionSelfEl.textContent = `${gameState.question.text} = ?`;
  lifeLeftEl.textContent = `${Math.max(0, gameState.lifeLeft)} ❤️`;
  lifeRightEl.textContent = `${Math.max(0, gameState.lifeRight)} ❤️`;
  nameLeftEl.textContent = gameState.players.left || "Canard";
  nameRightEl.textContent = gameState.players.right || "Lapin";
  updateRoleTitle();
}

function bumpVersion() {
  gameState.version = (gameState.version || 0) + 1;
}

function createCalculator() {
  calcSelfEl.innerHTML = "";

  for (let i = 1; i <= 9; i += 1) {
    const button = document.createElement("button");
    button.textContent = String(i);
    button.addEventListener("click", () => {
      displaySelfEl.value += String(i);
    });
    calcSelfEl.appendChild(button);
  }

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "C";
  clearBtn.addEventListener("click", () => {
    displaySelfEl.value = "";
  });

  const zeroBtn = document.createElement("button");
  zeroBtn.textContent = "0";
  zeroBtn.addEventListener("click", () => {
    displaySelfEl.value += "0";
  });

  const goBtn = document.createElement("button");
  goBtn.textContent = "GO";
  goBtn.addEventListener("click", submitMyAnswer);

  calcSelfEl.appendChild(clearBtn);
  calcSelfEl.appendChild(zeroBtn);
  calcSelfEl.appendChild(goBtn);
}

function checkGameOver() {
  if (gameState.lifeLeft <= 0 || gameState.lifeRight <= 0) {
    const winner = gameState.lifeLeft <= 0 ? "🐰 Lapin" : "🦆 Canard";
    setStatus(`Fin de manche: ${winner} gagne.`);
    gameState.lifeLeft = 100;
    gameState.lifeRight = 100;
    gameState.question = generateQuestion();
    bumpVersion();
  }
}

function applyAnswer(side, answer) {
  const value = Number.parseInt(answer, 10);

  if (Number.isNaN(value)) {
    return;
  }

  if (value === gameState.question.answer) {
    if (side === "left") {
      gameState.lifeRight -= 10;
    } else {
      gameState.lifeLeft -= 10;
    }
  } else if (side === "left") {
    gameState.lifeLeft -= 10;
  } else {
    gameState.lifeRight -= 10;
  }

  checkGameOver();
  gameState.question = generateQuestion();
  bumpVersion();
  renderState();
}

async function broadcastState() {
  if (!roomChannel) {
    return;
  }

  await roomChannel.send({
    type: "broadcast",
    event: "state",
    payload: {
      gameState,
      side: mySide,
    },
  });
}

async function sendAnswer(answer) {
  if (!roomChannel || !mySide) {
    return;
  }

  await roomChannel.send({
    type: "broadcast",
    event: "answer",
    payload: {
      side: mySide,
      answer,
      questionId: gameState.question.id,
    },
  });
}

async function submitMyAnswer() {
  if (!roomChannel || !mySide) {
    setStatus("Crée ou rejoins une salle d'abord.");
    return;
  }

  const answer = displaySelfEl.value.trim();
  if (!answer) {
    return;
  }

  displaySelfEl.value = "";

  if (isHost) {
    applyAnswer(mySide, answer);
    resetRoomExpiryTimer();
    await broadcastState();
    return;
  }

  await sendAnswer(answer);
}

async function leaveRoom(customStatus = "Tu as quitté la salle.") {
  clearRoomExpiryTimer();

  if (roomChannel) {
    await supabaseClient.removeChannel(roomChannel);
  }

  roomChannel = null;
  roomCode = null;
  mySide = null;
  isHost = false;
  activeRoomCodeEl.textContent = "-";
  setFriendStatus(false);
  updateRoleTitle();
  setStatus(customStatus);
}

async function waitForHostPresence(timeoutMs = 3000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const players = getPresencePlayers();
    const hostPlayer = players.find((entry) => entry.side === "left");
    if (hostPlayer) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return false;
}

function getPresencePlayers() {
  if (!roomChannel) {
    return [];
  }

  const state = roomChannel.presenceState();
  const entries = Object.values(state);
  return entries.flat();
}

async function syncPlayersFromPresence() {
  const players = getPresencePlayers();
  const leftPlayer = players.find((entry) => entry.side === "left");
  const rightPlayer = players.find((entry) => entry.side === "right");

  const friendOnline = mySide === "left" ? !!rightPlayer : !!leftPlayer;
  setFriendStatus(friendOnline);

  if (isHost && friendOnline) {
    resetRoomExpiryTimer();
  }

  let changed = false;

  if (leftPlayer?.pseudo) {
    if (gameState.players.left !== leftPlayer.pseudo) {
      changed = true;
    }
    gameState.players.left = leftPlayer.pseudo;
  } else if (!gameState.players.left) {
    gameState.players.left = "Canard";
    changed = true;
  }

  if (rightPlayer?.pseudo) {
    if (gameState.players.right !== rightPlayer.pseudo) {
      changed = true;
    }
    gameState.players.right = rightPlayer.pseudo;
  } else if (!gameState.players.right) {
    gameState.players.right = "Lapin";
    changed = true;
  }

  if (changed) {
    bumpVersion();
  }

  renderState();

  if (players.length > 2) {
    setStatus("Salle pleine (2 joueurs max). Choisis un autre code.");
    await leaveRoom();
    return;
  }

  if (isHost) {
    await broadcastState();
  }
}

async function joinRoom(code, side, hostMode) {
  if (!supabaseClient) {
    setStatus("Supabase indisponible. Impossible de jouer en ligne.");
    return;
  }

  if (roomChannel) {
    await leaveRoom();
  }

  roomCode = normalizeCode(code);
  mySide = side;
  isHost = hostMode;

  if (mySide === "left") {
    gameState.players.left = connectedPseudo;
  } else if (mySide === "right") {
    gameState.players.right = connectedPseudo;
  }

  renderState();

  roomChannel = supabaseClient.channel(`${ROOM_PREFIX}${roomCode}`, {
    config: {
      presence: { key: `${connectedPseudo}-${Math.random().toString(36).slice(2, 8)}` },
      broadcast: { self: true },
    },
  });

  roomChannel
    .on("broadcast", { event: "state" }, ({ payload }) => {
      if (!payload?.gameState) {
        return;
      }

      const incomingVersion = payload.gameState.version || 0;
      const localVersion = gameState.version || 0;
      if (incomingVersion < localVersion) {
        return;
      }

      gameState = {
        ...payload.gameState,
        players: {
          left: payload.gameState?.players?.left || gameState.players.left || "Canard",
          right: payload.gameState?.players?.right || gameState.players.right || "Lapin",
        },
      };
      renderState();
    })
    .on("broadcast", { event: "answer" }, async ({ payload }) => {
      if (!isHost) {
        return;
      }

      if (!payload?.side) {
        return;
      }

      if (payload.questionId && payload.questionId !== gameState.question.id) {
        await broadcastState();
        return;
      }

      resetRoomExpiryTimer();
      applyAnswer(payload.side, payload.answer);
      await broadcastState();
    })
    .on("presence", { event: "sync" }, async () => {
      await syncPlayersFromPresence();
    });

  roomChannel.subscribe(async (status) => {
    if (status !== "SUBSCRIBED") {
      return;
    }

    await roomChannel.track({
      pseudo: connectedPseudo,
      side: mySide,
      joinedAt: Date.now(),
    });

    if (isHost) {
      activeRoomCodeEl.textContent = roomCode;
      setStatus(`Salle ${roomCode} créée. Invite ton ami avec ce code.`);
      setFriendStatus(false);

      gameState = {
        version: 1,
        lifeLeft: 100,
        lifeRight: 100,
        question: generateQuestion(),
        players: {
          left: connectedPseudo,
          right: "Lapin",
        },
      };
      renderState();
      resetRoomExpiryTimer();
      await broadcastState();
      return;
    }

    setStatus(`Vérification de la salle ${roomCode}...`);
    const hasHost = await waitForHostPresence();

    if (!hasHost) {
      await leaveRoom("Code invalide ou salle inactive. Demande un code créé par ton ami.");
      return;
    }

    activeRoomCodeEl.textContent = roomCode;
    setFriendStatus(true);
    setStatus(`Connecté à la salle ${roomCode}. Duel prêt.`);
  });
}

function initSupabase() {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch {
    supabaseClient = null;
  }
}

function bindEvents() {
  createRoomBtnEl.addEventListener("click", async () => {
    const generatedCode = createCode();
    await joinRoom(generatedCode, "left", true);
  });

  copyCodeBtnEl.addEventListener("click", async () => {
    const code = activeRoomCodeEl.textContent.trim();

    if (!code || code === "-") {
      setStatus("Aucun code actif à copier. Génère une salle d'abord.");
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setStatus(`Code ${code} copié.`);
    } catch {
      setStatus("Impossible de copier automatiquement. Copie le code affiché.");
    }
  });

  joinRoomBtnEl.addEventListener("click", async () => {
    openJoinCodeModal();
  });

  joinCodeFormEl.addEventListener("submit", async (event) => {
    event.preventDefault();

    const code = normalizeCode(joinCodeInputEl.value);
    if (code.length !== 6) {
      setJoinCodeError("Code invalide. Le code doit contenir 6 caractères.");
      return;
    }

    closeJoinCodeModal();
    await joinRoom(code, "right", false);
  });

  cancelJoinBtnEl.addEventListener("click", () => {
    closeJoinCodeModal();
  });

  joinCodeModalEl.addEventListener("click", (event) => {
    if (event.target === joinCodeModalEl) {
      closeJoinCodeModal();
    }
  });

  leaveRoomBtnEl.addEventListener("click", async () => {
    await leaveRoom();
  });
}

function init() {
  const pseudo = getConnectedPseudo();
  if (!pseudo) {
    window.location.href = "index.html";
    return;
  }

  connectedPseudo = pseudo;
  connectedPseudoEl.textContent = `Pseudo: ${connectedPseudo}`;
  setFriendStatus(false);

  initSupabase();
  createCalculator();
  renderState();
  bindEvents();
}

init();