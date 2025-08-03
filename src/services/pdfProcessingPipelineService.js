import { supabase } from '../config/supabase'
import textWorkerService from './textWorkerService'
import imageWorkerService from './imageWorkerService'
import workerCoordinator from './workerCoordinatorService'
import queueManager from './queueManagerService'

/**
 * PDF Processing Pipeline Service
 * GÜN 9 - End-to-End PDF Processing Pipeline
 * PDF yüklendiğinde tüm işlemleri otomatik olarak yönetir
 */
class PDFProcessingPipelineService {
  constructor() {
    this.pipelineId = `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Pipeline durumları
    this.pipelineStatus = {
      IDLE: 'IDLE',
      UPLOADING: 'UPLOADING',
      SEGMENTING: 'SEGMENTING',
      PROCESSING: 'PROCESSING',
      COMPLETED: 'COMPLETED',
      FAILED: 'FAILED'
    }
    
    // Aktif pipeline'ları takip et
    this.activePipelines = new Map()
    
    // Pipeline konfigürasyonu
    this.pipelineConfig = {
      maxConcurrentPipelines: 3,
      segmentTimeoutMs: 300000, // 5 dakika
      pipelineTimeoutMs: 1800000, // 30 dakika
      autoProcessSegments: true,
      enableImageGeneration: true
    }
    
    // Event listeners
    this.eventListeners = new Map()
  }

  /**
   * PDF Processing Pipeline'ı başlat
   * @param {string} documentId - Document ID
   * @param {Object} options - Pipeline seçenekleri
   * @returns {Object} Pipeline başlatma sonucu
   */
  async startPipeline(documentId, options = {}) {
    try {
      console.log(`PDF Processing Pipeline başlatılıyor: ${documentId}`)
      
      // Document ID kontrolü
      if (!documentId) {
        throw new Error('Document ID gerekli')
      }
      
      console.log(`Document ID: ${documentId}, Type: ${typeof documentId}`)
      
      // Pipeline limit kontrolü
      if (this.activePipelines.size >= this.pipelineConfig.maxConcurrentPipelines) {
        throw new Error('Maksimum pipeline sayısına ulaşıldı')
      }
      
      // Pipeline kaydı oluştur
      const pipelineRecord = {
        id: this.pipelineId,
        documentId: documentId,
        status: this.pipelineStatus.UPLOADING,
        startedAt: new Date().toISOString(),
        completedAt: null,
        currentStep: 'INIT',
        progress: 0,
        totalSteps: 4, // Upload, Segment, Text, Image
        completedSteps: 0,
        results: {},
        error: null,
        options: {
          ...this.pipelineConfig,
          ...options
        }
      }
      
      // Aktif pipeline'lara ekle
      this.activePipelines.set(documentId, pipelineRecord)
      
      // Pipeline'ı başlat
      try {
        await this.executePipeline(documentId, pipelineRecord)
        
        return {
          success: true,
          pipelineId: this.pipelineId,
          documentId: documentId,
          status: pipelineRecord.status
        }
      } catch (pipelineError) {
        console.error('Pipeline execution hatası:', pipelineError)
        // Pipeline'ı aktif listesinden kaldır
        this.activePipelines.delete(documentId)
        
        return {
          success: false,
          error: pipelineError.message,
          pipelineId: this.pipelineId,
          documentId: documentId
        }
      }
      
    } catch (error) {
      console.error('Pipeline başlatma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Pipeline'ı çalıştır
   * @param {string} documentId - Document ID
   * @param {Object} pipelineRecord - Pipeline kaydı
   */
  async executePipeline(documentId, pipelineRecord) {
    try {
      // 1. ADIM: Document durumunu kontrol et
      await this.updatePipelineStep(documentId, 'UPLOAD_CHECK', 10)
      const documentStatus = await this.checkDocumentStatus(documentId)
      
      // Document durumunu kontrol et - birden fazla durumu kabul et
      const allowedStatuses = ['READY', 'UPLOADED', 'PROCESSING', 'FAILED']
      if (!allowedStatuses.includes(documentStatus)) {
        throw new Error(`Document pipeline için uygun değil. Durum: ${documentStatus}. Beklenen: ${allowedStatuses.join(', ')}`)
      }
      
      // FAILED durumundaki document'ı yeniden işlemeye hazırla
      if (documentStatus === 'FAILED') {
        console.log(`FAILED durumundaki document yeniden işleniyor: ${documentId}`)
        await supabase
          .from('documents')
          .update({ 
            status: 'PROCESSING',
            error_message: null
          })
          .eq('id', documentId)
      }
      
      // 2. ADIM: Segment Planning
      await this.updatePipelineStep(documentId, 'SEGMENTING', 25)
      const segmentResult = await this.executeSegmentPlanning(documentId)
      
      if (!segmentResult.success) {
        throw new Error(`Segment planning başarısız: ${segmentResult.error}`)
      }
      
      // 3. ADIM: Text Worker (Tüm segmentler için)
      await this.updatePipelineStep(documentId, 'TEXT_PROCESSING', 50)
      const textResult = await this.executeTextProcessing(documentId)
      
      if (!textResult.success) {
        throw new Error(`Text processing başarısız: ${textResult.error}`)
      }
      
      // 4. ADIM: Image Worker (Tüm segmentler için)
      await this.updatePipelineStep(documentId, 'IMAGE_PROCESSING', 75)
      const imageResult = await this.executeImageProcessing(documentId)
      
      if (!imageResult.success) {
        throw new Error(`Image processing başarısız: ${imageResult.error}`)
      }
      
      // 5. ADIM: Pipeline'ı tamamla
      await this.updatePipelineStep(documentId, 'COMPLETING', 100)
      await this.completePipeline(documentId, {
        segments: segmentResult,
        text: textResult,
        images: imageResult
      })
      
    } catch (error) {
      console.error(`Pipeline hatası: ${documentId}`, error)
      await this.failPipeline(documentId, error)
    }
  }

  /**
   * Document durumunu kontrol et
   * @param {string} documentId - Document ID
   * @returns {string} Document durumu
   */
  async checkDocumentStatus(documentId) {
    try {
      console.log(`Document durumu kontrol ediliyor: ${documentId}`)
      
      const { data, error } = await supabase
        .from('documents')
        .select('status, page_count')
        .eq('id', documentId)
        .single()
      
      if (error) {
        console.error('Document bulunamadı:', error)
        throw new Error(`Document bulunamadı: ${documentId}`)
      }
      
      if (!data) {
        throw new Error(`Document verisi bulunamadı: ${documentId}`)
      }
      
      console.log(`Document durumu: ${data.status} (${documentId})`)
      return data.status
      
    } catch (error) {
      console.error('Document durum kontrolü hatası:', error)
      throw error // Hatayı yukarı fırlat
    }
  }

  /**
   * Segment Planning'i çalıştır
   * @param {string} documentId - Document ID
   * @returns {Object} Segment planning sonucu
   */
  async executeSegmentPlanning(documentId) {
    try {
      console.log(`Segment planning başlatılıyor: ${documentId}`)
      
      // Document'ı yeniden segment'e böl
      const { data: document } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()
      
      if (!document) {
        throw new Error('Document bulunamadı')
      }
      
      // Segment planning işlemi (mevcut segment planning servisini kullan)
      // Bu kısım mevcut segment planning servisine bağlanacak
      
      // Segment sayısını güncelle
      const { data: segments } = await supabase
        .from('segments')
        .select('id')
        .eq('document_id', documentId)
      
      const segmentCount = segments?.length || 0
      
      console.log(`Segment planning tamamlandı: ${segmentCount} segment`)
      
      return {
        success: true,
        segmentCount: segmentCount,
        segments: segments
      }
      
    } catch (error) {
      console.error('Segment planning hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Text Processing'i çalıştır (Tüm segmentler için)
   * @param {string} documentId - Document ID
   * @returns {Object} Text processing sonucu
   */
  async executeTextProcessing(documentId) {
    try {
      console.log(`Text processing başlatılıyor: ${documentId}`)
      
      // Document'ın tüm segmentlerini al
      const { data: segments, error } = await supabase
        .from('segments')
        .select('id, seg_no, title')
        .eq('document_id', documentId)
        .order('seg_no', { ascending: true })
      
      if (error) throw error
      
      const results = []
      let successCount = 0
      let errorCount = 0
      
      // Her segment için Text Worker çalıştır
      for (const segment of segments) {
        try {
          console.log(`Text Worker başlatılıyor: Segment ${segment.seg_no}`)
          
          const result = await workerCoordinator.coordinateSegmentWorkers(
            segment.id,
            ['TEXT_WORKER'],
            {
              priority: 'HIGH',
              continueOnError: false
            }
          )
          
          if (result.success) {
            successCount++
            results.push({
              segmentId: segment.id,
              segmentNo: segment.seg_no,
              success: true,
              result: result
            })
          } else {
            errorCount++
            results.push({
              segmentId: segment.id,
              segmentNo: segment.seg_no,
              success: false,
              error: result.error
            })
          }
          
        } catch (segmentError) {
          errorCount++
          results.push({
            segmentId: segment.id,
            segmentNo: segment.seg_no,
            success: false,
            error: segmentError.message
          })
        }
      }
      
      console.log(`Text processing tamamlandı: ${successCount}/${segments.length} başarılı`)
      
      return {
        success: successCount > 0,
        totalSegments: segments.length,
        successCount: successCount,
        errorCount: errorCount,
        results: results
      }
      
    } catch (error) {
      console.error('Text processing hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Image Processing'i çalıştır (Tüm segmentler için)
   * @param {string} documentId - Document ID
   * @returns {Object} Image processing sonucu
   */
  async executeImageProcessing(documentId) {
    try {
      console.log(`Image processing başlatılıyor: ${documentId}`)
      
      // Document'ın tüm segmentlerini al
      const { data: segments, error } = await supabase
        .from('segments')
        .select('id, seg_no, title')
        .eq('document_id', documentId)
        .order('seg_no', { ascending: true })
      
      if (error) throw error
      
      const results = []
      let successCount = 0
      let errorCount = 0
      
      // Her segment için Image Worker çalıştır
      for (const segment of segments) {
        try {
          console.log(`Image Worker başlatılıyor: Segment ${segment.seg_no}`)
          
          const result = await workerCoordinator.coordinateSegmentWorkers(
            segment.id,
            ['IMAGE_WORKER'],
            {
              priority: 'MEDIUM',
              continueOnError: false
            }
          )
          
          if (result.success) {
            successCount++
            results.push({
              segmentId: segment.id,
              segmentNo: segment.seg_no,
              success: true,
              result: result
            })
          } else {
            errorCount++
            results.push({
              segmentId: segment.id,
              segmentNo: segment.seg_no,
              success: false,
              error: result.error
            })
          }
          
        } catch (segmentError) {
          errorCount++
          results.push({
            segmentId: segment.id,
            segmentNo: segment.seg_no,
            success: false,
            error: segmentError.message
          })
        }
      }
      
      console.log(`Image processing tamamlandı: ${successCount}/${segments.length} başarılı`)
      
      return {
        success: successCount > 0,
        totalSegments: segments.length,
        successCount: successCount,
        errorCount: errorCount,
        results: results
      }
      
    } catch (error) {
      console.error('Image processing hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Pipeline adımını güncelle
   * @param {string} documentId - Document ID
   * @param {string} step - Adım adı
   * @param {number} progress - İlerleme yüzdesi
   */
  async updatePipelineStep(documentId, step, progress) {
    try {
      const pipelineRecord = this.activePipelines.get(documentId)
      if (!pipelineRecord) return
      
      pipelineRecord.currentStep = step
      pipelineRecord.progress = progress
      pipelineRecord.completedSteps = Math.floor((progress / 100) * pipelineRecord.totalSteps)
      
      // Event emit
      this.emitEvent('pipelineProgress', {
        documentId: documentId,
        step: step,
        progress: progress,
        pipelineRecord: pipelineRecord
      })
      
      console.log(`Pipeline adımı: ${step} (${progress}%)`)
      
    } catch (error) {
      console.error('Pipeline adım güncelleme hatası:', error)
    }
  }

  /**
   * Pipeline'ı tamamla
   * @param {string} documentId - Document ID
   * @param {Object} results - Sonuçlar
   */
  async completePipeline(documentId, results) {
    try {
      const pipelineRecord = this.activePipelines.get(documentId)
      if (!pipelineRecord) return
      
      // Pipeline durumunu güncelle
      pipelineRecord.status = this.pipelineStatus.COMPLETED
      pipelineRecord.completedAt = new Date().toISOString()
      pipelineRecord.results = results
      pipelineRecord.progress = 100
      pipelineRecord.completedSteps = pipelineRecord.totalSteps
      
      // Document durumunu güncelle
      await supabase
        .from('documents')
        .update({ 
          status: 'PROCESSED',
          processed_at: new Date().toISOString()
        })
        .eq('id', documentId)
      
      // Event emit
      this.emitEvent('pipelineCompleted', {
        documentId: documentId,
        results: results,
        pipelineRecord: pipelineRecord
      })
      
      console.log(`Pipeline tamamlandı: ${documentId}`)
      console.log('Pipeline Sonuçları:', {
        segments: results.segments,
        text: results.text,
        images: results.images
      })
      
      // Aktif pipeline'lardan kaldır
      this.activePipelines.delete(documentId)
      
    } catch (error) {
      console.error('Pipeline tamamlama hatası:', error)
    }
  }

  /**
   * Pipeline'ı hata ile sonlandır
   * @param {string} documentId - Document ID
   * @param {Error} error - Hata
   */
  async failPipeline(documentId, error) {
    try {
      const pipelineRecord = this.activePipelines.get(documentId)
      if (!pipelineRecord) return
      
      // Pipeline durumunu güncelle
      pipelineRecord.status = this.pipelineStatus.FAILED
      pipelineRecord.completedAt = new Date().toISOString()
      pipelineRecord.error = error.message
      
      // Document durumunu güncelle
      await supabase
        .from('documents')
        .update({ 
          status: 'FAILED',
          error_message: error.message
        })
        .eq('id', documentId)
      
      // Event emit
      this.emitEvent('pipelineFailed', {
        documentId: documentId,
        error: error.message,
        pipelineRecord: pipelineRecord
      })
      
      console.log(`Pipeline başarısız: ${documentId} - ${error.message}`)
      
      // Aktif pipeline'lardan kaldır
      this.activePipelines.delete(documentId)
      
    } catch (updateError) {
      console.error('Pipeline hata sonlandırma hatası:', updateError)
    }
  }

  /**
   * Aktif pipeline'ları listele
   * @returns {Array} Aktif pipeline'lar
   */
  getActivePipelines() {
    return Array.from(this.activePipelines.values())
  }

  /**
   * Pipeline istatistiklerini al
   * @returns {Object} İstatistikler
   */
  getPipelineStats() {
    const pipelines = Array.from(this.activePipelines.values())
    
    return {
      total: pipelines.length,
      uploading: pipelines.filter(p => p.status === this.pipelineStatus.UPLOADING).length,
      segmenting: pipelines.filter(p => p.status === this.pipelineStatus.SEGMENTING).length,
      processing: pipelines.filter(p => p.status === this.pipelineStatus.PROCESSING).length,
      completed: pipelines.filter(p => p.status === this.pipelineStatus.COMPLETED).length,
      failed: pipelines.filter(p => p.status === this.pipelineStatus.FAILED).length
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
   * Pipeline ID'yi al
   * @returns {string} Pipeline ID
   */
  getPipelineId() {
    return this.pipelineId
  }
}

export default new PDFProcessingPipelineService() 