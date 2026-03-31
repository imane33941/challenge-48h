import { useGameStore } from '@/store/gameStore'
import canardImg from '@/assets/canard-boxeur.png'
import lapinImg from '@/assets/lapin-boxeur.png'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './DuelPage.css'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(6)
  window.crypto.getRandomValues(bytes)
  let code = ''
  for (let i = 0; i < bytes.length; i += 1) {
    code += chars[bytes[i] % chars.length]
  }
  return code
}

export default function DuelPage() {
  const navigate = useNavigate()
  const {
    userId,
    userName,
    session,
    socket,
    connected,
    connectSocket,
    question,
    myLife,
    oppLife,
    feedback,
    gameOver,
    myInput,
    pressKey,
    submitAnswer,
    resetGame,
  } = useGameStore()

  const [joinCode, setJoinCode] = useState('')
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [roomCode, setRoomCode] = useState('')

  useEffect(() => {
    if (!connected) connectSocket()
  }, [connected, connectSocket])

  useEffect(() => {
    if (!socket) return

    const onRoomCreated = ({ code }: { code: string }) => {
      setRoomCode(code)
    }

    const onDuelStarted = (data: {
      roomId: string
      hostId: string
      hostName: string
      guestId: string
      guestName: string
    }) => {
      const isHost = userId === data.hostId
      const opponentId = isHost ? data.guestId : data.hostId
      const opponentName = isHost ? data.guestName : data.hostName

      useGameStore.setState({
        session: {
          roomId: data.roomId,
          opponentId,
          opponentName,
        },
        myLife: 100,
        oppLife: 100,
        question: { text: '0 × 0', answer: 0 },
        gameOver: null,
        feedback: null,
        myInput: '',
      })
    }

    const onJoinError = ({ message }: { message: string }) => {
      setJoinError(message || 'Impossible de rejoindre la partie')
    }

    socket.on('duel_room_created', onRoomCreated)
    socket.on('duel_started', onDuelStarted)
    socket.on('duel_join_error', onJoinError)

    return () => {
      socket.off('duel_room_created', onRoomCreated)
      socket.off('duel_started', onDuelStarted)
      socket.off('duel_join_error', onJoinError)
    }
  }, [socket, userId])

  const handleGenerateCode = () => {
    if (!socket || !userId) return

    const newCode = generateCode()
    setRoomCode(newCode)
    useGameStore.setState({
      session: {
        roomId: `duel-room-${newCode}`,
        opponentId: 'waiting',
        opponentName: 'En attente...',
      },
      myLife: 100,
      oppLife: 100,
      question: { text: '0 × 0', answer: 0 },
      gameOver: null,
      feedback: null,
      myInput: '',
    })

    socket.emit('duel_create_room', {
      code: newCode,
      hostId: userId,
      hostName: userName || 'Joueur',
    })
  }

  const handleJoinCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) {
      setJoinError('Veuillez entrer un code')
      return
    }
    if (joinCode.length !== 6) {
      setJoinError('Le code doit contenir 6 caractères')
      return
    }
    if (!socket || !userId) {
      setJoinError('Connexion socket indisponible')
      return
    }

    socket.emit('duel_join_room', {
      code: joinCode,
      guestId: userId,
      guestName: userName || 'Joueur',
    })

    setJoinModalOpen(false)
  }

  const handleReplay = () => {
    resetGame()
    if (socket && session?.roomId) {
      socket.emit('duel_rematch', { roomId: session.roomId })
    }
  }

  if (!session) {
    return (
      <div className="shell">
        <header className="topbar">
          <div className="title-wrap">
            <button className="back-btn" type="button" onClick={() => navigate('/menu')}>
              ← Menu
            </button>
            <h1>Math Fight Duo</h1>
          </div>
          <div className="room-wrap">
            <p className="pseudo">{userName || 'Joueur'}</p>
            <button type="button" className="small-btn" onClick={handleGenerateCode}>
              Générer code
            </button>
            <button
              type="button"
              className="small-btn"
              onClick={() => {
                if (roomCode) {
                  navigator.clipboard.writeText(roomCode)
                }
              }}
            >
              Copier code
            </button>
            <button type="button" className="small-btn" onClick={() => setJoinModalOpen(true)}>
              Rejoindre
            </button>
            <p className="room-code">
              Code: <span>{roomCode || '-'}</span>
            </p>
            <p className="friend-status">Ami: hors ligne</p>
          </div>
        </header>

        <p className="status">
          {roomCode
            ? "Attente d'un ami... Partage le code!"
            : 'Crée un code ou rejoins un ami pour lancer le duel.'}
        </p>

        {joinModalOpen && (
          <div className="join-modal" role="dialog" aria-modal="true">
            <div className="join-modal-card">
              <h2>Rejoindre une partie</h2>
              <p className="join-subtitle">Entre le code reçu de ton ami.</p>
              <form onSubmit={handleJoinCode} className="join-code-form">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Code (Ex: A2F9KD)"
                  autoComplete="off"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase())
                    setJoinError('')
                  }}
                />
                {joinError && <p className="join-error">{joinError}</p>}
                <div className="join-actions">
                  <button
                    type="button"
                    className="small-btn muted"
                    onClick={() => setJoinModalOpen(false)}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="small-btn">
                    Rejoindre
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (gameOver) {
    const hasWon = gameOver === (userName || 'Moi')
    return (
      <div className="shell">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <button className="back-btn" type="button" onClick={() => navigate('/menu')}>
            ← Menu
          </button>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>{hasWon ? '🏆' : '💔'}</div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '20px 0' }}>
            {hasWon ? 'YOU WIN' : 'GAME OVER'}
          </p>
          <p style={{ fontSize: '20px', margin: '20px 0' }}>{myLife} ❤️ restants</p>
          <button className="small-btn" type="button" onClick={handleReplay}>
            🔄 Rejouer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="title-wrap">
          <button className="back-btn" type="button" onClick={() => navigate('/menu')}>
            ← Menu
          </button>
          <h1>Math Fight Duo</h1>
        </div>
        <div className="room-wrap">
          <p className="pseudo">{userName || 'Joueur'}</p>
          <button type="button" className="small-btn muted">
            Quitter
          </button>
          <p className="room-code">
            Code: <span>{roomCode || '-'}</span>
          </p>
          <p className="friend-status">Ami: connecté</p>
        </div>
      </header>

      <main className="game">
        <section className="player-panel">
          <h2 id="myRoleTitle">Ton côté</h2>
          <p className="hint">Tape la réponse puis GO.</p>
          <div className="question">{question.text} = ?</div>
          <input type="text" id="displaySelf" value={myInput || ''} readOnly />
          <div className="calculator">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
              <button key={k} onClick={() => pressKey(k)}>
                {k}
              </button>
            ))}
            <button onClick={() => pressKey('C')}>C</button>
            <button onClick={() => pressKey('0')}>0</button>
            <button onClick={submitAnswer}>GO</button>
          </div>
        </section>

        <section className="duel-panel">
          <h2 className="duel-title">
            <img src={canardImg} alt="Canard" className="title-avatar" />
            <span className="title-separator">VS</span>
            <img src={lapinImg} alt="Lapin" className="title-avatar" />
          </h2>

          <div className="battle">
            <div className="fighter">
              <div className="character duck-character">
                <img src={canardImg} alt="Canard boxeur" className="duck-avatar" />
              </div>
              <p className="name">{userName || 'Canard'}</p>
              <div className="life">{Math.max(0, myLife)} ❤️</div>
            </div>

            <div className="vs">⚔️</div>

            <div className="fighter">
              <div className="character rabbit-character">
                <img src={lapinImg} alt="Lapin boxeur" className="rabbit-avatar" />
              </div>
              <p className="name">{session.opponentName || 'Lapin'}</p>
              <div className="life">{Math.max(0, oppLife)} ❤️</div>
            </div>
          </div>

          <p className="rule">Bonne réponse = attaque. Mauvaise réponse = dégâts sur ton camp.</p>
        </section>
      </main>
    </div>
  )
}
