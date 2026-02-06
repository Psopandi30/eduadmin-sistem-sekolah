// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Helper to check if credentials are valid (not placeholders)
const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('[PROJECT-ID]') &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('[YOUR-ANON-KEY]') &&
  !supabaseAnonKey.includes('your-supabase-anon-key');

// Create a safe client or null
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
  : null as any;

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => !!isConfigured;

export const checkSupabaseConnection = async () => {
  if (!isConfigured) return { success: false, message: 'Supabase is not configured' };
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return { success: true, message: 'Connected to Supabase' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection failed' };
  }
};

export const getSupabaseConfigError = () => {
  if (!supabaseUrl || !supabaseAnonKey) return 'Missing Supabase environment variables in .env.local';
  if (!isConfigured) return 'Supabase environment variables are still using placeholder values';
  return null;
};

// Control whether fallback (legacy/local) authentication is allowed.
// In production deployments set VITE_ALLOW_FALLBACK_AUTH=false to disable fallback entirely.
export const isFallbackAuthAllowed = () => {
  // Default to true when variable is not set (legacy/dev), but treat explicit 'false' as disabled
  return (import.meta.env.VITE_ALLOW_FALLBACK_AUTH ?? 'true') !== 'false';
};

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
          mother_name: string | null
          father_job: string | null
          mother_job: string | null
          password: string | null
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
          mother_name?: string | null
          father_job?: string | null
          mother_job?: string | null
          password?: string | null
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
          mother_name?: string | null
          father_job?: string | null
          mother_job?: string | null
          password?: string | null
          status?: string
          class_id?: string | null
          profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      staff: {
        Row: {
          id: string
          employee_number: string
          position: string
          profile_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_number: string
          position: string
          profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_number?: string
          position?: string
          profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      app_settings: {
        Row: {
          key: string
          value: any
          updated_at: string
        }
        Insert: {
          key: string
          value: any
          updated_at?: string
        }
        Update: {
          key?: string
          value?: any
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          grade_level: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          grade_level: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          grade_level?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      },
      teachers: {
        Row: {
          id: string
          nip: string | null
          full_name: string
          role: string | null
          status: string
          profile_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nip?: string | null
          full_name: string
          role?: string | null
          status?: string
          profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nip?: string | null
          full_name?: string
          role?: string | null
          status?: string
          profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
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