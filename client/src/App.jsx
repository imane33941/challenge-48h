import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

const SUPABASE_URL = 'https://jsiwbxlvrmpwovfcntau.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzaXdieGx2cm1wd292ZmNudGF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjkzNTMsImV4cCI6MjA5MDQwNTM1M30.ly1hiDO25kaSd5S8sIpZ-fC-n3mM_v9bCHPXqOUeuU8'
const ROOM_PREFIX = 'duel-room-'

const hasSupabaseConfig =
  !SUPABASE_URL.includes('YOUR_PROJECT_ID') && SUPABASE_ANON_KEY !== 'YOUR_ANON_KEY'

const supabase = hasSupabaseConfig
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

function normalizePseudo(pseudo) {
  return pseudo.trim().toLowerCase().replace(/\s+/g, '-')
}

function getReadableAuthError(error) {
  const rawMessage = (error?.message || '').toLowerCase()

  if (rawMessage.includes('email rate limit exceeded')) {
    return "Trop de demandes d'email d'inscription en peu de temps. Attends quelques minutes puis réessaie."
  }

  if (rawMessage.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect.'
  }

  if (rawMessage.includes('email address') && rawMessage.includes('invalid')) {
    return 'Adresse email invalide. Vérifie le format puis réessaie.'
  }

  return error?.message || 'Une erreur est survenue.'
}

function getStoredUser() {
  const raw = localStorage.getItem('currentUser')
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveStoredUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user))
}

function clearStoredUser() {
  localStorage.removeItem('currentUser')
}

function getHashRoute() {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'menu' || hash === 'game') {
    return hash
  }
  return 'login'
}

function setHashRoute(route) {
  window.location.hash = route
}

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

function normalizeCode(code) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}

