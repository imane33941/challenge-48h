import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/gameStore'
import './MenuPage.css'

export default function MenuPage() {
  const navigate = useNavigate()
  const userName = useGameStore((s) => s.userName)
  const disconnectSocket = useGameStore((s) => s.disconnectSocket)

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_name')
    disconnectSocket()
    useGameStore.setState({
      userId: null,
      userName: null,
      pendingInvitation: null,
      session: null,
    })
    navigate('/login', { replace: true })
  }

  return (
    <div className="menu-page-react">
      <header className="menu-topbar">
        <div className="menu-brand">
          <p className="menu-kicker">Challenge 48h</p>
          <h1>Menu des mini-jeux</h1>
        </div>

        <div className="menu-account-area">
          <p className="menu-pseudo">{userName || 'Joueur'}</p>
          <button
            type="button"
            className="menu-logout-btn"
            aria-label="Déconnexion"
            onClick={handleLogout}
          >
            🚪 Quitter
          </button>
        </div>
      </header>

      <main className="menu-content">
        <section className="menu-cards" aria-label="Sélection des mini-jeux">
          <article className="menu-card">
            <h2>Duel Multiplication</h2>
            <p>Le mini-jeu existant: duel canard contre lapin avec calculatrice.</p>
            <button
              className="menu-play-btn"
              onClick={() => {
                navigate('/duel')
              }}
            >
              Jouer
            </button>
          </article>

          <article className="menu-card">
            <h2>Quiz Culture G</h2>
            <p>Mini-jeu à réaliser par l'équipe quiz. Emplacement réservé.</p>
            <span className="menu-play-btn menu-play-btn--disabled">Bientôt disponible</span>
          </article>

          <article className="menu-card">
            <h2>Calcul Express</h2>
            <p>Mini-jeu à réaliser par l'équipe calcul. Emplacement réservé.</p>
            <button
              className="menu-play-btn"
              onClick={() => {
                navigate('/lobby')
              }}
            >
              Jouer
            </button>
          </article>
        </section>
      </main>
    </div>
  )
}
