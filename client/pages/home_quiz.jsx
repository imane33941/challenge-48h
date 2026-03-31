import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../src/home_style.css";

const LEVELS = [
  { id: "facile",   label: "Primaire",  questions: 15 },
  { id: "moyen",    label: "Collège",   questions: 20 },
  { id: "difficile",label: "Lycée",     questions: 25 },
];

function HomeQuiz({ onLogout }) {
  const navigate = useNavigate();
  const [playerName, setPlayerName]       = useState("Nom du joueur");
  const [selectedLevelId, setSelectedLevelId] = useState(null);



  /* ── Sélection niveau ── */
  const handleLevelSelect = (levelId) => {
    setSelectedLevelId(levelId);
    navigate("/question");
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
          <button type="button" className="playerButton">
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


    </div>
  );
}

export default HomePage;