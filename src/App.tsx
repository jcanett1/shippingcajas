import { useState, useEffect, useCallback } from 'react'
import { supabase, type Shipment, DESTINATIONS } from './lib/supabase'
import { useScale } from './hooks/useScale'
import { Toaster, toast } from 'sonner'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import UsersPage from './pages/Users'
import {
  Package, Scale, Usb, RefreshCw, Send, Trash2, Edit2,
  ChevronDown, Wifi, WifiOff, Loader2, AlertCircle, ClipboardList,
  Users, LogOut, Shield, Truck, X, Check, MapPin,
  Sun, Moon, User, ChevronUp
} from 'lucide-react'

const BOX_TYPES = [
  '14 CLUN BOX',
  '24 DOZEN GOLF BALL BOX',
  '6 DOZEN GOLF BALL BOX',
  'BUCKET HAT BOX',
  'FEDEX PAK ( FEDEX ONE RATE )',
  'FULL BAG BOX',
  '10 X 10 X 6 BOX',
  'IRON BOX',
  'PUTTER BOX',
  'SINGLE IRON BOX',
  'SINGLE WOOD BOX',
  'WOODS BOX',
  'CUSTOM BOX',
] as const

const CUSTOM_BOX_TYPES = [
  'ULINE BOX - 8X6X6',
  'ULINE BOX - 27X21X18',
  'ULINE BOX - 15X7X11',
  'HAT BOX - 10X10X6',
  'BUCKET HAT BOX - 16X12X6',
  'BAG BOX - 36X15X11',
  'BAG BOX - 36X17X11',
  'BAG BOX - 36X13X11',
  'BAG BOX - 35X12X9',
  'BAG BOX - 36X19X12',
] as const

const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 12px', borderRadius: 8,
  border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)',
  color: 'var(--text)', fontSize: 13, outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: "'Inter', sans-serif",
}
const iconBtnStyle: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 8, border: '1px solid var(--border)',
  backgroundColor: 'transparent', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s',
}
const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em',
  textTransform: 'uppercase', display: 'block', marginBottom: 6,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>
}

const ROLE_COLORS = { admin: '#6366f1', supervisor: '#f59e0b', shipping: '#34d399' }
const ROLE_LABELS = { admin: 'Admin', supervisor: 'Supervisor', shipping: 'Shipping' }