function LoginView({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState('')

  const modeTitle = isLogin ? 'Connexion' : 'Inscription'

  async function fetchUserProfile() {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session) {
      throw new Error('Impossible de récupérer la session.')
    }

    const user = data.session.user
    return {
      id: user.id,
      pseudo: user.user_metadata?.pseudo || '',
      signupEmail: user.user_metadata?.signupEmail || '',
      nom: user.user_metadata?.nom || '',
      prenom: user.user_metadata?.prenom || '',
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!supabase) {
      setStatus("Supabase n'est pas configuré.")
      setStatusType('error')
      return
    }

    if (!identifier.trim() || !password.trim()) {
      setStatus('Champ principal et mot de passe sont obligatoires.')
      setStatusType('error')
      return
    }

    setStatus('Chargement...')
    setStatusType('')

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier.trim(),
          password,
        })

        if (error) {
          throw error
        }

        const profile = await fetchUserProfile()
        const user = {
          id: data.user.id,
          pseudo: profile.pseudo || '',
          profile,
        }
        saveStoredUser(user)
        setStatus('Connexion réussie. Redirection...')
        setStatusType('success')
        onAuthSuccess(user)
        return
      }

      const normalizedPseudo = normalizePseudo(identifier)
      if (!/^[a-z0-9._-]{3,30}$/.test(normalizedPseudo)) {
        throw new Error('Pseudo invalide. Utilise 3-30 caracteres: lettres, chiffres, ., _, -')
      }

      if (!signupEmail.trim() || !nom.trim() || !prenom.trim()) {
        throw new Error("Email, nom et prénom sont obligatoires pour l'inscription.")
      }

      const { error } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password,
        options: {
          data: {
            pseudo: normalizedPseudo,
            signupEmail: signupEmail.trim(),
            nom: nom.trim(),
            prenom: prenom.trim(),
          },
        },
      })

      if (error) {
        throw error
      }

      setStatus('Inscription envoyée. Vérifie ton email pour confirmer le compte.')
      setStatusType('success')
    } catch (error) {
      setStatus(getReadableAuthError(error))
      setStatusType('error')
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>{modeTitle}</h1>

        <input
          type={isLogin ? 'email' : 'text'}
          placeholder={isLogin ? 'Email' : 'Pseudo'}
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {!isLogin && (
          <>
            <input
              type="email"
              placeholder="Email"
              value={signupEmail}
              onChange={(event) => setSignupEmail(event.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Nom"
              value={nom}
              onChange={(event) => setNom(event.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Prénom"
              value={prenom}
              onChange={(event) => setPrenom(event.target.value)}
              required
            />
          </>
        )}

        <button className="main-btn" type="submit">Valider</button>
        <p className={`status ${statusType}`}>{status}</p>

        <p className="switch-text">
          <span>{isLogin ? 'Pas de compte ?' : 'Déjà un compte ?'}</span>
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setIsLogin((current) => !current)
              setStatus('')
              setStatusType('')
            }}
          >
            {isLogin ? "S'inscrire" : 'Se connecter'}
          </button>
        </p>
      </form>
    </div>
  )
}

function MenuView({ user, onOpenGame, onUserUpdate, onLogout }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState('')
  const [form, setForm] = useState(() => ({
    pseudo: user?.profile?.pseudo || user?.pseudo || 'joueur',
    signupEmail: user?.profile?.signupEmail || '',
    nom: user?.profile?.nom || '',
    prenom: user?.profile?.prenom || '',
  }))

  useEffect(() => {
    setForm({
      pseudo: user?.profile?.pseudo || user?.pseudo || 'joueur',
      signupEmail: user?.profile?.signupEmail || '',
      nom: user?.profile?.nom || '',
      prenom: user?.profile?.prenom || '',
    })
  }, [user])

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSave(event) {
    event.preventDefault()
    const pseudo = normalizePseudo(form.pseudo)

    if (!/^[a-z0-9._-]{3,30}$/.test(pseudo)) {
      setStatus('Pseudo invalide: 3-30 caractères avec lettres/chiffres/._-')
      setStatusType('error')
      return
    }

    if (!form.signupEmail.trim() || !form.nom.trim() || !form.prenom.trim()) {
      setStatus('Tous les champs sont obligatoires.')
      setStatusType('error')
      return
    }

    const nextUser = {
      ...user,
      pseudo,
      profile: {
        ...(user.profile || {}),
        pseudo,
        signupEmail: form.signupEmail.trim(),
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
      },
    }

    onUserUpdate(nextUser)
    setStatus('Compte mis à jour avec succès.')
    setStatusType('success')
  }

  return (
    <div className="menu-page">
      <header className="topbar">
        <div className="brand">
          <p className="kicker">Challenge 48h</p>
          <h1>Menu des mini-jeux</h1>
        </div>

        <div className="account-area">
          <p className="pseudo-label">{form.pseudo}</p>
          <button className="gear-btn" onClick={() => setSettingsOpen(true)}>
            ⚙
          </button>
        </div>
      </header>

      <section className="cards">
        <article className="card">
          <h2>Duel Multiplication</h2>
          <p>Le mini-jeu principal en multijoueur avec code ami.</p>
          <button className="play-btn" onClick={onOpenGame}>Jouer</button>
        </article>

        <article className="card">
          <h2>Quiz Culture G</h2>
          <p>Mini-jeu réservé aux collègues (intégration à venir).</p>
          <span className="play-btn disabled">Bientôt disponible</span>
        </article>

        <article className="card">
          <h2>Calcul Express</h2>
          <p>Mini-jeu réservé aux collègues (intégration à venir).</p>
          <span className="play-btn disabled">Bientôt disponible</span>
        </article>
      </section>

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
            <input value={form.pseudo} onChange={(e) => updateField('pseudo', e.target.value)} />

            <label>Email de contact</label>
            <input
              type="email"
              value={form.signupEmail}
              onChange={(e) => updateField('signupEmail', e.target.value)}
            />

            <label>Nom</label>
            <input value={form.nom} onChange={(e) => updateField('nom', e.target.value)} />

            <label>Prénom</label>
            <input value={form.prenom} onChange={(e) => updateField('prenom', e.target.value)} />

            <div className="actions">
              <button className="save-btn" type="submit">Enregistrer</button>
              <button
                className="logout-btn"
                type="button"
                onClick={() => {
                  onLogout()
                  setSettingsOpen(false)
                }}
              >
                Déconnexion
              </button>
            </div>

            <p className={`status ${statusType}`}>{status}</p>
          </form>
        </aside>
      )}
    </div>
  )
}

