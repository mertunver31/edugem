import { supabase } from '../config/supabase'

/**
 * Task Queue Service
 * GÜN 6 - AŞAMA 1: Task Queue Sistemi
 * Concurrency control ve status management
 */
class TaskQueueService {
  constructor() {
    this.workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Yeni task oluştur
   * @param {Object} params - Task parametreleri
   * @returns {Object} Oluşturma sonucu
   */
  async createTask(params) {
    try {
      const { documentId, segmentId, taskType, priority = 1, metadata = {} } = params

      // Kullanıcı kontrolü
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı oturumu bulunamadı')
      }

      // Task verilerini hazırla
      const taskData = {
        document_id: documentId,
        segment_id: segmentId,
        user_id: user.id,
        task_type: taskType,
        priority: priority,
        metadata: metadata
      }

      console.log('Task oluşturuluyor:', taskData)

      // Task'ı database'e ekle
      const { data, error } = await supabase
        .from('task_queue')
        .insert(taskData)
        .select()
        .single()

      if (error) {
        console.error('Task oluşturma hatası:', error)
        throw new Error(`Task oluşturulamadı: ${error.message}`)
      }

      console.log('Task başarıyla oluşturuldu:', data.id)
      return {
        success: true,
        task: data
      }

    } catch (error) {
      console.error('Task oluşturma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Document için tüm segmentler için task oluştur
   * @param {string} documentId - Document ID
   * @param {string} taskType - Task türü
   * @returns {Object} Oluşturma sonucu
   */
  async createTasksForDocument(documentId, taskType) {
    try {
      console.log(`Document ${documentId} için ${taskType} task'ları oluşturuluyor...`)

      // Document'ın segmentlerini al
      const { data: segments, error: segmentsError } = await supabase
        .from('segments')
        .select('id, seg_no')
        .eq('document_id', documentId)
        .order('seg_no', { ascending: true })

      if (segmentsError) {
        throw new Error(`Segment'ler alınamadı: ${segmentsError.message}`)
      }

      if (!segments || segments.length === 0) {
        throw new Error('Document için segment bulunamadı')
      }

      // Her segment için task oluştur
      const tasks = []
      for (const segment of segments) {
        const result = await this.createTask({
          documentId: documentId,
          segmentId: segment.id,
          taskType: taskType,
          priority: 10 - segment.seg_no, // İlk segmentler daha yüksek öncelik
          metadata: {
            segment_number: segment.seg_no,
            created_by: 'document_batch'
          }
        })

        if (result.success) {
          tasks.push(result.task)
        } else {
          console.error(`Segment ${segment.seg_no} için task oluşturulamadı:`, result.error)
        }
      }

      console.log(`${tasks.length} task başarıyla oluşturuldu`)
      return {
        success: true,
        tasks: tasks,
        totalSegments: segments.length,
        createdTasks: tasks.length
      }

    } catch (error) {
      console.error('Document task oluşturma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Bekleyen task'ları getir (concurrency control ile)
   * @param {number} limit - Maksimum task sayısı
   * @returns {Object} Task listesi
   */
  async getPendingTasks(limit = 10) {
    try {
      // Database fonksiyonunu kullan
      const { data, error } = await supabase
        .rpc('get_pending_tasks', { limit_count: limit })

      if (error) {
        console.error('Bekleyen task\'lar alınamadı:', error)
        throw new Error(`Task'lar alınamadı: ${error.message}`)
      }

      return {
        success: true,
        tasks: data || [],
      }

    } catch (error) {
      console.error('Bekleyen task\'lar getirme hatası:', error)
      return {
        success: false,
        error: error.message,
        tasks: [],
      }
    }
  }

  /**
   * Task'ı kilitle (concurrency control)
   * @param {string} taskId - Task ID
   * @returns {Object} Kilitleme sonucu
   */
  async lockTask(taskId) {
    try {
      console.log(`Task ${taskId} kilitleme deneniyor...`)

      // Database fonksiyonunu kullan
      const { data, error } = await supabase
        .rpc('lock_task', { 
          task_uuid: taskId, 
          worker_id: this.workerId 
        })

      if (error) {
        console.error('Task kilitleme hatası:', error)
        throw new Error(`Task kilitlenemedi: ${error.message}`)
      }

      if (data) {
        console.log(`Task ${taskId} başarıyla kilitlendi`)
        return {
          success: true,
          locked: true,
        }
      } else {
        console.log(`Task ${taskId} kilitlenemedi (zaten kilitli veya işleniyor)`)
        return {
          success: true,
          locked: false,
        }
      }

    } catch (error) {
      console.error('Task kilitleme hatası:', error)
      return {
        success: false,
        error: error.message,
        locked: false,
      }
    }
  }

  /**
   * Task'ı tamamla
   * @param {string} taskId - Task ID
   * @param {Object} resultData - Sonuç verileri
   * @returns {Object} Tamamlama sonucu
   */
  async completeTask(taskId, resultData = null) {
    try {
      console.log(`Task ${taskId} tamamlanıyor...`)

      // Database fonksiyonunu kullan
      const { data, error } = await supabase
        .rpc('complete_task', { 
          task_uuid: taskId, 
          result_data: resultData 
        })

      if (error) {
        console.error('Task tamamlama hatası:', error)
        throw new Error(`Task tamamlanamadı: ${error.message}`)
      }

      console.log(`Task ${taskId} başarıyla tamamlandı`)
      return {
        success: true,
        completed: true,
      }

    } catch (error) {
      console.error('Task tamamlama hatası:', error)
      return {
        success: false,
        error: error.message,
        completed: false,
      }
    }
  }

  /**
   * Task'ı başarısız olarak işaretle
   * @param {string} taskId - Task ID
   * @param {string} errorMessage - Hata mesajı
   * @param {Object} errorDetails - Hata detayları
   * @returns {Object} İşaretleme sonucu
   */
  async failTask(taskId, errorMessage, errorDetails = null) {
    try {
      console.log(`Task ${taskId} başarısız olarak işaretleniyor...`)

      // Database fonksiyonunu kullan
      const { data, error } = await supabase
        .rpc('fail_task', { 
          task_uuid: taskId, 
          error_msg: errorMessage,
          error_details: errorDetails
        })

      if (error) {
        console.error('Task başarısız işaretleme hatası:', error)
        throw new Error(`Task işaretlenemedi: ${error.message}`)
      }

      console.log(`Task ${taskId} başarısız olarak işaretlendi`)
      return {
        success: true,
        failed: true
      }

    } catch (error) {
      console.error('Task başarısız işaretleme hatası:', error)
      return {
        success: false,
        error: error.message,
        failed: false
      }
    }
  }

  /**
   * Kullanıcının task istatistiklerini getir
   * @returns {Object} İstatistikler
   */
  async getUserTaskStats() {
    try {
      // Kullanıcı kontrolü
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı oturumu bulunamadı')
      }

      // Database fonksiyonunu kullan
      const { data, error } = await supabase
        .rpc('get_user_task_stats', { user_uuid: user.id })

      if (error) {
        console.error('Task istatistikleri alınamadı:', error)
        throw new Error(`İstatistikler alınamadı: ${error.message}`)
      }

      return {
        success: true,
        stats: data[0] || {
          total_tasks: 0,
          pending_tasks: 0,
          processing_tasks: 0,
          completed_tasks: 0,
          failed_tasks: 0
        }
      }

    } catch (error) {
      console.error('Task istatistikleri getirme hatası:', error)
      return {
        success: false,
        error: error.message,
        stats: null
      }
    }
  }

  /**
   * Kullanıcının task'larını getir
   * @param {string} status - Task durumu (opsiyonel)
   * @param {number} limit - Maksimum sayı
   * @returns {Object} Task listesi
   */
  async getUserTasks(status = null, limit = 50) {
    try {
      // Kullanıcı kontrolü
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı oturumu bulunamadı')
      }

      let query = supabase
        .from('task_queue')
        .select(`
          *,
          documents(file_path),
          segments(title, p_start, p_end)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        console.error('Kullanıcı task\'ları alınamadı:', error)
        throw new Error(`Task'lar alınamadı: ${error.message}`)
      }

      return {
        success: true,
        tasks: data || []
      }

    } catch (error) {
      console.error('Kullanıcı task\'ları getirme hatası:', error)
      return {
        success: false,
        error: error.message,
        tasks: []
      }
    }
  }

  /**
   * Task'ı sil
   * @param {string} taskId - Task ID
   * @returns {Object} Silme sonucu
   */
  async deleteTask(taskId) {
    try {
      console.log(`Task ${taskId} siliniyor...`)

      const { error } = await supabase
        .from('task_queue')
        .delete()
        .eq('id', taskId)

      if (error) {
        console.error('Task silme hatası:', error)
        throw new Error(`Task silinemedi: ${error.message}`)
      }

      console.log(`Task ${taskId} başarıyla silindi`)
      return {
        success: true,
        deleted: true
      }

    } catch (error) {
      console.error('Task silme hatası:', error)
      return {
        success: false,
        error: error.message,
        deleted: false
      }
    }
  }

  /**
   * Worker ID'yi al
   * @returns {string} Worker ID
   */
  getWorkerId() {
    return this.workerId
  }
}

export default new TaskQueueService() 