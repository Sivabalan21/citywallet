import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Service key exists:', !!supabaseKey)
console.log('Service key prefix:', supabaseKey?.slice(0, 20))

export const supabase = createClient(supabaseUrl, supabaseKey)