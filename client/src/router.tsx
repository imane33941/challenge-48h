import { createBrowserRouter } from 'react-router-dom'
import QuestionPage from '../pages/question'
import HomePage from '../pages/app'


export const router = createBrowserRouter([
  {
    path: '/',
    element: <div>Accueil</div>,
  },
  {
    path : '/app',
    element: <HomePage />
  },
  {
    path : '/question',
    element: <QuestionPage />
  }
])