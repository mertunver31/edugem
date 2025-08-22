import { supabase } from '../config/supabase'
import { generateTextContent } from './geminiService'

// Yardımcı: oturumdaki kullanıcıyı getir
async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return { success: false, error: error?.message || 'user_not_found', user: null }
    }
    return { success: true, user: data.user }
  } catch (e) {
    return { success: false, error: e.message, user: null }
  }
}

// Sınıf mesajlarını getir
export const getClassroomMessages = async (classroomId) => {
  try {
    const { data, error } = await supabase
      .from('classroom_messages')
      .select(`
        *,
        ai_teachers!inner(name, subject, avatar_url),
        users!inner(name, avatar_url)
      `)
      .eq('classroom_id', classroomId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return { success: true, messages: data || [] }
  } catch (error) {
    console.error('Sınıf mesajları getirme hatası:', error)
    return { success: false, error: error.message }
  }
}

// Kullanıcı mesajı gönder
export const sendUserMessage = async (classroomId, message, contextData = {}) => {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      throw new Error('Kullanıcı girişi yapılmamış')
    }

    const { data, error } = await supabase
      .from('classroom_messages')
      .insert([{
        classroom_id: classroomId,
        sender_type: 'user',
        sender_id: userResult.user.id,
        message,
        message_type: 'text',
        context_data: contextData
      }])
      .select()

    if (error) {
      throw error
    }

    return { success: true, message: data[0] }
  } catch (error) {
    console.error('Kullanıcı mesajı gönderme hatası:', error)
    return { success: false, error: error.message }
  }
}

// AI öğretmen yanıtı oluştur ve gönder
export const generateAIResponse = async (classroomId, userMessage, contextData = {}) => {
  try {
    // Context'ten AI öğretmen bilgisini al
    const aiTeacher = contextData.aiTeacher

    if (!aiTeacher) {
      throw new Error('AI öğretmen bilgisi bulunamadı')
    }

    // Ders içeriklerini al
    const { data: lessonContents } = await supabase
      .from('lesson_contents')
      .select('*')
      .eq('ai_teacher_id', aiTeacher.id)

    // Gemini API ile yanıt oluştur
    const systemPrompt = `
    Sen ${aiTeacher.name} adında bir AI öğretmensin ve şu anda bir panoramik sınıfta öğrenciyle konuşuyorsun.
    
    Öğretmen Profili:
    - Branş: ${aiTeacher.subject}
    - Uzmanlık: ${aiTeacher.specialty}
    - Kişilik: ${aiTeacher.personality_type}
    - Öğretim Stili: ${aiTeacher.teaching_style}
    - Deneyim: ${aiTeacher.experience_level}/10
    - Eğitim Seviyesi: ${aiTeacher.education_level}
    
    Karakter: ${aiTeacher.character_description}
    
    ${lessonContents && lessonContents.length > 0 ? `
    Bildiğin Ders İçerikleri:
    ${lessonContents.map(content => `- ${content.title}: ${content.content.substring(0, 200)}...`).join('\n')}
    ` : ''}
    
    ${contextData.lessonContext ? `Mevcut Ders Bağlamı: ${contextData.lessonContext}` : ''}
    ${contextData.subject ? `Ders Konusu: ${contextData.subject}` : ''}
    
    Öğrencinin sorusuna bu bilgiler ışığında yanıt ver. 
    Kendi karakterine uygun, samimi ve eğitici bir dil kullan.
    Sınıf ortamında olduğunu unutma, daha interaktif ve destekleyici ol.
    Türkçe olarak yanıtla.
    `

    const response = await generateTextContent(userMessage, systemPrompt)

    // AI öğretmen yanıtını kaydet
    const { data, error } = await supabase
      .from('classroom_messages')
      .insert([{
        classroom_id: classroomId,
        sender_type: 'ai_teacher',
        sender_id: aiTeacher.id,
        message: response,
        message_type: 'answer',
        context_data: contextData
      }])
      .select()

    if (error) {
      throw error
    }

    return { success: true, message: data[0] }
  } catch (error) {
    console.error('AI yanıt oluşturma hatası:', error)
    return { success: false, error: error.message }
  }
}

// Sınıf katılımcılarını getir
export const getClassroomParticipants = async (classroomId) => {
  try {
    const { data, error } = await supabase
      .from('classroom_participants')
      .select(`
        *,
        ai_teachers(*),
        users(name, avatar_url)
      `)
      .eq('classroom_id', classroomId)

    if (error) {
      throw error
    }

    return { success: true, participants: data || [] }
  } catch (error) {
    console.error('Sınıf katılımcıları getirme hatası:', error)
    return { success: false, error: error.message }
  }
}

// AI öğretmeni sınıfa ekle
export const addAITeacherToClassroom = async (classroomId, teacherId, position = { x: 0, y: 0, z: 0 }) => {
  try {
    const { data, error } = await supabase
      .from('classroom_participants')
      .insert([{
        classroom_id: classroomId,
        ai_teacher_id: teacherId,
        position_x: position.x,
        position_y: position.y,
        position_z: position.z,
        is_online: true
      }])
      .select()

    if (error) {
      throw error
    }

    return { success: true, participant: data[0] }
  } catch (error) {
    console.error('AI öğretmen sınıfa ekleme hatası:', error)
    return { success: false, error: error.message }
  }
}

// Kullanıcıyı sınıfa ekle
export const addUserToClassroom = async (classroomId, position = { x: 0, y: 0, z: 0 }) => {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      throw new Error('Kullanıcı girişi yapılmamış')
    }

    const { data, error } = await supabase
      .from('classroom_participants')
      .insert([{
        classroom_id: classroomId,
        user_id: userResult.user.id,
        position_x: position.x,
        position_y: position.y,
        position_z: position.z,
        is_online: true
      }])
      .select()

    if (error) {
      throw error
    }

    return { success: true, participant: data[0] }
  } catch (error) {
    console.error('Kullanıcı sınıfa ekleme hatası:', error)
    return { success: false, error: error.message }
  }
}

// Katılımcı pozisyonunu güncelle
export const updateParticipantPosition = async (participantId, position) => {
  try {
    const { data, error } = await supabase
      .from('classroom_participants')
      .update({
        position_x: position.x,
        position_y: position.y,
        position_z: position.z
      })
      .eq('id', participantId)
      .select()

    if (error) {
      throw error
    }

    return { success: true, participant: data[0] }
  } catch (error) {
    console.error('Katılımcı pozisyon güncelleme hatası:', error)
    return { success: false, error: error.message }
  }
}

// Katılımcıyı sınıftan çıkar
export const removeParticipantFromClassroom = async (participantId) => {
  try {
    const { error } = await supabase
      .from('classroom_participants')
      .delete()
      .eq('id', participantId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Katılımcı sınıftan çıkarma hatası:', error)
    return { success: false, error: error.message }
  }
}

// Sınıf mesajlarını gerçek zamanlı dinle
export const subscribeToClassroomMessages = (classroomId, callback) => {
  const subscription = supabase
    .channel(`classroom_messages_${classroomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'classroom_messages',
        filter: `classroom_id=eq.${classroomId}`
      },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()

  return subscription
}

// Sınıf katılımcılarını gerçek zamanlı dinle
export const subscribeToClassroomParticipants = (classroomId, callback) => {
  const subscription = supabase
    .channel(`classroom_participants_${classroomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'classroom_participants',
        filter: `classroom_id=eq.${classroomId}`
      },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()

  return subscription
} 