function GameView({ user, onBackMenu }) {
  const pseudo = useMemo(() => user?.profile?.pseudo || user?.pseudo || 'joueur', [user])
  const channelRef = useRef(null)
  const isHostRef = useRef(false)
  const sideRef = useRef(null)

  const [mySide, setMySide] = useState(null)
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [activeRoomCode, setActiveRoomCode] = useState('-')
  const [status, setStatus] = useState('Crée un code ou rejoins un ami pour lancer le duel.')
  const [displayValue, setDisplayValue] = useState('')
  const [gameState, setGameState] = useState({
    version: 1,
    lifeLeft: 100,
    lifeRight: 100,
    question: generateQuestion(),
    players: {
      left: 'Canard',
      right: 'Lapin',
    },
  })

  useEffect(() => {
    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  function updateState(mutator) {
    setGameState((current) => {
      const next = mutator(current)
      return next
    })
  }

  async function broadcastState(nextState) {
    const channel = channelRef.current
    if (!channel) {
      return
    }

    await channel.send({
      type: 'broadcast',
      event: 'state',
      payload: { gameState: nextState },
    })
  }

  function applyAnswerToState(state, side, answer) {
    const value = Number.parseInt(answer, 10)
    if (Number.isNaN(value)) {
      return state
    }

    const next = {
      ...state,
      lifeLeft: state.lifeLeft,
      lifeRight: state.lifeRight,
      players: { ...state.players },
    }

    if (value === state.question.answer) {
      if (side === 'left') {
        next.lifeRight -= 10
      } else {
        next.lifeLeft -= 10
      }
    } else if (side === 'left') {
      next.lifeLeft -= 10
    } else {
      next.lifeRight -= 10
    }

    if (next.lifeLeft <= 0 || next.lifeRight <= 0) {
      const winner = next.lifeLeft <= 0 ? '🐰 Lapin' : '🦆 Canard'
      setStatus(`Fin de manche: ${winner} gagne.`)
      next.lifeLeft = 100
      next.lifeRight = 100
    }

    next.question = generateQuestion()
    next.version = (state.version || 0) + 1
    return next
  }

  async function leaveRoom() {
    if (channelRef.current && supabase) {
      await supabase.removeChannel(channelRef.current)
    }

    channelRef.current = null
    isHostRef.current = false
    sideRef.current = null
    setMySide(null)
    setActiveRoomCode('-')
    setStatus('Tu as quitté la salle.')
  }

  async function syncPresence(channel) {
    const presence = channel.presenceState()
    const entries = Object.values(presence).flat()
    const left = entries.find((entry) => entry.side === 'left')
    const right = entries.find((entry) => entry.side === 'right')

    setGameState((current) => {
      const next = {
        ...current,
        players: {
          left: left?.pseudo || current.players.left || 'Canard',
          right: right?.pseudo || current.players.right || 'Lapin',
        },
      }

      if (
        next.players.left !== current.players.left ||
        next.players.right !== current.players.right
      ) {
        next.version = (current.version || 0) + 1
      }

      return next
    })

    if (entries.length > 2) {
      setStatus('Salle pleine (2 joueurs max). Choisis un autre code.')
      await leaveRoom()
    }
  }

  async function joinRoom(code, side, hostMode) {
    if (!supabase) {
      setStatus('Supabase indisponible. Impossible de jouer en ligne.')
      return
    }

    if (channelRef.current) {
      await leaveRoom()
    }

    const roomCode = normalizeCode(code)
    const channel = supabase.channel(`${ROOM_PREFIX}${roomCode}`, {
      config: {
        presence: { key: `${pseudo}-${Math.random().toString(36).slice(2, 8)}` },
        broadcast: { self: true },
      },
    })

    channel
      .on('broadcast', { event: 'state' }, ({ payload }) => {
        if (!payload?.gameState) {
          return
        }

        setGameState((current) => {
          const incomingVersion = payload.gameState.version || 0
          const localVersion = current.version || 0
          if (incomingVersion < localVersion) {
            return current
          }

          return {
            ...payload.gameState,
            players: {
              left: payload.gameState?.players?.left || current.players.left || 'Canard',
              right: payload.gameState?.players?.right || current.players.right || 'Lapin',
            },
          }
        })
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (!isHostRef.current || !payload?.side) {
          return
        }

        setGameState((current) => {
          if (payload.questionId && payload.questionId !== current.question.id) {
            broadcastState(current)
            return current
          }

          const next = applyAnswerToState(current, payload.side, payload.answer)
          broadcastState(next)
          return next
        })
      })
      .on('presence', { event: 'sync' }, async () => {
        await syncPresence(channel)
      })

    channel.subscribe(async (channelStatus) => {
      if (channelStatus !== 'SUBSCRIBED') {
        return
      }

      setActiveRoomCode(roomCode)
      setStatus(`Connecté à la salle ${roomCode}. Invite ton ami avec ce code.`)

      await channel.track({
        pseudo,
        side,
        joinedAt: Date.now(),
      })

      if (hostMode) {
        const hostState = {
          version: 1,
          lifeLeft: 100,
          lifeRight: 100,
          question: generateQuestion(),
          players: {
            left: pseudo,
            right: 'Lapin',
          },
        }

        setGameState(hostState)
        await broadcastState(hostState)
      }
    })

    channelRef.current = channel
    isHostRef.current = hostMode
    sideRef.current = side
    setMySide(side)

    setGameState((current) => ({
      ...current,
      players: {
        ...current.players,
        [side]: pseudo,
      },
    }))
  }

  async function submitAnswer() {
    const answer = displayValue.trim()
    const side = sideRef.current
    const channel = channelRef.current

    if (!answer) {
      return
    }

    if (!side || !channel) {
      setStatus("Crée ou rejoins une salle d'abord.")
      return
    }

    setDisplayValue('')

    if (isHostRef.current) {
      setGameState((current) => {
        const next = applyAnswerToState(current, side, answer)
        broadcastState(next)
        return next
      })
      return
    }

    await channel.send({
      type: 'broadcast',
      event: 'answer',
      payload: {
        side,
        answer,
        questionId: gameState.question.id,
      },
    })
  }

  const roleTitle = mySide === 'left'
    ? 'Ton camp: Canard'
    : mySide === 'right'
      ? 'Ton camp: Lapin'
      : 'Ton côté'

  return (
    <div className="game-page">
      <header className="topbar game-topbar">
        <div className="brand">
          <button className="back-btn" onClick={onBackMenu}>← Menu</button>
          <h1>Math Fight Duo</h1>
        </div>

        <div className="room-wrap">
          <p className="pseudo-label">Pseudo: {pseudo}</p>
          <button className="small-btn" onClick={() => {
            const code = createCode()
            setRoomCodeInput(code)
            joinRoom(code, 'left', true)
          }}>
            Créer code
          </button>
          <input
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(normalizeCode(e.target.value))}
            placeholder="Code"
          />
          <button className="small-btn" onClick={() => joinRoom(roomCodeInput, 'right', false)}>
            Rejoindre
          </button>
          <button className="small-btn muted" onClick={leaveRoom}>Quitter</button>
          <p className="room-code">Code: {activeRoomCode}</p>
        </div>
      </header>

      <p className="status">{status}</p>

      <main className="game-layout">
        <section className="player-panel">
          <h2>{roleTitle}</h2>
          <p className="hint">Tape la réponse puis GO.</p>
          <div className="question">{gameState.question.text} = ?</div>
          <input value={displayValue} readOnly />

          <div className="calculator">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => (
              <button key={value} onClick={() => setDisplayValue((current) => `${current}${value}`)}>
                {value}
              </button>
            ))}
            <button onClick={() => setDisplayValue('')}>C</button>
            <button onClick={() => setDisplayValue((current) => `${current}0`)}>0</button>
            <button onClick={submitAnswer}>GO</button>
          </div>
        </section>

        <section className="duel-panel">
          <h2 className="duel-title">
            <img src="/assets/canard-boxeur.png" alt="Canard" className="title-avatar" />
            <span>VS</span>
            <img src="/assets/lapin-boxeur.png" alt="Lapin" className="title-avatar" />
          </h2>

          <div className="battle">
            <div className="fighter">
              <img src="/assets/canard-boxeur.png" alt="Canard" className="fighter-avatar" />
              <p className="name">{gameState.players.left || 'Canard'}</p>
              <div className="life">{Math.max(0, gameState.lifeLeft)} ❤️</div>
            </div>

            <div className="vs">⚔</div>

            <div className="fighter">
              <img src="/assets/lapin-boxeur.png" alt="Lapin" className="fighter-avatar" />
              <p className="name">{gameState.players.right || 'Lapin'}</p>
              <div className="life">{Math.max(0, gameState.lifeRight)} ❤️</div>
            </div>
          </div>

          <p className="rule">Bonne réponse = attaque. Mauvaise réponse = dégâts sur ton camp.</p>
        </section>
      </main>
    </div>
  )
}

