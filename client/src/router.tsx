import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import MenuPage from './pages/menu/MenuPage'
import LobbyPage from './pages/lobby/LobbyPage'
import GamePage from './pages/game-duel/GamePage'
import GameExpress from './pages/game-express/GameExpress'
import DuelPage from './pages/duel/DuelPage'
import PlayerPage from './pages/player/PlayerPage'
import QuestionPage from './pages/quizz/question'
import HomePage from './pages/home/home_page'
import { useGameStore } from './store/gameStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const userId = useGameStore((s) => s.userId)
  if (!userId) return <Navigate to="/login" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/home', element: <HomePage /> },
  { path: '/question', element: <QuestionPage /> },
  {
    path: '/menu',
    element: (
      <ProtectedRoute>
        <MenuPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/lobby',
    element: (
      <ProtectedRoute>
        <LobbyPage />
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
  {
    path: '/express',
    element: (
      <ProtectedRoute>
        <GameExpress />
      </ProtectedRoute>
    ),
  },
  {
    path: '/duel',
    element: (
      <ProtectedRoute>
        <DuelPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/player',
    element: (
      <ProtectedRoute>
        <PlayerPage />
      </ProtectedRoute>
    ),
  },
])
