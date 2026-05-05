import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Package, Eye, EyeOff, Loader2, Lock, User, Mail } from 'lucide-react'

export default function Login({ onLogin }: { onLogin: () => void }) {
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier || !password) { setError('Completa todos los campos'); return }
    setLoading(true)
    setError('')
    const result = await login(identifier, password)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onLogin()
    }
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 420,
        borderRadius: 20, border: '1px solid var(--border)',
        backgroundColor: 'var(--bg-card)',
        padding: '40px 36px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Package size={26} color="#6366f1" />
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            fontSize: 22, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 6,
          }}>SHIPPING SYSTEM PXG TEQUILA</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Identifier: username or email */}
          <div>
            <label style={labelStyle}>USUARIO O CORREO</label>
            <div style={{ position: 'relative' }}>
              {identifier.includes('@')
                ? <Mail size={15} color="#6366f1" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                : <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              }
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Nombre de usuario o correo electrónico"
                autoComplete="username"
                style={{ ...inputStyle, paddingLeft: 36 }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>CONTRASEÑA</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña"
                autoComplete="current-password"
                style={{ ...inputStyle, paddingLeft: 36, paddingRight: 44 }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
              <button type="button" onClick={() => setShowPass(v => !v)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2,
              }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
              fontSize: 13, color: '#f87171', textAlign: 'center',
            }}>{error}</div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width: '100%', height: 48, borderRadius: 10, border: 'none',
            background: loading ? 'rgba(99,102,241,0.5)' : '#6366f1',
            color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: '0.8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(99,102,241,0.25)',
            transition: 'all 0.2s', marginTop: 4,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            {loading ? <><Loader2 size={16} className="spin" /> Verificando...</> : 'INICIAR SESIÓN'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 24 }}>
          Shipping System v1.0 — Acceso restringido
        </p>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 12px', borderRadius: 8,
  border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)',
  color: 'var(--text)', fontSize: 13, outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: "'Inter', sans-serif",
}

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em',
  display: 'block', marginBottom: 6,
}
