import { supabase } from '../config/supabase'

/**
 * Segment Planner Service
 * PDF outline'larını analiz ederek öğrenme segmentleri oluşturur
 */
class SegmentService {
  constructor() {
    this.maxSegmentSize = 20 // Maksimum sayfa sayısı per segment
    this.minSegmentSize = 3  // Minimum sayfa sayısı per segment (düşürüldü)
  }

  /**
   * Document outline'ından segment'ler oluştur
   * @param {Object} document - Document bilgileri
   * @param {Object} outline - Gemini'den gelen outline
   * @returns {Array} Segment listesi
   */
  createSegmentsFromOutline(document, outline) {
    console.log('Segment oluşturma başlatılıyor...', { document, outline })

    if (!outline || !outline.sections || !Array.isArray(outline.sections)) {
      console.error('Geçersiz outline formatı')
      return []
    }

    const segments = []
    let segNo = 1
    let carryOver = null // Küçük segment'leri birleştirmek için

    // Her section'ı analiz et
    for (const section of outline.sections) {
      const segmentSize = section.end_page - section.start_page + 1
      
      // Eğer section çok büyükse, böl
      if (segmentSize > this.maxSegmentSize) {
        // Önceki carryOver'ı işle
        if (carryOver) {
          segments.push(carryOver)
          segNo++
          carryOver = null
        }
        
        const subSegments = this.splitLargeSection(section, segNo)
        segments.push(...subSegments)
        segNo += subSegments.length
      } else {
        // Normal segment oluştur
        const segment = this.createSegment(section, segNo)
        
        // Küçük segment kontrolü
        if (segmentSize < this.minSegmentSize) {
          if (carryOver) {
            // Önceki küçük segment ile birleştir
            carryOver.p_end = segment.p_end
            carryOver.title = `${carryOver.title} + ${segment.title}`
            carryOver.original_section = `${carryOver.original_section}, ${segment.original_section}`
          } else {
            // Yeni carryOver başlat
            carryOver = segment
          }
        } else {
          // Önceki carryOver'ı işle
          if (carryOver) {
            segments.push(carryOver)
            segNo++
            carryOver = null
          }
          
          // Normal segment'i ekle
          segments.push(segment)
          segNo++
        }
      }
    }

    // Son carryOver'ı işle
    if (carryOver) {
      segments.push(carryOver)
    }

    // Eğer hiç section yoksa, sayfa bazlı böl
    if (segments.length === 0) {
      const pageBasedSegments = this.createPageBasedSegments(document.page_count, outline)
      segments.push(...pageBasedSegments)
    }

    // Segment numaralarını yeniden düzenle
    segments.forEach((segment, index) => {
      segment.seg_no = index + 1
    })

    console.log(`${segments.length} segment oluşturuldu`)
    return segments
  }

  /**
   * Büyük section'ları alt segmentlere böl
   * @param {Object} section - Büyük section
   * @param {number} startSegNo - Başlangıç segment numarası
   * @returns {Array} Alt segmentler
   */
  splitLargeSection(section, startSegNo) {
    const segments = []
    const totalPages = section.end_page - section.start_page + 1
    const numSegments = Math.ceil(totalPages / this.maxSegmentSize)

    for (let i = 0; i < numSegments; i++) {
      const startPage = section.start_page + (i * this.maxSegmentSize)
      const endPage = Math.min(section.end_page, startPage + this.maxSegmentSize - 1)
      
      const segment = {
        seg_no: startSegNo + i,
        title: `${section.title} - Bölüm ${i + 1}`,
        p_start: startPage,
        p_end: endPage,
        content_type: section.content_type || 'mixed',
        original_section: section.title
      }

      segments.push(segment)
    }

    return segments
  }

  /**
   * Tek bir segment oluştur
   * @param {Object} section - Section bilgileri
   * @param {number} segNo - Segment numarası
   * @returns {Object} Segment objesi
   */
  createSegment(section, segNo) {
    return {
      seg_no: segNo,
      title: section.title,
      p_start: section.start_page,
      p_end: section.end_page,
      content_type: section.content_type || 'mixed',
      original_section: section.title
    }
  }

