import { supabase } from '../config/supabase'

// Supabase bağlantısını test et
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('test').select('*').limit(1)
    if (error) {
      console.error('Supabase bağlantı hatası:', error)
      return false
    }
    console.log('Supabase bağlantısı başarılı')
    return true
  } catch (error) {
    console.error('Supabase bağlantı testi hatası:', error)
    return false
  }
}

// Supabase client'ını export et
export { supabase } 