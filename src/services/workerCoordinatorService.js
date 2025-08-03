import textWorkerService from './textWorkerService'
import imageWorkerService from './imageWorkerService'
import concurrencyManager from './concurrencyManagerService'
import queueManager from './queueManagerService'

/**
 * Worker Coordinator Service
 * GÜN 8 - AŞAMA 3: Concurrency Control - Worker Koordinasyonu
 * Worker'lar arası koordinasyon ve senkronizasyon
 */
class WorkerCoordinatorService {
  constructor() {
    this.coordinatorId = `worker-coordinator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Worker servisleri
    this.workers = {
      TEXT_WORKER: textWorkerService,
      IMAGE_WORKER: imageWorkerService
    }
    
    // Koordinasyon ayarları
    this.coordinationConfig = {
      maxConcurrentSegments: 5,
      segmentTimeoutMs: 300000, // 5 dakika
      workerDependencies: {
        IMAGE_WORKER: ['TEXT_WORKER'] // Image Worker, Text Worker'ı bekler
      }
    }
    
    // Segment tracking
    this.activeSegments = new Map()
    this.segmentTimeouts = new Map()
    
    // Event listeners
    this.eventListeners = new Map()
    
    // Queue event listeners
    this.setupQueueListeners()
  }

  /**
   * Segment için worker'ları koordine et
   * @param {string} segmentId - Segment ID
   * @param {Array} workerTypes - Çalıştırılacak worker türleri
   * @param {Object} options - Koordinasyon seçenekleri
   * @returns {Object} Koordinasyon sonucu
   */
  async coordinateSegmentWorkers(segmentId, workerTypes = ['TEXT_WORKER', 'IMAGE_WORKER'], options = {}) {
    try {
      console.log(`Segment worker koordinasyonu başlatılıyor: ${segmentId}`)
      
      // Segment tracking başlat
      const segmentRecord = {
        id: segmentId,
        workerTypes: workerTypes,
        status: 'COORDINATING',
        startedAt: new Date().toISOString(),
        completedWorkers: [],
        failedWorkers: [],
        results: {},
        options: options
      }
      
      this.activeSegments.set(segmentId, segmentRecord)
      
      // Segment timeout ayarla
      this.setSegmentTimeout(segmentId)
      
      // Worker'ları sırayla başlat
      const results = await this.executeWorkersSequentially(segmentId, workerTypes, options)
      
      // Segment'i tamamla
      await this.completeSegment(segmentId, results)
      
      return {
        success: true,
        segmentId: segmentId,
        results: results
      }
      
    } catch (error) {
      console.error('Segment worker koordinasyonu hatası:', error)
      await this.failSegment(segmentId, error)
      return {
        success: false,
        error: error.message,
        segmentId: segmentId
      }
    }
  }

  /**
   * Worker'ları sırayla çalıştır
   * @param {string} segmentId - Segment ID
   * @param {Array} workerTypes - Worker türleri
   * @param {Object} options - Seçenekler
   * @returns {Object} Sonuçlar
   */
  async executeWorkersSequentially(segmentId, workerTypes, options) {
    const results = {}
    
    for (const workerType of workerTypes) {
      try {
        console.log(`Worker başlatılıyor: ${workerType} - ${segmentId}`)
        
        // Dependency kontrolü (sadece birden fazla worker varsa)
        if (workerTypes.length > 1) {
          const dependencies = this.coordinationConfig.workerDependencies[workerType] || []
          const dependenciesMet = await this.checkDependencies(segmentId, dependencies, results)
          
          if (!dependenciesMet) {
            throw new Error(`${workerType} için gerekli bağımlılıklar karşılanmadı`)
          }
        }
        
        // Worker'ı çalıştır
        const workerResult = await this.executeWorker(segmentId, workerType, options)
        results[workerType] = workerResult
        
        // Segment record'u güncelle
        const segmentRecord = this.activeSegments.get(segmentId)
        if (segmentRecord) {
          segmentRecord.completedWorkers.push(workerType)
          segmentRecord.results[workerType] = workerResult
        }
        
        console.log(`Worker tamamlandı: ${workerType} - ${segmentId}`)
        
      } catch (error) {
        console.error(`Worker hatası: ${workerType} - ${segmentId}`, error)
        
        // Segment record'u güncelle
        const segmentRecord = this.activeSegments.get(segmentId)
        if (segmentRecord) {
          segmentRecord.failedWorkers.push(workerType)
          segmentRecord.results[workerType] = { error: error.message }
        }
        
        // Hata durumunda devam et veya dur
        if (options.continueOnError !== true) {
          throw error
        }
      }
    }
    
    return results
  }

  /**
   * Worker'ı çalıştır
   * @param {string} segmentId - Segment ID
   * @param {string} workerType - Worker türü
   * @param {Object} options - Seçenekler
   * @returns {Object} Worker sonucu
   */
  async executeWorker(segmentId, workerType, options) {
    try {
      // Worker servisini al
      const workerService = this.workers[workerType]
      if (!workerService) {
        throw new Error(`Worker servisi bulunamadı: ${workerType}`)
      }
      
      // Worker konfigürasyonu
      const workerConfig = {
        priority: options.priority || 'MEDIUM',
        timeout: options.timeout || this.coordinationConfig.segmentTimeoutMs,
        retryCount: options.retryCount || 3,
        ...options[workerType] // Worker'a özel seçenekler
      }
      
      // Task'ı queue'ya ekle
      const taskResult = await queueManager.addTask({
        type: workerType,
        segmentId: segmentId,
        priority: workerConfig.priority,
        config: workerConfig,
        metadata: {
          coordinatorId: this.coordinatorId,
          segmentId: segmentId,
          options: options
        }
      })
      
      if (!taskResult.success) {
        throw new Error(`Task eklenemedi: ${taskResult.error}`)
      }
      
      // Worker'ı çalıştır
      let workerResult
      if (workerType === 'TEXT_WORKER') {
        workerResult = await workerService.processSegmentText(segmentId)
      } else if (workerType === 'IMAGE_WORKER') {
        workerResult = await workerService.processSegmentImages(segmentId)
      } else {
        throw new Error(`Desteklenmeyen worker türü: ${workerType}`)
      }
      
      return {
        taskId: taskResult.taskId,
        workerResult: workerResult,
        config: workerConfig
      }
      
    } catch (error) {
      console.error(`Worker çalıştırma hatası: ${workerType} - ${segmentId}`, error)
      throw error
    }
  }

  /**
   * Bağımlılıkları kontrol et
   * @param {string} segmentId - Segment ID
   * @param {Array} dependencies - Bağımlılık listesi
   * @param {Object} results - Mevcut sonuçlar
   * @returns {boolean} Bağımlılıklar karşılanıyor mu
   */
  async checkDependencies(segmentId, dependencies, results) {
    for (const dependency of dependencies) {
      // Sonuçlarda bağımlılık var mı?
      if (!results[dependency]) {
        console.log(`Bağımlılık bekleniyor: ${dependency} - ${segmentId}`)
        return false
      }
      
      // Bağımlılık başarılı mı?
      if (results[dependency].workerResult && !results[dependency].workerResult.success) {
        console.log(`Bağımlılık başarısız: ${dependency} - ${segmentId}`)
        return false
      }
    }
    
    return true
  }

  /**
   * Segment'i tamamla
   * @param {string} segmentId - Segment ID
   * @param {Object} results - Sonuçlar
   */
  async completeSegment(segmentId, results) {
    try {
      const segmentRecord = this.activeSegments.get(segmentId)
      if (!segmentRecord) return
      
      // Segment durumunu güncelle
      segmentRecord.status = 'COMPLETED'
      segmentRecord.completedAt = new Date().toISOString()
      segmentRecord.results = results
      
      // Timeout'u temizle
      this.clearSegmentTimeout(segmentId)
      
      // Event emit
      this.emitEvent('segmentCompleted', { segmentId, results })
      
      console.log(`Segment tamamlandı: ${segmentId}`)
      
    } catch (error) {
      console.error('Segment tamamlama hatası:', error)
    }
  }

  /**
   * Segment'i hata ile sonlandır
   * @param {string} segmentId - Segment ID
   * @param {Error} error - Hata
   */
  async failSegment(segmentId, error) {
    try {
      const segmentRecord = this.activeSegments.get(segmentId)
      if (!segmentRecord) return
      
      // Segment durumunu güncelle
      segmentRecord.status = 'FAILED'
      segmentRecord.completedAt = new Date().toISOString()
      segmentRecord.error = error.message
      
      // Timeout'u temizle
      this.clearSegmentTimeout(segmentId)
      
      // Event emit
      this.emitEvent('segmentFailed', { segmentId, error })
      
      console.log(`Segment başarısız: ${segmentId}`)
      
    } catch (updateError) {
      console.error('Segment hata sonlandırma hatası:', updateError)
    }
  }

  /**
   * Segment timeout ayarla
   * @param {string} segmentId - Segment ID
   */
  setSegmentTimeout(segmentId) {
    const timeoutId = setTimeout(() => {
      console.log(`Segment timeout: ${segmentId}`)
      this.failSegment(segmentId, new Error('Segment timeout'))
    }, this.coordinationConfig.segmentTimeoutMs)
    
    this.segmentTimeouts.set(segmentId, timeoutId)
  }

  /**
   * Segment timeout'u temizle
   * @param {string} segmentId - Segment ID
   */
  clearSegmentTimeout(segmentId) {
    const timeoutId = this.segmentTimeouts.get(segmentId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.segmentTimeouts.delete(segmentId)
    }
  }

  /**
   * Queue event listener'larını ayarla
   */
  setupQueueListeners() {
    // Task tamamlandığında
    queueManager.addEventListener('taskCompleted', (data) => {
      this.emitEvent('workerCompleted', data)
    })
    
    // Task başarısız olduğunda
    queueManager.addEventListener('taskFailed', (data) => {
      this.emitEvent('workerFailed', data)
    })
  }

  /**
   * Aktif segment'leri listele
   * @returns {Array} Aktif segment'ler
   */
  getActiveSegments() {
    return Array.from(this.activeSegments.values())
  }

  /**
   * Segment istatistiklerini al
   * @returns {Object} İstatistikler
   */
  getSegmentStats() {
    const segments = Array.from(this.activeSegments.values())
    
    return {
      total: segments.length,
      coordinating: segments.filter(s => s.status === 'COORDINATING').length,
      completed: segments.filter(s => s.status === 'COMPLETED').length,
      failed: segments.filter(s => s.status === 'FAILED').length,
      byWorkerType: {
        TEXT_WORKER: segments.filter(s => s.workerTypes.includes('TEXT_WORKER')).length,
        IMAGE_WORKER: segments.filter(s => s.workerTypes.includes('IMAGE_WORKER')).length
      }
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
   * Coordinator ID'yi al
   * @returns {string} Coordinator ID
   */
  getCoordinatorId() {
    return this.coordinatorId
  }
}

export default new WorkerCoordinatorService() 