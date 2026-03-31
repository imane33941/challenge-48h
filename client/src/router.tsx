import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import MenuPage from './pages/menu/MenuPage'
import LobbyPage from './pages/lobby/LobbyPage'
import GamePage from './pages/game-duel/GamePage'
import { useGameStore } from './store/gameStore'
import GameExpress from './pages/game-express/GameExpress'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const userId = useGameStore((s) => s.userId)
  if (!userId) return <Navigate to="/login" replace />
  return <>{children}</>
}

function ProtectedGame() {
  const session = useGameStore((s) => s.session)
  if (!session) return <Navigate to="/login" replace />
  return <GamePage />
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/menu',
    element: (
      <ProtectedRoute>
        <MenuPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/express',
    element: (
      <ProtectedRoute>
        <GameExpress />
      </ProtectedRoute>
    ),
  },
  {
    path: '/game',
    element: (
      <ProtectedRoute>
        <GamePage />
      </ProtectedRoute>
    ),
  },
])