// ─── Edit Shipment Modal ───────────────────────────────────────────────────────
function EditShipmentModal({ shipment, onClose, onSaved }: { shipment: Shipment; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    shipment: shipment.shipment,
    boxType: shipment.custom_box ? 'CUSTOM BOX' : shipment.box_type,
    customBox: shipment.custom_box || '',
    weight: shipment.weight != null ? String(shipment.weight) : '',
    comments: shipment.comments || '',
    destination: shipment.destination || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.shipment.trim()) { toast.error('El campo SHIPMENT es requerido'); return }
    if (!form.boxType) { toast.error('Selecciona un tipo de caja'); return }
    if (form.boxType === 'CUSTOM BOX' && !form.customBox) { toast.error('Selecciona el tipo de CUSTOM BOX'); return }
    setSaving(true)
    const { error } = await supabase.from('shipments').update({
      shipment: form.shipment.trim(),
      box_type: form.boxType === 'CUSTOM BOX' ? `CUSTOM BOX - ${form.customBox}` : form.boxType,
      custom_box: form.boxType === 'CUSTOM BOX' ? form.customBox : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      comments: form.comments.trim() || null,
      destination: form.destination || null,
    }).eq('id', shipment.id)
    if (error) toast.error('Error al actualizar: ' + error.message)
    else { toast.success('Registro actualizado'); onSaved(); onClose() }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: '100%', maxWidth: 460, borderRadius: 16, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Editar Registro</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="SHIPMENT">
            <input value={form.shipment} onChange={e => setForm(f => ({ ...f, shipment: e.target.value }))} style={inputStyle} />
          </Field>
          <Field label="BOXES">
            <select value={form.boxType} onChange={e => setForm(f => ({ ...f, boxType: e.target.value, customBox: '' }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Seleccionar...</option>
              {BOX_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          {form.boxType === 'CUSTOM BOX' && (
            <div style={{ paddingLeft: 14, borderLeft: '2px solid #6366f1' }}>
              <Field label="CUSTOM BOX - TIPO">
                <select value={form.customBox} onChange={e => setForm(f => ({ ...f, customBox: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                  <option value="">Seleccionar medida...</option>
                  {CUSTOM_BOX_TYPES.map(cb => <option key={cb} value={cb}>{cb}</option>)}
                </select>
              </Field>
            </div>
          )}
          <Field label="DESTINO">
            <div style={{ position: 'relative' }}>
              <MapPin size={14} color={form.destination ? '#f59e0b' : 'var(--text-muted)'} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <select value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                style={{ ...inputStyle, paddingLeft: 36, cursor: 'pointer', borderColor: form.destination ? 'rgba(245,158,11,0.4)' : 'var(--border)' }}>
                <option value="">Seleccionar destino...</option>
                {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </Field>
          <Field label="PESO">
            <input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="0.000" style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }} />
          </Field>
          <Field label="COMENTARIOS">
            <textarea value={form.comments} onChange={e => setForm(f => ({ ...f, comments: e.target.value }))} rows={3}
              style={{ ...inputStyle, height: 'auto', resize: 'none', padding: '10px 12px', lineHeight: 1.6 }} />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <X size={14} /> Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, height: 42, borderRadius: 8, border: 'none', background: saving ? 'rgba(99,102,241,0.5)' : '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Check size={14} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!fullName.trim()) { toast.error('El nombre no puede estar vacío'); return }
    if (password && password !== confirmPassword) { toast.error('Las contraseñas no coinciden'); return }
    if (password && password.length < 4) { toast.error('La contraseña debe tener al menos 4 caracteres'); return }
    setSaving(true)
    const updates: Record<string, string> = { full_name: fullName.trim() }
    if (password) updates.password_text = password
    const { error } = await supabase.from('app_users').update(updates).eq('id', user!.id)
    if (error) { toast.error('Error al actualizar perfil'); setSaving(false); return }
    // Update localStorage session
    const saved = localStorage.getItem('shipping_session')
    if (saved) {
      const parsed = JSON.parse(saved)
      parsed.full_name = fullName.trim()
      if (password) parsed.password_text = password
      localStorage.setItem('shipping_session', JSON.stringify(parsed))
    }
    toast.success('Perfil actualizado correctamente')
    setSaving(false)
    onClose()
    setTimeout(() => window.location.reload(), 800)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: '100%', maxWidth: 400, borderRadius: 16, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Editar Perfil</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={labelStyle}>NOMBRE COMPLETO</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} placeholder="Tu nombre completo" />
          </div>
          <div><label style={labelStyle}>NUEVA CONTRASEÑA <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(dejar vacío para no cambiar)</span></label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: 44 }} placeholder="Nueva contraseña" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11 }}>
                {showPass ? 'OCULTAR' : 'VER'}
              </button>
            </div>
          </div>
          {password && (
            <div><label style={labelStyle}>CONFIRMAR CONTRASEÑA</label>
              <input type={showPass ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== password ? '#f87171' : 'var(--border)' }} placeholder="Repetir contraseña" />
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, height: 42, borderRadius: 8, border: 'none', background: saving ? 'rgba(99,102,241,0.5)' : '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Check size={14} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main App (authenticated) ─────────────────────────────────────────────────
function MainApp() {
  const { user, logout, canDeleteShipments, canEditAllShipments } = useAuth()
  const [activeTab, setActiveTab] = useState<'shipments' | 'users'>('shipments')
  const [shipment, setShipment] = useState('')
  const [boxType, setBoxType] = useState('')
  const [customBox, setCustomBox] = useState('')
  const [destination, setDestination] = useState('')
  const [manualWeight, setManualWeight] = useState('')
  const [comments, setComments] = useState('')
  const [saving, setSaving] = useState(false)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null)

  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('shipping_theme') as 'dark' | 'light') || 'dark')

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('shipping_theme', next)
  }

  const scale = useScale()
  const effectiveWeight = scale.status === 'connected' ? scale.weight : manualWeight

  const isShipping = user?.role === 'shipping'
  const canManageUsers = user?.role === 'admin' || user?.role === 'supervisor'

  const fetchShipments = useCallback(async () => {
    setLoadingList(true)
    const { data, error } = await supabase.from('shipments').select('*').order('created_at', { ascending: false })
    if (error) toast.error('Error al cargar historial', { description: error.message })
    else setShipments(data || [])
    setLoadingList(false)
  }, [])

  useEffect(() => { fetchShipments() }, [fetchShipments])

  const handleSubmit = async () => {
    if (!shipment.trim()) { toast.error('El campo SHIPMENT es requerido'); return }
    if (!boxType) { toast.error('Selecciona un tipo de CAJA'); return }
    if (boxType === 'CUSTOM BOX' && !customBox) { toast.error('Selecciona el tipo de CUSTOM BOX'); return }
    if (!destination) { toast.error('Selecciona el DESTINO del envío'); return }
    setSaving(true)
    const { error } = await supabase.from('shipments').insert([{
      shipment: shipment.trim(),
      box_type: boxType === 'CUSTOM BOX' ? `CUSTOM BOX - ${customBox}` : boxType,
      custom_box: boxType === 'CUSTOM BOX' ? customBox : null,
      weight: effectiveWeight ? parseFloat(effectiveWeight) : null,
      comments: comments.trim() || null,
      destination: destination,
      created_by: user?.id,
      created_by_name: user?.full_name,
    }])
    if (error) toast.error('Error al guardar', { description: error.message })
    else {
      toast.success('Envío registrado exitosamente')
      setShipment(''); setBoxType(''); setCustomBox(''); setDestination(''); setManualWeight(''); setComments('')
      fetchShipments()
    }
    setSaving(false)
  }

  const handleDelete = async (s: Shipment) => {
    if (!canDeleteShipments) { toast.error('No tienes permiso para eliminar registros'); return }
    const { error } = await supabase.from('shipments').delete().eq('id', s.id)
    if (error) toast.error('Error al eliminar', { description: error.message })
    else { toast.success('Registro eliminado'); fetchShipments() }
  }

  const canEditShipment = (s: Shipment) => {
    if (canEditAllShipments) return true
    // shipping can only edit their own
    return s.created_by === user?.id
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

  const scaleStatusColor = { disconnected: '#6b6b8a', connecting: '#fbbf24', connected: '#34d399', error: '#f87171' }[scale.status]
  const scaleStatusLabel = { disconnected: 'Sin conexión', connecting: 'Conectando...', connected: 'Báscula conectada', error: 'Error de conexión' }[scale.status]
  const roleColor = user ? ROLE_COLORS[user.role] : '#6366f1'

  return (
    <div className={theme} style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Toaster theme="dark" position="top-right" richColors />

      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', backgroundColor: theme === 'light' ? 'rgba(244,245,247,0.95)' : 'rgba(17,17,24,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={17} color="#6366f1" />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text)', letterSpacing: '-0.3px' }}>SHIPPING SYSTEM</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Gestión de Envíos</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
            <TabBtn active={activeTab === 'shipments'} onClick={() => setActiveTab('shipments')} icon={<ClipboardList size={14} />} label="ENVÍOS" />
            {canManageUsers && (
              <TabBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={14} />} label="USUARIOS" />
            )}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Scale status */}
            <div style={{ display: 'none', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, color: scaleStatusColor }}>
              {scale.status === 'connected' ? <Wifi size={13} /> : <WifiOff size={13} />}
              <span style={{ display: 'none' }}>{scaleStatusLabel}</span>
            </div>

            {/* Scale status dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: scaleStatusColor }}>
              {scale.status === 'connected' ? <Wifi size={13} /> : <WifiOff size={13} />}
            </div>

            {/* User dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setUserDropdownOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: userDropdownOpen ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: `${roleColor}18`, border: `1px solid ${roleColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user?.role === 'admin' ? <Shield size={13} color={roleColor} /> : user?.role === 'supervisor' ? <Users size={13} color={roleColor} /> : <Truck size={13} color={roleColor} />}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{user?.full_name}</div>
                  <div style={{ fontSize: 10, color: roleColor, fontWeight: 600 }}>{user ? ROLE_LABELS[user.role] : ''}</div>
                </div>
                {userDropdownOpen ? <ChevronUp size={13} color="var(--text-muted)" /> : <ChevronDown size={13} color="var(--text-muted)" />}
              </button>

              {userDropdownOpen && (
                <>
                  {/* Backdrop to close */}
                  <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setUserDropdownOpen(false)} />
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220, borderRadius: 12, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', boxShadow: '0 16px 40px rgba(0,0,0,0.4)', zIndex: 99, overflow: 'hidden' }}>
                    {/* Profile info */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(99,102,241,0.04)' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{user?.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>@{user?.username}</div>
                    </div>
                    {/* Edit profile */}
                    <button onClick={() => { setUserDropdownOpen(false); setShowEditProfile(true) }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 13, textAlign: 'left', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <User size={14} color="var(--text-muted)" /> Editar Perfil
                    </button>
                    {/* Theme toggle */}
                    <button onClick={toggleTheme}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 13, transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {theme === 'dark' ? <Sun size={14} color="var(--text-muted)" /> : <Moon size={14} color="var(--text-muted)" />}
                        {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                      </div>
                      <div style={{ width: 36, height: 20, borderRadius: 10, background: theme === 'light' ? '#6366f1' : 'var(--border)', position: 'relative', transition: 'background 0.2s' }}>
                        <div style={{ position: 'absolute', top: 3, left: theme === 'light' ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                      </div>
                    </button>
                    {/* Divider */}
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                    {/* Logout */}
                    <button onClick={() => { setUserDropdownOpen(false); logout() }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 13, textAlign: 'left', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <LogOut size={14} /> Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }}>

        {/* ── SHIPMENTS TAB ── */}
        {activeTab === 'shipments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Form */}
            <div style={{ maxWidth: 520 }}>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Nuevo Envío</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Complete los datos del paquete a registrar</p>
              </div>
              <div style={{ borderRadius: 14, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                <Field label="DESTINO">
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} color={destination ? '#f59e0b' : 'var(--text-muted)'} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
                    <select value={destination} onChange={e => setDestination(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: 36, cursor: 'pointer', borderColor: destination ? 'rgba(245,158,11,0.4)' : 'var(--border)', color: destination ? 'var(--text)' : 'var(--text-muted)' }}>
                      <option value="">Seleccionar destino...</option>
                      {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </Field>

                <Field label="SHIPMENT">
                  <input value={shipment} onChange={e => setShipment(e.target.value)} placeholder="Ej: SHP-2024-001 o ABC123" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }} />
                </Field>

                <Field label="BOXES">
                  <select value={boxType} onChange={e => { setBoxType(e.target.value); setCustomBox('') }} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Seleccionar tipo de caja...</option>
                    {BOX_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>

                {boxType === 'CUSTOM BOX' && (
                  <div style={{ paddingLeft: 16, borderLeft: '2px solid #6366f1', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ ...labelStyle, color: '#6366f1' }}>
                      <ChevronDown size={12} style={{ display: 'inline', marginRight: 4 }} />
                      CUSTOM BOX - TIPO
                    </label>
                    <select value={customBox} onChange={e => setCustomBox(e.target.value)} style={{ ...inputStyle, borderColor: 'rgba(99,102,241,0.3)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, cursor: 'pointer' }}>
                      <option value="">Seleccionar medida...</option>
                      {CUSTOM_BOX_TYPES.map(cb => <option key={cb} value={cb}>{cb}</option>)}
                    </select>
                  </div>
                )}

                <Field label="PESO">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Scale size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <input
                        value={scale.status === 'connected' ? scale.weight : manualWeight}
                        onChange={e => { if (scale.status !== 'connected') setManualWeight(e.target.value) }}
                        readOnly={scale.status === 'connected'}
                        placeholder={scale.status === 'connected' ? 'Leyendo báscula...' : '0.000'}
                        style={{ ...inputStyle, paddingLeft: 36, fontFamily: "'JetBrains Mono', monospace", ...(scale.status === 'connected' ? { borderColor: 'rgba(52,211,153,0.4)', backgroundColor: 'rgba(52,211,153,0.06)', color: '#34d399' } : {}) }}
                      />
                    </div>
                    <button onClick={scale.status === 'connected' ? scale.readWeight : scale.connect} disabled={scale.status === 'connecting'} title={scale.status === 'connected' ? 'Leer peso' : 'Conectar báscula USB'}
                      style={{ ...iconBtnStyle, borderColor: scale.status === 'connected' ? 'rgba(52,211,153,0.4)' : 'var(--border)', color: scale.status === 'connected' ? '#34d399' : 'var(--text-muted)' }}>
                      {scale.status === 'connecting' ? <Loader2 size={16} className="spin" /> : scale.status === 'connected' ? <RefreshCw size={16} /> : <Usb size={16} />}
                    </button>
                    {scale.status === 'connected' && (
                      <button onClick={scale.disconnect} title="Desconectar báscula" style={{ ...iconBtnStyle, borderColor: 'rgba(248,113,113,0.3)', color: '#f87171' }}>
                        <WifiOff size={16} />
                      </button>
                    )}
                  </div>
                  {scale.errorMsg && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#f87171', marginTop: 4 }}><AlertCircle size={11} /> {scale.errorMsg}</div>}
                  {scale.status === 'disconnected' && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Presiona el ícono USB para conectar la báscula o ingresa el peso manualmente.</p>}
                </Field>

                <Field label="COMENTARIOS">
                  <textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Notas adicionales del envío..." rows={3}
                    style={{ ...inputStyle, height: 'auto', resize: 'none', lineHeight: 1.6, padding: '10px 12px' }}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }} />
                </Field>

                <button onClick={handleSubmit} disabled={saving}
                  style={{ width: '100%', height: 48, borderRadius: 10, border: 'none', background: saving ? 'rgba(99,102,241,0.5)' : '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: '0.8px', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(99,102,241,0.25)', transition: 'all 0.2s', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {saving ? <><Loader2 size={16} className="spin" /> Guardando...</> : <><Send size={16} /> GUARDAR ENVÍO</>}
                </button>
              </div>
            </div>

            {/* History */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Historial de Envíos</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{shipments.length} registro{shipments.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={fetchShipments} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                  <RefreshCw size={13} /> Actualizar
                </button>
              </div>
              <div style={{ borderRadius: 14, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', overflow: 'auto', maxHeight: 620 }}>
                {loadingList ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10, color: 'var(--text-muted)' }}>
                    <Loader2 size={18} className="spin" /> Cargando...
                  </div>
                ) : shipments.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(107,107,138,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ClipboardList size={24} color="var(--text-muted)" />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Sin registros</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Los envíos guardados aparecerán aquí</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <>
                          {[{h:'FECHA',w:130},{h:'USUARIO',w:120},{h:'DESTINO',w:130},{h:'SHIPMENT',w:110},{h:'CAJA',w:160},{h:'PESO',w:70},{h:'COMENTARIOS',w:200},{h:'',w:70}].map(({h,w}) => (
                            <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', whiteSpace: 'nowrap', width: w }}>{h}</th>
                          ))}
                        </>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.map((s, idx) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid rgba(37,37,53,0.6)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatDate(s.created_at)}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{s.created_by_name || '—'}</span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {s.destination
                              ? <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>{s.destination}</span>
                              : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{s.shipment}</span></td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{s.custom_box ? 'CUSTOM BOX' : s.box_type}</span>
                              {s.custom_box && <span style={{ fontSize: 10, color: '#6366f1', fontFamily: "'JetBrains Mono', monospace" }}>{s.custom_box}</span>}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {s.weight != null ? <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#34d399', fontWeight: 600 }}>{Number(s.weight).toFixed(3)}</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', wordBreak: 'break-word', lineHeight: 1.5 }}>{s.comments || '—'}</span></td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {canEditShipment(s) && (
                                <button onClick={() => setEditingShipment(s)} title="Editar"
                                  style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                  <Edit2 size={12} />
                                </button>
                              )}
                              {(canDeleteShipments || (!isShipping)) && canDeleteShipments && (
                                <button onClick={() => handleDelete(s)} title="Eliminar"
                                  style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && canManageUsers && <UsersPage />}
      </main>

      {/* Edit Profile Modal */}
      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}

      {/* Edit modal */}
      {editingShipment && (
        <EditShipmentModal
          shipment={editingShipment}
          onClose={() => setEditingShipment(null)}
          onSaved={fetchShipments}
        />
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        select option { background: #16161f; color: #e8e8f0; }
      `}</style>
    </div>
  )
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
      borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
      letterSpacing: '0.05em', transition: 'all 0.15s', fontFamily: "'Space Grotesk', sans-serif",
      background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
      color: active ? '#6366f1' : 'var(--text-muted)',
    }}>
      {icon} {label}
    </button>
  )
}

// ─── Root with Auth ────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(false)

  return (
    <AuthProvider>
      <AppGate authed={authed} setAuthed={setAuthed} />
    </AuthProvider>
  )
}

function AppGate({ authed, setAuthed }: { authed: boolean; setAuthed: (v: boolean) => void }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (user) setAuthed(true)
    else setAuthed(false)
  }, [user, setAuthed])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="#6366f1" className="spin" />
        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!authed || !user) {
    return (
      <>
        <Toaster theme="dark" position="top-right" richColors />
        <Login onLogin={() => setAuthed(true)} />
      </>
    )
  }

  return <MainApp />
}
