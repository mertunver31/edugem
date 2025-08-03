import { supabase } from '../config/supabase'
import concurrencyManager from './concurrencyManagerService'

/**
 * Queue Manager Service
 * GÜN 8 - AŞAMA 2: Concurrency Control - Task Sıralaması
 * Worker task'larını sıralama ve yönetme
 */
class QueueManagerService {
  constructor() {
    this.queueId = `queue-manager-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Task queue'ları
    this.pendingQueue = []
    this.processingQueue = []
    this.completedQueue = []
    this.failedQueue = []
    
    // Queue ayarları
    this.queueConfig = {
      maxPendingTasks: 50,
      maxProcessingTasks: 10,
      maxRetries: 3,
      retryDelayMs: 5000,
      priorityLevels: ['HIGH', 'MEDIUM', 'LOW']
    }
    
    // Queue processing
    this.isProcessing = false
    this.processingInterval = null
    
    // Event listeners
    this.eventListeners = new Map()
  }

  /**
   * Task'ı queue'ya ekle
   * @param {Object} task - Task objesi
   * @returns {Object} Ekleme sonucu
   */
  async addTask(task) {
    try {
      console.log(`Task queue'ya ekleniyor: ${task.type} - ${task.segmentId}`)
      
      // Priority'yi integer'a çevir
      const priorityMap = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
      const priorityValue = priorityMap[task.priority || 'MEDIUM'] || 2
      
      // Task kaydı oluştur (ID database tarafından otomatik oluşturulacak)
      const taskRecord = {
        type: task.type,
        segmentId: task.segmentId,
        priority: priorityValue,
        status: 'PENDING',
        config: task.config || {},
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        retryCount: 0,
        errorCount: 0,
        dependencies: task.dependencies || [],
        metadata: task.metadata || {}
      }
      
      // Queue limit kontrolü
      if (this.pendingQueue.length >= this.queueConfig.maxPendingTasks) {
        throw new Error('Queue kapasitesi dolu')
      }
      
      // Priority'ye göre sırala ve ekle
      this.insertTaskByPriority(taskRecord)
      
      // Database'e kaydet
      await this.saveTaskRecord(taskRecord)
      
      // Queue processing'i başlat
      this.startQueueProcessing()
      
      console.log(`Task queue'ya eklendi: ${taskRecord.id}`)
      return {
        success: true,
        taskId: taskRecord.id,
        position: this.getTaskPosition(taskRecord.id)
      }
      
    } catch (error) {
      console.error('Task ekleme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Task'ı priority'ye göre sırala ve ekle
   * @param {Object} taskRecord - Task kaydı
   */
  insertTaskByPriority(taskRecord) {
    // Priority artık integer (3=HIGH, 2=MEDIUM, 1=LOW)
    const taskPriority = taskRecord.priority
    
    let insertIndex = 0
    for (let i = 0; i < this.pendingQueue.length; i++) {
      const currentPriority = this.pendingQueue[i].priority
      if (taskPriority >= currentPriority) { // Yüksek priority önce gelir
        insertIndex = i + 1
      } else {
        break
      }
    }
    
    this.pendingQueue.splice(insertIndex, 0, taskRecord)
  }

  /**
   * Queue processing'i başlat
   */
  startQueueProcessing() {
    if (this.isProcessing) return
    
    this.isProcessing = true
    this.processingInterval = setInterval(() => {
      this.processQueue()
    }, 1000) // Her saniye kontrol et
    
    console.log('Queue processing başlatıldı')
  }

  /**
   * Queue processing'i durdur
   */
  stopQueueProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    this.isProcessing = false
    console.log('Queue processing durduruldu')
  }

  /**
   * Queue'yu işle
   */
  async processQueue() {
    try {
      // Processing limit kontrolü
      if (this.processingQueue.length >= this.queueConfig.maxProcessingTasks) {
        return
      }
      
      // Pending queue'dan task al
      const task = this.pendingQueue.shift()
      if (!task) return
      
      // Task'ı processing'e taşı
      task.status = 'PROCESSING'
      task.startedAt = new Date().toISOString()
      this.processingQueue.push(task)
      
      // Database'i güncelle
      await this.updateTaskStatus(task.id, 'PROCESSING')
      
      // Worker'ı başlat
      await this.executeTask(task)
      
    } catch (error) {
      console.error('Queue processing hatası:', error)
    }
  }

  /**
   * Task'ı çalıştır
   * @param {Object} task - Task objesi
   */
  async executeTask(task) {
    try {
      console.log(`Task çalıştırılıyor: ${task.id}`)
      
      // Concurrency Manager ile worker kaydı
      const workerResult = await concurrencyManager.registerWorker(
        task.type,
        task.segmentId,
        task.config
      )
      
      if (!workerResult.success) {
        throw new Error(`Worker kaydı başarısız: ${workerResult.error}`)
      }
      
      // Worker'ı başlat
      await concurrencyManager.startWorker(workerResult.workerId)
      
      // Task'ı worker ile ilişkilendir
      task.workerId = workerResult.workerId
      
      // Task'ı tamamla
      await this.completeTask(task, { workerId: workerResult.workerId })
      
    } catch (error) {
      console.error(`Task çalıştırma hatası: ${task.id}`, error)
      await this.failTask(task, error)
    }
  }

  /**
   * Task'ı tamamla
   * @param {Object} task - Task objesi
   * @param {Object} result - Sonuç
   */
  async completeTask(task, result = {}) {
    try {
      // Task durumunu güncelle
      task.status = 'COMPLETED'
      task.completedAt = new Date().toISOString()
      task.result = result
      
      // Processing queue'dan kaldır
      this.processingQueue = this.processingQueue.filter(t => t.id !== task.id)
      
      // Completed queue'ya ekle
      this.completedQueue.push(task)
      
      // Database'i güncelle
      await this.updateTaskStatus(task.id, 'COMPLETED', result)
      
      // Worker'ı tamamla
      if (task.workerId) {
        await concurrencyManager.completeWorker(task.workerId, result)
      }
      
      // Event emit
      this.emitEvent('taskCompleted', { task, result })
      
      console.log(`Task tamamlandı: ${task.id}`)
      
    } catch (error) {
      console.error('Task tamamlama hatası:', error)
    }
  }

  /**
   * Task'ı hata ile sonlandır
   * @param {Object} task - Task objesi
   * @param {Error} error - Hata
   */
  async failTask(task, error) {
    try {
      // Hata sayısını artır
      task.errorCount++
      task.lastError = error.message
      
      // Processing queue'dan kaldır
      this.processingQueue = this.processingQueue.filter(t => t.id !== task.id)
      
      // Retry kontrolü
      if (task.errorCount < this.queueConfig.maxRetries) {
        task.status = 'RETRYING'
        task.retryCount++
        
        // Retry delay sonrası tekrar queue'ya ekle
        setTimeout(() => {
          task.status = 'PENDING'
          this.insertTaskByPriority(task)
        }, this.queueConfig.retryDelayMs)
        
        // Database'i güncelle
        await this.updateTaskStatus(task.id, 'RETRYING', { error: error.message })
        
        console.log(`Task retry ediliyor: ${task.id} (${task.retryCount}/${this.queueConfig.maxRetries})`)
        
      } else {
        // Maksimum retry aşıldı
        task.status = 'FAILED'
        task.completedAt = new Date().toISOString()
        
        // Failed queue'ya ekle
        this.failedQueue.push(task)
        
        // Database'i güncelle
        await this.updateTaskStatus(task.id, 'FAILED', { error: error.message })
        
        // Worker'ı hata ile sonlandır
        if (task.workerId) {
          await concurrencyManager.failWorker(task.workerId, error)
        }
        
        // Event emit
        this.emitEvent('taskFailed', { task, error })
        
        console.log(`Task başarısız: ${task.id} (maksimum retry aşıldı)`)
      }
      
    } catch (updateError) {
      console.error('Task hata sonlandırma hatası:', updateError)
    }
  }

  /**
   * Task pozisyonunu al
   * @param {string} taskId - Task ID
   * @returns {number} Pozisyon
   */
  getTaskPosition(taskId) {
    const pendingIndex = this.pendingQueue.findIndex(t => t.id === taskId)
    if (pendingIndex !== -1) return pendingIndex + 1
    
    const processingIndex = this.processingQueue.findIndex(t => t.id === taskId)
    if (processingIndex !== -1) return this.pendingQueue.length + processingIndex + 1
    
    return -1 // Bulunamadı
  }

  /**
   * Task kaydını database'e kaydet
   * @param {Object} taskRecord - Task kaydı
   */
  async saveTaskRecord(taskRecord) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı')
      }
      
