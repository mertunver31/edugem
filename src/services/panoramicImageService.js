import { supabase } from './supabaseService'
import { getCurrentUser } from './authService'

// Kullanıcının panoramik görüntülerini getir
export const getUserPanoramicImages = async () => {
  try {
    const { data, error } = await supabase
      .from('panoramic_images')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return { success: true, images: data }
  } catch (error) {
    console.error('Panoramik görüntüler getirme hatası:', error.message)
    return { success: false, error: error.message }
  }
}

// Yeni panoramik görüntü kaydet
export const savePanoramicImage = async (imageData) => {
  try {
    const { data, error } = await supabase
      .from('panoramic_images')
      .insert([imageData])
      .select()

    if (error) {
      throw error
    }

    return { success: true, image: data[0] }
  } catch (error) {
    console.error('Panoramik görüntü kaydetme hatası:', error.message)
    return { success: false, error: error.message }
  }
}

// Dosyayı Supabase Storage'a yükle
export const uploadPanoramicFile = async (file, fileName) => {
  try {
    const fileExt = file.name.split('.').pop()
    const filePath = `panoramic-images/${fileName}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('panoramic-images')
      .upload(filePath, file)

    if (error) {
      throw error
    }

    // Public URL al
    const { data: { publicUrl } } = supabase.storage
      .from('panoramic-images')
      .getPublicUrl(filePath)

    return { success: true, filePath, publicUrl }
  } catch (error) {
    console.error('Dosya yükleme hatası:', error.message)
    return { success: false, error: error.message }
  }
}

// Panoramik görüntüyü sil
export const deletePanoramicImage = async (imageId) => {
  try {
    const { error } = await supabase
      .from('panoramic_images')
      .delete()
      .eq('id', imageId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Panoramik görüntü silme hatası:', error.message)
    return { success: false, error: error.message }
  }
}

// Default panoramic resimleri kullanıcıya ata
export const assignDefaultPanoramicImages = async () => {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success) {
      return { success: false, error: 'Kullanıcı bilgileri alınamadı' }
    }

    const { data, error } = await supabase.rpc('assign_default_panoramic_images_to_user', {
      user_id: userResult.user.id
    })

    if (error) {
      console.error('Default panoramic assignment error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Default panoramic assignment error:', error)
    return { success: false, error: error.message }
  }
} 