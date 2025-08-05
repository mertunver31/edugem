import { supabase } from '../config/supabase'

// Supabase bağlantısını test et
export const testConnection = async () => {
  try {
    // Mevcut bir tablo ile test et (users tablosu)
    const { data, error } = await supabase.from('users').select('id').limit(1)
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