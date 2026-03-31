import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/gameStore'
import './GameExpress.css'
import { useInvite } from '@/hooks/useInvite'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const ROOM_PREFIX = 'express-room-'
const MAX_SCORE = 7
const POLE_HEIGHT = 300

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function generateQuestion() {
  const a = Math.floor(Math.random() * 10)
  const b = Math.floor(Math.random() * 10)
  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    text: `${a} × ${b}`,
    answer: a * b,
  }
}

function createCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function normalizeCode(code: string) {
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
}

export default function GameExpress() {
  const navigate = useNavigate()
  const { userName } = useGameStore()
  const pseudo = userName || 'joueur'

  const { invitation, inviteSent, sendInvite, acceptInvite, declineInvite } = useInvite(
    pseudo,
    (roomCode) => joinRoom(roomCode, 'right', false)
  )

  const [invitePseudo, setInvitePseudo] = useState('')
  const channelRef = useRef<any>(null)
  const isHostRef = useRef(false)
  const sideRef = useRef<string | null>(null)

  const [winner, setWinner] = useState<string | null>(null)
  const [mySide, setMySide] = useState<string | null>(null)
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [activeRoomCode, setActiveRoomCode] = useState('-')
  const [status, setStatus] = useState('Crée un code ou rejoins un ami pour lancer le duel.')
  const [displayValue, setDisplayValue] = useState('')
  const [friendOnline, setFriendOnline] = useState(false)
  const [myDisplayName, setMyDisplayName] = useState(pseudo)
  const [oppDisplayName, setOppDisplayName] = useState('...')
  const [gameState, setGameState] = useState({
    version: 1,
    scoreLeft: 0,
    scoreRight: 0,
    question: generateQuestion(),
    players: { left: 'Joueur 1', right: 'Joueur 2' },
  })

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  async function broadcastState(nextState: typeof gameState) {
    if (!channelRef.current) return
    await channelRef.current.send({
      type: 'broadcast',
      event: 'state',
      payload: { gameState: nextState },
    })
  }

  function applyAnswer(state: typeof gameState, side: string, answer: string) {
    const value = parseInt(answer, 10)
    if (isNaN(value)) return state

    const next = { ...state, players: { ...state.players } }

    if (value === state.question.answer) {
      if (side === 'left') next.scoreLeft += 1
      else next.scoreRight += 1
    }

    if (next.scoreLeft >= MAX_SCORE || next.scoreRight >= MAX_SCORE) {
      const winner = next.scoreLeft >= MAX_SCORE ? next.players.left : next.players.right
      const w = next.scoreLeft >= MAX_SCORE ? next.players.left : next.players.right
      setWinner(w)
      // setStatus(`🏆 ${winner} a gagné !`)
      next.scoreLeft = 0
      next.scoreRight = 0
    }

    next.question = generateQuestion()
    next.version = (state.version || 0) + 1
    return next
  }

  async function leaveRoom() {
    if (channelRef.current) await supabase.removeChannel(channelRef.current)
    channelRef.current = null
    isHostRef.current = false
    sideRef.current = null
    setMySide(null)
    setActiveRoomCode('-')
    setFriendOnline(false)
    setStatus('Tu as quitté la salle.')
  }

  async function syncPresence(channel: any) {
    const presence = channel.presenceState()
    const entries = Object.values(presence).flat() as any[]

    // Cherche par pseudo — indépendant du side
    const myEntry = entries.find((e: any) => e.pseudo === pseudo)
    const oppEntry = entries.find((e: any) => e.pseudo !== pseudo)

    setFriendOnline(!!oppEntry)
    setMyDisplayName(myEntry?.pseudo || pseudo)
    setOppDisplayName(oppEntry?.pseudo || '...')

    const left = entries.find((e: any) => e.side === 'left')
    const right = entries.find((e: any) => e.side === 'right')

    setGameState((current) => {
      const next = {
        ...current,
        players: {
          left: left?.pseudo || current.players.left,
          right: right?.pseudo || current.players.right,
        },
      }
      if (isHostRef.current) broadcastState(next)
      return next
    })

    if (entries.length > 2) {
      setStatus('Salle pleine (2 joueurs max).')
      await leaveRoom()
    }
  }

  async function joinRoom(code: string, side: string, hostMode: boolean) {
    if (channelRef.current) await leaveRoom()

    const roomCode = normalizeCode(code)
    const channel = supabase.channel(`${ROOM_PREFIX}${roomCode}`, {
      config: {
        presence: { key: `${pseudo}-${Math.random().toString(36).slice(2, 8)}` },
        broadcast: { self: true },
      },
    })

    channelRef.current = channel
    isHostRef.current = hostMode
    sideRef.current = side
    setMySide(side)

    channel
      .on('broadcast', { event: 'state' }, ({ payload }: any) => {
        if (!payload?.gameState) return
        setGameState((current) => {
          if ((payload.gameState.version || 0) < (current.version || 0)) return current
          return {
            ...payload.gameState,
            players: {
              left: payload.gameState?.players?.left || current.players.left,
              right: payload.gameState?.players?.right || current.players.right,
            },
          }
        })
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
        if (!isHostRef.current || !payload?.side) return
        setGameState((current) => {
          if (payload.questionId && payload.questionId !== current.question.id) {
            broadcastState(current)
            return current
          }
          const next = applyAnswer(current, payload.side, payload.answer)
          broadcastState(next)
          return next
        })
      })
      .on('presence', { event: 'sync' }, async () => {
        await syncPresence(channel)
      })

    channel.subscribe(async (s: string) => {
      if (s !== 'SUBSCRIBED') return
      setActiveRoomCode(roomCode)
      await channel.track({ pseudo, side, joinedAt: Date.now() })

      if (hostMode) {
        const hostState = {
          version: 1,
          scoreLeft: 0,
          scoreRight: 0,
          question: generateQuestion(),
          players: { left: pseudo, right: 'Joueur 2' },
        }
        setGameState(hostState)
        setStatus(`Salle ${roomCode} créée. Partage ce code à ton ami.`)
        await broadcastState(hostState)
      } else {
        setStatus(`Connecté à la salle ${roomCode}. Duel prêt !`)
      }
    })
  }

  async function submitAnswer() {
    const answer = displayValue.trim()
    const side = sideRef.current
    const channel = channelRef.current
    if (!answer || !side || !channel) {
      if (!side) setStatus("Crée ou rejoins une salle d'abord.")
      return
    }
    setDisplayValue('')

    if (isHostRef.current) {
      setGameState((current) => {
        const next = applyAnswer(current, side, answer)
        broadcastState(next)
        return next
      })
      return
    }

    await channel.send({
      type: 'broadcast',
      event: 'answer',
      payload: { side, answer, questionId: gameState.question.id },
    })
  }

  const myScore = mySide === 'left' ? gameState.scoreLeft : gameState.scoreRight
  const oppScore = mySide === 'left' ? gameState.scoreRight : gameState.scoreLeft
  const myBottom = (myScore / MAX_SCORE) * POLE_HEIGHT
  const oppBottom = (oppScore / MAX_SCORE) * POLE_HEIGHT

  if (winner)
    return (
      <div className="express-page">
        <div className="game-over-screen">
          <div className="game-over-screen__emoji">{winner === pseudo ? '🏆' : '💔'}</div>
          <h2 className="game-over-screen__title">
            {winner === pseudo ? `Bravo ${pseudo} !` : `${winner} a gagné !`}
          </h2>
          <p className="game-over-screen__sub">
            {winner === pseudo
              ? 'Tu as grimpé en premier !'
              : 'Meilleure chance la prochaine fois !'}
          </p>
          <div className="game-over-screen__stats">
            <div className="game-over-screen__stat">
              <span>🧒 Mon score</span>
              <strong>
                {myScore}/{MAX_SCORE}
              </strong>
            </div>
            <div className="game-over-screen__stat">
              <span>🆚 {oppDisplayName}</span>
              <strong>
                {oppScore}/{MAX_SCORE}
              </strong>
            </div>
          </div>
          <button
            className="game-over-screen__btn"
            onClick={() => {
              setWinner(null)
              setGameState((current) => ({
                ...current,
                scoreLeft: 0,
                scoreRight: 0,
                question: generateQuestion(),
                version: (current.version || 0) + 1,
              }))
              if (isHostRef.current) {
                const reset = {
                  version: (gameState.version || 0) + 1,
                  scoreLeft: 0,
                  scoreRight: 0,
                  question: generateQuestion(),
                  players: gameState.players,
                }
                broadcastState(reset)
              }
            }}
          >
            🔄 Rejouer
          </button>
          <button className="game-over-screen__back" onClick={() => navigate('/menu')}>
            ← Retour au menu
          </button>
        </div>
      </div>
    )

  return (
    <div className="express-page">
      <header className="express-topbar">
        <button className="back-btn" onClick={() => navigate('/menu')}>
          ← Menu
        </button>
        <h1>🧮 Calcul Express</h1>
        <div className="room-controls">
          <span className={`friend-status ${friendOnline ? 'online' : ''}`}>
            {friendOnline ? '● Ami connecté' : '○ Ami hors ligne'}
          </span>
          <button
            className="small-btn"
            onClick={() => {
              const code = createCode()
              setRoomCodeInput(code)
              joinRoom(code, 'left', true)
            }}
          >
            Créer code
          </button>
          <input
            className="code-input"
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(normalizeCode(e.target.value))}
            placeholder="Code ami"
            maxLength={6}
          />
          <button className="small-btn" onClick={() => joinRoom(roomCodeInput, 'right', false)}>
            Rejoindre
          </button>
          <button className="small-btn muted" onClick={leaveRoom}>
            Quitter
          </button>
          <span className="room-code">
            Code: <strong>{activeRoomCode}</strong>
          </span>
        </div>
      </header>

      {invitation && (
        <div className="invite-toast">
          <p>
            📨 <strong>{invitation.from}</strong> t'invite à jouer !
          </p>
          <div className="invite-toast__btns">
            <button className="invite-btn invite-btn--accept" onClick={acceptInvite}>
              ✅ Accepter
            </button>
            <button className="invite-btn invite-btn--decline" onClick={declineInvite}>
              ❌ Refuser
            </button>
          </div>
        </div>
      )}

      <div className="invite-bar">
        <input
          placeholder="Pseudo de l'ami..."
          value={invitePseudo}
          onChange={(e) => setInvitePseudo(e.target.value)}
          className="invite-input"
        />
        <button
          className="small-btn"
          disabled={inviteSent || !invitePseudo.trim()}
          onClick={() => {
            const code = createCode()
            joinRoom(code, 'left', true)
            sendInvite(invitePseudo.trim(), code, 'express')
            setRoomCodeInput(code)
          }}
        >
          {inviteSent ? '⏳ Envoyé...' : '📨 Inviter'}
        </button>
      </div>

      <p className="express-status">{status}</p>

      <main className="express-body">
        <div className="calc-panel">
          <div className="calc-panel__name">👤 {myDisplayName}</div>
          <div className="calc-panel__question calc-panel__question--left">
            {gameState.question.text} = ?
          </div>
          <div
            className={`calc-panel__display${!displayValue ? ' calc-panel__display--placeholder' : ''}`}
          >
            {displayValue || '—'}
          </div>
          <div className="calc-panel__keys">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => (
              <button
                key={k}
                className="calc-key"
                onClick={() => setDisplayValue((d) => `${d}${k}`)}
              >
                {k}
              </button>
            ))}
            <button className="calc-key calc-key--clear" onClick={() => setDisplayValue('')}>
              C
            </button>
            <button className="calc-key" onClick={() => setDisplayValue((d) => `${d}0`)}>
              0
            </button>
            <button className="calc-key calc-key--go" onClick={submitAnswer}>
              Go
            </button>
          </div>
          <div className="calc-panel__score">
            Score :{' '}
            <span>
              {myScore}/{MAX_SCORE}
            </span>
          </div>
        </div>

        <div className="express-center">
          <div className="poles">
            <div className="pole-wrapper">
              <div className="pole__top">
                <span>🚩</span>
                <span>🎁👕🎸</span>
              </div>
              <div className="pole__bar" style={{ height: POLE_HEIGHT }}>
                <div className="pole__character" style={{ bottom: myBottom }}>
                  🧒
                </div>
              </div>
              <div className="pole__name">{myDisplayName}</div>
            </div>

            <div className="pole-wrapper">
              <div className="pole__top">
                <span>🚩</span>
                <span>🎁👕🎸</span>
              </div>
              <div className="pole__bar" style={{ height: POLE_HEIGHT }}>
                <div className="pole__character" style={{ bottom: oppBottom }}>
                  🧒
                </div>
              </div>
              <div className="pole__name">{oppDisplayName}</div>
            </div>
          </div>
        </div>

        <div className="calc-panel calc-panel--opp">
          <div className="calc-panel__name">👤 {oppDisplayName}</div>
          <div className="calc-panel__question calc-panel__question--right">
            ⏳ {oppDisplayName} joue...
          </div>
          <div className="calc-panel__display calc-panel__display--placeholder">—</div>
          <div className="calc-panel__keys">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '·', 0, '·'].map((k, i) => (
              <button key={i} className="calc-key" disabled style={{ opacity: 0.4 }}>
                {k}
              </button>
            ))}
          </div>
          <div className="calc-panel__score">
            Score :{' '}
            <span>
              {oppScore}/{MAX_SCORE}
            </span>
          </div>
        </div>
      </main>

      <p className="express-footer">
        Grimpe le poteau en répondant juste ! ({MAX_SCORE} bonnes réponses pour gagner)
      </p>
    </div>
  )
}
