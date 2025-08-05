import { supabase } from '../config/supabase'
import pdfService from './pdfService'
import { documentUnderstandingService } from './documentUnderstandingService'
import segmentService from './segmentService'
import { pdfTextExtractionService } from './pdfTextExtractionService'
import { courseStructureService } from './courseStructureService'
import { courseVisualService } from './courseVisualService'
import { enhancedContentService } from './enhancedContentService'


/**
 * Master Pipeline Service
 * PDF'den tam eğitim kursu oluşturma pipeline'ı
 */
class MasterPipelineService {
  constructor() {
    this.stages = [
      { name: 'PDF Upload & Validation', weight: 5 },
      { name: 'Document Understanding', weight: 15 },
      { name: 'Segment Planning', weight: 10 },
      { name: 'PDF Text Extraction', weight: 20 },
      { name: 'Course Structure Generation', weight: 15 },
      { name: 'Course Visual Generation', weight: 15 },
      { name: 'Enhanced Content Generation', weight: 20 }
    ]
  }

  /**
   * Tam pipeline'ı çalıştır
   * @param {File} pdfFile - PDF dosyası
   * @param {string} userId - Kullanıcı ID
   * @param {string} courseTitle - Dersin adı
   * @returns {Object} Pipeline sonucu
   */
  async runFullPipeline(pdfFile, userId, courseTitle) {
    const pipelineId = crypto.randomUUID()
    let currentProgress = 0
    let documentId = null
    let pipelineData = {}

    try {
      console.log(`🚀 Master Pipeline başlatılıyor: ${pipelineId}`)
      
      // Pipeline execution kaydı oluştur
      await this.createPipelineExecution(pipelineId, userId, 'STARTED')

      // AŞAMA 1: PDF Upload & Validation
      console.log('📁 Aşama 1: PDF Upload & Validation')
      await this.updatePipelineProgress(pipelineId, 'PDF Upload & Validation', 0)
      
      const uploadResult = await pdfService.uploadPDF(pdfFile, courseTitle)
      if (!uploadResult.success) {
        throw new Error(`PDF upload hatası: ${uploadResult.error}`)
      }
      
      documentId = uploadResult.documentId
      pipelineData.documentId = documentId
      currentProgress += this.stages[0].weight
      
      await this.updatePipelineProgress(pipelineId, 'PDF Upload & Validation', 100)
      console.log(`✅ PDF Upload tamamlandı: ${documentId}`)

      // AŞAMA 2: Document Understanding
      console.log('🧠 Aşama 2: Document Understanding')
      await this.updatePipelineProgress(pipelineId, 'Document Understanding', 0)
      
      const understandingResult = await documentUnderstandingService.extractDocumentOutline(documentId)
      if (!understandingResult.success) {
        throw new Error(`Document Understanding hatası: ${understandingResult.error}`)
      }
      
      pipelineData.outline = understandingResult.outline
      currentProgress += this.stages[1].weight
      
      await this.updatePipelineProgress(pipelineId, 'Document Understanding', 100)
      console.log('✅ Document Understanding tamamlandı')

      // AŞAMA 3: Segment Planning
      console.log('📋 Aşama 3: Segment Planning')
      await this.updatePipelineProgress(pipelineId, 'Segment Planning', 0)
      
      const segmentResult = await segmentService.createSegmentsForDocument(documentId)
      if (!segmentResult.success) {
        throw new Error(`Segment Planning hatası: ${segmentResult.error}`)
      }
      
      pipelineData.segments = segmentResult.segments
      currentProgress += this.stages[2].weight
      
      await this.updatePipelineProgress(pipelineId, 'Segment Planning', 100)
      console.log(`✅ Segment Planning tamamlandı: ${segmentResult.segments.length} segment`)

      // AŞAMA 4: PDF Text Extraction
      console.log('📖 Aşama 4: PDF Text Extraction')
      await this.updatePipelineProgress(pipelineId, 'PDF Text Extraction', 0)
      
      const extractionResult = await this.extractAllSegmentContent(documentId, segmentResult.segments)
      if (!extractionResult.success) {
        throw new Error(`PDF Text Extraction hatası: ${extractionResult.error}`)
      }
      
      pipelineData.extractedContent = extractionResult.extractedContent
      currentProgress += this.stages[3].weight
      
      await this.updatePipelineProgress(pipelineId, 'PDF Text Extraction', 100)
      console.log('✅ PDF Text Extraction tamamlandı')

      // AŞAMA 5: Course Structure Generation
      console.log('🏗️ Aşama 5: Course Structure Generation')
      await this.updatePipelineProgress(pipelineId, 'Course Structure Generation', 0)
      
      const structureResult = await courseStructureService.generateCourseStructure(documentId)
      if (!structureResult.success) {
        throw new Error(`Course Structure hatası: ${structureResult.error}`)
      }
      
      pipelineData.courseStructure = structureResult.courseStructure
      currentProgress += this.stages[4].weight
      
      await this.updatePipelineProgress(pipelineId, 'Course Structure Generation', 100)
      console.log('✅ Course Structure Generation tamamlandı')

      // AŞAMA 6: Course Visual Generation
      console.log('🎨 Aşama 6: Course Visual Generation')
      await this.updatePipelineProgress(pipelineId, 'Course Visual Generation', 0)
      
      const visualResult = await courseVisualService.generateCourseImages(documentId)
      if (!visualResult.success) {
        console.warn(`Course Visual Generation uyarısı: ${visualResult.error}`)
        // Visual generation başarısız olsa bile devam et
      } else {
        pipelineData.courseImages = visualResult.courseImages
      }
      
      currentProgress += this.stages[5].weight
      await this.updatePipelineProgress(pipelineId, 'Course Visual Generation', 100)
      console.log('✅ Course Visual Generation tamamlandı')

      // AŞAMA 7: Enhanced Content Generation
      console.log('📚 Aşama 7: Enhanced Content Generation')
      await this.updatePipelineProgress(pipelineId, 'Enhanced Content Generation', 0)
      
      const enhancedResult = await enhancedContentService.generateEnhancedContent(documentId)
      if (!enhancedResult.success) {
        console.warn(`Enhanced Content Generation uyarısı: ${enhancedResult.error}`)
        // Enhanced content başarısız olsa bile devam et
      } else {
        pipelineData.enhancedContent = enhancedResult.enhancedContent
      }
      
      currentProgress += this.stages[6].weight
      await this.updatePipelineProgress(pipelineId, 'Enhanced Content Generation', 100)
      console.log('✅ Enhanced Content Generation tamamlandı')

      // Pipeline tamamlandı
      await this.completePipeline(pipelineId, 'COMPLETED', pipelineData)
      
      console.log(`🎉 Master Pipeline tamamlandı: ${pipelineId}`)
      
      return {
        success: true,
        pipelineId: pipelineId,
        documentId: documentId,
        data: pipelineData,
        progress: 100,
        message: 'Kurs başarıyla oluşturuldu!'
      }

    } catch (error) {
      console.error('❌ Master Pipeline hatası:', error)
      
      await this.completePipeline(pipelineId, 'FAILED', {
        error: error.message,
        documentId: documentId,
        currentProgress: currentProgress
      })
      
      return {
        success: false,
        pipelineId: pipelineId,
        documentId: documentId,
        error: error.message,
        progress: currentProgress,
        message: 'Pipeline sırasında hata oluştu'
      }
    }
  }

