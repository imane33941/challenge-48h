import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/gameStore'
import './PlayerPage.css'

const TEST_USERS = {
  test1: { id: '02708d80-5d53-4e09-9a1c-2f58b08da8d7', name: 'Test 1' },
  test2: { id: '68858b73-53ca-4e63-8f55-b22ac4a6adbe', name: 'Test 2' },
}

const EXERCISE_ID = 'b8d81a89-0699-462b-bf5f-7981d1645414'

export default function PlayerPage() {
  const navigate = useNavigate()
  const {
    userId,
    userName,
    connected,
    pendingInvitation,
    session,
    setUser,
    connectSocket,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
  } = useGameStore()

  useEffect(() => {
    console.log('session changed:', session)
    if (session) navigate('/game')
  }, [session])

  const login = (user: { id: string; name: string }) => {
    setUser(user.id, user.name)
    connectSocket()
  }

  const guestId = userId === TEST_USERS.test1.id ? TEST_USERS.test2.id : TEST_USERS.test1.id

  return (
    <div className="pt">
      <div className="pt__header">
        <h1>🎮 Test Joueur</h1>
        <span className={`pt__dot ${connected ? 'pt__dot--on' : ''}`}>
          {connected ? `● ${userName}` : '○ Non connecté'}
        </span>
      </div>

      {!userId ? (
        <div className="pt__section">
          <h2>Choisir un joueur</h2>
          <button className="pt__btn--blue" onClick={() => login(TEST_USERS.test1)}>
            Jouer en tant que Test 1
          </button>
          <button className="pt__btn--green" onClick={() => login(TEST_USERS.test2)}>
            Jouer en tant que Test 2
          </button>
        </div>
      ) : (
        connected && (
          <>
            <div className="pt__section">
              <h2>Envoyer une invitation</h2>
              <button
                className="pt__btn--blue"
                onClick={() => sendInvitation(guestId, EXERCISE_ID)}
              >
                📨 Inviter l'autre joueur
              </button>
            </div>

            {pendingInvitation && (
              <div className="pt__section">
                <h2>📨 Invitation reçue !</h2>
                <div className="pt__row">
                  <button className="pt__btn--green" onClick={acceptInvitation}>
                    ✅ Accepter
                  </button>
                  <button className="pt__btn--red" onClick={declineInvitation}>
                    ❌ Refuser
                  </button>
                </div>
              </div>
            )}
          </>
        )
      )}
    </div>
  )
}
