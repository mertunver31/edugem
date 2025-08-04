import { supabase } from '../config/supabase'
import { genAI, MODELS, estimateTokens } from './geminiService'
import { courseStructureService } from './courseStructureService'
import segmentService from './segmentService'
import { pdfTextExtractionService } from './pdfTextExtractionService'

/**
 * Enhanced Content Generation Service
 * AI destekli detaylı eğitim içeriği üretimi ve yönetimi
 */
class EnhancedContentService {
  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: MODELS.TEXT_GENERATION 
    })
  }

  /**
   * Document için enhanced content üret
   * @param {string} documentId - Document ID
   * @returns {Object} Enhanced content sonucu
   */
  async generateEnhancedContent(documentId) {
    try {
      console.log(`Enhanced Content Generation başlatılıyor: ${documentId}`)

      // 1. Document bilgilerini al
      const documentInfo = await this.getDocumentInfo(documentId)
      if (!documentInfo.success) {
        throw new Error(`Document bilgileri alınamadı: ${documentInfo.error}`)
      }

      // 2. Kurs yapısını al
      const courseStructure = await courseStructureService.getCourseStructure(documentId)
      if (!courseStructure.success) {
        throw new Error(`Kurs yapısı alınamadı: ${courseStructure.error}`)
      }

      // 3. Her chapter için enhanced content üret
      const enhancedContent = await this.generateContentForChapters(documentId, courseStructure.data.courseStructure)
      if (!enhancedContent.success) {
        throw new Error(`Enhanced content üretilemedi: ${enhancedContent.error}`)
      }

      // 4. Enhanced content'i kaydet
      const saveResult = await this.saveEnhancedContent(documentId, enhancedContent.data)
      if (!saveResult.success) {
        throw new Error(`Enhanced content kaydedilemedi: ${saveResult.error}`)
      }

      // 5. Kalite değerlendirmesi yap
      const qualityAssessment = await this.assessContentQuality(enhancedContent.data)
      if (!qualityAssessment.success) {
        console.warn('Kalite değerlendirmesi yapılamadı:', qualityAssessment.error)
      }

      console.log(`Enhanced Content Generation tamamlandı: ${documentId}`)
      return {
        success: true,
        documentId: documentId,
        enhancedContent: enhancedContent.data,
        qualityAssessment: qualityAssessment.success ? qualityAssessment.data : null,
        metadata: {
          generated_at: new Date().toISOString(),
          total_chapters: enhancedContent.data.chapters.length,
          total_lessons: enhancedContent.data.chapters.reduce((total, chapter) => {
            return total + (chapter.content && chapter.content.lessons ? chapter.content.lessons.length : 0)
          }, 0),
          content_types: this.getContentTypeStats(enhancedContent.data)
        }
      }

    } catch (error) {
      console.error('Enhanced Content Generation hatası:', error)
      return {
        success: false,
        error: error.message,
        documentId: documentId
      }
    }
  }

  /**
   * Chapter'lar için enhanced content üret
   * @param {string} documentId - Document ID
   * @param {Object} courseStructure - Kurs yapısı
   * @returns {Object} Enhanced content
   */
  async generateContentForChapters(documentId, courseStructure) {
    try {
      const enhancedChapters = []

      for (const chapter of courseStructure.chapters) {
        console.log(`Chapter content üretiliyor: ${chapter.title}`)
        
        const chapterContent = await this.generateChapterContent(documentId, chapter, courseStructure)
        if (!chapterContent.success) {
          console.warn(`Chapter content üretilemedi: ${chapter.title}`, chapterContent.error)
          continue
        }

        enhancedChapters.push({
          chapterId: chapter.id,
          title: chapter.title,
          content: chapterContent.data
        })
      }

      return {
        success: true,
        data: {
          documentId: documentId,
          chapters: enhancedChapters,
          generated_at: new Date().toISOString()
        }
      }

    } catch (error) {
      console.error('Chapter content üretme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Tek chapter için enhanced content üret (Chapter bazında tüm segment'leri birleştirerek)
   * @param {string} documentId - Document ID
   * @param {Object} chapter - Chapter bilgileri
   * @param {Object} courseStructure - Kurs yapısı
   * @returns {Object} Chapter content
   */
  async generateChapterContent(documentId, chapter, courseStructure) {
    try {
      console.log(`📚 Chapter için tüm segment'ler birleştiriliyor: ${chapter.title}`)
      
      // Chapter'daki tüm lesson'ların segment ID'lerini topla
      const allSegmentIds = []
      chapter.lessons.forEach(lesson => {
        const segmentIds = lesson.segmentIds || (lesson.segmentId ? [lesson.segmentId] : [])
        allSegmentIds.push(...segmentIds)
      })
      
      // Benzersiz segment ID'leri al
      const uniqueSegmentIds = [...new Set(allSegmentIds)]
      console.log(`📖 Chapter için ${uniqueSegmentIds.length} benzersiz segment bulundu`)
      
      // Tüm segment içeriklerini birleştir (PDF extraction ile, Gemini için sadece text)
      const chapterSegmentContent = await this.getSegmentContent(uniqueSegmentIds, documentId)
      if (!chapterSegmentContent.success) {
        throw new Error(`Chapter segment içerikleri alınamadı: ${chapterSegmentContent.error}`)
      }
      
      console.log(`📝 Chapter içerik uzunluğu: ${chapterSegmentContent.content.length} karakter`)
      
      // Chapter için tek seferde AI content üret
      const chapterContent = await this.generateChapterContentWithAI(documentId, chapter, courseStructure, chapterSegmentContent.content)
      if (!chapterContent.success) {
        throw new Error(`Chapter content üretilemedi: ${chapterContent.error}`)
      }
      
      return {
        success: true,
        data: {
          chapterTitle: chapter.title,
          lessons: chapterContent.data.lessons,
          metadata: {
            segmentCount: uniqueSegmentIds.length,
            contentLength: chapterSegmentContent.content.length,
            lessonCount: chapterContent.data.lessons.length
          }
        }
      }

    } catch (error) {
      console.error('Chapter content üretme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Chapter için AI ile tüm lesson'ları tek seferde üret
   * @param {string} documentId - Document ID
   * @param {Object} chapter - Chapter bilgileri
   * @param {Object} courseStructure - Kurs yapısı
   * @param {string} segmentContent - Birleştirilmiş segment içeriği (sadece text)
   * @returns {Object} Chapter content
   */
  async generateChapterContentWithAI(documentId, chapter, courseStructure, segmentContent) {
    try {
      console.log(`🤖 Chapter için AI content üretimi başlatılıyor: ${chapter.title}`)
      
      // Chapter için optimize edilmiş prompt oluştur
      const prompt = this.createChapterPrompt(chapter, courseStructure, segmentContent)
      
      console.log(`📤 AI'ya gönderilen prompt uzunluğu: ${prompt.length} karakter`)
      
      // Rate limiting ile AI content üret
      const aiResponse = await this.generateContentWithRetry(prompt)
      if (!aiResponse.success) {
        throw new Error(`AI content üretilemedi: ${aiResponse.error}`)
      }
      
      console.log(`📥 AI'dan gelen response uzunluğu: ${aiResponse.data.length} karakter`)
      
      // Content'i parse et ve yapılandır
      const structuredContent = this.parseAndStructureChapterContent(aiResponse.data, chapter)
      if (!structuredContent.success) {
        throw new Error(`Chapter content yapılandırılamadı: ${structuredContent.error}`)
      }
      
      return {
        success: true,
        data: {
          chapterTitle: chapter.title,
          lessons: structuredContent.data.lessons,
          metadata: {
            generated_at: new Date().toISOString(),
            lessonCount: structuredContent.data.lessons.length,
            contentLength: JSON.stringify(structuredContent.data).length
          }
        }
      }

    } catch (error) {
      console.error('Chapter AI content üretme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Chapter için AI prompt oluştur (Tüm lesson'ları tek seferde üretmek için)
   * @param {Object} chapter - Chapter bilgileri
   * @param {Object} courseStructure - Kurs yapısı
   * @param {string} segmentContent - Birleştirilmiş segment içeriği (sadece text)
   * @returns {string} AI prompt
   */
  createChapterPrompt(chapter, courseStructure, segmentContent) {
    return `
    Aşağıdaki chapter için tüm lesson'ların detaylı eğitim içeriğini tek seferde üret:
    
    KURS BİLGİLERİ:
    Kurs: ${courseStructure.title}
    Chapter: ${chapter.title}
    Lesson Sayısı: ${chapter.lessons.length}
    
    LESSON'LAR:
    ${chapter.lessons.map((lesson, index) => `${index + 1}. ${lesson.title}`).join('\n')}
    
    SEGMENT İÇERİĞİ (PDF'den çıkarılan gerçek metin, tablolar ve görsel açıklamaları):
    ${segmentContent || 'Segment içeriği bulunamadı.'}
    
    TALİMATLAR:
    Yukarıdaki segment içeriğini kullanarak, her lesson için detaylı eğitim içeriği üret.
    Her lesson için ayrı ayrı içerik oluştur, ancak chapter bütünlüğünü koru.
    
    İçerik türleri (her lesson için):
    1. **Açıklayıcı Metin** - Konuyu detaylı açıklayan paragraflar (minimum 300 karakter)
    2. **Madde Listeleri** - Önemli noktaları listeleyen maddeler (en az 5 madde)
    3. **Tablo** - Karşılaştırma veya özet tabloları (eğer uygunsa)
    4. **Kod Blokları** - Örnek kodlar (eğer uygunsa)
    5. **Örnekler** - Pratik örnekler (en az 2 örnek)
    6. **Özet** - Ders özeti (minimum 150 karakter)
    
    JSON formatında döndür:
    {
      "lessons": [
        {
          "lessonId": "lesson-1-1",
          "title": "Lesson Başlığı",
          "content": {
            "explanatory_text": "Açıklayıcı metin...",
            "key_points": ["Madde 1", "Madde 2", "Madde 3", "Madde 4", "Madde 5"],
            "tables": [
              {
                "title": "Tablo başlığı",
                "headers": ["Sütun 1", "Sütun 2"],
                "rows": [["Veri 1", "Veri 2"], ["Veri 3", "Veri 4"]]
              }
            ],
            "code_examples": [
              {
                "language": "javascript",
                "title": "Örnek kod başlığı",
                "code": "console.log('Hello World');"
              }
            ],
            "practical_examples": [
              {
                "title": "Örnek başlığı",
                "description": "Örnek açıklaması"
              }
            ],
            "summary": "Ders özeti..."
          }
        }
      ]
    }
    
    Sadece JSON döndür, başka açıklama ekleme.
    `
  }

  /**
   * Chapter AI response'unu parse et ve yapılandır
   * @param {string} aiResponse - AI response
   * @param {Object} chapter - Chapter bilgileri
   * @returns {Object} Structured chapter content
   */
  parseAndStructureChapterContent(aiResponse, chapter) {
    try {
      // AI response'u temizle - markdown code blocks'ları kaldır
      let cleanedResponse = aiResponse.trim()
      
      // ```json ve ``` işaretlerini kaldır
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.substring(7)
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.substring(3)
      }
      
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3)
      }
      
      // JSON parse et
      const parsedContent = JSON.parse(cleanedResponse.trim())
      
      // Content'i doğrula ve yapılandır
      if (!parsedContent.lessons || !Array.isArray(parsedContent.lessons)) {
        throw new Error('AI response\'da lessons array bulunamadı')
      }
      
      const structuredLessons = parsedContent.lessons.map(lessonData => {
        return {
          lessonId: lessonData.lessonId || lessonData.title,
          title: lessonData.title,
          content: {
            explanatory_text: lessonData.content?.explanatory_text || '',
            key_points: Array.isArray(lessonData.content?.key_points) ? lessonData.content.key_points : [],
            tables: Array.isArray(lessonData.content?.tables) ? lessonData.content.tables : [],
            code_examples: Array.isArray(lessonData.content?.code_examples) ? lessonData.content.code_examples : [],
            practical_examples: Array.isArray(lessonData.content?.practical_examples) ? lessonData.content.practical_examples : [],
            summary: lessonData.content?.summary || ''
          }
        }
      })

      return {
        success: true,
        data: {
          lessons: structuredLessons
        }
      }

    } catch (error) {
      console.error('Chapter content parse hatası:', error)
      return {
        success: false,
        error: `JSON parse hatası: ${error.message}`
      }
    }
  }

  /**
   * AI ile content üret (Rate limiting ile retry)
   * @param {string} prompt - AI prompt
   * @returns {Object} AI response
   */
  async generateContentWithRetry(prompt) {
    const maxRetries = 3
    const baseDelay = 5000 // 5 saniye
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 AI isteği gönderiliyor (Deneme ${attempt}/${maxRetries})`)
        
        const result = await this.model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        
        console.log(`✅ AI isteği başarılı (Deneme ${attempt})`)
        
        return {
          success: true,
          data: text
        }

      } catch (error) {
        console.error(`❌ AI isteği başarısız (Deneme ${attempt}):`, error.message)
        
        // Rate limit hatası ise bekle ve tekrar dene
        if (error.message.includes('429') || error.message.includes('quota')) {
          if (attempt < maxRetries) {
            const delay = baseDelay * attempt // 5s, 10s, 15s
            console.log(`⏳ Rate limit aşıldı. ${delay/1000} saniye bekleniyor...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
        }
        
        // Son deneme veya başka hata
        if (attempt === maxRetries) {
          return {
            success: false,
            error: error.message
          }
        }
      }
    }
  }

  /**
   * Tek lesson için enhanced content üret (Artık kullanılmıyor)
   * @param {string} documentId - Document ID
   * @param {Object} lesson - Lesson bilgileri
   * @param {Object} chapter - Chapter bilgileri
   * @param {Object} courseStructure - Kurs yapısı
   * @returns {Object} Lesson content
   */
  async generateLessonContent(documentId, lesson, chapter, courseStructure) {
    try {
      // Debug: Lesson bilgilerini göster
      console.log('🔍 LESSON DEBUG:', {
        lessonTitle: lesson.title,
        lessonId: lesson.id,
        segmentIds: lesson.segmentIds,
        hasSegmentIds: !!lesson.segmentIds && lesson.segmentIds.length > 0
      })

      // Segment içeriklerini al
      const segmentContent = await this.getSegmentContent(lesson.segmentIds || [], documentId)
      
      // Öğrenme hedeflerini al
      const learningObjectives = await this.getLearningObjectives(documentId, chapter.id)
      
      // Önceki lesson'ları al
      const previousLessons = await this.getPreviousLessons(documentId, chapter.id, lesson.order || 0)

      // Zenginleştirilmiş context ile AI prompt oluştur
      const prompt = this.createLessonPrompt(lesson, chapter, courseStructure, {
        segmentContent: segmentContent.content,
        learningObjectives: learningObjectives.objectives,
        previousLessons: previousLessons.lessons
      })
      
      // Debug: Prompt'u göster
      console.log('🤖 GEMINI PROMPT:', {
        lessonTitle: lesson.title,
        segmentContentLength: segmentContent.content.length,
        learningObjectivesCount: learningObjectives.objectives.length,
        previousLessonsCount: previousLessons.lessons.length,
        promptPreview: prompt.substring(0, 500) + '...'
      })
      
      // AI ile content üret
      const aiResponse = await this.generateContentWithAI(prompt)
      if (!aiResponse.success) {
        throw new Error(`AI content üretilemedi: ${aiResponse.error}`)
      }

      // Debug: AI response'unu göster
      console.log('🤖 GEMINI RESPONSE:', {
        lessonTitle: lesson.title,
        responseLength: aiResponse.data.length,
        responsePreview: aiResponse.data.substring(0, 300) + '...'
      })

      // Content'i parse et ve yapılandır
      const structuredContent = this.parseAndStructureContent(aiResponse.data, lesson)
      if (!structuredContent.success) {
        throw new Error(`Content yapılandırılamadı: ${structuredContent.error}`)
      }

      return {
        success: true,
        data: {
          lessonTitle: lesson.title,
          content: structuredContent.data,
          metadata: {
            generated_at: new Date().toISOString(),
            content_length: JSON.stringify(structuredContent.data).length,
            content_types: this.getContentTypes(structuredContent.data),
            segmentCount: segmentContent.segments.length,
            hasLearningObjectives: learningObjectives.objectives.length > 0,
            previousLessonsCount: previousLessons.lessons.length
          }
        }
      }

    } catch (error) {
      console.error('Lesson content üretme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Lesson için AI prompt oluştur
   * @param {Object} lesson - Lesson bilgileri
   * @param {Object} chapter - Chapter bilgileri
   * @param {Object} courseStructure - Kurs yapısı
   * @param {Object} context - Zenginleştirilmiş context
   * @returns {string} AI prompt
   */
  createLessonPrompt(lesson, chapter, courseStructure, context = {}) {
    const { segmentContent = '', learningObjectives = [], previousLessons = [] } = context

    return `
    Aşağıdaki lesson için detaylı eğitim içeriği üret:
    
    KURS BİLGİLERİ:
    Kurs: ${courseStructure.title}
    Chapter: ${chapter.title}
    Lesson: ${lesson.title}
    
    ÖĞRENME HEDEFLERİ:
    ${learningObjectives.length > 0 ? learningObjectives.map(obj => `- ${obj}`).join('\n') : 'Bu lesson için özel hedef belirtilmemiş.'}
    
    ÖNCEKİ LESSON BAĞLANTILARI:
    ${previousLessons.length > 0 ? previousLessons.map(prev => `- ${prev.title}`).join('\n') : 'Bu ilk lesson.'}
    
    SEGMENT İÇERİĞİ (PDF'den çıkarılan gerçek metin):
    ${segmentContent || 'Segment içeriği bulunamadı.'}
    
    TALİMATLAR:
    Yukarıdaki segment içeriğini kullanarak, öğrenme hedeflerine uygun ve önceki lesson'larla bağlantılı detaylı eğitim içeriği üret.
    
    İçerik türleri:
    1. **Açıklayıcı Metin** - Konuyu detaylı açıklayan paragraflar (minimum 300 karakter)
    2. **Madde Listeleri** - Önemli noktaları listeleyen maddeler (en az 5 madde)
    3. **Tablo** - Karşılaştırma veya özet tabloları (eğer uygunsa)
    4. **Kod Blokları** - Örnek kodlar (eğer uygunsa)
    5. **Örnekler** - Pratik örnekler (en az 2 örnek)
    6. **Özet** - Ders özeti (minimum 150 karakter)
    
    JSON formatında döndür:
    {
      "explanatory_text": "Açıklayıcı metin...",
      "key_points": ["Madde 1", "Madde 2", "Madde 3", "Madde 4", "Madde 5"],
      "tables": [
        {
          "title": "Tablo başlığı",
          "headers": ["Sütun 1", "Sütun 2"],
          "rows": [["Veri 1", "Veri 2"], ["Veri 3", "Veri 4"]]
        }
      ],
      "code_examples": [
        {
          "language": "javascript",
          "title": "Örnek kod başlığı",
          "code": "console.log('Hello World');"
        }
      ],
      "practical_examples": [
        {
          "title": "Örnek başlığı",
          "description": "Örnek açıklaması"
        }
      ],
      "summary": "Ders özeti..."
    }
    
    Sadece JSON döndür, başka açıklama ekleme.
    `
  }

  /**
   * AI ile content üret
   * @param {string} prompt - AI prompt
   * @returns {Object} AI response
   */
  async generateContentWithAI(prompt) {
    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      return {
        success: true,
        data: text
      }

    } catch (error) {
      console.error('AI content üretme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * AI response'u parse et ve yapılandır
   * @param {string} aiResponse - AI response
   * @param {Object} lesson - Lesson bilgileri
   * @returns {Object} Structured content
   */
  parseAndStructureContent(aiResponse, lesson) {
    try {
      // AI response'u temizle - markdown code blocks'ları kaldır
      let cleanedResponse = aiResponse.trim()
      
      // ```json ve ``` işaretlerini kaldır
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.substring(7)
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.substring(3)
      }
      
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3)
      }
      
      // JSON parse et
      const parsedContent = JSON.parse(cleanedResponse.trim())
      
      // Content'i doğrula ve yapılandır
      const structuredContent = {
        explanatory_text: parsedContent.explanatory_text || '',
        key_points: Array.isArray(parsedContent.key_points) ? parsedContent.key_points : [],
        tables: Array.isArray(parsedContent.tables) ? parsedContent.tables : [],
        code_examples: Array.isArray(parsedContent.code_examples) ? parsedContent.code_examples : [],
        practical_examples: Array.isArray(parsedContent.practical_examples) ? parsedContent.practical_examples : [],
        summary: parsedContent.summary || ''
      }

      return {
        success: true,
        data: structuredContent
      }

    } catch (error) {
      console.error('Content parse hatası:', error)
      return {
        success: false,
        error: `JSON parse hatası: ${error.message}`
      }
    }
  }

  /**
   * Enhanced content'i kaydet
   * @param {string} documentId - Document ID
   * @param {Object} enhancedContent - Enhanced content
   * @returns {Object} Save result
   */
  async saveEnhancedContent(documentId, enhancedContent) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          enhanced_content: enhancedContent,
          enhanced_content_generated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()

      if (error) {
        throw new Error(`Enhanced content kaydedilemedi: ${error.message}`)
      }

      return {
        success: true,
        data: data[0]
      }

    } catch (error) {
      console.error('Enhanced content kaydetme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Enhanced content'i al
   * @param {string} documentId - Document ID
   * @returns {Object} Enhanced content
   */
  async getEnhancedContent(documentId) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('enhanced_content, enhanced_content_generated_at')
        .eq('id', documentId)
        .single()

      if (error) {
        throw new Error(`Enhanced content alınamadı: ${error.message}`)
      }

      return {
        success: true,
        data: {
          enhanced_content: data.enhanced_content,
          generated_at: data.enhanced_content_generated_at
        }
      }

    } catch (error) {
      console.error('Enhanced content alma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * İçerik kalitesi değerlendirmesi
   * @param {Object} enhancedContent - Enhanced content
   * @returns {Object} Quality assessment
   */
  async assessContentQuality(enhancedContent) {
    try {
      const assessment = {
        overall_score: 0,
        chapter_scores: [],
        issues: [],
        recommendations: []
      }

      let totalScore = 0
      let chapterCount = 0

      for (const chapter of enhancedContent.chapters) {
        const chapterScore = this.assessChapterQuality(chapter)
        assessment.chapter_scores.push({
          chapterId: chapter.chapterId,
          title: chapter.title,
          score: chapterScore.score,
          issues: chapterScore.issues
        })

        totalScore += chapterScore.score
        chapterCount++
      }

      assessment.overall_score = chapterCount > 0 ? Math.round(totalScore / chapterCount) : 0

      // Genel öneriler
      if (assessment.overall_score < 70) {
        assessment.recommendations.push("İçerik kalitesi düşük. AI prompt'ları iyileştirilmeli.");
      }

      return {
        success: true,
        data: assessment
      }

    } catch (error) {
      console.error('Kalite değerlendirmesi hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Chapter kalitesi değerlendirmesi
   * @param {Object} chapter - Chapter content
   * @returns {Object} Chapter quality assessment
   */
  assessChapterQuality(chapter) {
    const issues = []
    let score = 100

    // Null checks
    if (!chapter || !chapter.content) {
      issues.push('Chapter content bulunamadı')
      return {
        score: 0,
        issues: issues
      }
    }

    if (!chapter.content.lessons || !Array.isArray(chapter.content.lessons)) {
      issues.push('Chapter lessons bulunamadı veya geçersiz format')
      return {
        score: 0,
        issues: issues
      }
    }

    // Lesson sayısı kontrolü
    if (chapter.content.lessons.length === 0) {
      issues.push('Hiç lesson içeriği yok')
      score -= 30
    }

    // Her lesson için kalite kontrolü
    for (const lesson of chapter.content.lessons) {
      if (!lesson || !lesson.content) {
        issues.push(`${lesson?.title || 'Unknown'}: Lesson content bulunamadı`)
        score -= 10
        continue
      }

      if (!lesson.content.explanatory_text || lesson.content.explanatory_text.length < 100) {
        issues.push(`${lesson.title}: Açıklayıcı metin çok kısa`)
        score -= 5
      }

      if (!lesson.content.key_points || lesson.content.key_points.length === 0) {
        issues.push(`${lesson.title}: Anahtar noktalar eksik`)
        score -= 5
      }

      if (!lesson.content.summary || lesson.content.summary.length < 50) {
        issues.push(`${lesson.title}: Özet eksik veya çok kısa`)
        score -= 5
      }
    }

    return {
      score: Math.max(0, score),
      issues: issues
    }
  }

  /**
   * Content type istatistikleri
   * @param {Object} enhancedContent - Enhanced content
   * @returns {Object} Content type stats
   */
  getContentTypeStats(enhancedContent) {
    const stats = {
      total_chapters: enhancedContent.chapters.length,
      total_lessons: 0,
      content_types: {
        explanatory_text: 0,
        key_points: 0,
        tables: 0,
        code_examples: 0,
        practical_examples: 0,
        summaries: 0
      }
    }

    for (const chapter of enhancedContent.chapters) {
      if (chapter.content && chapter.content.lessons && Array.isArray(chapter.content.lessons)) {
        stats.total_lessons += chapter.content.lessons.length

        for (const lesson of chapter.content.lessons) {
          if (lesson && lesson.content) {
            if (lesson.content.explanatory_text) stats.content_types.explanatory_text++
            if (lesson.content.key_points && lesson.content.key_points.length > 0) stats.content_types.key_points++
            if (lesson.content.tables && lesson.content.tables.length > 0) stats.content_types.tables++
            if (lesson.content.code_examples && lesson.content.code_examples.length > 0) stats.content_types.code_examples++
            if (lesson.content.practical_examples && lesson.content.practical_examples.length > 0) stats.content_types.practical_examples++
            if (lesson.content.summary) stats.content_types.summaries++
          }
        }
      }
    }

    return stats
  }

  /**
   * Content types al
   * @param {Object} content - Content
   * @returns {Array} Content types
   */
  getContentTypes(content) {
    const types = []
    if (content.explanatory_text) types.push('explanatory_text')
    if (content.key_points.length > 0) types.push('key_points')
    if (content.tables.length > 0) types.push('tables')
    if (content.code_examples.length > 0) types.push('code_examples')
    if (content.practical_examples.length > 0) types.push('practical_examples')
    if (content.summary) types.push('summary')
    return types
  }

  /**
   * Segment içeriklerini al (PDF extraction ile text ve görsel ayrıştırma, Gemini için sadece text)
   * @param {Array} segmentIds - Segment ID'leri
   * @param {string} documentId - Document ID (opsiyonel, segment'lerden alınacak)
   * @returns {Object} Segment içerikleri
   */
  async getSegmentContent(segmentIds, documentId = null) {
    try {
      if (!segmentIds || !Array.isArray(segmentIds) || segmentIds.length === 0) {
        return {
          success: true,
          content: '',
          segments: []
        }
      }

      // Önce veritabanından segment'leri kontrol et
      const { data: segments, error } = await supabase
        .from('segments')
        .select('id, seg_no, title, content, p_start, p_end, extracted_content, document_id')
        .in('id', segmentIds)
        .order('seg_no', { ascending: true })

      if (error) {
        throw new Error(`Segment içerikleri alınamadı: ${error.message}`)
      }

      // Eğer segment'lerde content yoksa, PDF'den çıkar
      const segmentsWithoutContent = segments.filter(segment => !segment.content)
      
      if (segmentsWithoutContent.length > 0) {
        console.log(`${segmentsWithoutContent.length} segment için PDF extraction gerekli`)
        
        // Document ID'yi belirle (parametre veya segment'ten)
        const targetDocumentId = documentId || segments[0]?.document_id
        
        if (!targetDocumentId) {
          throw new Error('Document ID bulunamadı. Segment\'lerde document_id yok veya parametre geçilmedi.')
        }
        
        console.log(`📄 PDF extraction için document ID: ${targetDocumentId}`)
        
        // PDF extraction yap (text + görsel + tablo)
        const extractionResult = await pdfTextExtractionService.extractSegmentContent(
          targetDocumentId,
          segmentsWithoutContent.map(s => s.id)
        )
        
        if (extractionResult.success) {
          // Çıkarılan içerikleri segment'lere ekle
          for (const extractedSegment of extractionResult.data.segments) {
            const segmentIndex = segments.findIndex(s => s.id === extractedSegment.segmentId)
            if (segmentIndex !== -1) {
              segments[segmentIndex].content = extractedSegment.content.text
              segments[segmentIndex].extracted_content = extractedSegment.content
            }
          }
        }
      }

      // Segment içeriklerini birleştir (Gemini için sadece text)
      const combinedContent = segments
        .map(segment => {
          let content = `## ${segment.title}\n`
          
          // Ana metin (her zaman ekle)
          if (segment.content) {
            content += segment.content
          } else if (segment.extracted_content && segment.extracted_content.text) {
            content += segment.extracted_content.text
          } else {
            content += 'İçerik bulunamadı.'
          }
          
          // Tablolar varsa text olarak ekle (Gemini için)
          if (segment.extracted_content && segment.extracted_content.tables && segment.extracted_content.tables.length > 0) {
            content += '\n\n### Tablolar\n\n'
            segment.extracted_content.tables.forEach((table, index) => {
              content += `**Tablo ${index + 1} (Sayfa ${table.pageNum}):**\n\n`
              
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
          
          // Görseller varsa sadece açıklama ekle (base64 gönderme)
          if (segment.extracted_content && segment.extracted_content.images && segment.extracted_content.images.length > 0) {
            content += '\n\n### Görseller\n\n'
            segment.extracted_content.images.forEach((image, index) => {
              if (image.exists) {
                content += `**Görsel ${index + 1}:** ${image.imageName} (${image.width}x${image.height})\n\n`
              }
            })
          }
          
          return content
        })
        .join('\n\n')

      return {
        success: true,
        content: combinedContent,
        segments: segments || []
      }

    } catch (error) {
      console.error('Segment içerik alma hatası:', error)
      return {
        success: false,
        error: error.message,
        content: '',
        segments: []
      }
    }
  }

  /**
   * Öğrenme hedeflerini al
   * @param {string} documentId - Document ID
   * @param {string} chapterId - Chapter ID
   * @returns {Object} Öğrenme hedefleri
   */
  async getLearningObjectives(documentId, chapterId) {
    try {
      // Course structure'dan chapter'ı bul
      const courseStructure = await courseStructureService.getCourseStructure(documentId)
      if (!courseStructure.success) {
        return {
          success: false,
          objectives: []
        }
      }

      const chapter = courseStructure.data.courseStructure.chapters.find(ch => ch.id === chapterId)
      if (!chapter || !chapter.learningObjectives) {
        return {
          success: true,
          objectives: []
        }
      }

      return {
        success: true,
        objectives: chapter.learningObjectives
      }

    } catch (error) {
      console.error('Öğrenme hedefleri alma hatası:', error)
      return {
        success: false,
        error: error.message,
        objectives: []
      }
    }
  }

    /**
   * Önceki lesson'ları al
   * @param {string} documentId - Document ID
   * @param {string} chapterId - Chapter ID
   * @param {number} currentLessonOrder - Mevcut lesson sırası
   * @returns {Object} Önceki lesson'lar
   */
  async getPreviousLessons(documentId, chapterId, currentLessonOrder) {
    try {
      // Course structure'dan chapter'ı bul
      const courseStructure = await courseStructureService.getCourseStructure(documentId)
      if (!courseStructure.success) {
        return {
          success: false,
          lessons: []
        }
      }

      const chapter = courseStructure.data.courseStructure.chapters.find(ch => ch.id === chapterId)
      if (!chapter || !chapter.lessons) {
        return {
          success: true,
          lessons: []
        }
      }

      // Mevcut lesson'dan önceki lesson'ları al
      const previousLessons = chapter.lessons
        .filter(lesson => lesson.order < currentLessonOrder)
        .slice(-3) // Son 3 lesson'ı al

      return {
        success: true,
        lessons: previousLessons
      }

    } catch (error) {
      console.error("Önceki lesson'lar alma hatası:", error);
      return {
        success: false,
        error: error.message,
        lessons: []
      };
    }
  }
    
  

  /**
   * Document bilgilerini al
   * @param {string} documentId - Document ID
   * @returns {Object} Document info
   */
  async getDocumentInfo(documentId) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) {
        throw new Error(`Document alınamadı: ${error.message}`);
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Document bilgileri alma hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enhanced Content Generation testini çalıştırır
   * @param {string} documentId - Document ID
   * @returns {Object} Test sonucu
   */
  async testEnhancedContentGeneration(documentId) {
    try {
      console.log(`Enhanced Content Generation test başlatılıyor: ${documentId}`);

      const result = await this.generateEnhancedContent(documentId);

      if (result.success) {
        console.log('✅ Enhanced Content Generation test başarılı');
        console.log('📊 Metadata:', result.metadata);

        if (result.qualityAssessment) {
          console.log('📈 Kalite Değerlendirmesi:', result.qualityAssessment.overall_score);
        }
      } else {
        console.error('❌ Enhanced Content Generation test başarısız:', result.error);
      }

      return result;
    } catch (error) {
      console.error('Enhanced Content Generation test hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

}
// Service instance'ı oluştur ve export et
export const enhancedContentService = new EnhancedContentService(); 