  /**
   * Tüm segment içeriklerini çıkar
   * @param {string} documentId - Document ID
   * @param {Array} segments - Segment listesi
   * @returns {Object} Çıkarma sonucu
   */
  async extractAllSegmentContent(documentId, segments) {
    try {
      const extractedContent = {}
      
      // Segment ID'lerini düzelt - database'den gerçek segment'leri al
      const { data: dbSegments, error: segmentError } = await supabase
        .from('segments')
        .select('id, title, seg_no')
        .eq('document_id', documentId)
        .order('seg_no', { ascending: true })

      if (segmentError) {
        console.error('Segment verileri alınamadı:', segmentError)
        return {
          success: false,
          error: 'Segment verileri alınamadı: ' + segmentError.message
        }
      }

      console.log(`📖 Database'den ${dbSegments.length} segment alındı`)
      
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        const dbSegment = dbSegments[i]
        
        if (!dbSegment) {
          console.warn(`Segment ${i + 1} için database kaydı bulunamadı`)
          continue
        }
        
        console.log(`📖 Segment ${i + 1}/${segments.length}: ${segment.title} (ID: ${dbSegment.id})`)
        
        try {
          const result = await pdfTextExtractionService.extractSegmentContent(documentId, [dbSegment.id])
          if (result.success) {
            extractedContent[dbSegment.id] = result.extractedContent
          }
        } catch (error) {
          console.warn(`Segment ${dbSegment.id} çıkarma hatası:`, error)
          // Bir segment başarısız olsa bile devam et
        }
      }
      
      return {
        success: true,
        extractedContent: extractedContent
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Pipeline execution kaydı oluştur
   * @param {string} pipelineId - Pipeline ID
   * @param {string} userId - Kullanıcı ID
   * @param {string} status - Durum
   */
  async createPipelineExecution(pipelineId, userId, status) {
    try {
      const { error } = await supabase
        .from('pipeline_executions')
        .insert({
          id: pipelineId,
          user_id: userId,
          status: status,
          current_stage: 'INITIALIZED',
          progress_percentage: 0,
          started_at: new Date().toISOString()
        })

      if (error) {
        console.error('Pipeline execution kayıt hatası:', error)
      }
    } catch (error) {
      console.error('Pipeline execution oluşturma hatası:', error)
    }
  }

  /**
   * Pipeline progress güncelle
   * @param {string} pipelineId - Pipeline ID
   * @param {string} stage - Aşama adı
   * @param {number} percentage - Yüzde
   */
  async updatePipelineProgress(pipelineId, stage, percentage) {
    try {
      const { error } = await supabase
        .from('pipeline_executions')
        .update({
          current_stage: stage,
          progress_percentage: percentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', pipelineId)

      if (error) {
        console.error('Pipeline progress güncelleme hatası:', error)
      }
    } catch (error) {
      console.error('Pipeline progress güncelleme hatası:', error)
    }
  }

  /**
   * Pipeline'ı tamamla
   * @param {string} pipelineId - Pipeline ID
   * @param {string} status - Durum
   * @param {Object} data - Sonuç verisi
   */
  async completePipeline(pipelineId, status, data) {
    try {
      const { error } = await supabase
        .from('pipeline_executions')
        .update({
          status: status,
          progress_percentage: status === 'COMPLETED' ? 100 : 0,
          completed_at: new Date().toISOString(),
          result_data: data
        })
        .eq('id', pipelineId)

      if (error) {
        console.error('Pipeline tamamlama hatası:', error)
      }
    } catch (error) {
      console.error('Pipeline tamamlama hatası:', error)
    }
  }

  /**
   * Pipeline durumunu getir
   * @param {string} pipelineId - Pipeline ID
   * @returns {Object} Pipeline durumu
   */
  async getPipelineStatus(pipelineId) {
    try {
      const { data, error } = await supabase
        .from('pipeline_executions')
        .select('*')
        .eq('id', pipelineId)
        .single()

      if (error) {
        throw new Error(`Pipeline durumu alınamadı: ${error.message}`)
      }

      return {
        success: true,
        data: data
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }





  /**
   * Kurs içeriğini oluştur
   * @param {Object} pipelineData - Pipeline verileri
   * @returns {string} Kurs içeriği
   */
  buildCourseContent(pipelineData) {
    console.log('🔍 buildCourseContent çağrıldı, pipelineData:', pipelineData)
    let content = ''

    // Enhanced content varsa onu kullan
    if (pipelineData.enhancedContent) {
      console.log('📚 Enhanced content mevcut:', pipelineData.enhancedContent)
      content += 'GELİŞTİRİLMİŞ İÇERİK:\n'
      Object.keys(pipelineData.enhancedContent).forEach(chapterKey => {
        const chapter = pipelineData.enhancedContent[chapterKey]
        console.log('📖 Chapter:', chapter)
        if (chapter && chapter.title) {
          content += `\n${chapter.title}:\n`
          if (chapter.content) {
            content += chapter.content + '\n'
          }
        }
      })
    } else {
      console.log('❌ Enhanced content yok')
    }

    // Extracted content varsa ekle
    if (pipelineData.extractedContent) {
      console.log('📄 Extracted content mevcut:', pipelineData.extractedContent)
      content += '\nORİJİNAL İÇERİK:\n'
      Object.keys(pipelineData.extractedContent).forEach(segmentKey => {
        const segment = pipelineData.extractedContent[segmentKey]
        console.log('📋 Segment:', segment)
        if (segment && segment.title) {
          content += `\n${segment.title}:\n`
          if (segment.content) {
            content += segment.content + '\n'
          }
        }
      })
    } else {
      console.log('❌ Extracted content yok')
    }

    console.log('📝 Oluşturulan content uzunluğu:', content.length)
    return content
  }

  /**
   * Kurs yapısını oluştur
   * @param {Object} pipelineData - Pipeline verileri
   * @returns {string} Kurs yapısı
   */
  buildCourseOutline(pipelineData) {
    let outline = ''

    // Course structure varsa onu kullan
    if (pipelineData.courseStructure) {
      outline += 'KURS YAPISI:\n'
      if (pipelineData.courseStructure.title) {
        outline += `Başlık: ${pipelineData.courseStructure.title}\n`
      }
      if (pipelineData.courseStructure.description) {
        outline += `Açıklama: ${pipelineData.courseStructure.description}\n\n`
      }
      
      if (pipelineData.courseStructure.chapters && Array.isArray(pipelineData.courseStructure.chapters)) {
        outline += 'BÖLÜMLER:\n'
        pipelineData.courseStructure.chapters.forEach((chapter, index) => {
          if (chapter && chapter.title) {
            outline += `${index + 1}. ${chapter.title}\n`
            if (chapter.lessons && Array.isArray(chapter.lessons)) {
              chapter.lessons.forEach((lesson, lessonIndex) => {
                if (lesson && lesson.title) {
                  outline += `   ${index + 1}.${lessonIndex + 1}. ${lesson.title}\n`
                }
              })
            }
          }
        })
      }
    }

    // Segments varsa ekle
    if (pipelineData.segments && Array.isArray(pipelineData.segments)) {
      outline += '\nSEGMENTLER:\n'
      pipelineData.segments.forEach((segment, index) => {
        if (segment && segment.title) {
          outline += `${index + 1}. ${segment.title}\n`
        }
      })
    }

    return outline
  }

  /**
   * Kullanıcının pipeline'larını getir
   * @param {string} userId - Kullanıcı ID
   * @returns {Object} Pipeline listesi
   */
  async getUserPipelines(userId) {
    try {
      const { data, error } = await supabase
        .from('pipeline_executions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Kullanıcı pipeline'ları alınamadı: ${error.message}`)
      }

      return {
        success: true,
        data: data
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Singleton instance
export const masterPipelineService = new MasterPipelineService() 