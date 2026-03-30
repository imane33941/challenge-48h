import React, { useState } from "react";
import "./style_quiz.css";

const LEVELS = [
  { id: "facile",   label: "Primaire",  questions: 15 },
  { id: "moyen",    label: "Collège",   questions: 20 },
  { id: "difficile",label: "Lycée",     questions: 25 },
];

function AccueilQuiz({ onLogout }) {
  const [playerName, setPlayerName]       = useState("Nom du joueur");
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [showModal, setShowModal]         = useState(false);
  const [inputValue, setInputValue]       = useState("");
  const [inputError, setInputError]       = useState(false);

  /* ── Modale nom ── */
  const openModal = () => {
    setInputValue(playerName === "Nom du joueur" ? "" : playerName);
    setInputError(false);
    setShowModal(true);
  };

  const confirmName = () => {
    const trimmed = inputValue.trim();
    if (trimmed.length < 2) { setInputError(true); return; }
    setPlayerName(trimmed);
    setShowModal(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") confirmName();
    if (e.key === "Escape") setShowModal(false);
  };

  /* ── Sélection niveau ── */
  const handleLevelSelect = (levelId) => {
    setSelectedLevelId(levelId);
  };

  /* ── Déconnexion ── */
  const handleLogout = () => {
    if (typeof onLogout === "function") onLogout();
    // TODO : intégrer la navigation vers la page login
  };

  return (
    <div className="page">

      {/* ── Header ── */}
      <header className="topBar">
        <div className="leftGroup">
          <button type="button" className="homeButton" aria-label="Accueil">
            <svg className="homeIcon" viewBox="0 0 24 24" fill="none"
              xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 10.5L12 4L20 10.5V20H14V14H10V20H4V10.5Z"
                stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="mascotWrap" aria-hidden="true">
            <img className="mascotImage" src="/images/mascotte%20duo.png" alt="" />
          </div>
        </div>

        <div className="rightGroup">
          <button type="button" className="playerButton" onClick={openModal}>
            <span>{playerName}</span>
            <span className="star" aria-hidden="true">☆</span>
          </button>

          <button type="button" className="logoutButton" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      {/* ── Contenu ── */}
      <main className="content">
        <h1 className="title">Quiz Culture Générale</h1>

        <section className="levels" aria-label="Choix de la difficulté">
          {LEVELS.map((level) => {
            const isSelected = level.id === selectedLevelId;
            return (
              <button
                key={level.id}
                type="button"
                className={`level ${level.id}${isSelected ? " selected" : ""}`}
                onClick={() => handleLevelSelect(level.id)}
              >
                <span className="levelTitle">{level.label}</span>
              </button>
            );
          })}
        </section>
      </main>

      {/* ── Modale nom du joueur ── */}
      {showModal && (
        <div
          className="modalOverlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalTitle"
        >
          <div className="modal">
            <h2 id="modalTitle" className="modalTitle">Ton prénom</h2>
            <p className="modalSub">Il apparaîtra sur ton score final</p>
            <input
              className={`modalInput${inputError ? " modalInputError" : ""}`}
              type="text"
              placeholder="Entre ton prénom…"
              maxLength={20}
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setInputError(false); }}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {inputError && (
              <p className="modalError">Minimum 2 caractères</p>
            )}
            <div className="modalActions">
              <button type="button" className="modalCancel"
                onClick={() => setShowModal(false)}>Annuler</button>
              <button type="button" className="modalConfirm"
                onClick={confirmName}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccueilQuiz;