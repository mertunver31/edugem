import { supabase } from '../config/supabase'
import { getCurrentUser } from './authService'

export const getUserAvatars = async () => {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      throw new Error('Kullanıcı girişi yapılmamış')
    }

    const { data, error } = await supabase
      .from('avatars')
      .select('*')
      .eq('user_id', userResult.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Avatar listesi getirme hatası:', error)
    throw error
  }
}

// Avatar dosyasını Supabase Storage'a yükle
export const uploadAvatarFile = async (file, fileName) => {
  try {
    const fileExt = file.name.split('.').pop()
    const filePath = `avatars/${fileName}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (error) {
      throw error
    }

    // Public URL al
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return { success: true, filePath, publicUrl }
  } catch (error) {
    console.error('Avatar dosya yükleme hatası:', error.message)
    return { success: false, error: error.message }
  }
}

// Yeni avatar kaydet
export const saveAvatar = async (avatarData) => {
  try {
    const { data, error } = await supabase
      .from('avatars')
      .insert([avatarData])
      .select()

    if (error) {
      throw error
    }

    return { success: true, avatar: data[0] }
  } catch (error) {
    console.error('Avatar kaydetme hatası:', error.message)
    return { success: false, error: error.message }
  }
}

// Avatar sil
export const deleteAvatar = async (avatarId) => {
  try {
    const { error } = await supabase
      .from('avatars')
      .delete()
      .eq('id', avatarId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Avatar silme hatası:', error.message)
    return { success: false, error: error.message }
  }
} 