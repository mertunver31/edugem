import { supabase } from '../config/supabase'
import { pdfTextExtractionService } from './pdfTextExtractionService'

/**
 * Text Worker Service
 * GÜN 6 - AŞAMA 2: Text Worker - Segment Text Processing
 * Segment içeriğini işleme ve hazırlama
 */
class TextWorkerService {
  constructor() {
    this.workerId = `text-worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Segment içeriğini al ve işle
   * @param {string} segmentId - Segment ID
   * @returns {Object} İşleme sonucu
   */
  async processSegmentText(segmentId) {
    try {
      console.log(`Segment ${segmentId} text işleme başlatılıyor...`)

      // Segment bilgilerini al
      const segmentInfo = await this.getSegmentInfo(segmentId)
      if (!segmentInfo.success) {
        throw new Error(`Segment bilgileri alınamadı: ${segmentInfo.error}`)
      }

      // Document bilgilerini al
      const documentInfo = await this.getDocumentInfo(segmentInfo.data.document_id)
      if (!documentInfo.success) {
        throw new Error(`Document bilgileri alınamadı: ${documentInfo.error}`)
      }

      // Segment içeriğini hazırla
      const processedText = await this.prepareSegmentContent(segmentInfo.data, documentInfo.data)
      if (!processedText.success) {
        throw new Error(`Segment içeriği hazırlanamadı: ${processedText.error}`)
      }

      // İşlenmiş metni kaydet
      const saveResult = await this.saveProcessedText(segmentId, processedText.data)
      if (!saveResult.success) {
        throw new Error(`İşlenmiş metin kaydedilemedi: ${saveResult.error}`)
      }

      console.log(`Segment ${segmentId} text işleme tamamlandı`)
      return {
        success: true,
        segmentId: segmentId,
        processedText: processedText.data,
        metadata: {
          worker_id: this.workerId,
          processed_at: new Date().toISOString(),
          text_length: processedText.data.content.length,
          word_count: processedText.data.content.split(/\s+/).length
        }
      }

    } catch (error) {
      console.error('Segment text işleme hatası:', error)
      return {
        success: false,
        error: error.message,
        segmentId: segmentId
      }
    }
  }

  /**
   * Segment bilgilerini al
   * @param {string} segmentId - Segment ID
   * @returns {Object} Segment bilgileri
   */
  async getSegmentInfo(segmentId) {
    try {
      const { data, error } = await supabase
        .from('segments')
        .select(`
          *,
          documents(file_path, page_count)
        `)
        .eq('id', segmentId)
        .single()

      if (error) {
        throw new Error(`Segment alınamadı: ${error.message}`)
      }

      return {
        success: true,
        data: data
      }

    } catch (error) {
      console.error('Segment bilgileri alma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Document bilgilerini al
   * @param {string} documentId - Document ID
   * @returns {Object} Document bilgileri
   */
  async getDocumentInfo(documentId) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error) {
        throw new Error(`Document alınamadı: ${error.message}`)
      }

      return {
        success: true,
        data: data
      }

    } catch (error) {
      console.error('Document bilgileri alma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Segment içeriğini hazırla
   * @param {Object} segmentInfo - Segment bilgileri
   * @param {Object} documentInfo - Document bilgileri
   * @returns {Object} Hazırlanmış içerik
   */
  async prepareSegmentContent(segmentInfo, documentInfo) {
    try {
      console.log(`Segment ${segmentInfo.seg_no} içeriği hazırlanıyor...`)

      // Segment metadata'sını hazırla
      const metadata = {
        segment_number: segmentInfo.seg_no,
        page_range: `${segmentInfo.p_start}-${segmentInfo.p_end}`,
        total_pages: segmentInfo.p_end - segmentInfo.p_start + 1,
        document_name: documentInfo.file_path.split('/').pop(),
        document_id: documentInfo.id,
        segment_title: segmentInfo.title || `Segment ${segmentInfo.seg_no}`,
        created_at: segmentInfo.created_at
      }

      // Segment içeriğini oluştur
      const content = await this.generateSegmentContent(segmentInfo, documentInfo)

      // İçeriği temizle ve formatla
      const cleanedContent = this.cleanAndFormatContent(content)

      // İşlenmiş içeriği hazırla
      const processedContent = {
        metadata: metadata,
        content: cleanedContent,
        structure: {
          has_title: !!segmentInfo.title,
          has_outline: !!segmentInfo.outline,
          content_type: this.detectContentType(cleanedContent),
          complexity_level: this.analyzeComplexity(cleanedContent)
        },
        statistics: {
          character_count: cleanedContent.length,
          word_count: cleanedContent.split(/\s+/).length,
          sentence_count: this.countSentences(cleanedContent),
          paragraph_count: this.countParagraphs(cleanedContent)
        }
      }

      return {
        success: true,
        data: processedContent
      }

    } catch (error) {
      console.error('Segment içeriği hazırlama hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Segment içeriğini oluştur
   * @param {Object} segmentInfo - Segment bilgileri
   * @param {Object} documentInfo - Document bilgileri
   * @returns {string} Segment içeriği
   */
  async generateSegmentContent(segmentInfo, documentInfo) {
    try {
      let content = ''

      // Segment başlığını ekle
      if (segmentInfo.title) {
        content += `# ${segmentInfo.title}\n\n`
      } else {
        content += `# Segment ${segmentInfo.seg_no}\n\n`
      }

