import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL) as string
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Shipment = {
  id: number
  shipment: string
  box_type: string
  custom_box: string | null
  weight: number | null
  comments: string | null
  created_at: string
}