  /**
   * Section yoksa sayfa bazlı segmentler oluştur
   * @param {number} totalPages - Toplam sayfa sayısı
   * @param {Object} outline - Outline bilgileri
   * @returns {Array} Sayfa bazlı segmentler
   */
  createPageBasedSegments(totalPages, outline) {
    const segments = []
    const title = outline.title || 'Bilinmeyen Başlık'
    
    // 20 sayfalık segmentler oluştur
    for (let i = 0; i < totalPages; i += this.maxSegmentSize) {
      const startPage = i + 1
      const endPage = Math.min(totalPages, i + this.maxSegmentSize)
      
      const segment = {
        seg_no: segments.length + 1,
        title: `${title} - Sayfa ${startPage}-${endPage}`,
        p_start: startPage,
        p_end: endPage,
        content_type: 'mixed',
        original_section: 'Sayfa Bazlı Bölümleme'
      }

      segments.push(segment)
    }

    return segments
  }

  /**
   * Segment'leri validate et
   * @param {Array} segments - Segment listesi
   * @param {number} totalPages - Toplam sayfa sayısı
   * @returns {Object} Validation sonucu
   */
  validateSegments(segments, totalPages) {
    const errors = []
    const warnings = []

    // Boş segment kontrolü
    if (!segments || segments.length === 0) {
      errors.push('Hiç segment oluşturulamadı')
      return { isValid: false, errors, warnings, totalSegments: 0 }
    }

    // Sayfa aralığı kontrolü
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      
      // Sayfa numarası kontrolü
      if (segment.p_start < 1 || segment.p_end > totalPages) {
        errors.push(`Segment ${segment.seg_no}: Sayfa aralığı geçersiz (${segment.p_start}-${segment.p_end})`)
      }

      // Segment boyutu kontrolü
      const segmentSize = segment.p_end - segment.p_start + 1
      if (segmentSize < this.minSegmentSize) {
        warnings.push(`Segment ${segment.seg_no}: Çok küçük (${segmentSize} sayfa)`)
      }

      // Overlap kontrolü - sadece ardışık segmentler arasında
      if (i > 0) {
        const prevSegment = segments[i - 1]
        if (segment.p_start <= prevSegment.p_end) {
          errors.push(`Segment ${segment.seg_no}: Önceki segment ile overlap (${prevSegment.p_end} ≥ ${segment.p_start})`)
        }
      }
    }

    // Kapsama kontrolü
    const firstSegment = segments[0]
    const lastSegment = segments[segments.length - 1]
    
    if (firstSegment.p_start > 1) {
      warnings.push('İlk sayfa kapsanmıyor')
    }
    
    if (lastSegment.p_end < totalPages) {
      warnings.push('Son sayfa kapsanmıyor')
    }

    // Aradaki boşlukları kontrol et
    for (let i = 1; i < segments.length; i++) {
      const prevSegment = segments[i - 1]
      const currentSegment = segments[i]
      
      // Eğer segmentler arasında boşluk varsa
      if (currentSegment.p_start > prevSegment.p_end + 1) {
        const gapStart = prevSegment.p_end + 1
        const gapEnd = currentSegment.p_start - 1
        warnings.push(`Sayfa ${gapStart}-${gapEnd} bölümler arasında eksik`)
      }
    }

