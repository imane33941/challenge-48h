let isLogin = true;

const SUPABASE_URL = "https://jsiwbxlvrmpwovfcntau.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzaXdieGx2cm1wd292ZmNudGF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjkzNTMsImV4cCI6MjA5MDQwNTM1M30.ly1hiDO25kaSd5S8sIpZ-fC-n3mM_v9bCHPXqOUeuU8";
const hasSupabaseConfig =
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") && SUPABASE_ANON_KEY !== "YOUR_ANON_KEY";

let supabaseClient = null;

if (hasSupabaseConfig) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch {
    supabaseClient = null;
  }
}

const formEl = document.getElementById("form");
const statusEl = document.getElementById("status");
const extraFieldsEl = document.getElementById("extraFields");
const titleEl = document.getElementById("title");
const switchTextEl = document.getElementById("switchText");
const switchLabelEl = document.getElementById("switchLabel");
const switchModeBtnEl = document.getElementById("switchModeBtn");
const pseudoEl = document.getElementById("pseudo");
const signupEmailEl = document.getElementById("signupEmail");
const nomEl = document.getElementById("nom");
const prenomEl = document.getElementById("prenom");
const passwordEl = document.getElementById("password");

if (!formEl || !extraFieldsEl || !titleEl) {
  console.warn("DOM elements not found, login.js initialization delayed");
}

// Initialiser: cacher les champs au démarrage (mode connexion par défaut)
if (extraFieldsEl && !extraFieldsEl.classList.contains("hidden")) {
  extraFieldsEl.classList.add("hidden");
}

function setStatus(message, type = "") {
  if (!statusEl) {
    return;
  }

  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function getReadableAuthError(error) {
  const rawMessage = (error?.message || "").toLowerCase();

  if (rawMessage.includes("email rate limit exceeded")) {
    return "Trop de demandes d'email d'inscription en peu de temps. Attends quelques minutes puis réessaie.";
  }

  if (rawMessage.includes("invalid login credentials")) {
    return "Pseudo ou mot de passe incorrect.";
  }

  return error?.message || "Une erreur est survenue.";
}

function toggleMode() {
  isLogin = !isLogin;

  if (extraFieldsEl) {
    extraFieldsEl.classList.toggle("hidden");
  }

  if (titleEl) {
    titleEl.textContent = isLogin ? "Connexion" : "Inscription";
  }

  if (switchLabelEl) {
    switchLabelEl.textContent = isLogin ? "Pas de compte ?" : "Déjà un compte ?";
  }

  if (switchModeBtnEl) {
    switchModeBtnEl.textContent = isLogin ? "S'inscrire" : "Se connecter";
  }

  setStatus("");
}

// Compatibilite avec une ancienne version HTML qui utilisait onclick
window.toggleMode = toggleMode;

if (switchModeBtnEl && switchModeBtnEl.dataset.boundSwitch !== "1") {
  switchModeBtnEl.addEventListener("click", toggleMode);
  switchModeBtnEl.dataset.boundSwitch = "1";
}

if (switchTextEl && switchTextEl.dataset.boundSwitchText !== "1") {
  switchTextEl.addEventListener("click", (event) => {
    if (event.target.id === "switchText" || event.target.id === "switchLabel") {
      toggleMode();
    }
  });
  switchTextEl.dataset.boundSwitchText = "1";
}

async function fetchUserProfile(userId) {
  if (!supabaseClient) {
    throw new Error("Supabase n'est pas configuré.");
  }

  const { data, error } = await supabaseClient.auth.getSession();

  if (error || !data.session) {
    throw new Error("Impossible de récupérer la session.");
  }

  const user = data.session.user;
  return {
    id: user.id,
    pseudo: user.user_metadata?.pseudo || "",
    signupEmail: user.user_metadata?.signupEmail || "",
    nom: user.user_metadata?.nom || "",
    prenom: user.user_metadata?.prenom || "",
  };
}

function normalizePseudo(pseudo) {
  return pseudo.trim().toLowerCase().replace(/\s+/g, "-");
}

function pseudoToEmail(pseudo) {
  const normalizedPseudo = normalizePseudo(pseudo);
  if (!/^[a-z0-9._-]{3,30}$/.test(normalizedPseudo)) {
    throw new Error("Pseudo invalide. Utilise 3-30 caracteres: lettres, chiffres, ., _, -");
  }

  return `${normalizedPseudo}@pseudo.local`;
}

async function signUpUser(pseudo, password, signupEmail, nom, prenom) {
  if (!supabaseClient) {
    throw new Error("Supabase n'est pas configuré.");
  }

  const email = pseudoToEmail(pseudo);

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        pseudo: normalizePseudo(pseudo),
        signupEmail,
        nom,
        prenom,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data.user;
}

async function signInUser(pseudo, password) {
  if (!supabaseClient) {
    throw new Error("Supabase n'est pas configuré.");
  }

  const email = pseudoToEmail(pseudo);

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data.user;
}

if (!hasSupabaseConfig) {
  setStatus("Renseigne SUPABASE_URL et SUPABASE_ANON_KEY dans login.js", "error");
}

// SUBMIT
if (formEl && formEl.dataset.boundSubmit !== "1") {
  formEl.addEventListener("submit", async (e) => {
  e.preventDefault();

  const pseudo = pseudoEl.value.trim();
  const password = passwordEl.value;
  const isSignupMode = !!extraFieldsEl && !extraFieldsEl.classList.contains("hidden");

  if (!pseudo || !password) {
    setStatus("Pseudo et mot de passe sont obligatoires.", "error");
    return;
  }

  setStatus("Chargement...", "");

  try {
    if (!isSignupMode) {
      const user = await signInUser(pseudo, password);
      const profile = await fetchUserProfile(user.id);

      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: user.id,
          pseudo: profile.pseudo || normalizePseudo(pseudo),
          profile,
        })
      );

      setStatus("Connexion réussie. Redirection...", "success");
      window.location.href = "game.html";
      return;
    }

    const signupEmail = signupEmailEl.value.trim();
    const nom = nomEl.value.trim();
    const prenom = prenomEl.value.trim();

    if (!signupEmail || !nom || !prenom) {
      setStatus("Email, nom et prénom sont obligatoires pour l'inscription.", "error");
      return;
    }

    await signUpUser(pseudo, password, signupEmail, nom, prenom);
    setStatus("Inscription envoyée. Vérifie ton email pour confirmer le compte.", "success");
  } catch (error) {
    setStatus(getReadableAuthError(error), "error");
  }
  });

  formEl.dataset.boundSubmit = "1";
}