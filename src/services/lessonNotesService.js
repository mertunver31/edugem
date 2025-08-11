import { supabase } from '../config/supabase'

class LessonNotesService {
  async getNotes(documentId) {
    if (!documentId) throw new Error('Belge ID gerekli')
    const { data, error } = await supabase
      .from('lesson_notes')
      .select('id, document_id, user_id, content, created_at')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  async addNote(documentId, content) {
    if (!documentId) throw new Error('Belge ID gerekli')
    if (!content || !content.trim()) throw new Error('Not içeriği boş olamaz')

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!userData?.user?.id) throw new Error('Kullanıcı oturumu bulunamadı')

    const { data, error } = await supabase
      .from('lesson_notes')
      .insert({
        document_id: documentId,
        user_id: userData.user.id,
        content: content.trim()
      })
      .select('id, document_id, user_id, content, created_at')
      .single()
    if (error) throw error
    return data
  }
}

const lessonNotesService = new LessonNotesService()
export default lessonNotesService
