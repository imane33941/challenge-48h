import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/gameStore'
import './GamePage.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const ROOM_PREFIX = 'duel-room-'

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

export default function GamePage() {
  const navigate = useNavigate()
  const { userName } = useGameStore()
  const pseudo = userName || 'joueur'

  const channelRef = useRef<any>(null)
  const isHostRef = useRef(false)
  const sideRef = useRef<string | null>(null)

  const [mySide, setMySide] = useState<string | null>(null)
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [activeRoomCode, setActiveRoomCode] = useState('-')
  const [status, setStatus] = useState('Crée un code ou rejoins un ami pour lancer le duel.')
  const [displayValue, setDisplayValue] = useState('')
  const [friendOnline, setFriendOnline] = useState(false)
  const [gameState, setGameState] = useState({
    version: 1,
    lifeLeft: 100,
    lifeRight: 100,
    question: generateQuestion(),
    players: { left: 'Canard', right: 'Lapin' },
  })

  const [leftAnim, setLeftAnim] = useState('')
  const [rightAnim, setRightAnim] = useState('')

  function triggerAnim(side: 'left' | 'right', type: 'hit' | 'attack') {
    const setter = side === 'left' ? setLeftAnim : setRightAnim
    setter(`character--${type}`)
    setTimeout(() => setter(''), 400)
  }

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
      if (side === 'left') {
        next.lifeRight -= 10
        triggerAnim('left', 'attack')
        triggerAnim('right', 'hit')
      } else {
        next.lifeLeft -= 10
        triggerAnim('right', 'attack')
        triggerAnim('left', 'hit')
      }
    } else {
      if (side === 'left') {
        next.lifeLeft -= 10
        triggerAnim('left', 'hit')
      } else {
        next.lifeRight -= 10
        triggerAnim('right', 'hit')
      }
    }

    if (next.lifeLeft <= 0 || next.lifeRight <= 0) {
      const winner = next.lifeLeft <= 0 ? '🐰 Lapin' : '🦆 Canard'
      setStatus(`Fin de manche : ${winner} gagne !`)
      next.lifeLeft = 100
      next.lifeRight = 100
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
    const left = entries.find((e) => e.side === 'left')
    const right = entries.find((e) => e.side === 'right')
    const friend = sideRef.current === 'left' ? !!right : !!left
    setFriendOnline(friend)

    setGameState((current) => ({
      ...current,
      players: {
        left: left?.pseudo || current.players.left || 'Canard',
        right: right?.pseudo || current.players.right || 'Lapin',
      },
    }))

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

    channel.subscribe(async (status: string) => {
      if (status !== 'SUBSCRIBED') return

      setActiveRoomCode(roomCode)
      await channel.track({ pseudo, side, joinedAt: Date.now() })

      if (hostMode) {
        const hostState = {
          version: 1,
          lifeLeft: 100,
          lifeRight: 100,
          question: generateQuestion(),
          players: { left: pseudo, right: 'Lapin' },
        }
        setGameState(hostState)
        setStatus(`Salle ${roomCode} créée. Partage ce code à ton ami.`)
        await broadcastState(hostState)
      } else {
        setStatus(`Connecté à la salle ${roomCode}. Duel prêt !`)
      }
    })

    channelRef.current = channel
    isHostRef.current = hostMode
    sideRef.current = side
    setMySide(side)
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

  const roleTitle =
    mySide === 'left'
      ? 'Ton camp : 🦆 Canard'
      : mySide === 'right'
        ? 'Ton camp : 🐰 Lapin'
        : 'Ton côté'

  return (
    <div className="game-page">
      <header className="topbar game-topbar">
        <div className="brand">
          <button className="back-btn" onClick={() => navigate('/menu')}>
            ← Menu
          </button>
          <h1>Math Fight Duo</h1>
        </div>
        <div className="room-wrap">
          <p className="pseudo-label">👤 {pseudo}</p>
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
          <p className="room-code">
            Code: <strong>{activeRoomCode}</strong>
          </p>
        </div>
      </header>

      <p className="status">{status}</p>

      <main className="game-layout">
        <section className="player-panel">
          <h2>{roleTitle}</h2>
          <p className="hint">Tape la réponse puis GO.</p>
          <div className="question">{gameState.question.text} = ?</div>
          <input className="display-input" value={displayValue} readOnly />
          <div className="calculator">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => (
              <button key={v} onClick={() => setDisplayValue((d) => `${d}${v}`)}>
                {v}
              </button>
            ))}
            <button className="btn-clear" onClick={() => setDisplayValue('')}>
              C
            </button>
            <button onClick={() => setDisplayValue((d) => `${d}0`)}>0</button>
            <button className="btn-go" onClick={submitAnswer}>
              GO
            </button>
          </div>
        </section>

        <section className="duel-panel">
          <h2 className="duel-title">🦆 VS 🐰</h2>
          <div className="battle">
            <div className="fighter">
              <div className={`character ${leftAnim}`}>🦆</div>
              <p className="name">{gameState.players.left}</p>
              <div className="life">{Math.max(0, gameState.lifeLeft)} ❤️</div>
            </div>
            <div className="vs">⚔️</div>
            <div className="fighter">
              <div className={`character ${rightAnim}`}>🐰</div>{' '}
              <p className="name">{gameState.players.right}</p>
              <div className="life">{Math.max(0, gameState.lifeRight)} ❤️</div>
            </div>
          </div>
          <p className="rule">Bonne réponse = attaque. Mauvaise réponse = dégâts sur ton camp.</p>
        </section>
      </main>
    </div>
  )
}
