import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'

const WS_URL = 'http://localhost:3000'

interface Question {
  text: string
  answer: number
}

interface GameSession {
  roomId: string
  opponentId: string
  opponentName: string
}

interface GameStore {
  userId: string | null
  userName: string | null
  setUser: (id: string, name: string) => void

  socket: Socket | null
  connected: boolean
  connectSocket: () => void
  disconnectSocket: () => void

  pendingInvitation: { invitationId: string; hostId: string; hostName: string } | null
  setPendingInvitation: (inv: GameStore['pendingInvitation']) => void
  sendInvitation: (guestId: string, exerciseId: string) => void
  acceptInvitation: () => void
  declineInvitation: () => void

  session: GameSession | null
  setSession: (session: GameSession | null) => void
  startPracticeGame: () => void

  question: Question
  myLife: number
  oppLife: number
  feedback: 'correct' | 'wrong' | null
  gameOver: string | null
  myInput: string
  pressKey: (k: string) => void
  submitAnswer: () => void
  resetGame: () => void
}

function generateQuestion(): Question {
  const a = Math.floor(Math.random() * 10)
  const b = Math.floor(Math.random() * 10)
  return { text: `${a} × ${b}`, answer: a * b }
}

export const useGameStore = create<GameStore>((set, get) => ({
  userId: null,
  userName: null,
  setUser: (id, name) => set({ userId: id, userName: name }),

  socket: null,
  connected: false,

  connectSocket: () => {
    const { userId, socket: existing } = get()
    if (!userId || existing?.connected) return

    const socket = io(WS_URL, {
      query: { userId },
      transports: ['websocket'],
    })

    socket.on('connect', () => set({ connected: true }))
    socket.on('disconnect', () => set({ connected: false }))

    socket.on('invitation_received', (data) => {
      set({
        pendingInvitation: {
          invitationId: data.invitationId,
          hostId: data.hostId,
          hostName: data.hostName || 'Un joueur',
        },
      })
    })

    socket.on('game_started', (data) => {
      const { userId, userName } = get()
      const room = data.room
      const opponentId = room.host_id === userId ? room.guest_id : room.host_id
      set({
        session: {
          roomId: room.id,
          opponentId,
          opponentName: data.opponentName || 'Adversaire',
        },
        pendingInvitation: null,
        myLife: 100,
        oppLife: 100,
        question: generateQuestion(),
        gameOver: null,
        feedback: null,
        myInput: '',
      })
    })

    socket.on('opponent_attacked', ({ damage }: { damage: number }) => {
      const next = Math.max(0, get().myLife - damage)
      set({ myLife: next })
      if (next <= 0) set({ gameOver: get().session?.opponentName ?? 'Adversaire' })
    })

    socket.on('player_self_damaged', ({ userId, damage }: { userId: string; damage: number }) => {
      const me = get().userId
      if (!me || userId === me) return
      const nextOppLife = Math.max(0, get().oppLife - damage)
      set({ oppLife: nextOppLife })
      if (nextOppLife <= 0) set({ gameOver: get().userName ?? 'Moi' })
    })

    socket.on('game_finished', ({ userId: winnerId }: { userId: string }) => {
      const { userId, userName, session } = get()
      if (!userId) return
      if (winnerId === userId) {
        set({ gameOver: userName ?? 'Moi' })
      } else {
        set({ gameOver: session?.opponentName ?? 'Adversaire' })
      }
    })

    socket.on('duel_rematch', () => {
      set({
        myLife: 100,
        oppLife: 100,
        gameOver: null,
        feedback: null,
        myInput: '',
        question: generateQuestion(),
      })
    })

    socket.on('invitation_declined', () => {
      set({ pendingInvitation: null })
    })

    set({ socket })
  },

  disconnectSocket: () => {
    get().socket?.disconnect()
    set({ socket: null, connected: false })
  },

  pendingInvitation: null,
  setPendingInvitation: (inv) => set({ pendingInvitation: inv }),

  sendInvitation: (guestId, exerciseId) => {
    const { socket, userId } = get()
    if (!socket || !userId) return
    socket.emit('send_invitation', { hostId: userId, guestId, exerciseId })
  },

  acceptInvitation: () => {
    const { socket, userId, pendingInvitation } = get()
    if (!socket || !userId || !pendingInvitation) return
    socket.emit('accept_invitation', {
      invitationId: pendingInvitation.invitationId,
      guestId: userId,
    })
  },

  declineInvitation: () => {
    const { socket, pendingInvitation } = get()
    if (!socket || !pendingInvitation) return
    socket.emit('decline_invitation', { invitationId: pendingInvitation.invitationId })
    set({ pendingInvitation: null })
  },

  session: null,
  setSession: (session) => set({ session }),

  startPracticeGame: () => {
    const { userName } = get()
    set({
      session: {
        roomId: `practice-${Date.now()}`,
        opponentId: 'practice-bot',
        opponentName: 'Pratique',
      },
      myLife: 100,
      oppLife: 100,
      question: generateQuestion(),
      gameOver: null,
      feedback: null,
      myInput: '',
    })
  },

  question: generateQuestion(),
  myLife: 100,
  oppLife: 100,
  feedback: null,
  gameOver: null,
  myInput: '',

  pressKey: (k) => {
    const { feedback, gameOver, myInput } = get()
    if (feedback || gameOver) return
    if (k === 'C') {
      set({ myInput: '' })
      return
    }
    if (myInput.length < 3) set({ myInput: myInput + k })
  },

  submitAnswer: () => {
    const { myInput, question, gameOver, socket, session, userId, userName, oppLife, myLife } =
      get()
    if (!myInput || gameOver) return

    const correct = parseInt(myInput) === question.answer

    if (correct) {
      set({ feedback: 'correct' })
      const next = Math.max(0, oppLife - 10)
      set({ oppLife: next })
      if (next <= 0) set({ gameOver: userName ?? 'Moi' })
      socket?.emit('submit_answer', {
        roomId: session?.roomId,
        userId,
        score: 1,
        finished: next <= 0,
        damage: 10,
        winnerId: next <= 0 ? userId : undefined,
      })
    } else {
      set({ feedback: 'wrong' })
      const next = Math.max(0, myLife - 10)
      set({ myLife: next })
      if (next <= 0) set({ gameOver: session?.opponentName ?? 'Adversaire' })
      socket?.emit('submit_answer', {
        roomId: session?.roomId,
        userId,
        score: 0,
        finished: next <= 0,
        selfDamage: 10,
        winnerId: next <= 0 ? session?.opponentId : undefined,
      })
    }

    setTimeout(() => {
      set({ myInput: '', feedback: null, question: generateQuestion() })
    }, 800)
  },

  resetGame: () =>
    set({
      myLife: 100,
      oppLife: 100,
      gameOver: null,
      feedback: null,
      myInput: '',
      question: generateQuestion(),
    }),
}))
