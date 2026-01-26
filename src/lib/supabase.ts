// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database Types (generated from schema)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'ks' | 'gm' | 'wk' | 'gb' | 'ot'
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'admin' | 'ks' | 'gm' | 'wk' | 'gb' | 'ot'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'ks' | 'gm' | 'wk' | 'gb' | 'ot'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          nis: string
          nisn: string | null
          full_name: string
          gender: 'L' | 'P' | null
          birth_date: string | null
          birth_place: string | null
          address: string | null
          phone: string | null
          email: string | null
          parent_name: string | null
          parent_phone: string | null
          parent_email: string | null
          enrollment_date: string
          graduation_date: string | null
          status: string
          class_id: string | null
          profile_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nis: string
          nisn?: string | null
          full_name: string
          gender?: 'L' | 'P' | null
          birth_date?: string | null
          birth_place?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_email?: string | null
          enrollment_date?: string
          graduation_date?: string | null
          status?: string
          class_id?: string | null
          profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nis?: string
          nisn?: string | null
          full_name?: string
          gender?: 'L' | 'P' | null
          birth_date?: string | null
          birth_place?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_email?: string | null
          enrollment_date?: string
          graduation_date?: string | null
          status?: string
          class_id?: string | null
          profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add other table types as needed...
    }
    Views: {
      student_overview: {
        Row: {
          id: string
          nis: string
          full_name: string
          gender: string | null
          status: string
          class_name: string | null
          grade_level: number | null
          academic_year: string | null
          homeroom_teacher: string | null
          enrollment_date: string
          phone: string | null
          parent_name: string | null
          parent_phone: string | null
        }
      }
      financial_summary: {
        Row: {
          type: string
          total_amount: number
          transaction_count: number
          date: string
        }
      }
    }
    Functions: {
      // Add function types if needed
    }
    Enums: {
      user_role: 'admin' | 'ks' | 'gm' | 'wk' | 'gb' | 'ot'
      attendance_status: 'H' | 'S' | 'I' | 'A' | 'B' | 'C'
      payment_method: 'cash' | 'transfer' | 'qris' | 'other'
      schedule_type: 'regular' | 'exam' | 'extracurricular'
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]