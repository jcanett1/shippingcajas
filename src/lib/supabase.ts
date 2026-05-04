import { createClient } from '@supabase/supabase-js'

// Supabase anon key is safe to expose in frontend code
// It is a public key designed for browser use, protected by Row Level Security
const supabaseUrl = 'https://lwdapqzcrezgfkhgftac.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3ZGFwcXpjcmV6Z2ZraGdmdGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MTg0MzYsImV4cCI6MjA2NzQ5NDQzNn0.7X8mYgIVUTvaQXS5UE2gdlogolPQQmcOqzgaVemCI7k'

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
