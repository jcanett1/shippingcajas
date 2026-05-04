import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth, type AppUser, type UserRole } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { UserPlus, Edit2, Trash2, Eye, EyeOff, X, Check, Shield, Truck, Users } from 'lucide-react'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  shipping: 'Shipping',
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: '#6366f1',
  supervisor: '#f59e0b',
  shipping: '#34d399',
}

const ROLE_BG: Record<UserRole, string> = {
  admin: 'rgba(99,102,241,0.12)',
  supervisor: 'rgba(245,158,11,0.12)',
  shipping: 'rgba(52,211,153,0.12)',
}

interface UserFormData {
  username: string
  password_text: string
  full_name: string
  role: UserRole
}

const emptyForm: UserFormData = { username: '', password_text: '', full_name: '', role: 'shipping' }

export default function UsersPage() {
  const { user: currentUser, canSeePasswords, canDeleteUsers, canEditAnyUser, canAddAnyUser } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [form, setForm] = useState<UserFormData>(emptyForm)
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [showFormPass, setShowFormPass] = useState(false)

  const isAdmin = currentUser?.role === 'admin'
  const isSupervisor = currentUser?.role === 'supervisor'
  const isShipping = currentUser?.role === 'shipping'

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('app_users').select('*').order('created_at', { ascending: true })
    if (error) toast.error('Error al cargar usuarios')
    else setUsers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const openAdd = () => {
    setEditingUser(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (u: AppUser) => {
    setEditingUser(u)
    setForm({ username: u.username, password_text: u.password_text, full_name: u.full_name, role: u.role })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.username.trim() || !form.password_text.trim() || !form.full_name.trim()) {
      toast.error('Completa todos los campos')
      return
    }
    setSaving(true)

    if (editingUser) {
      const { error } = await supabase.from('app_users').update({
        username: form.username.trim().toLowerCase(),
        password_text: form.password_text,
        full_name: form.full_name.trim(),
        role: form.role,
        updated_at: new Date().toISOString(),
      }).eq('id', editingUser.id)
      if (error) toast.error('Error al actualizar: ' + error.message)
      else { toast.success('Usuario actualizado'); setShowForm(false); fetchUsers() }
    } else {
      const { error } = await supabase.from('app_users').insert([{
        username: form.username.trim().toLowerCase(),
        password_text: form.password_text,
        full_name: form.full_name.trim(),
        role: form.role,
      }])
      if (error) toast.error('Error al crear: ' + error.message)
      else { toast.success('Usuario creado exitosamente'); setShowForm(false); fetchUsers() }
    }
    setSaving(false)
  }

  const handleDelete = async (u: AppUser) => {
    if (u.id === currentUser?.id) { toast.error('No puedes eliminarte a ti mismo'); return }
    const { error } = await supabase.from('app_users').delete().eq('id', u.id)
    if (error) toast.error('Error al eliminar')
    else { toast.success('Usuario eliminado'); fetchUsers() }
  }

  const togglePass = (id: number) => setShowPasswords(p => ({ ...p, [id]: !p[id] }))

  // Determine available roles for the form
  const availableRoles: UserRole[] = isAdmin
    ? ['admin', 'supervisor', 'shipping']
    : ['shipping']

  // Shipping users can only edit their own profile
  const canEditUser = (u: AppUser) => {
    if (isAdmin) return true
    if (isSupervisor) return false
    if (isShipping) return u.id === currentUser?.id
    return false
  }

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>
            Gestión de Usuarios
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{users.length} usuarios registrados</p>
        </div>
        {(isAdmin || isSupervisor) && (
          <button onClick={openAdd} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
            borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff',
            fontWeight: 700, fontSize: 12, letterSpacing: '0.5px', cursor: 'pointer',
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            <UserPlus size={15} /> NUEVO USUARIO
          </button>
        )}
      </div>

      {/* Users grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Cargando...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {users.map(u => (
            <div key={u.id} style={{
              borderRadius: 12, border: `1px solid ${u.id === currentUser?.id ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
              backgroundColor: 'var(--bg-card)', padding: 20,
              boxShadow: u.id === currentUser?.id ? '0 0 0 1px rgba(99,102,241,0.2)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: ROLE_BG[u.role], border: `1px solid ${ROLE_COLORS[u.role]}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {u.role === 'admin' ? <Shield size={18} color={ROLE_COLORS[u.role]} /> :
                     u.role === 'supervisor' ? <Users size={18} color={ROLE_COLORS[u.role]} /> :
                     <Truck size={18} color={ROLE_COLORS[u.role]} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{u.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>@{u.username}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                  background: ROLE_BG[u.role], color: ROLE_COLORS[u.role], letterSpacing: '0.05em',
                }}>
                  {ROLE_LABELS[u.role].toUpperCase()}
                </span>
              </div>

              {/* Password row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                marginBottom: 14,
              }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                  {canSeePasswords
                    ? (showPasswords[u.id] ? u.password_text : '••••••••')
                    : (u.id === currentUser?.id
                        ? (showPasswords[u.id] ? u.password_text : '••••••••')
                        : '••••••••')}
                </span>
                {(canSeePasswords || u.id === currentUser?.id) && (
                  <button onClick={() => togglePass(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                    {showPasswords[u.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                {canEditUser(u) && (
                  <button onClick={() => openEdit(u)} style={{
                    flex: 1, height: 34, borderRadius: 8, border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLButtonElement).style.color = '#6366f1' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}>
                    <Edit2 size={12} /> Editar
                  </button>
                )}
                {canDeleteUsers && u.id !== currentUser?.id && (
                  <button onClick={() => handleDelete(u)} style={{
                    width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)',
                    background: 'transparent', color: '#f87171', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.08)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 24,
        }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{
            width: '100%', maxWidth: 420, borderRadius: 16,
            border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)',
            padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormField label="NOMBRE COMPLETO">
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Nombre completo" style={modalInputStyle} />
              </FormField>

              <FormField label="USUARIO">
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="Nombre de usuario (sin espacios)" style={modalInputStyle}
                  disabled={!!editingUser && !canEditAnyUser} />
              </FormField>

              <FormField label="CONTRASEÑA">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showFormPass ? 'text' : 'password'}
                    value={form.password_text}
                    onChange={e => setForm(f => ({ ...f, password_text: e.target.value }))}
                    placeholder="Contraseña"
                    style={{ ...modalInputStyle, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowFormPass(v => !v)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  }}>
                    {showFormPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </FormField>

              <FormField label="PERFIL">
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  style={{ ...modalInputStyle, cursor: 'pointer' }}
                  disabled={!canAddAnyUser && !isAdmin}>
                  {availableRoles.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </FormField>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={() => setShowForm(false)} style={{
                  flex: 1, height: 42, borderRadius: 8, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <X size={14} /> Cancelar
                </button>
                <button onClick={handleSave} disabled={saving} style={{
                  flex: 2, height: 42, borderRadius: 8, border: 'none',
                  background: saving ? 'rgba(99,102,241,0.5)' : '#6366f1',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const modalInputStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 12px', borderRadius: 8,
  border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)',
  color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: "'Inter', sans-serif",
}
