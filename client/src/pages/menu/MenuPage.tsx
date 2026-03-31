import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/gameStore'
import './MenuPage.css'

export default function MenuPage() {
  const navigate = useNavigate()
  const { userName, userId, setUser, logout } = useGameStore()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pseudo, setPseudo] = useState(userName || '')
  const [email, setEmail] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [status, setStatus] = useState<{ msg: string; type: string }>({ msg: '', type: '' })

  const normalizePseudo = (p: string) => p.trim().toLowerCase().replace(/\s+/g, '-')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = normalizePseudo(pseudo)
    if (!/^[a-z0-9._-]{3,30}$/.test(normalized)) {
      setStatus({
        msg: 'Pseudo invalide: 3-30 caractères avec lettres/chiffres/._-',
        type: 'error',
      })
      return
    }
    if (!email || !nom || !prenom) {
      setStatus({ msg: 'Tous les champs sont obligatoires.', type: 'error' })
      return
    }
    setUser(userId!, normalized)
    setStatus({ msg: 'Compte mis à jour avec succès.', type: 'success' })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="menu-page">
      <header className="topbar">
        <div className="brand">
          <p className="kicker">Challenge 48h</p>
          <h1>Menu des mini-jeux</h1>
        </div>
        <div className="account-area">
          <p className="pseudo">{userName}</p>
          <button className="gear-btn" onClick={() => setSettingsOpen(true)}>
            ⚙
          </button>
        </div>
      </header>

      <main className="content">
        <section className="cards">
          <article className="card">
            <h2>Duel Multiplication</h2>
            <p>Duel en temps réel avec invitation par pseudo.</p>
            <button className="play-btn" onClick={() => navigate('/game')}>
              Jouer
            </button>
          </article>
          <article className="card">
            <h2>Quiz Culture G</h2>
            <p>Mini-jeu à réaliser par l'équipe quiz. Emplacement réservé.</p>
            <span className="play-btn disabled">Bientôt disponible</span>
          </article>
          <article className="card">
            <h2>Calcul Express</h2>
            <p>Mini-jeu à réaliser par l'équipe calcul. Emplacement réservé.</p>
            <button className="play-btn" onClick={() => navigate('/express')}>
              Jouer
            </button>
          </article>
        </section>
      </main>

      {settingsOpen && (
        <aside className="settings-panel">
          <div className="panel-header">
            <h3>Mon compte</h3>
            <button className="close-btn" onClick={() => setSettingsOpen(false)}>
              ✕
            </button>
          </div>
          <form className="account-form" onSubmit={handleSave}>
            <label>Pseudo</label>
            <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} />
            <label>Email de contact</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label>Nom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} />
            <label>Prénom</label>
            <input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            <div className="actions">
              <button type="submit" className="save-btn">
                Enregistrer
              </button>
              <button type="button" className="logout-btn" onClick={handleLogout}>
                Déconnexion
              </button>
            </div>
            {status.msg && <p className={`status ${status.type}`}>{status.msg}</p>}
          </form>
        </aside>
      )}
    </div>
  )
}
