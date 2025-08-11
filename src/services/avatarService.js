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

// Ready Player Me ile avatar oluştur
export const createAvatarWithReadyPlayerMe = async () => {
  try {
    // Ready Player Me URL'ini aç
    const readyPlayerMeUrl = 'https://readyplayer.me/'
    
    // Yeni pencerede Ready Player Me'yi aç
    const newWindow = window.open(readyPlayerMeUrl, '_blank', 'width=1200,height=800')
    
    // Kullanıcıya talimat ver
    alert('Ready Player Me açıldı. Avatarınızı oluşturduktan sonra URL\'i kopyalayıp buraya yapıştırın.')
    
    // URL girişi için prompt göster
    const avatarUrl = prompt('Ready Player Me avatar URL\'inizi buraya yapıştırın:')
    
    if (!avatarUrl) {
      return { success: false, error: 'Avatar URL\'i girilmedi' }
    }

    // URL'i doğrula
    if (!avatarUrl.includes('readyplayer.me')) {
      return { success: false, error: 'Geçersiz Ready Player Me URL\'i' }
    }

    return { success: true, avatarUrl }
  } catch (error) {
    console.error('Avatar oluşturma hatası:', error)
    return { success: false, error: error.message }
  }
}

// Avatar dosyasını Supabase Storage'a yükle
export const uploadAvatarFile = async (file, fileName) => {
  try {
    if (!file) {
      throw new Error('Dosya seçilmedi')
    }

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

// AI Öğretmen için avatar oluştur (Ready Player Me ile)
export const createAITeacherAvatar = async () => {
  try {
    const result = await createAvatarWithReadyPlayerMe()
    
    if (result.success) {
      return { success: true, avatarUrl: result.avatarUrl }
    } else {
      return { success: false, error: result.error }
    }
  } catch (error) {
    console.error('AI öğretmen avatar oluşturma hatası:', error)
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

// Avatar ismini güncelle
export const renameAvatar = async (avatarId, newName) => {
  try {
    const { data, error } = await supabase
      .from('avatars')
      .update({ name: newName })
      .eq('id', avatarId)
      .select()

    if (error) {
      throw error
    }

    return { success: true, avatar: data?.[0] }
  } catch (error) {
    console.error('Avatar yeniden adlandırma hatası:', error.message)
    return { success: false, error: error.message }
  }
}