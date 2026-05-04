import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export type UserRole = 'admin' | 'supervisor' | 'shipping'

export interface AppUser {
  id: number
  username: string
  password_text: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ error?: string }>
  logout: () => void
  // Permissions
  canManageUsers: boolean       // admin + supervisor
  canAddShippingUsers: boolean  // admin + supervisor
  canAddAnyUser: boolean        // admin only
  canSeePasswords: boolean      // admin only
  canDeleteUsers: boolean       // admin only
  canEditAnyUser: boolean       // admin only
  canDeleteShipments: boolean   // admin + supervisor
  canEditAllShipments: boolean  // admin + supervisor
}

const AuthContext = createContext<AuthContextType | null>(null)

const SESSION_KEY = 'shipping_session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from localStorage
    const saved = localStorage.getItem(SESSION_KEY)
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem(SESSION_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<{ error?: string }> => {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username.trim().toLowerCase())
      .eq('password_text', password)
      .single()

    if (error || !data) {
      return { error: 'Usuario o contraseña incorrectos' }
    }

    setUser(data)
    localStorage.setItem(SESSION_KEY, JSON.stringify(data))
    return {}
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  const role = user?.role

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    canManageUsers: role === 'admin' || role === 'supervisor',
    canAddShippingUsers: role === 'admin' || role === 'supervisor',
    canAddAnyUser: role === 'admin',
    canSeePasswords: role === 'admin',
    canDeleteUsers: role === 'admin',
    canEditAnyUser: role === 'admin',
    canDeleteShipments: role === 'admin' || role === 'supervisor',
    canEditAllShipments: role === 'admin' || role === 'supervisor',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