function App() {
  const [route, setRoute] = useState(getHashRoute())
  const [user, setUser] = useState(getStoredUser())

  useEffect(() => {
    function onHashChange() {
      setRoute(getHashRoute())
    }

    window.addEventListener('hashchange', onHashChange)
    if (!window.location.hash) {
      setHashRoute(user ? 'menu' : 'login')
    }

    return () => {
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [user])

  useEffect(() => {
    if ((route === 'menu' || route === 'game') && !user) {
      setHashRoute('login')
    }
  }, [route, user])

  function handleAuthSuccess(nextUser) {
    setUser(nextUser)
    setHashRoute('menu')
  }

  function handleUserUpdate(nextUser) {
    setUser(nextUser)
    saveStoredUser(nextUser)
  }

  function handleLogout() {
    clearStoredUser()
    setUser(null)
    setHashRoute('login')
  }

  if (route === 'menu' && user) {
    return (
      <MenuView
        user={user}
        onOpenGame={() => setHashRoute('game')}
        onUserUpdate={handleUserUpdate}
        onLogout={handleLogout}
      />
    )
  }

  if (route === 'game' && user) {
    return <GameView user={user} onBackMenu={() => setHashRoute('menu')} />
  }

  return <LoginView onAuthSuccess={handleAuthSuccess} />
}

export default App
