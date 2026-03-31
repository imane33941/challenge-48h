import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/store/gameStore";
import "./home_style.css";

const LEVELS = [
  { id: "primaire",  label: "Primaire", questions: 15 },
  { id: "college",   label: "Collège",  questions: 20 },
  { id: "lycee",     label: "Lycée",    questions: 25 },
];

function HomePage() {
  const navigate = useNavigate();
  const userName = useGameStore((s) => s.userName);
  const playerName = useMemo(() => userName || "Joueur", [userName]);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);



  const handleLevelSelect = (levelId: string) => {
    setSelectedLevelId(levelId);
    navigate(`/question/${levelId}`);
  };

  /* ── Déconnexion ── */
  const handleLogout = () => {
    navigate("/menu");
  };

  return (
    <div className="page">

      {/* ── Header ── */}
      <header className="topBar">
        <div className="leftGroup">
          <button type="button" className="back-btn" onClick={() => navigate('/menu')}>
            ← Menu
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
        <h1 className="title">Quiz Culture Generale</h1>
        <p className="subtitle">Choisis ton niveau pour lancer la prochaine question.</p>

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
                <span className="levelMeta">{level.questions} questions</span>
              </button>
            );
          })}
        </section>
      </main>


    </div>
  );
}

export default HomePage;