    // Segment numarası kontrolü
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].seg_no !== i + 1) {
        warnings.push(`Segment numarası sıralı değil: ${segments[i].seg_no} (beklenen: ${i + 1})`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalSegments: segments.length,
      coverage: {
        start: firstSegment.p_start,
        end: lastSegment.p_end,
        total: totalPages
      }
    }
  }

  /**
   * Segment'leri database'e kaydet
   * @param {string} documentId - Document ID
   * @param {Array} segments - Segment listesi
   * @returns {Object} Kaydetme sonucu
   */
  async saveSegmentsToDatabase(documentId, segments) {
    try {
      console.log(`${segments.length} segment database'e kaydediliyor...`)

      // Önce mevcut segment'leri kontrol et (duplicate prevention)
      const { data: existingSegments, error: checkError } = await supabase
        .from('segments')
        .select('id')
        .eq('document_id', documentId)

      if (checkError) {
        console.error('Mevcut segment kontrolü hatası:', checkError)
        throw new Error(`Segment kontrolü hatası: ${checkError.message}`)
      }

      if (existingSegments && existingSegments.length > 0) {
        console.log(`${existingSegments.length} mevcut segment bulundu, siliniyor...`)
        
        // Mevcut segment'leri sil
        const { error: deleteError } = await supabase
          .from('segments')
          .delete()
          .eq('document_id', documentId)

        if (deleteError) {
          console.error('Segment silme hatası:', deleteError)
          throw new Error(`Segment silme hatası: ${deleteError.message}`)
        }
      }

      // Yeni segment'leri ekle
      const segmentData = segments.map(segment => ({
        document_id: documentId,
        seg_no: segment.seg_no,
        title: segment.title,
        p_start: segment.p_start,
        p_end: segment.p_end,
        text_status: 'PENDING',
        img_status: 'PENDING',
        raw_json: {
          content_type: segment.content_type,
          original_section: segment.original_section,
          created_at: new Date().toISOString()
        }
      }))

      console.log('Segment verileri hazırlandı:', segmentData)

      const { data, error } = await supabase
        .from('segments')
        .insert(segmentData)
        .select()

      if (error) {
        console.error('Segment kaydetme hatası:', error)
        throw new Error(`Database hatası: ${error.message}`)
      }

      console.log(`${data.length} segment başarıyla kaydedildi`)
      return {
        success: true,
        savedCount: data.length,
        segments: data
      }

    } catch (error) {
      console.error('Segment kaydetme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Document için segment oluştur ve kaydet
   * @param {string} documentId - Document ID
   * @returns {Object} İşlem sonucu
   */
  async createSegmentsForDocument(documentId) {
    try {
      console.log(`Document ${documentId} için segment oluşturuluyor...`)

      // Document bilgilerini al
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (docError || !document) {
        throw new Error('Document bulunamadı')
      }

      // Outline kontrolü
      if (!document.outline) {
        throw new Error('Document outline\'ı bulunamadı. Önce Document Understanding çalıştırın.')
      }

      // Segment'leri oluştur
      const segments = this.createSegmentsFromOutline(document, document.outline)

      // Validate et
      const validation = this.validateSegments(segments, document.page_count)
      
      if (!validation.isValid) {
        console.error('Segment validation hatası:', validation.errors)
        return {
          success: false,
          error: 'Segment validation başarısız',
          details: validation
        }
      }

      // Database'e kaydet
      const saveResult = await this.saveSegmentsToDatabase(documentId, segments)

      if (!saveResult.success) {
        return saveResult
      }

      return {
        success: true,
        segments: segments,
        validation: validation,
        savedCount: saveResult.savedCount
      }

    } catch (error) {
      console.error('Segment oluşturma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Document'ın segment'lerini getir
   * @param {string} documentId - Document ID
   * @returns {Object} Segment listesi
   */
  async getDocumentSegments(documentId) {
    try {
      const { data: segments, error } = await supabase
        .from('segments')
        .select('*')
        .eq('document_id', documentId)
        .order('seg_no', { ascending: true })

      if (error) {
        console.error('Segment getirme hatası:', error)
        throw new Error(`Segment getirme hatası: ${error.message}`)
      }

      return {
        success: true,
        segments: segments || []
      }

    } catch (error) {
      console.error('Segment getirme hatası:', error)
      return {
        success: false,
        error: error.message,
        segments: []
      }
    }
  }

  /**
   * Segment durumunu güncelle
   * @param {string} segmentId - Segment ID
   * @param {string} statusType - 'text_status' veya 'img_status'
   * @param {string} status - Yeni durum
   * @returns {Object} Güncelleme sonucu
   */
  async updateSegmentStatus(segmentId, statusType, status) {
    try {
      const { data, error } = await supabase
        .from('segments')
        .update({ [statusType]: status })
        .eq('id', segmentId)
        .select()

      if (error) {
        console.error('Segment durum güncelleme hatası:', error)
        throw new Error(`Durum güncelleme hatası: ${error.message}`)
      }

      return {
        success: true,
        segment: data[0]
      }

    } catch (error) {
      console.error('Segment durum güncelleme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new SegmentService() 