import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdnmhbqxvkdfjvufjvff.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbm1oYnF4dmtkZmp2dWZqdmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTkwNjcsImV4cCI6MjA2ODg5NTA2N30.zXkkHypG8jFSAX2m639pmikYfJZpTEU2wyWCnMJaf2U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 