import React, { useState } from "react";
import "./style_quiz.css";

const LEVELS = [
  {
    id: "facile",
    label: "Primaire",
    questions: 15
  },
  {
    id: "moyen",
    label: "Collège",
    questions: 20
  },
  {
    id: "difficile",
    label: "Lycée",
    questions: 25
  }
];

function AccueilQuiz() {
  const [playerName, setPlayerName] = useState("Nom du joueur");
  const [selectedLevelId, setSelectedLevelId] = useState("facile");

  const handlePlayerNameChange = () => {
    const newName = window.prompt("Entre ton nom de joueur :", playerName);

    if (!newName) return;

    const trimmedName = newName.trim();
    if (trimmedName.length < 2) return;

    setPlayerName(trimmedName);
  };

  const handleLevelSelect = (levelId) => {
    setSelectedLevelId(levelId);

    const selectedLevel = LEVELS.find((level) => level.id === levelId);
    if (!selectedLevel) return;

    window.alert(
      `Bienvenue ${playerName} ! Niveau selectionne : ${selectedLevel.label}.`
    );
  };

  return (
    <div className="page">
      <header className="topBar">
        <div className="leftGroup">
          <button type="button" className="homeButton" aria-label="Accueil">
            <svg
              className="homeIcon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 10.5L12 4L20 10.5V20H14V14H10V20H4V10.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="mascotWrap" aria-hidden="true">
            <img
              className="mascotImage"
              src="/images/mascotte%20duo.png"
              alt=""
            />
          </div>
        </div>

        <button
          type="button"
          className="playerButton"
          onClick={handlePlayerNameChange}
        >
          <span>{playerName}</span>
          <span className="star" aria-hidden="true">
            ☆
          </span>
        </button>
      </header>

      <main className="content">
        <h1 className="title">Quiz Culture Generale</h1>

        <section className="levels" aria-label="Choix de la difficulte">
          {LEVELS.map((level) => {
            const isSelected = level.id === selectedLevelId;

            return (
              <button
                key={level.id}
                type="button"
                className={`level ${level.id} ${isSelected ? "selected" : ""}`}
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

export default AccueilQuiz;
