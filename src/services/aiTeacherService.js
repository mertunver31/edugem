import { supabase } from '../config/supabase'
import { generateTextContent } from './geminiService'
import { getCurrentUser } from './authService'

// AI Öğretmen CRUD işlemleri
export const getAITeachers = async () => {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      throw new Error('Kullanıcı girişi yapılmamış')
    }

    const { data, error } = await supabase
      .from('ai_teachers')
      .select('*')
      .eq('user_id', userResult.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return { success: true, teachers: data || [] }
  } catch (error) {
    console.error('AI öğretmen listesi getirme hatası:', error)
    return { success: false, error: error.message }
  }
}

export const createAITeacher = async (teacherData) => {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      throw new Error('Kullanıcı girişi yapılmamış')
    }

    // Gemini API ile AI öğretmen karakteri oluştur
    const characterPrompt = `
    Sen ${teacherData.name} adında bir AI öğretmensin. 
    Branş: ${teacherData.subject}
    Uzmanlık: ${teacherData.specialty}
    Kişilik: ${teacherData.personality_type}
    Öğretim Stili: ${teacherData.teaching_style}
    Deneyim Seviyesi: ${teacherData.experience_level}/10
    Eğitim Seviyesi: ${teacherData.education_level}
    
    Karakter Açıklaması: ${teacherData.character_description}
    
    Bu bilgilere göre kendini tanıt ve nasıl bir öğretmen olduğunu açıkla. 
    Türkçe olarak, samimi ve profesyonel bir dil kullan.
    
    ÖNEMLİ: Yanıtını sadece düz metin olarak ver, JSON formatında verme. Sadece doğrudan yanıtını yaz.
    `

    const characterResponseResult = await generateTextContent(characterPrompt)
    
    const characterResponse = characterResponseResult.success 
      ? characterResponseResult.content 
      : teacherData.character_description
    
    const teacherToCreate = {
      ...teacherData,
      user_id: userResult.user.id,
      character_description: characterResponse
    }

    const { data, error } = await supabase
      .from('ai_teachers')
      .insert([teacherToCreate])
      .select()

    if (error) {
      throw error
    }

    return { success: true, teacher: data[0] }
  } catch (error) {
    console.error('AI öğretmen oluşturma hatası:', error)
    return { success: false, error: error.message }
  }
}

export const updateAITeacher = async (teacherId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('ai_teachers')
      .update(updateData)
      .eq('id', teacherId)
      .select()

    if (error) {
      throw error
    }

    return { success: true, teacher: data[0] }
  } catch (error) {
    console.error('AI öğretmen güncelleme hatası:', error)
    return { success: false, error: error.message }
  }
}

export const deleteAITeacher = async (teacherId) => {
  try {
    const { error } = await supabase
      .from('ai_teachers')
      .delete()
      .eq('id', teacherId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('AI öğretmen silme hatası:', error)
    return { success: false, error: error.message }
  }
}

// AI Öğretmen ile konuşma
export const chatWithAITeacher = async (teacherId, message, context = '') => {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      throw new Error('Kullanıcı girişi yapılmamış')
    }

    // AI öğretmen bilgilerini al
    const { data: teacherData, error: teacherError } = await supabase
      .from('ai_teachers')
      .select('*')
      .eq('id', teacherId)
      .single()

    if (teacherError || !teacherData) {
      throw new Error('AI öğretmen bulunamadı')
    }

    // Ders içeriklerini al (eğer varsa)
    const { data: lessonContents } = await supabase
      .from('lesson_contents')
      .select('*')
      .eq('ai_teacher_id', teacherId)

    // Gemini API ile yanıt oluştur
    const systemPrompt = `
    Sen ${teacherData.name} adında bir AI öğretmensin.
    
    Öğretmen Profili:
    - Branş: ${teacherData.subject}
    - Uzmanlık: ${teacherData.specialty}
    - Kişilik: ${teacherData.personality_type}
    - Öğretim Stili: ${teacherData.teaching_style}
    - Deneyim: ${teacherData.experience_level}/10
    - Eğitim Seviyesi: ${teacherData.education_level}
    
    Karakter: ${teacherData.character_description}
    
    ${lessonContents && lessonContents.length > 0 ? `
    Bildiğin Ders İçerikleri:
    ${lessonContents.map(content => `- ${content.title}: ${content.content.substring(0, 200)}...`).join('\n')}
    ` : ''}
    
    ${context ? `Ders Bağlamı: ${context}` : ''}
    
    Öğrencinin sorusuna bu bilgiler ışığında yanıt ver. 
    Kendi karakterine uygun, samimi ve eğitici bir dil kullan.
    Türkçe olarak yanıtla.
    
    ÖNEMLİ: Yanıtını sadece düz metin olarak ver, JSON formatında verme. Sadece doğrudan yanıtını yaz.
    `

    const responseResult = await generateTextContent(message, systemPrompt)
    
    if (!responseResult.success) {
      throw new Error(responseResult.error || 'AI yanıt oluşturulamadı')
    }
    
    const response = responseResult.content

    // Konuşma geçmişini kaydet
    const { data: conversationData, error: conversationError } = await supabase
      .from('ai_teacher_conversations')
      .insert([{
        ai_teacher_id: teacherId,
        user_id: userResult.user.id,
        message,
        response,
        context
      }])
      .select()

    if (conversationError) {
      console.error('Konuşma kaydetme hatası:', conversationError)
      throw conversationError
    }

    return { 
      success: true, 
      conversation: {
        id: conversationData[0].id,
        response: response,
        created_at: conversationData[0].created_at,
        context: context
      }
    }
  } catch (error) {
    console.error('AI öğretmen ile konuşma hatası:', error)
    return { success: false, error: error.message }
  }
}

