import { supabase } from '../config/supabase'

/**
 * Concurrency Manager Service
 * GÜN 8 - AŞAMA 1: Concurrency Control - Worker Yönetimi
 * Worker'lar arası senkronizasyon ve kaynak yönetimi
 */
class ConcurrencyManagerService {
  constructor() {
    this.managerId = `concurrency-manager-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Aktif worker'ları takip et
    this.activeWorkers = new Map()
    
    // Rate limiting ayarları
    this.rateLimits = {
      textWorker: { maxConcurrent: 2, delayMs: 2000 },
      imageWorker: { maxConcurrent: 1, delayMs: 5000 },
      totalWorkers: { maxConcurrent: 3, delayMs: 1000 }
    }
    
    // Queue yönetimi
    this.taskQueue = []
    this.processingQueue = false
    
    // Error tracking
    this.errorCounts = new Map()
    this.maxRetries = 3
  }

  /**
   * Worker kaydı oluştur
   * @param {string} workerType - Worker türü (TEXT_WORKER, IMAGE_WORKER)
   * @param {string} segmentId - Segment ID
   * @param {Object} workerConfig - Worker konfigürasyonu
   * @returns {Object} Kayıt sonucu
   */
  async registerWorker(workerType, segmentId, workerConfig = {}) {
    try {
      console.log(`Worker kaydı oluşturuluyor: ${workerType} - ${segmentId}`)
      
      // Rate limit kontrolü
      const canStart = await this.checkRateLimit(workerType)
      if (!canStart) {
        throw new Error(`${workerType} için rate limit aşıldı`)
      }
      
      // Worker ID oluştur
      const workerId = `${workerType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Worker kaydı
      const workerRecord = {
        id: workerId,
        type: workerType,
        segmentId: segmentId,
        status: 'REGISTERED',
        config: workerConfig,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        errorCount: 0,
        retryCount: 0
      }
      
      // Aktif worker'lara ekle
      this.activeWorkers.set(workerId, workerRecord)
      
      // Database'e kaydet
      await this.saveWorkerRecord(workerRecord)
      
      console.log(`Worker kaydı başarılı: ${workerId}`)
      return {
        success: true,
        workerId: workerId,
        canStart: true
      }
      
    } catch (error) {
      console.error('Worker kaydı hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Worker'ı başlat
   * @param {string} workerId - Worker ID
   * @returns {Object} Başlatma sonucu
   */
  async startWorker(workerId) {
    try {
      const worker = this.activeWorkers.get(workerId)
      if (!worker) {
        throw new Error(`Worker bulunamadı: ${workerId}`)
      }
      
      // Worker durumunu güncelle
      worker.status = 'RUNNING'
      worker.startedAt = new Date().toISOString()
      
      // Database'i güncelle
      await this.updateWorkerStatus(workerId, 'RUNNING')
      
      console.log(`Worker başlatıldı: ${workerId}`)
      return {
        success: true,
        workerId: workerId
      }
      
    } catch (error) {
      console.error('Worker başlatma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Worker'ı tamamla
   * @param {string} workerId - Worker ID
   * @param {Object} result - İşlem sonucu
   * @returns {Object} Tamamlama sonucu
   */
  async completeWorker(workerId, result = {}) {
    try {
      const worker = this.activeWorkers.get(workerId)
      if (!worker) {
        throw new Error(`Worker bulunamadı: ${workerId}`)
      }
      
      // Worker durumunu güncelle
      worker.status = 'COMPLETED'
      worker.completedAt = new Date().toISOString()
      worker.result = result
      
      // Database'i güncelle
      await this.updateWorkerStatus(workerId, 'COMPLETED', result)
      
      // Aktif worker'lardan kaldır
      this.activeWorkers.delete(workerId)
      
      console.log(`Worker tamamlandı: ${workerId}`)
      return {
        success: true,
        workerId: workerId
      }
      
    } catch (error) {
      console.error('Worker tamamlama hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Worker'ı hata ile sonlandır
   * @param {string} workerId - Worker ID
   * @param {Error} error - Hata
   * @returns {Object} Sonlandırma sonucu
   */
  async failWorker(workerId, error) {
    try {
      const worker = this.activeWorkers.get(workerId)
      if (!worker) {
        throw new Error(`Worker bulunamadı: ${workerId}`)
      }
      
      // Hata sayısını artır
      worker.errorCount++
      worker.lastError = error.message
      
      // Retry kontrolü
      if (worker.errorCount < this.maxRetries) {
        worker.status = 'RETRYING'
        worker.retryCount++
        
        // Database'i güncelle
        await this.updateWorkerStatus(workerId, 'RETRYING', { error: error.message })
        
        console.log(`Worker retry ediliyor: ${workerId} (${worker.retryCount}/${this.maxRetries})`)
        return {
          success: true,
          workerId: workerId,
          shouldRetry: true,
          retryCount: worker.retryCount
        }
      } else {
        // Maksimum retry aşıldı
        worker.status = 'FAILED'
        worker.completedAt = new Date().toISOString()
        
        // Database'i güncelle
        await this.updateWorkerStatus(workerId, 'FAILED', { error: error.message })
        
        // Aktif worker'lardan kaldır
        this.activeWorkers.delete(workerId)
        
        console.log(`Worker başarısız: ${workerId} (maksimum retry aşıldı)`)
        return {
          success: true,
          workerId: workerId,
          shouldRetry: false,
          finalFailure: true
        }
      }
      
    } catch (updateError) {
      console.error('Worker hata sonlandırma hatası:', updateError)
      return {
        success: false,
        error: updateError.message
      }
    }
  }

  /**
   * Rate limit kontrolü
   * @param {string} workerType - Worker türü
   * @returns {boolean} Başlatılabilir mi
   */
  async checkRateLimit(workerType) {
    try {
      const limit = this.rateLimits[workerType]
      if (!limit) return true
      
      // Aktif worker sayısını kontrol et
      const activeCount = Array.from(this.activeWorkers.values())
        .filter(w => w.type === workerType && w.status === 'RUNNING').length
      
      // Toplam worker sayısını kontrol et
      const totalActiveCount = Array.from(this.activeWorkers.values())
        .filter(w => w.status === 'RUNNING').length
      
      const canStart = activeCount < limit.maxConcurrent && 
                      totalActiveCount < this.rateLimits.totalWorkers.maxConcurrent
      
      if (!canStart) {
        console.log(`Rate limit aşıldı: ${workerType} (${activeCount}/${limit.maxConcurrent})`)
      }
      
      return canStart
      
    } catch (error) {
      console.error('Rate limit kontrolü hatası:', error)
      return false
    }
  }

  /**
   * Worker kaydını database'e kaydet
   * @param {Object} workerRecord - Worker kaydı
   */
  async saveWorkerRecord(workerRecord) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı')
      }
      
      const { error } = await supabase
        .from('worker_records')
        .insert({
          worker_id: workerRecord.id,
          worker_type: workerRecord.type,
          segment_id: workerRecord.segmentId,
          user_id: user.id,
          status: workerRecord.status,
          metadata: workerRecord.config || {},
          created_at: workerRecord.createdAt
        })
      
      if (error) {
        throw new Error(`Worker kaydı kaydedilemedi: ${error.message}`)
      }
      
    } catch (error) {
      console.error('Worker kaydı kaydetme hatası:', error)
      throw error
    }
  }

  /**
   * Worker durumunu database'de güncelle
   * @param {string} workerId - Worker ID
   * @param {string} status - Yeni durum
   * @param {Object} result - Sonuç verisi
   */
  async updateWorkerStatus(workerId, status, result = {}) {
    try {
      const updateData = {
        status: status
      }
      
      if (status === 'RUNNING') {
        updateData.started_at = new Date().toISOString()
      } else if (status === 'COMPLETED' || status === 'FAILED') {
        updateData.completed_at = new Date().toISOString()
        updateData.result_data = result
      }
      
      const { error } = await supabase
        .from('worker_records')
        .update(updateData)
        .eq('worker_id', workerId)
      
      if (error) {
        throw new Error(`Worker durumu güncellenemedi: ${error.message}`)
      }
      
    } catch (error) {
      console.error('Worker durumu güncelleme hatası:', error)
      throw error
    }
  }

  /**
   * Aktif worker'ları listele
   * @returns {Array} Aktif worker'lar
   */
  getActiveWorkers() {
    return Array.from(this.activeWorkers.values())
  }

  /**
   * Worker istatistiklerini al
   * @returns {Object} İstatistikler
   */
  getWorkerStats() {
    const workers = Array.from(this.activeWorkers.values())
    
    return {
      total: workers.length,
      running: workers.filter(w => w.status === 'RUNNING').length,
      registered: workers.filter(w => w.status === 'REGISTERED').length,
      retrying: workers.filter(w => w.status === 'RETRYING').length,
      byType: {
        TEXT_WORKER: workers.filter(w => w.type === 'TEXT_WORKER').length,
        IMAGE_WORKER: workers.filter(w => w.type === 'IMAGE_WORKER').length
      }
    }
  }

  /**
   * Manager ID'yi al
   * @returns {string} Manager ID
   */
  getManagerId() {
    return this.managerId
  }
}

export default new ConcurrencyManagerService() 