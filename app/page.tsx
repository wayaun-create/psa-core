'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [alert, setAlert] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [loading, setLoading] = useState(false)

  const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? window.location.origin
    : 'https://psa-core-api.onrender.com'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setAlert(null)
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        setAlert({ message: '✅ Login successful! Welcome back.', type: 'success' })
        localStorage.setItem('acct_id', data.acct_id)
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        setAlert({ message: data.error || 'Invalid email or password', type: 'error' })
      }
    } catch (error) {
      setAlert({ message: 'Connection error. Please try again.', type: 'error' })
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '450px',
        width: '100%'
      }}>
        <h1 style={{
          color: '#333',
          marginBottom: '10px',
          fontSize: '2.5rem',
          textAlign: 'center'
        }}>🏢 PSA Core</h1>
        
        <p style={{
          color: '#666',
          marginBottom: '30px',
          fontSize: '1.1rem',
          textAlign: 'center'
        }}>Professional Services Automation</p>

        {alert && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.95rem',
            background: alert.type === 'error' ? '#fee2e2' : '#d1fae5',
            color: alert.type === 'error' ? '#991b1b' : '#065f46',
            border: `1px solid ${alert.type === 'error' ? '#fecaca' : '#a7f3d0'}`
          }}>
            {alert.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={{
              display: 'block',
              color: '#374151',
              fontWeight: 500,
              marginBottom: '8px',
              fontSize: '0.95rem'
            }}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="password" style={{
              display: 'block',
              color: '#374151',
              fontWeight: 500,
              marginBottom: '8px',
              fontSize: '0.95rem'
            }}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#9ca3af' : '#667eea',
              color: 'white',
              border: 'none',
              padding: '14px 24px',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              width: '100%'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  )
}
