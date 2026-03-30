import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import LobbyPage from './pages/lobby/LobbyPage'
import GamePage from './pages/game/GamePage'
import { useGameStore } from './store/gameStore'

function ProtectedGame() {
  const session = useGameStore((s) => s.session)
  if (!session) return <Navigate to="/login" replace />
  return <GamePage />
}

function ProtectedLobby() {
  const userId = useGameStore((s) => s.userId)
  if (!userId) return <Navigate to="/login" replace />
  return <LobbyPage />
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/lobby', element: <ProtectedLobby /> },
  { path: '/game', element: <ProtectedGame /> },
])