      // Sayfa aralığını ekle
      content += `**Sayfa Aralığı:** ${segmentInfo.p_start}-${segmentInfo.p_end}\n\n`

      // Outline varsa ekle
      if (segmentInfo.outline) {
        content += `## İçerik Yapısı\n\n`
        try {
          const outline = JSON.parse(segmentInfo.outline)
          if (outline.sections && outline.sections.length > 0) {
            outline.sections.forEach((section, index) => {
              content += `${index + 1}. **${section.title}** (Sayfa ${section.start}-${section.end})\n`
            })
            content += '\n'
          }
        } catch (e) {
          content += `${segmentInfo.outline}\n\n`
        }
      }

      // PDF'den gerçek içeriği çıkar
      console.log(`PDF'den segment içeriği çıkarılıyor: ${segmentInfo.id}`)
      const extractionResult = await pdfTextExtractionService.extractSegmentContent(
        segmentInfo.document_id,
        [segmentInfo.id]
      )

      if (extractionResult.success && extractionResult.data.segments.length > 0) {
        const extractedSegment = extractionResult.data.segments[0]
        content += `## PDF İçeriği\n\n`
        content += extractedSegment.content.text || 'İçerik çıkarılamadı.\n\n'
        
        // Tablolar varsa ekle
        if (extractedSegment.content.tables && extractedSegment.content.tables.length > 0) {
          content += `\n## Tablolar\n\n`
          extractedSegment.content.tables.forEach((table, index) => {
            content += `### Tablo ${index + 1} (Sayfa ${table.pageNum})\n\n`
            if (table.headers && table.headers.length > 0) {
              content += `| ${table.headers.join(' | ')} |\n`
              content += `| ${table.headers.map(() => '---').join(' | ')} |\n`
            }
            if (table.rows && table.rows.length > 0) {
              table.rows.forEach(row => {
                content += `| ${row.join(' | ')} |\n`
              })
            }
            content += '\n'
          })
        }
      } else {
        // Fallback: placeholder içerik
        content += `## İçerik\n\n`
        content += `Bu segment ${segmentInfo.p_start} ile ${segmentInfo.p_end} sayfaları arasındaki içeriği kapsamaktadır. `
        content += `Toplam ${segmentInfo.p_end - segmentInfo.p_start + 1} sayfa içerik bulunmaktadır.\n\n`
        content += `**Not:** PDF içeriği çıkarılamadı. (${extractionResult.error || 'Bilinmeyen hata'})\n\n`
      }

      // Segment notları varsa ekle
      if (segmentInfo.notes) {
        content += `## Notlar\n\n${segmentInfo.notes}\n\n`
      }

