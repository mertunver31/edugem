import { supabase } from '../config/supabase'
import { genAI, MODELS } from './geminiService'

/**
 * Course Structure Generator Service
 * PDF analiz sonuçlarından otomatik kurs yapısı oluşturma
 */
class CourseStructureService {
  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: MODELS.DOCUMENT_UNDERSTANDING 
    })
  }

  /**
   * Document'dan kurs yapısı oluştur
   * @param {string} documentId - Document ID
   * @returns {Object} Kurs yapısı
   */
  async generateCourseStructure(documentId) {
    try {
      console.log(`Course Structure Generator başlatılıyor: ${documentId}`)

      // 1. Document bilgilerini al
      const documentInfo = await this.getDocumentInfo(documentId)
      if (!documentInfo.success) {
        throw new Error(`Document bilgileri alınamadı: ${documentInfo.error}`)
      }

      // 2. Document outline'ını kontrol et
      if (!documentInfo.data.outline) {
        throw new Error('Document outline bulunamadı. Önce Document Understanding çalıştırılmalı.')
      }

      // 3. Segment'leri al
      const segmentsInfo = await this.getSegments(documentId)
      if (!segmentsInfo.success) {
        throw new Error(`Segment'ler alınamadı: ${segmentsInfo.error}`)
      }

      // 4. Kurs yapısını oluştur
      const courseStructure = await this.createCourseStructure(documentInfo.data, segmentsInfo.data)
      if (!courseStructure.success) {
        throw new Error(`Kurs yapısı oluşturulamadı: ${courseStructure.error}`)
      }

      // 5. Kurs yapısını kaydet
      const saveResult = await this.saveCourseStructure(documentId, courseStructure.data)
      if (!saveResult.success) {
        throw new Error(`Kurs yapısı kaydedilemedi: ${saveResult.error}`)
      }

      console.log(`Course Structure Generator tamamlandı: ${documentId}`)
      return {
        success: true,
        documentId: documentId,
        courseStructure: courseStructure.data,
        metadata: {
          generated_at: new Date().toISOString(),
          total_chapters: courseStructure.data.chapters.length,
          total_lessons: courseStructure.data.chapters.reduce((total, chapter) => total + chapter.lessons.length, 0),
          estimated_duration: courseStructure.data.estimatedDuration
        }
      }

    } catch (error) {
      console.error('Course Structure Generator hatası:', error)
      return {
        success: false,
        error: error.message,
        documentId: documentId
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
   * Document'ın segment'lerini al
   * @param {string} documentId - Document ID
   * @returns {Object} Segment listesi
   */
  async getSegments(documentId) {
    try {
      const { data, error } = await supabase
        .from('segments')
        .select('*')
        .eq('document_id', documentId)
        .order('seg_no', { ascending: true })

      if (error) {
        throw new Error(`Segment'ler alınamadı: ${error.message}`)
      }

      return {
        success: true,
        data: data
      }

    } catch (error) {
      console.error('Segmentler alma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Kurs yapısını oluşturur.
   * @param {Object} documentInfo Document bilgileri
   * @param {Array} segments Segment listesi
   * @returns {Object} Kurs yapısı
   */
  async createCourseStructure(documentInfo, segments) {
    try {
      console.log('Kurs yapısı oluşturuluyor...')

      // Outline'ı parse et
      let outline
      try {
        outline = typeof documentInfo.outline === 'string' 
          ? JSON.parse(documentInfo.outline) 
          : documentInfo.outline
      } catch (e) {
        throw new Error('Document outline parse edilemedi')
      }

      // Gemini ile kurs yapısını oluştur
      const courseStructure = await this.generateCourseStructureWithAI(outline, segments, documentInfo)

      return {
        success: true,
        data: courseStructure
      }

    } catch (error) {
      console.error('Kurs yapısı oluşturma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * AI ile kurs yapısını oluştur
   * @param {Object} outline - Document outline
   * @param {Array} segments - Segment listesi
   * @param {Object} documentInfo - Document bilgileri
   * @returns {Object} Kurs yapısı
   */
  async generateCourseStructureWithAI(outline, segments, documentInfo) {
    try {
      const prompt = `
        Bu PDF için kapsamlı bir eğitim kursu yapısı oluştur.
        
        PDF Bilgileri:
        - Başlık: ${outline.title || 'Bilinmeyen Başlık'}
        - Yazar: ${outline.author || 'Bilinmeyen Yazar'}
        - Toplam Sayfa: ${outline.total_pages || documentInfo.page_count}
        
        PDF Yapısı:
        ${JSON.stringify(outline.headings, null, 2)}
        
        Segment'ler:
        ${segments.map(seg => `Segment ${seg.seg_no}: ${seg.title} (Sayfa ${seg.p_start}-${seg.p_end})`).join('\n')}
        
        Lütfen şu JSON formatında kurs yapısı oluştur:
        {
          "title": "Kurs Başlığı",
          "description": "Kurs açıklaması",
          "learningObjectives": [
            "Öğrenme hedefi 1",
            "Öğrenme hedefi 2"
          ],
          "estimatedDuration": "Tahmini süre (örn: 8-10 saat)",
          "difficultyLevel": "Başlangıç|Orta|İleri",
          "chapters": [
            {
              "id": "chapter-1",
              "title": "Bölüm Başlığı",
              "description": "Bölüm açıklaması",
              "order": 1,
              "estimatedDuration": "2-3 saat",
              "lessons": [
                {
                  "id": "lesson-1-1",
                  "title": "Ders Başlığı",
                  "description": "Ders açıklaması",
                  "order": 1,
                  "estimatedDuration": "30-45 dakika",
                  "segmentId": "segment-id",
                  "contentType": "text|video|interactive",
                  "learningPoints": [
                    "Öğrenme noktası 1",
                    "Öğrenme noktası 2"
                  ]
                }
              ]
            }
          ]
        }
        
        Kurallar:
        1. Segment'leri mantıklı bölümlere grupla
        2. Her bölüm 3-7 ders içersin
        3. Öğrenme hedefleri net ve ölçülebilir olsun
        4. Zorluk seviyesi içeriğe uygun olsun
        5. Sadece JSON döndür, başka açıklama ekleme
      `

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // JSON'ı parse et
      let courseStructure
      try {
        // Markdown formatını temizle
        let cleanText = text.trim()
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }

        courseStructure = JSON.parse(cleanText)
      } catch (parseError) {
        console.error('JSON parse hatası:', parseError)
        console.error('Ham metin:', text)
        throw new Error('AI yanıtı JSON formatında değil')
      }

      // Segment ID'lerini eşleştir
      courseStructure = this.mapSegmentIds(courseStructure, segments)

      return courseStructure

    } catch (error) {
      console.error('AI ile kurs yapısı oluşturma hatası:', error)
      throw error
    }
  }

  /**
   * Segment ID'lerini eşleştir
   * @param {Object} courseStructure - Kurs yapısı
   * @param {Array} segments - Segment listesi
   * @returns {Object} Güncellenmiş kurs yapısı
   */
  mapSegmentIds(courseStructure, segments) {
    // Her ders için uygun segment'i bul
    courseStructure.chapters.forEach(chapter => {
      chapter.lessons.forEach(lesson => {
        // Segment ID'si varsa kontrol et, yoksa uygun segment'i bul
        if (!lesson.segmentId) {
          // Ders başlığına göre en uygun segment'i bul
          const matchingSegment = segments.find(seg => 
            seg.title && lesson.title.toLowerCase().includes(seg.title.toLowerCase())
          )
          
          if (matchingSegment) {
            lesson.segmentId = matchingSegment.id
          } else {
            // İlk uygun segment'i ata
            const availableSegment = segments.find(seg => 
              !courseStructure.chapters.some(ch => 
                ch.lessons.some(les => les.segmentId === seg.id)
              )
            )
            if (availableSegment) {
              lesson.segmentId = availableSegment.id
            }
          }
        }
      })
    })

    return courseStructure
  }

  /**
   * Kurs yapısını kaydet
   * @param {string} documentId - Document ID
   * @param {Object} courseStructure - Kurs yapısı
   * @returns {Object} Kaydetme sonucu
   */
  async saveCourseStructure(documentId, courseStructure) {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          course_structure: courseStructure,
          course_structure_generated_at: new Date().toISOString(),
          status: 'course_structure_generated'
        })
        .eq('id', documentId)

      if (error) {
        throw new Error(`Kurs yapısı kaydedilemedi: ${error.message}`)
      }

      return {
        success: true
      }

    } catch (error) {
      console.error('Kurs yapısı kaydetme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Kurs yapısını getir
   * @param {string} documentId - Document ID
   * @returns {Object} Kurs yapısı
   */
  async getCourseStructure(documentId) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('course_structure, course_structure_generated_at')
        .eq('id', documentId)
        .single()

      if (error) {
        throw new Error(`Kurs yapısı alınamadı: ${error.message}`)
      }

      return {
        success: true,
        data: {
          courseStructure: data.course_structure,
          generatedAt: data.course_structure_generated_at
        }
      }

    } catch (error) {
      console.error('Kurs yapısı alma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Test fonksiyonu
   * @param {string} documentId - Document ID
   * @returns {boolean} Test sonucu
   */
  async testCourseStructureGeneration(documentId) {
    console.log('Course Structure Generator test başlatılıyor...')
    
    const result = await this.generateCourseStructure(documentId)
    
    if (result.success) {
      console.log('✅ Course Structure Generator test başarılı')
      console.log('Oluşturulan kurs yapısı:', result.courseStructure)
      return true
    } else {
      console.log('❌ Course Structure Generator test başarısız:', result.error)
      return false
    }
  }
}

// Singleton instance
export const courseStructureService = new CourseStructureService() 