import { createBrowserRouter } from 'react-router-dom'
import QuestionPage from '../pages/question'
import HomePage from '../pages/home_quiz'


export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  },

  {
    path : '/question',
    element: <QuestionPage />
  }
])