      return content

    } catch (error) {
      console.error('Segment içeriği oluşturma hatası:', error)
      throw new Error(`İçerik oluşturulamadı: ${error.message}`)
    }
  }

  /**
   * İçeriği temizle ve formatla
   * @param {string} content - Ham içerik
   * @returns {string} Temizlenmiş içerik
   */
  cleanAndFormatContent(content) {
    try {
      // Gereksiz boşlukları temizle
      let cleaned = content.replace(/\s+/g, ' ').trim()

      // Satır sonlarını düzenle
      cleaned = cleaned.replace(/\n\s*\n/g, '\n\n')

      // Markdown formatını koru
      cleaned = cleaned.replace(/#{1,6}\s+/g, (match) => match)

      // Liste formatını koru
      cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '- ')

      return cleaned

    } catch (error) {
      console.error('İçerik temizleme hatası:', error)
      return content // Hata durumunda orijinal içeriği döndür
    }
  }

  /**
   * İçerik türünü tespit et
   * @param {string} content - İçerik
   * @returns {string} İçerik türü
   */
  detectContentType(content) {
    const lowerContent = content.toLowerCase()

    if (lowerContent.includes('soru') || lowerContent.includes('test') || lowerContent.includes('quiz')) {
      return 'ASSESSMENT'
    } else if (lowerContent.includes('örnek') || lowerContent.includes('example')) {
      return 'EXAMPLE'
    } else if (lowerContent.includes('tanım') || lowerContent.includes('definition')) {
      return 'DEFINITION'
    } else if (lowerContent.includes('formül') || lowerContent.includes('equation')) {
      return 'FORMULA'
    } else {
      return 'THEORETICAL'
    }
  }

  /**
   * İçerik karmaşıklığını analiz et
   * @param {string} content - İçerik
   * @returns {string} Karmaşıklık seviyesi
   */
  analyzeComplexity(content) {
    const words = content.split(/\s+/)
    const sentences = this.countSentences(content)
    const avgWordsPerSentence = words.length / Math.max(sentences, 1)

    if (avgWordsPerSentence > 25) {
      return 'HIGH'
    } else if (avgWordsPerSentence > 15) {
      return 'MEDIUM'
    } else {
      return 'LOW'
    }
  }

  /**
   * Cümle sayısını hesapla
   * @param {string} content - İçerik
   * @returns {number} Cümle sayısı
   */
  countSentences(content) {
    const sentences = content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0)
    return sentences.length
  }

  /**
   * Paragraf sayısını hesapla
   * @param {string} content - İçerik
   * @returns {number} Paragraf sayısı
   */
  countParagraphs(content) {
    const paragraphs = content.split(/\n\s*\n/).filter(para => para.trim().length > 0)
    return paragraphs.length
  }

  /**
   * İşlenmiş metni kaydet
   * @param {string} segmentId - Segment ID
   * @param {Object} processedText - İşlenmiş metin
   * @returns {Object} Kaydetme sonucu
   */
  async saveProcessedText(segmentId, processedText) {
    try {
      // Mevcut kullanıcı ID'sini al
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı')
      }

      // Geçici olarak Task Queue olmadan direkt Worker Results'a kaydet
      const { data, error } = await supabase
        .from('worker_results')
        .insert({
          segment_id: segmentId,
          user_id: user.id,
          worker_type: 'TEXT_WORKER',
          metadata: {
            processing_stage: 'TEXT_PROCESSING',
            processed_text: processedText,
            worker_id: this.workerId
          }
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Worker result kaydedilemedi: ${error.message}`)
      }

      console.log(`İşlenmiş metin kaydedildi: ${data.id}`)
      return {
        success: true,
        result_id: data.id,
        task_id: null // Geçici olarak null
      }

    } catch (error) {
      console.error('İşlenmiş metin kaydetme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Text Worker için task oluştur
   * @param {string} segmentId - Segment ID
   * @returns {Object} Task oluşturma sonucu
   */
  async createTextWorkerTask(segmentId) {
    try {
      const { data, error } = await supabase
        .rpc('create_task', {
          p_segment_id: segmentId,
          p_worker_type: 'TEXT_WORKER',
          p_priority: 1
        })

      if (error) {
        throw new Error(`Task oluşturulamadı: ${error.message}`)
      }

      return {
        success: true,
        task_id: data
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
   * Segment'in işlenmiş metnini al
   * @param {string} segmentId - Segment ID
   * @returns {Object} İşlenmiş metin
   */
  async getProcessedText(segmentId) {
    try {
      const { data, error } = await supabase
        .from('worker_results')
        .select(`
          *,
          task_queue(id, status, created_at)
        `)
        .eq('segment_id', segmentId)
        .eq('worker_type', 'TEXT_WORKER')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        throw new Error(`İşlenmiş metin alınamadı: ${error.message}`)
      }

      return {
        success: true,
        data: data
      }

    } catch (error) {
      console.error('İşlenmiş metin alma hatası:', error)
      return {
        success: false,
        error: error.message
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

export default new TextWorkerService() 