// Konuşma geçmişini getir
export const getConversationHistory = async (teacherId) => {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      throw new Error('Kullanıcı girişi yapılmamış')
    }

    const { data, error } = await supabase
      .from('ai_teacher_conversations')
      .select('*')
      .eq('ai_teacher_id', teacherId)
      .eq('user_id', userResult.user.id)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return { success: true, conversations: data || [] }
  } catch (error) {
    console.error('Konuşma geçmişi getirme hatası:', error)
    return { success: false, error: error.message }
  }
}

// Ders içeriği ekleme
export const addLessonContent = async (teacherId, contentData) => {
  try {
    const lessonToCreate = {
      ...contentData,
      ai_teacher_id: teacherId
    }

    const { data, error } = await supabase
      .from('lesson_contents')
      .insert([lessonToCreate])
      .select()

    if (error) {
      throw error
    }

    return { success: true, content: data[0] }
  } catch (error) {
    console.error('Ders içeriği ekleme hatası:', error)
    return { success: false, error: error.message }
  }
}

// Ders içeriklerini getir
export const getLessonContents = async (teacherId) => {
  try {
    const { data, error } = await supabase
      .from('lesson_contents')
      .select('*')
      .eq('ai_teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return { success: true, contents: data || [] }
  } catch (error) {
    console.error('Ders içerikleri getirme hatası:', error)
    return { success: false, error: error.message }
  }
}

// Avatar URL'ini güncelle
export const updateTeacherAvatar = async (teacherId, avatarUrl) => {
  try {
    const { data, error } = await supabase
      .from('ai_teachers')
      .update({ avatar_url: avatarUrl })
      .eq('id', teacherId)
      .select()

    if (error) {
      throw error
    }

    return { success: true, teacher: data[0] }
  } catch (error) {
    console.error('AI öğretmen avatar güncelleme hatası:', error)
    return { success: false, error: error.message }
  }
}

// AI Öğretmen istatistikleri
export const getTeacherStats = async () => {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      throw new Error('Kullanıcı girişi yapılmamış')
    }

    const { data: teachers, error: teachersError } = await supabase
      .from('ai_teachers')
      .select('id, experience_level')
      .eq('user_id', userResult.user.id)
      .eq('is_active', true)

    if (teachersError) {
      throw teachersError
    }

    const { data: conversations, error: conversationsError } = await supabase
      .from('ai_teacher_conversations')
      .select('id')
      .eq('user_id', userResult.user.id)

    if (conversationsError) {
      throw conversationsError
    }

    const stats = {
      totalTeachers: teachers.length,
      totalConversations: conversations.length,
      averageExperience: teachers.length > 0 
        ? Math.round(teachers.reduce((sum, t) => sum + t.experience_level, 0) / teachers.length)
        : 0
    }

    return { success: true, stats }
  } catch (error) {
    console.error('AI öğretmen istatistikleri getirme hatası:', error)
    return { success: false, error: error.message }
  }
} 