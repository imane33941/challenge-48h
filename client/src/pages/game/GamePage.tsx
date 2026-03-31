import { useGameStore } from '@/store/gameStore'

const MAX_SCORE = 7

export default function GamePage() {
  const {
    userName,
    session,
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

  if (!session)
    return (
      <div className="game-over">
        <p>Aucune session en cours.</p>
      </div>
    )

  if (gameOver)
    return (
      <div className="game-over">
        <div className="game-over__emoji">{gameOver === userName ? 'WIN' : 'LOSE'}</div>
        <p className="game-over__title">
          {gameOver === userName ? `Bravo ${userName} !` : `${gameOver} a gagne !`}
        </p>
        <p className="game-over__score">{myLife} HP restants</p>
        <button className="game-over__btn" onClick={resetGame}>
          Rejouer
        </button>
      </div>
    )

  const myScore = Math.round((100 - myLife) / 10)
  const oppScore = Math.round((100 - oppLife) / 10)

  const POLE_HEIGHT = 300
  const myBottom = (myScore / MAX_SCORE) * POLE_HEIGHT
  const oppBottom = (oppScore / MAX_SCORE) * POLE_HEIGHT

  const qClass = `calc-panel__question calc-panel__question--left${feedback === 'correct' ? ' correct' : feedback === 'wrong' ? ' wrong' : ''}`

  return (
    <div className="game">
      <div className="game__title">Calcul Mental - Duel</div>

      <div className="game__body">
        <div className="calc-panel">
          <div className={qClass}>{question.text} = ?</div>
          <div
            className={`calc-panel__display${!myInput ? ' calc-panel__display--placeholder' : ''}`}
          >
            {myInput || '--'}
          </div>
          <div className="calc-panel__keys">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
              <button key={k} className="calc-key" onClick={() => pressKey(k)}>
                {k}
              </button>
            ))}
            <button className="calc-key calc-key--clear" onClick={() => pressKey('C')}>
              C
            </button>
            <button className="calc-key" onClick={() => pressKey('0')}>
              0
            </button>
            <button className="calc-key calc-key--go" onClick={submitAnswer}>
              Go
            </button>
          </div>
          <div className="calc-panel__score">
            Bonnes reponses:{' '}
            <span>
              {myScore}/{MAX_SCORE}
            </span>
          </div>
        </div>

        <div className="game__center">
          <div style={{ display: 'flex', gap: '4rem', alignItems: 'flex-end' }}>
            <div className="pole-wrapper">
              <div className="pole__top">
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>FIN</div>
                <div style={{ fontSize: '1rem' }}>PRIX</div>
              </div>
              <div className="pole__bar" style={{ height: POLE_HEIGHT, position: 'relative' }}>
                <div className="pole__character" style={{ bottom: myBottom }}>
                  P
                </div>
              </div>
              <div className="pole__ground">SOL</div>
            </div>

            <div className="pole-wrapper">
              <div className="pole__top">
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>FIN</div>
                <div style={{ fontSize: '1rem' }}>PRIX</div>
              </div>
              <div className="pole__bar" style={{ height: POLE_HEIGHT, position: 'relative' }}>
                <div className="pole__character" style={{ bottom: oppBottom }}>
                  P
                </div>
              </div>
              <div className="pole__ground">SOL</div>
            </div>
          </div>
        </div>

        <div className="calc-panel calc-panel--opp">
          <div className="calc-panel__question calc-panel__question--right">
            {session.opponentName} joue...
          </div>
          <div className="calc-panel__display calc-panel__display--placeholder">--</div>
          <div className="calc-panel__keys">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '.'].map((k, i) => (
              <button key={i} className="calc-key" disabled style={{ opacity: 0.4 }}>
                {k}
              </button>
            ))}
          </div>
          <div className="calc-panel__score">
            Bonnes reponses:{' '}
            <span>
              {oppScore}/{MAX_SCORE}
            </span>
          </div>
        </div>
      </div>

      <div className="game__footer">
        Reponds correctement pour grimper ! ({MAX_SCORE} bonnes reponses pour gagner)
      </div>
    </div>
  )
}
