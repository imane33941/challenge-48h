import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/gameStore'
import { getApiUrl } from '@/config/apiConfig'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser, connectSocket } = useGameStore()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' | '' }>({
    msg: '',
    type: '',
  })
  const [loading, setLoading] = useState(false)

  const handleDemoLogin = () => {
    // Demo login pour Render - bypass le backend pour tests rapides
    setLoading(true)
    setStatus({ msg: 'Connexion démo...', type: '' })
    
    setTimeout(() => {
      const demoToken = 'demo_' + Math.random().toString(36).substring(7)
      const demoUserId = 'demo_user_' + Math.floor(Math.random() * 10000)
      
      localStorage.setItem('access_token', demoToken)
      localStorage.setItem('user_id', demoUserId)
      localStorage.setItem('user_name', 'DemoUser')
      
      setUser(demoUserId, 'DemoUser', demoToken)
      connectSocket()
      setStatus({ msg: 'Mode démo activé!', type: 'success' })
      setTimeout(() => navigate('/menu'), 800)
      setLoading(false)
    }, 500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setStatus({ msg: 'Email et mot de passe sont obligatoires.', type: 'error' })
      return
    }

    setLoading(true)
    setStatus({ msg: 'Chargement...', type: '' })

    try {
      const apiUrl = getApiUrl()
      console.log('🔗 API URL détectée:', apiUrl)

      if (isLogin) {
        const res = await fetch(`${apiUrl}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        
        console.log('📡 Réponse status:', res.status)
        const data = await res.json()
        console.log('📦 Réponse data:', data)

        if (!res.ok) throw new Error(data.message || 'Erreur de connexion')

        if (!data.session?.access_token || !data.user?.id) {
          throw new Error('Réponse invalide du serveur: données manquantes')
        }

        localStorage.setItem('access_token', data.session.access_token)
        localStorage.setItem('user_id', data.user.id)
        localStorage.setItem('user_name', data.user.email.split('@')[0])

        setUser(data.user.id, data.user.email.split('@')[0], data.session.access_token)
        connectSocket()
        setStatus({ msg: 'Connexion réussie !', type: 'success' })
        setTimeout(() => navigate('/menu'), 800)
      } else {
        if (!username || !nom || !prenom) {
          setStatus({ msg: 'Tous les champs sont obligatoires.', type: 'error' })
          setLoading(false)
          return
        }

        const res = await fetch(`${apiUrl}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Erreur inscription')

        setStatus({ msg: 'Compte créé ! Tu peux te connecter.', type: 'success' })
        setIsLogin(true)
      }
    } catch (err: any) {
      console.error('❌ Erreur:', err)
      setStatus({ msg: err.message || 'Une erreur est survenue.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <div className="login__box">
        <h1 className="login__title">{isLogin ? 'Connexion' : 'Inscription'}</h1>

        <form onSubmit={handleSubmit} className="login__form">
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {!isLogin && (
            <div className="login__extra">
              <input
                placeholder="Pseudo (visible par les autres)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
              <input
                placeholder="Prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
            </div>
          )}

          <button type="submit" className="login__btn" disabled={loading}>
            {loading ? '...' : isLogin ? 'Se connecter' : "S'inscrire"}
          </button>

          {import.meta.env.PROD && (
            <button 
              type="button" 
              className="login__btn" 
              style={{ backgroundColor: '#FFA500', marginTop: '10px' }}
              onClick={handleDemoLogin}
              disabled={loading}
            >
              Mode Démo
            </button>
          )}
        </form>

        {status.msg && (
          <p className={`login__status login__status--${status.type}`}>{status.msg}</p>
        )}

        <p className="login__switch">
          {isLogin ? 'Pas de compte ?' : 'Déjà un compte ?'}{' '}
          <button
            className="login__switch-btn"
            onClick={() => {
              setIsLogin(!isLogin)
              setStatus({ msg: '', type: '' })
            }}
          >
            {isLogin ? "S'inscrire" : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  )
}
