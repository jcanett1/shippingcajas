import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Package, Eye, EyeOff, Loader2, Lock, User, Mail } from 'lucide-react'

const BG_IMAGES = [
  '/shippingcajas/images/warehouse1.jpg',
  '/shippingcajas/images/warehouse2.jpg',
  '/shippingcajas/images/warehouse3.jpg',
  '/shippingcajas/images/warehouse4.jpg',
  '/shippingcajas/images/warehouse5.jpg',
]

export default function Login({ onLogin }: { onLogin: () => void }) {
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentImg, setCurrentImg] = useState(0)
  const [nextImg, setNextImg] = useState(1)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setCurrentImg(prev => {
          const next = (prev + 1) % BG_IMAGES.length
          setNextImg((next + 1) % BG_IMAGES.length)
          return next
        })
        setFading(false)
      }, 1000)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

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
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }}>

      {/* Background images with crossfade */}
      {BG_IMAGES.map((src, i) => (
        <div key={src} style={{
          position: 'fixed', inset: 0, zIndex: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          transition: 'opacity 1s ease-in-out',
          opacity: i === currentImg ? (fading ? 0 : 1) : i === nextImg ? (fading ? 1 : 0) : 0,
        }} />
      ))}

      {/* Dark overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.72) 100%)' }} />

      {/* Dot indicators */}
      <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 10 }}>
        {BG_IMAGES.map((_, i) => (
          <button key={i} onClick={() => setCurrentImg(i)} style={{
            width: i === currentImg ? 22 : 8, height: 8, borderRadius: 4,
            background: i === currentImg ? '#6366f1' : 'rgba(255,255,255,0.4)',
            border: 'none', cursor: 'pointer', padding: 0,
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* Login card */}
      <div style={{
        width: '100%', maxWidth: 420, position: 'relative', zIndex: 10,
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(10,10,20,0.82)',
        backdropFilter: 'blur(24px)',
        padding: '40px 36px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 30px rgba(99,102,241,0.2)',
          }}>
            <Package size={28} color="#6366f1" />
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            fontSize: 22, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6,
          }}>SHIPPING SYSTEM</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Identifier */}
          <div>
            <label style={labelStyle}>USUARIO O CORREO</label>
            <div style={{ position: 'relative' }}>
              {identifier.includes('@')
                ? <Mail size={15} color="#6366f1" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                : <User size={15} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              }
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Nombre de usuario o correo electrónico"
                autoComplete="username"
                style={{ ...inputStyle, paddingLeft: 36 }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>CONTRASEÑA</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña"
                autoComplete="current-password"
                style={{ ...inputStyle, paddingLeft: 36, paddingRight: 44 }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
              />
              <button type="button" onClick={() => setShowPass(v => !v)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 2,
              }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
              fontSize: 13, color: '#f87171', textAlign: 'center',
            }}>{error}</div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width: '100%', height: 48, borderRadius: 10, border: 'none',
            background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: '0.8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 24px rgba(99,102,241,0.4)',
            transition: 'all 0.2s', marginTop: 4,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
          >
            {loading ? <><Loader2 size={16} className="spin" /> Verificando...</> : 'INICIAR SESIÓN'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 24 }}>
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
  border: '1px solid rgba(255,255,255,0.12)',
  backgroundColor: 'rgba(255,255,255,0.06)',
  color: '#fff', fontSize: 13, outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: "'Inter', sans-serif",
}

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em',
  display: 'block', marginBottom: 6,
}
