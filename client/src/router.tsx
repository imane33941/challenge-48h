import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import MenuPage from './pages/menu/MenuPage'
import LobbyPage from './pages/lobby/LobbyPage'
import GamePage from './pages/game/GamePage'
import DuelPage from './pages/duel/DuelPage'
import PlayerPage from './pages/player/PlayerPage'
import { useGameStore } from './store/gameStore'
import QuestionPage from './pages/quizz/question'
import HomePage from './pages/home/home_page'

function ProtectedMenu() {
  const userId = useGameStore((s) => s.userId)
  if (!userId) return <Navigate to="/login" replace />
  return <MenuPage />
}

function ProtectedLobby() {
  const userId = useGameStore((s) => s.userId)
  if (!userId) return <Navigate to="/login" replace />
  return <LobbyPage />
}

function ProtectedGame() {
  const session = useGameStore((s) => s.session)
  if (!session) return <Navigate to="/login" replace />
  return <GamePage />
}

function ProtectedDuel() {
  const userId = useGameStore((s) => s.userId)
  if (!userId) return <Navigate to="/login" replace />
  return <DuelPage />
}

function ProtectedPlayer() {
  const userId = useGameStore((s) => s.userId)
  if (!userId) return <Navigate to="/login" replace />
  return <PlayerPage />
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/menu', element: <ProtectedMenu /> },
  { path: '/lobby', element: <ProtectedLobby /> },
  { path: '/game', element: <ProtectedGame /> },
  { path: '/duel', element: <ProtectedDuel /> },
  { path: '/player', element: <ProtectedPlayer /> },
  { path: '/question/:niveau', element: <QuestionPage /> },
  { path: '/home', element: <HomePage /> },
])
