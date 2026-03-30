const currentUserRaw = localStorage.getItem("currentUser");

if (!currentUserRaw) {
  window.location.href = "index.html";
}

let currentUser = null;

try {
  currentUser = JSON.parse(currentUserRaw);
} catch {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

const headerPseudoEl = document.getElementById("headerPseudo");
const settingsBtnEl = document.getElementById("settingsBtn");
const settingsPanelEl = document.getElementById("settingsPanel");
const closeSettingsBtnEl = document.getElementById("closeSettingsBtn");
const accountFormEl = document.getElementById("accountForm");
const accountStatusEl = document.getElementById("accountStatus");
const logoutBtnEl = document.getElementById("logoutBtn");

const accountPseudoEl = document.getElementById("accountPseudo");
const accountEmailEl = document.getElementById("accountEmail");
const accountNomEl = document.getElementById("accountNom");
const accountPrenomEl = document.getElementById("accountPrenom");

function normalizePseudo(pseudo) {
  return pseudo.trim().toLowerCase().replace(/\s+/g, "-");
}

function setStatus(message, type = "") {
  if (!accountStatusEl) {
    return;
  }

  accountStatusEl.textContent = message;
  accountStatusEl.className = `status ${type}`.trim();
}

function getProfile() {
  return currentUser?.profile || {};
}

function fillAccountFields() {
  const profile = getProfile();
  const pseudo = profile.pseudo || currentUser?.pseudo || "joueur";

  if (headerPseudoEl) {
    headerPseudoEl.textContent = pseudo;
  }

  if (accountPseudoEl) {
    accountPseudoEl.value = pseudo;
  }

  if (accountEmailEl) {
    accountEmailEl.value = profile.signupEmail || "";
  }

  if (accountNomEl) {
    accountNomEl.value = profile.nom || "";
  }

  if (accountPrenomEl) {
    accountPrenomEl.value = profile.prenom || "";
  }
}

function openSettings() {
  settingsPanelEl.classList.remove("hidden");
}

function closeSettings() {
  settingsPanelEl.classList.add("hidden");
}

function saveCurrentUser() {
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

settingsBtnEl?.addEventListener("click", openSettings);
closeSettingsBtnEl?.addEventListener("click", closeSettings);

logoutBtnEl?.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
});

accountFormEl?.addEventListener("submit", (event) => {
  event.preventDefault();

  const pseudoInput = normalizePseudo(accountPseudoEl.value);
  const emailInput = accountEmailEl.value.trim();
  const nomInput = accountNomEl.value.trim();
  const prenomInput = accountPrenomEl.value.trim();

  if (!/^[a-z0-9._-]{3,30}$/.test(pseudoInput)) {
    setStatus("Pseudo invalide: 3-30 caractères avec lettres/chiffres/._-", "error");
    return;
  }

  if (!emailInput || !nomInput || !prenomInput) {
    setStatus("Tous les champs sont obligatoires.", "error");
    return;
  }

  currentUser = {
    ...currentUser,
    pseudo: pseudoInput,
    profile: {
      ...(currentUser.profile || {}),
      pseudo: pseudoInput,
      signupEmail: emailInput,
      nom: nomInput,
      prenom: prenomInput,
    },
  };

  saveCurrentUser();
  fillAccountFields();
  setStatus("Compte mis à jour avec succès.", "success");
});

fillAccountFields();
