import { supabase } from './supabaseService'

// Kullanıcı girişi
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      throw error
    }

    return { success: true, user: data.user }
  } catch (error) {
    console.error('Giriş hatası:', error.message)
    return { success: false, error: error.message }
  }
}

// Kullanıcı kaydı
export const signUp = async (email, password, name) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name
        }
      }
    })

    if (error) {
      throw error
    }

    return { success: true, user: data.user }
  } catch (error) {
    console.error('Kayıt hatası:', error.message)
    return { success: false, error: error.message }
  }
}

// Kullanıcı çıkışı
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    return { success: true }
  } catch (error) {
    console.error('Çıkış hatası:', error.message)
    return { success: false, error: error.message }
  }
}

// Mevcut kullanıcıyı al
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      throw error
    }
    return { success: true, user }
  } catch (error) {
    console.error('Kullanıcı alma hatası:', error.message)
    return { success: false, error: error.message }
  }
}

// Auth state değişikliklerini dinle
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
} 