
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

async function test() {
    const { data, error } = await supabase.from('schedules').select('*').limit(1)
    if (error) {
        console.error('Error fetching schedules:', error.message)
    } else {
        console.log('Schedules exist! Data:', data)
    }
}

test()
