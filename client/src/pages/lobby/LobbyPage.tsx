import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/gameStore'
import './LobbyPage.css'
import '../menu/MenuPage.css'

export default function LobbyPage() {
  const navigate = useNavigate()
  const { userName } = useGameStore()

  return (
    <div className="lobby">
      <header className="menu-topbar">
        <div className="lobby__box">
          <h1 className="lobby__title">🎮 Choisir un jeu</h1>
          <p className="lobby__welcome">
            Bonjour <strong>{userName}</strong> !
          </p>
          <p className="lobby__hint">
            Choisis un jeu, crée un code et partage-le à ton ami pour jouer ensemble.
          </p>

          <button className="lobby__game-btn lobby__game-btn--duel" onClick={() => navigate('/game')}>
            <span className="lobby__game-emoji">🦆 VS 🐰</span>
            <span className="lobby__game-name">Duel Multiplication</span>
            <span className="lobby__game-desc">Attaque l'adversaire avec tes bonnes réponses</span>
          </button>

          <button
            className="lobby__game-btn lobby__game-btn--express"
            onClick={() => navigate('/express')}
          >
            <span className="lobby__game-emoji">🧒🏻</span>
            <span className="lobby__game-name">Calcul Express</span>
            <span className="lobby__game-desc">Grimpe le poteau en répondant correctement</span>
          </button>

          <button className="lobby__back-btn" onClick={() => navigate('/menu')}>
            ← Retour au menu
          </button>
        </div>
      </header>
    </div>
  )
}