      // Segment'ten document_id'yi al
      const { data: segmentData, error: segmentError } = await supabase
        .from('segments')
        .select('document_id')
        .eq('id', taskRecord.segmentId)
        .single()
      
      if (segmentError || !segmentData) {
        throw new Error(`Segment bulunamadı: ${taskRecord.segmentId}`)
      }
      
      const { data, error } = await supabase
        .from('task_queue')
        .insert({
          task_type: taskRecord.type,
          document_id: segmentData.document_id,
          segment_id: taskRecord.segmentId,
          user_id: user.id,
          priority: taskRecord.priority,
          status: taskRecord.status,
          metadata: taskRecord.metadata,
          created_at: taskRecord.createdAt
        })
        .select('id')
        .single()
      
      if (error) {
        throw new Error(`Task kaydı kaydedilemedi: ${error.message}`)
      }
      
      // Generated ID'yi taskRecord'a ekle
      taskRecord.id = data.id
      
    } catch (error) {
      console.error('Task kaydı kaydetme hatası:', error)
      throw error
    }
  }

  /**
   * Task durumunu database'de güncelle
   * @param {string} taskId - Task ID
   * @param {string} status - Yeni durum
   * @param {Object} result - Sonuç verisi
   */
  async updateTaskStatus(taskId, status, result = {}) {
    try {
      const updateData = {
        status: status
      }
      
      if (status === 'PROCESSING') {
        updateData.started_at = new Date().toISOString()
      } else if (status === 'COMPLETED' || status === 'FAILED') {
        updateData.completed_at = new Date().toISOString()
        updateData.result_data = result
      }
      
      const { error } = await supabase
        .from('task_queue')
        .update(updateData)
        .eq('id', taskId)
      
      if (error) {
        throw new Error(`Task durumu güncellenemedi: ${error.message}`)
      }
      
    } catch (error) {
      console.error('Task durumu güncelleme hatası:', error)
      throw error
    }
  }

  /**
   * Queue istatistiklerini al
   * @returns {Object} İstatistikler
   */
  getQueueStats() {
    return {
      pending: this.pendingQueue.length,
      processing: this.processingQueue.length,
      completed: this.completedQueue.length,
      failed: this.failedQueue.length,
      total: this.pendingQueue.length + this.processingQueue.length + 
             this.completedQueue.length + this.failedQueue.length
    }
  }

  /**
   * Event listener ekle
   * @param {string} event - Event adı
   * @param {Function} callback - Callback fonksiyonu
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }

  /**
   * Event emit et
   * @param {string} event - Event adı
   * @param {Object} data - Event verisi
   */
  emitEvent(event, data) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Event listener hatası: ${event}`, error)
        }
      })
    }
  }

  /**
   * Queue ID'yi al
   * @returns {string} Queue ID
   */
  getQueueId() {
    return this.queueId
  }
}

export default new QueueManagerService() 