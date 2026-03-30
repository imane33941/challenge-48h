import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/gameStore'
import './LobbyPage.css'

const EXERCISE_ID = import.meta.env.VITE_EXERCISE_ID || 'b8d81a89-0699-462b-bf5f-7981d1645414'

export default function LobbyPage() {
  const navigate = useNavigate()
  const {
    userId,
    userName,
    connected,
    pendingInvitation,
    session,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    connectSocket,
  } = useGameStore()

  const [inviteSent, setInviteSent] = useState(false)

  const [guestPseudo, setGuestPseudo] = useState('')
  const [searching, setSearching] = useState(false)
  const [foundUser, setFoundUser] = useState<{ id: string; username: string } | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!connected) connectSocket()
  }, [])

  useEffect(() => {
    if (session) navigate('/game')
  }, [session])

  const searchUser = async () => {
    if (!guestPseudo.trim()) return
    setSearching(true)
    setNotFound(false)
    setFoundUser(null)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/users/by-username/${guestPseudo.trim()}`
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      setFoundUser(data)
    } catch {
      setNotFound(true)
    } finally {
      setSearching(false)
    }
  }

  const handleInvite = () => {
    if (!foundUser) return
    sendInvitation(foundUser.id, EXERCISE_ID)
    setInviteSent(true)
  }

  return (
    <div className="lobby">
      <div className="lobby__box">
        <h1 className="lobby__title">🎮 Lobby</h1>
        <p className="lobby__welcome">
          Bonjour <strong>{userName}</strong> !
        </p>

        <div className={`lobby__status ${connected ? 'lobby__status--on' : ''}`}>
          {connected ? '● Connecté' : '○ Connexion...'}
        </div>

        <div className="lobby__section">
          <h2>Inviter un joueur</h2>
          <p className="lobby__hint">Tape le pseudo de ton ami</p>
          <div className="lobby__search-row">
            <input
              placeholder="Pseudo..."
              value={guestPseudo}
              onChange={(e) => {
                setGuestPseudo(e.target.value)
                setFoundUser(null)
                setNotFound(false)
                setInviteSent(false)
              }}
            />
            <button
              className="lobby__btn lobby__btn--search"
              onClick={searchUser}
              disabled={searching}
            >
              {searching ? '...' : '🔍'}
            </button>
          </div>

          {foundUser && (
            <div className="lobby__found">
              <span>✅ {foundUser.username} trouvé !</span>
              <button
                className="lobby__btn lobby__btn--blue"
                onClick={handleInvite}
                disabled={inviteSent}
              >
                {inviteSent ? '⏳ Envoyé...' : '📨 Inviter'}
              </button>
            </div>
          )}

          {notFound && <p className="lobby__not-found">❌ Pseudo introuvable</p>}
        </div>
        <div className="lobby__section lobby__section--id">
          <h2>Mon pseudo</h2>
          <p className="lobby__id">{userName}</p>
          <button
            className="lobby__btn lobby__btn--copy"
            onClick={() => navigator.clipboard.writeText(userName || '')}
          >
            📋 Copier
          </button>
        </div>

        {pendingInvitation && (
          <div className="lobby__invitation">
            <p>📨 Invitation reçue !</p>
            <div className="lobby__invitation-btns">
              <button className="lobby__btn lobby__btn--green" onClick={acceptInvitation}>
                ✅ Accepter
              </button>
              <button className="lobby__btn lobby__btn--red" onClick={declineInvitation}>
                ❌ Refuser
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
