import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import '../styles/login.css'

export default function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState(null)

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password)
    if (error) setError(error.message)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">DecorPal</h1>
        <p className="login-subtitle">Plan your perfect space</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            className="login-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <label className="login-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="login-input"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
          <button className="login-btn login-btn--primary" type="submit">
            {isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          className="login-btn login-btn--text"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
          }}
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>

        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  )
}
