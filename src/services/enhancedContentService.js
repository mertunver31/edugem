import { supabase } from '../config/supabase'
import { genAI, MODELS, estimateTokens } from './geminiService'
import { courseStructureService } from './courseStructureService'
import segmentService from './segmentService'
import { pdfTextExtractionService } from './pdfTextExtractionService'
import retrievalService from './retrievalService'
import knowledgeBaseService from './knowledgeBaseService'

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

      // 5. Knowledge Base Integration - Segment'leri ve kavramları kaydet
      const knowledgeBaseResult = await this.integrateWithKnowledgeBase(documentId, enhancedContent.data)
      if (!knowledgeBaseResult.success) {
        console.warn('Knowledge Base entegrasyonu yapılamadı:', knowledgeBaseResult.error)
      }

      // 6. Kalite değerlendirmesi yap
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
   * Tek chapter için enhanced content üret (RAG ile zenginleştirilmiş context)
   * @param {string} documentId - Document ID
   * @param {Object} chapter - Chapter bilgileri
   * @param {Object} courseStructure - Kurs yapısı
   * @returns {Object} Chapter content
   */
  async generateChapterContent(documentId, chapter, courseStructure) {
    try {
      console.log(`📚 Chapter için RAG context hazırlanıyor: ${chapter.title}`)
      
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
      
      // RAG Context'i hazırla
      const ragContext = await this.prepareRAGContext(documentId, chapter, courseStructure, chapterSegmentContent.content)
      if (!ragContext.success) {
        console.warn(`RAG context hazırlanamadı, mevcut yöntemle devam ediliyor: ${ragContext.error}`)
      }
      
      // Chapter için tek seferde AI content üret (RAG context ile)
      const chapterContent = await this.generateChapterContentWithAI(documentId, chapter, courseStructure, chapterSegmentContent.content, ragContext.success ? ragContext.data : null)
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
            lessonCount: chapterContent.data.lessons.length,
            ragContextUsed: ragContext.success,
            ragContextSize: ragContext.success ? ragContext.data.contextLength : 0,
            knowledgeBaseReady: true
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
   * RAG Context hazırla (Gelişmiş Context Building Stratejisi)
   * @param {string} documentId - Document ID
   * @param {Object} chapter - Chapter bilgileri
   * @param {Object} courseStructure - Kurs yapısı
   * @param {string} segmentContent - Chapter'ın segment içeriği
   * @returns {Object} RAG context
   */
  async prepareRAGContext(documentId, chapter, courseStructure, segmentContent) {
    try {
      console.log(`🔍 Gelişmiş RAG context hazırlanıyor: ${chapter.title}`)
      
      const contextComponents = []
      let totalContextLength = 0
      
      // 1. Cross-Chapter Context: Önceki chapter'ların önemli bilgilerini al
      const crossChapterContext = await this.buildCrossChapterContext(documentId, chapter, courseStructure)
      if (crossChapterContext.success && crossChapterContext.data.length > 0) {
        contextComponents.push({
          type: 'cross_chapter',
          content: crossChapterContext.data,
          length: crossChapterContext.data.length,
          priority: 1 // En yüksek öncelik
        })
        totalContextLength += crossChapterContext.data.length
        console.log(`📚 Cross-chapter context eklendi: ${crossChapterContext.data.length} karakter`)
      }
      
      // 2. Related Concepts: Benzer kavramları vector database'den çek
      const relatedConceptsContext = await this.buildRelatedConceptsContext(segmentContent, documentId)
      if (relatedConceptsContext.success && relatedConceptsContext.data.length > 0) {
        contextComponents.push({
          type: 'related_concepts',
          content: relatedConceptsContext.data,
          length: relatedConceptsContext.data.length,
          priority: 2
        })
        totalContextLength += relatedConceptsContext.data.length
        console.log(`🔗 Related concepts context eklendi: ${relatedConceptsContext.data.length} karakter`)
      }
      
      // 3. Semantic Search: Mevcut segment içeriğine benzer içerikleri bul
      const semanticSearchContext = await this.buildSemanticSearchContext(segmentContent, documentId)
      if (semanticSearchContext.success && semanticSearchContext.data.length > 0) {
        contextComponents.push({
          type: 'semantic_search',
          content: semanticSearchContext.data,
          length: semanticSearchContext.data.length,
          priority: 3
        })
        totalContextLength += semanticSearchContext.data.length
        console.log(`🔍 Semantic search context eklendi: ${semanticSearchContext.data.length} karakter`)
      }
      
      // 4. Course Consistency: Tüm course boyunca tutarlılık sağla
      const courseConsistencyContext = await this.buildCourseConsistencyContext(documentId, chapter, courseStructure)
      if (courseConsistencyContext.success && courseConsistencyContext.data.length > 0) {
        contextComponents.push({
          type: 'course_consistency',
          content: courseConsistencyContext.data,
          length: courseConsistencyContext.data.length,
          priority: 4
        })
        totalContextLength += courseConsistencyContext.data.length
        console.log(`🎯 Course consistency context eklendi: ${courseConsistencyContext.data.length} karakter`)
      }
      
      // Gelişmiş context optimization
      const optimizedContext = this.optimizeAdvancedContext(contextComponents, 5000) // 5000 karakter limit
      
      console.log(`✅ Gelişmiş RAG context hazırlandı: ${optimizedContext.length} karakter`)
      
      return {
        success: true,
        data: {
          context: optimizedContext,
          contextLength: optimizedContext.length,
          components: contextComponents.map(comp => ({
            type: comp.type,
            length: comp.length,
            priority: comp.priority
          })),
          strategy: 'advanced_context_building'
        }
      }
      
    } catch (error) {
      console.error('Gelişmiş RAG context hazırlama hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Cross-Chapter Context: Önceki chapter'ların önemli bilgilerini al
   * @param {string} documentId - Document ID
   * @param {Object} chapter - Chapter bilgileri
   * @param {Object} courseStructure - Kurs yapısı
   * @returns {Object} Cross-chapter context
   */
  async buildCrossChapterContext(documentId, chapter, courseStructure) {
    try {
      // Chapter'ın sırasını bul
      const chapterIndex = courseStructure.chapters.findIndex(ch => ch.id === chapter.id)
      if (chapterIndex <= 0) {
        return {
          success: true,
          data: ''
        }
      }
      
      // Önceki chapter'ları al (son 3 chapter - daha kapsamlı)
      const previousChapters = courseStructure.chapters.slice(Math.max(0, chapterIndex - 3), chapterIndex)
      
      if (previousChapters.length === 0) {
        return {
          success: true,
          data: ''
        }
      }
      
      // Her önceki chapter için detaylı bilgi oluştur
      const crossChapterContexts = []
      for (const prevChapter of previousChapters) {
        const chapterAnalysis = await this.analyzeChapterForCrossContext(prevChapter, documentId)
        if (chapterAnalysis.success && chapterAnalysis.data) {
          crossChapterContexts.push(chapterAnalysis.data)
        }
      }
      
      const combinedContext = crossChapterContexts.length > 0 
        ? `**CROSS-CHAPTER CONTEXT (Önceki ${previousChapters.length} Chapter):**\n${crossChapterContexts.join('\n\n')}\n\n`
        : ''
      
      return {
        success: true,
        data: combinedContext
      }
      
    } catch (error) {
      console.error('Cross-chapter context alma hatası:', error)
      return {
        success: false,
        error: error.message,
        data: ''
      }
    }
  }

  /**
   * Chapter'ı cross-context için analiz et
   * @param {Object} chapter - Chapter bilgileri
   * @param {string} documentId - Document ID
   * @returns {Object} Chapter analizi
   */
  async analyzeChapterForCrossContext(chapter, documentId) {
    try {
      // Chapter'ın ana kavramlarını çıkar
      const lessonTitles = chapter.lessons.map(lesson => lesson.title)
      const keyConcepts = this.extractKeyConceptsFromTitles(lessonTitles)
      
      // Chapter'ın önem derecesini hesapla
      const importanceScore = this.calculateChapterImportance(chapter)
      
      // Cross-reference bilgilerini oluştur
      const crossReferenceInfo = `**${chapter.title}** (Önem: ${importanceScore}/10):\n` +
        `- Ana Kavramlar: ${keyConcepts.join(', ')}\n` +
        `- Lesson Sayısı: ${chapter.lessons.length}\n` +
        `- Bu chapter'dan sonraki chapter'larda referans verilecek önemli noktalar`
      
      return {
        success: true,
        data: crossReferenceInfo
      }
      
    } catch (error) {
      console.error('Chapter analiz hatası:', error)
      return {
        success: false,
        error: error.message,
        data: ''
      }
    }
  }

  /**
   * Related Concepts: Benzer kavramları vector database'den çek
   * @param {string} segmentContent - Segment içeriği
   * @param {string} documentId - Document ID
   * @returns {Object} Related concepts context
   */
  async buildRelatedConceptsContext(segmentContent, documentId) {
    try {
      // Segment içeriğinden gelişmiş anahtar kelimeler çıkar
      const keywords = this.extractAdvancedKeywords(segmentContent)
      
      if (keywords.length === 0) {
        return {
          success: true,
          data: ''
        }
      }
      
      // Vector database'den ilgili kavramları bul - mevcut veritabanı yapısına uygun
      const relatedConcepts = await retrievalService.getRelatedConcepts(keywords.join(' '))
      if (!relatedConcepts.success || relatedConcepts.concepts.length === 0) {
        return {
          success: true,
          data: ''
        }
      }
      
      // Kavramları önem sırasına göre sırala ve formatla
      const sortedConcepts = relatedConcepts.concepts
        .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
        .slice(0, 7) // İlk 7 kavram
        .map(concept => {
          const relevance = concept.relevance_score ? ` (${Math.round(concept.relevance_score * 100)}% uyum)` : ''
          return `**${concept.name}:** ${concept.description}${relevance}`
        })
        .join('\n')
      
      const context = `**RELATED CONCEPTS (Vector Database):**\n${sortedConcepts}\n\n`
      
      return {
        success: true,
        data: context
      }
      
    } catch (error) {
      console.error('Related concepts context alma hatası:', error)
      return {
        success: false,
        error: error.message,
        data: ''
      }
    }
  }

  /**
   * Semantic Search: Mevcut segment içeriğine benzer içerikleri bul
   * @param {string} segmentContent - Segment içeriği
   * @param {string} documentId - Document ID
   * @returns {Object} Semantic search context
   */
  async buildSemanticSearchContext(segmentContent, documentId) {
    try {
      // Segment içeriğinden semantic search için optimize edilmiş query oluştur
      const semanticQuery = this.createSemanticSearchQuery(segmentContent)
      
      // Vector database'den benzer içerikleri bul
      const similarContent = await retrievalService.findRelevantContent(semanticQuery, {
        limit: 5,
        threshold: 0.5, // Daha düşük threshold - daha fazla sonuç
        documentId: documentId,
        contentType: 'segment_content'
      })
      
      if (!similarContent.success || similarContent.content.length === 0) {
        return {
          success: true,
          data: ''
        }
      }
      
      // Benzer içerikleri semantic relevance'e göre sırala ve formatla
      const semanticResults = similarContent.content
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
        .map(item => {
          const similarity = item.similarity ? ` (${Math.round(item.similarity * 100)}% benzerlik)` : ''
          const source = item.metadata?.chapter_title || item.metadata?.title || 'Bilinmeyen Kaynak'
          return `**${source}:** ${item.content.substring(0, 200)}...${similarity}`
        })
        .join('\n\n')
      
      const context = `**SEMANTIC SEARCH RESULTS (Vector Database):**\n${semanticResults}\n\n`
      
      return {
        success: true,
        data: context
      }
      
    } catch (error) {
      console.error('Semantic search context alma hatası:', error)
      return {
        success: false,
        error: error.message,
        data: ''
      }
    }
  }

  /**
   * Course Consistency: Tüm course boyunca tutarlılık sağla
   * @param {string} documentId - Document ID
   * @param {Object} chapter - Chapter bilgileri
   * @param {Object} courseStructure - Kurs yapısı
   * @returns {Object} Course consistency context
   */
  async buildCourseConsistencyContext(documentId, chapter, courseStructure) {
    try {
      // Course genelinde tutarlılık kurallarını oluştur
      const consistencyRules = this.generateConsistencyRules(courseStructure, chapter)
      
      // Chapter'ın course içindeki pozisyonunu analiz et
      const chapterPosition = this.analyzeChapterPosition(chapter, courseStructure)
      
      // Tutarlılık context'ini oluştur
      const consistencyContext = `**COURSE CONSISTENCY RULES:**\n${consistencyRules}\n\n` +
        `**CHAPTER POSITION ANALYSIS:**\n${chapterPosition}\n\n` +
        `**CONTENT CONSISTENCY GUIDELINES:**\n` +
        `- Önceki chapter'larda tanımlanan kavramları tekrar tanımlama\n` +
        `- Tutarlı terminoloji kullan\n` +
        `- Course genelinde aynı örnek formatını koru\n` +
        `- Chapter'lar arası geçişleri yumuşak yap\n\n`
      
      return {
        success: true,
        data: consistencyContext
      }
      
    } catch (error) {
      console.error('Course consistency context alma hatası:', error)
      return {
        success: false,
        error: error.message,
        data: ''
      }
    }
  }

  /**
   * Gelişmiş context optimization (priority-based)
   * @param {Array} contextComponents - Context bileşenleri (priority ile)
   * @param {number} maxLength - Maksimum uzunluk
   * @returns {string} Optimize edilmiş context
   */
  optimizeAdvancedContext(contextComponents, maxLength) {
    if (contextComponents.length === 0) {
      return ''
    }
    
    // Priority'ye göre sırala (düşük sayı = yüksek öncelik)
    const sortedComponents = contextComponents.sort((a, b) => a.priority - b.priority)
    
    // Toplam uzunluk kontrol et
    const totalLength = sortedComponents.reduce((sum, comp) => sum + comp.length, 0)
    
    if (totalLength <= maxLength) {
      // Limit içindeyse tüm context'i kullan
      return sortedComponents.map(comp => comp.content).join('\n')
    }
    
    // Priority-based optimization
    let optimizedContext = ''
    let currentLength = 0
    
    for (const component of sortedComponents) {
      const remainingLength = maxLength - currentLength
      if (remainingLength <= 0) break
      
      if (component.length <= remainingLength) {
        optimizedContext += component.content + '\n'
        currentLength += component.length
      } else {
        // Component'i intelligent truncation ile kısalt
        const truncatedContent = this.intelligentTruncate(component.content, remainingLength - 150)
        optimizedContext += truncatedContent + '\n'
        currentLength += truncatedContent.length
        break
      }
    }
    
    return optimizedContext.trim()
  }

  /**
   * Intelligent truncation - cümle bütünlüğünü koru
   * @param {string} text - Metin
   * @param {number} maxLength - Maksimum uzunluk
   * @returns {string} Kısaltılmış metin
   */
  intelligentTruncate(text, maxLength) {
    if (text.length <= maxLength) {
      return text
    }
    
    // Cümle sonlarını bul
    const sentenceEndings = ['.', '!', '?', '\n\n']
    let truncatedText = text.substring(0, maxLength)
    
    // En yakın cümle sonunu bul
    for (const ending of sentenceEndings) {
      const lastIndex = truncatedText.lastIndexOf(ending)
      if (lastIndex > maxLength * 0.7) { // %70'den sonra cümle sonu varsa
        truncatedText = truncatedText.substring(0, lastIndex + ending.length)
        break
      }
    }
    
    return truncatedText + '...'
  }

  /**
   * Chapter özeti oluştur
   * @param {Object} chapter - Chapter bilgileri
   * @param {string} documentId - Document ID
   * @returns {Object} Chapter özeti
   */
  async getChapterSummary(chapter, documentId) {
    try {
      // Chapter'ın lesson'larından basit bir özet oluştur
      const lessonTitles = chapter.lessons.map(lesson => lesson.title).join(', ')
      return {
        success: true,
        data: `Bu chapter ${chapter.lessons.length} lesson içeriyor: ${lessonTitles}`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: ''
      }
    }
  }

  /**
   * Gelişmiş anahtar kelime çıkarma
   * @param {string} text - Metin
   * @returns {Array} Anahtar kelimeler
   */
  extractAdvancedKeywords(text) {
    try {
      // Gelişmiş anahtar kelime çıkarma
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['bu', 'bir', 've', 'ile', 'için', 'olan', 'gibi', 'kadar', 'daha', 'çok', 'az', 'en', 'da', 'de', 'bir', 'iki', 'üç', 'dört', 'beş'].includes(word))
      
      // En sık geçen kelimeleri al
      const wordCount = {}
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1
      })
      
      return Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8) // Daha fazla anahtar kelime
        .map(([word]) => word)
        
    } catch (error) {
      console.error('Gelişmiş anahtar kelime çıkarma hatası:', error)
      return []
    }
  }

  /**
   * Lesson başlıklarından anahtar kavramları çıkar
   * @param {Array} lessonTitles - Lesson başlıkları
   * @returns {Array} Anahtar kavramlar
   */
  extractKeyConceptsFromTitles(lessonTitles) {
    try {
      const allWords = lessonTitles.join(' ').toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !['ve', 'ile', 'için', 'olan', 'gibi', 'kadar', 'daha', 'çok', 'az', 'en', 'da', 'de'].includes(word))
      
      const wordCount = {}
      allWords.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1
      })
      
      return Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word)
        
    } catch (error) {
      console.error('Lesson başlıklarından kavram çıkarma hatası:', error)
      return []
    }
  }

  /**
   * Chapter'ın önem derecesini hesapla
   * @param {Object} chapter - Chapter bilgileri
   * @returns {number} Önem skoru (1-10)
   */
  calculateChapterImportance(chapter) {
    try {
      let score = 5 // Base score
      
      // Lesson sayısına göre
      if (chapter.lessons.length > 5) score += 2
      else if (chapter.lessons.length > 3) score += 1
      
      // Başlık uzunluğuna göre
      if (chapter.title.length > 30) score += 1
      
      // Başlıkta önemli kelimeler varsa
      const importantWords = ['temel', 'ana', 'önemli', 'kritik', 'merkezi', 'core', 'fundamental', 'essential']
      const hasImportantWord = importantWords.some(word => 
        chapter.title.toLowerCase().includes(word)
      )
      if (hasImportantWord) score += 1
      
      return Math.min(10, Math.max(1, score))
      
    } catch (error) {
      console.error('Chapter önem hesaplama hatası:', error)
      return 5
    }
  }

  /**
   * Semantic search için optimize edilmiş query oluştur
   * @param {string} segmentContent - Segment içeriği
   * @returns {string} Semantic search query
   */
  createSemanticSearchQuery(segmentContent) {
    try {
      // İlk 300 karakteri al ve optimize et
      const contentPreview = segmentContent.substring(0, 300)
      
      // Anahtar kelimeleri çıkar
      const keywords = this.extractAdvancedKeywords(contentPreview)
      
      // Query'yi oluştur
      const query = keywords.length > 0 
        ? `${keywords.slice(0, 3).join(' ')} ${contentPreview.substring(0, 100)}`
        : contentPreview.substring(0, 200)
      
      return query
      
    } catch (error) {
      console.error('Semantic search query oluşturma hatası:', error)
      return segmentContent.substring(0, 200)
    }
  }

  /**
   * Course genelinde tutarlılık kurallarını oluştur
   * @param {Object} courseStructure - Kurs yapısı
   * @param {Object} currentChapter - Mevcut chapter
   * @returns {string} Tutarlılık kuralları
   */
  generateConsistencyRules(courseStructure, currentChapter) {
    try {
      const totalChapters = courseStructure.chapters.length
      const currentIndex = courseStructure.chapters.findIndex(ch => ch.id === currentChapter.id)
      
      let rules = `- Course toplam ${totalChapters} chapter içeriyor\n`
      rules += `- Bu chapter ${currentIndex + 1}. sırada\n`
      
      if (currentIndex > 0) {
        rules += `- Önceki chapter'larda tanımlanan kavramları referans ver\n`
      }
      
      if (currentIndex < totalChapters - 1) {
        rules += `- Sonraki chapter'lara hazırlık yap\n`
      }
      
      rules += `- Tutarlı terminoloji kullan\n`
      rules += `- Aynı örnek formatını koru\n`
      
      return rules
      
    } catch (error) {
      console.error('Tutarlılık kuralları oluşturma hatası:', error)
      return '- Tutarlı terminoloji kullan\n- Aynı örnek formatını koru\n'
    }
  }

  /**
   * Chapter'ın course içindeki pozisyonunu analiz et
   * @param {Object} chapter - Chapter bilgileri
   * @param {Object} courseStructure - Kurs yapısı
   * @returns {string} Pozisyon analizi
   */
  analyzeChapterPosition(chapter, courseStructure) {
    try {
      const totalChapters = courseStructure.chapters.length
      const currentIndex = courseStructure.chapters.findIndex(ch => ch.id === chapter.id)
      
      let analysis = `- Chapter pozisyonu: ${currentIndex + 1}/${totalChapters}\n`
      
      if (currentIndex === 0) {
        analysis += `- Bu ilk chapter, temel kavramları tanımla\n`
      } else if (currentIndex === totalChapters - 1) {
        analysis += `- Bu son chapter, özet ve sentez yap\n`
      } else {
        analysis += `- Orta chapter, önceki bilgileri kullan ve sonraki için hazırla\n`
      }
      
      analysis += `- Lesson sayısı: ${chapter.lessons.length}\n`
      analysis += `- Beklenen içerik derinliği: ${this.getExpectedDepth(currentIndex, totalChapters)}\n`
      
      return analysis
      
    } catch (error) {
      console.error('Chapter pozisyon analizi hatası:', error)
      return '- Chapter pozisyonu analiz edilemedi\n'
    }
  }

  /**
   * Chapter sırasını al
   * @param {Object} chapter - Chapter bilgileri
   * @param {Object} courseStructure - Kurs yapısı
   * @returns {string} Chapter sırası
   */
  getChapterOrder(chapter, courseStructure) {
    try {
      const chapterIndex = courseStructure.chapters.findIndex(ch => ch.id === chapter.id)
      const totalChapters = courseStructure.chapters.length
      return `${chapterIndex + 1}/${totalChapters}`
    } catch (error) {
      return 'Bilinmiyor'
    }
  }

  /**
   * Önceki chapter'ların özetini oluştur
   * @param {Object} ragContext - RAG context
   * @returns {string} Önceki chapter'lar özeti
   */
  createPreviousChaptersSummary(ragContext) {
    if (!ragContext || !ragContext.context || !ragContext.context.includes('CROSS-CHAPTER CONTEXT')) {
      return `
    📚 ÖNCEKİ CHAPTER'LAR ÖZETİ:
    Bu ilk chapter olduğu için önceki chapter bilgisi bulunmuyor.
    Temel kavramları tanımlayarak başlayın.
    
    `
    }
    
    // Cross-chapter context'ten özet çıkar
    const crossChapterMatch = ragContext.context.match(/CROSS-CHAPTER CONTEXT.*?LESSON'LAR:/s)
    if (crossChapterMatch) {
      const summary = crossChapterMatch[0].replace('CROSS-CHAPTER CONTEXT', '').replace('LESSON\'LAR:', '').trim()
      return `
    📚 ÖNCEKİ CHAPTER'LAR ÖZETİ:
    ${summary}
    
    `
    }
    
    return `
    📚 ÖNCEKİ CHAPTER'LAR ÖZETİ:
    Önceki chapter'larda işlenen konular:
    ${ragContext.context.substring(0, 500)}...
    
    `
  }

  /**
   * İlgili kavramlar bölümünü oluştur
   * @param {Object} ragContext - RAG context
   * @returns {string} İlgili kavramlar bölümü
   */
  createRelatedConceptsSection(ragContext) {
    if (!ragContext || !ragContext.context || !ragContext.context.includes('RELATED CONCEPTS')) {
      return `
    🔗 İLGİLİ KAVRAMLAR:
    Bu chapter için özel kavram tanımları henüz mevcut değil.
    Segment içeriğinden çıkarılan anahtar kavramları kullanın.
    
    `
    }
    
    // Related concepts'ten bilgi çıkar
    const conceptsMatch = ragContext.context.match(/RELATED CONCEPTS.*?SEMANTIC SEARCH/s)
    if (conceptsMatch) {
      const concepts = conceptsMatch[0].replace('RELATED CONCEPTS', '').replace('SEMANTIC SEARCH', '').trim()
      return `
    🔗 İLGİLİ KAVRAMLAR VE TANIMLAR:
    ${concepts}
    
    `
    }
    
    return `
    🔗 İLGİLİ KAVRAMLAR:
    Vector database'den çıkarılan ilgili kavramlar:
    ${ragContext.context.includes('RELATED CONCEPTS') ? 'Mevcut' : 'Henüz mevcut değil'}
    
    `
  }

  /**
   * Tutarlılık rehberlerini oluştur
   * @param {Object} ragContext - RAG context
   * @param {Object} chapter - Chapter bilgileri
   * @param {Object} courseStructure - Kurs yapısı
   * @returns {string} Tutarlılık rehberleri
   */
  createConsistencyGuidelines(ragContext, chapter, courseStructure) {
    const chapterIndex = courseStructure.chapters.findIndex(ch => ch.id === chapter.id)
    const totalChapters = courseStructure.chapters.length
    
    let guidelines = `
    🎯 COURSE GENELİNDE TUTARLILIK TALİMATLARI:
    - Bu chapter ${chapterIndex + 1}/${totalChapters} sırada
    `
    
    if (chapterIndex === 0) {
      guidelines += `
    - İlk chapter: Temel kavramları net bir şekilde tanımlayın
    - Sonraki chapter'lar için sağlam temel oluşturun
    - Terminolojiyi tutarlı bir şekilde belirleyin
    `
    } else if (chapterIndex === totalChapters - 1) {
      guidelines += `
    - Son chapter: Önceki tüm bilgileri sentezleyin
    - Course genelinde öğrenilenleri birleştirin
    - Kapsamlı özet ve değerlendirme yapın
    `
    } else {
      guidelines += `
    - Orta chapter: Önceki bilgileri kullanın ve genişletin
    - Sonraki chapter'lara hazırlık yapın
    - Tutarlı terminoloji kullanın
    `
    }
    
    if (ragContext && ragContext.context && ragContext.context.includes('COURSE CONSISTENCY RULES')) {
      const consistencyMatch = ragContext.context.match(/COURSE CONSISTENCY RULES.*?CHAPTER POSITION/s)
      if (consistencyMatch) {
        const rules = consistencyMatch[0].replace('COURSE CONSISTENCY RULES', '').replace('CHAPTER POSITION', '').trim()
        guidelines += `
    ${rules}
    `
      }
    }
    
    guidelines += `
    - Önceki chapter'larda tanımlanan kavramları tekrar tanımlamayın
    - Tutarlı örnek formatı kullanın
    - Chapter'lar arası geçişleri yumuşak yapın
    `
    
    return guidelines
  }

  /**
   * Gelişmiş talimatları oluştur
   * @param {Object} ragContext - RAG context
   * @param {Object} chapter - Chapter bilgileri
   * @param {Object} courseStructure - Kurs yapısı
   * @returns {string} Gelişmiş talimatlar
   */
  createEnhancedInstructions(ragContext, chapter, courseStructure) {
    const chapterIndex = courseStructure.chapters.findIndex(ch => ch.id === chapter.id)
    const totalChapters = courseStructure.chapters.length
    
    let instructions = `
    🚀 GELİŞMİŞ ÜRETİM TALİMATLARI:
    `
    
    if (ragContext && ragContext.context && ragContext.context.length > 0) {
      instructions += `
    ✅ RAG CONTEXT KULLANIMI:
    - Yukarıdaki RAG context'ini aktif olarak kullanın
    - Önceki chapter'larla bağlantılar kurun
    - Tutarlı terminoloji ve yaklaşım sergileyin
    - Cross-reference'lar ekleyin
    `
    } else {
      instructions += `
    ℹ️ RAG CONTEXT DURUMU:
    - Bu chapter için RAG context henüz mevcut değil
    - Segment içeriğine odaklanın
    - Temel kavramları net bir şekilde tanımlayın
    `
    }
    
    instructions += `
    📝 İÇERİK ÜRETİM STRATEJİSİ:
    - Her lesson için ayrı ayrı detaylı içerik oluşturun
    - Chapter bütünlüğünü koruyun
    - Pratik ve uygulanabilir örnekler verin
    - Öğrenci odaklı açıklamalar yapın
    `
    
    if (chapterIndex > 0) {
      instructions += `
    🔗 ÖNCEKİ CHAPTER BAĞLANTILARI:
    - Önceki chapter'larda geçen kavramları referans verin
    - "Daha önce öğrendiğimiz..." gibi geçişler kullanın
    - Bilgiyi genişletin, tekrar etmeyin
    `
    }
    
    if (chapterIndex < totalChapters - 1) {
      instructions += `
    🔮 SONRAKİ CHAPTER HAZIRLIĞI:
    - Sonraki chapter'lara hazırlık yapın
    - "Bir sonraki bölümde göreceğimiz..." gibi ipuçları verin
    - Öğrenciyi motive edin
    `
    }
    
    instructions += `
    🎯 KALİTE STANDARTLARI:
    - Açıklayıcı metinler minimum 400 karakter olsun
    - En az 6 madde listesi ekleyin
    - Gerçek hayat örnekleri verin
    - Özetler minimum 200 karakter olsun
    - Cross-reference'lar ekleyin (eğer uygunsa)
    `
    
    return instructions
  }

  /**
   * Knowledge Base Integration - Segment'leri ve kavramları kaydet
   * @param {string} documentId - Document ID
   * @param {Object} enhancedContent - Enhanced content
   * @returns {Object} Integration result
   */
  async integrateWithKnowledgeBase(documentId, enhancedContent) {
    try {
      console.log(`🗄️ Knowledge Base entegrasyonu başlatılıyor: ${documentId}`)
      
      const integrationResults = {
        segmentsStored: 0,
        conceptsExtracted: 0,
        relationshipsCreated: 0,
        errors: []
      }
      
      // Her chapter için knowledge base entegrasyonu
      for (const chapter of enhancedContent.chapters) {
        console.log(`📚 Chapter knowledge base entegrasyonu: ${chapter.title}`)
        
        // 1. Segment'leri knowledge base'e kaydet
        const segmentResult = await this.storeChapterSegments(documentId, chapter)
        if (segmentResult.success) {
          integrationResults.segmentsStored += segmentResult.data.storedCount
        } else {
          integrationResults.errors.push(`Segment storage error: ${segmentResult.error}`)
        }
        
        // 2. Kavramları çıkar ve kaydet
        const conceptResult = await this.extractAndStoreConcepts(documentId, chapter)
        if (conceptResult.success) {
          integrationResults.conceptsExtracted += conceptResult.data.extractedCount
        } else {
          integrationResults.errors.push(`Concept extraction error: ${conceptResult.error}`)
        }
        
        // 3. İlişkileri oluştur
        const relationshipResult = await this.createConceptRelationships(documentId, chapter)
        if (relationshipResult.success) {
          integrationResults.relationshipsCreated += relationshipResult.data.relationshipCount
        } else {
          integrationResults.errors.push(`Relationship creation error: ${relationshipResult.error}`)
        }
      }
      
      console.log(`✅ Knowledge Base entegrasyonu tamamlandı: ${integrationResults.segmentsStored} segment, ${integrationResults.conceptsExtracted} kavram, ${integrationResults.relationshipsCreated} ilişki`)
      
      return {
        success: true,
        data: integrationResults
      }
      
    } catch (error) {
      console.error('Knowledge Base entegrasyonu hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Chapter segment'lerini knowledge base'e kaydet
   * @param {string} documentId - Document ID
   * @param {Object} chapter - Chapter bilgileri
   * @returns {Object} Storage result
   */
  async storeChapterSegments(documentId, chapter) {
    try {
      let storedCount = 0
      
      // Her lesson için segment'leri kaydet
      for (const lesson of chapter.content.lessons) {
        const lessonContent = this.combineLessonContent(lesson)
        
        // Knowledge base'e kaydet
        const storeResult = await knowledgeBaseService.storeSegment(
          documentId,
          lesson.lessonId, // lesson ID'yi segment_id olarak kullan
          lessonContent,
          {
            chapter_title: chapter.title,
            lesson_title: lesson.title,
            content_type: 'lesson_content',
            lessonId: lesson.lessonId, // metadata içinde de sakla
            metadata: {
              chapterId: chapter.chapterId,
              lessonId: lesson.lessonId,
              contentLength: lessonContent.length
            }
          }
        )
        
        if (storeResult.success) {
          storedCount++
        }
      }
      
      return {
        success: true,
        data: {
          storedCount: storedCount,
          chapterTitle: chapter.title
        }
      }
      
    } catch (error) {
      console.error('Segment storage hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Lesson içeriğini birleştir
   * @param {Object} lesson - Lesson bilgileri
   * @returns {string} Birleştirilmiş içerik
   */
  combineLessonContent(lesson) {
    const content = lesson.content
    let combinedContent = ''
    
    // Açıklayıcı metin
    if (content.explanatory_text) {
      combinedContent += content.explanatory_text + '\n\n'
    }
    
    // Anahtar noktalar
    if (content.key_points && content.key_points.length > 0) {
      combinedContent += 'Anahtar Noktalar:\n' + content.key_points.join('\n') + '\n\n'
    }
    
    // Tablolar
    if (content.tables && content.tables.length > 0) {
      content.tables.forEach((table, index) => {
        combinedContent += `Tablo ${index + 1}: ${table.title}\n`
        if (table.headers) {
          combinedContent += table.headers.join(' | ') + '\n'
        }
        if (table.rows) {
          table.rows.forEach(row => {
            combinedContent += row.join(' | ') + '\n'
          })
        }
        combinedContent += '\n'
      })
    }
    
    // Kod örnekleri
    if (content.code_examples && content.code_examples.length > 0) {
      content.code_examples.forEach((example, index) => {
        combinedContent += `Kod Örneği ${index + 1}: ${example.title}\n`
        combinedContent += `${example.language}\n${example.code}\n\n`
      })
    }
    
    // Pratik örnekler
    if (content.practical_examples && content.practical_examples.length > 0) {
      content.practical_examples.forEach((example, index) => {
        combinedContent += `Pratik Örnek ${index + 1}: ${example.title}\n`
        combinedContent += `${example.description}\n\n`
      })
    }
    
    // Cross-references
    if (content.cross_references && content.cross_references.length > 0) {
      combinedContent += 'İlgili Konular:\n'
      content.cross_references.forEach(ref => {
        combinedContent += `- ${ref.chapter}: ${ref.reference}\n`
      })
      combinedContent += '\n'
    }
    
    // Özet
    if (content.summary) {
      combinedContent += `Özet: ${content.summary}\n\n`
    }
    
    return combinedContent.trim()
  }

  /**
   * Kavramları çıkar ve kaydet
   * @param {string} documentId - Document ID
   * @param {Object} chapter - Chapter bilgileri
   * @returns {Object} Extraction result
   */
  async extractAndStoreConcepts(documentId, chapter) {
    try {
      let extractedCount = 0
      
      // Her lesson'dan kavramları çıkar
      for (const lesson of chapter.content.lessons) {
        const lessonContent = this.combineLessonContent(lesson)
        
        // Anahtar kelimeleri çıkar
        const keywords = this.extractAdvancedKeywords(lessonContent)
        
        // Her anahtar kelime için concept oluştur
        for (const keyword of keywords.slice(0, 5)) { // İlk 5 kavram
          const conceptDescription = this.generateConceptDescription(keyword, lessonContent)
          
          // Concept'i kaydet
          const storeResult = await knowledgeBaseService.storeConcept(
            keyword,
            conceptDescription,
            {
              document_id: documentId,
              chapter_title: chapter.title,
              lesson_title: lesson.title,
              relevance_score: this.calculateConceptRelevance(keyword, lessonContent)
            }
          )
          
          if (storeResult.success) {
            extractedCount++
          }
        }
      }
      
      return {
        success: true,
        data: {
          extractedCount: extractedCount,
          chapterTitle: chapter.title
        }
      }
      
    } catch (error) {
      console.error('Concept extraction hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Kavram açıklaması oluştur
   * @param {string} keyword - Anahtar kelime
   * @param {string} content - İçerik
   * @returns {string} Kavram açıklaması
   */
  generateConceptDescription(keyword, content) {
    try {
      // İçerikte kavramın geçtiği cümleleri bul
      const sentences = content.split(/[.!?]+/).filter(sentence => 
        sentence.toLowerCase().includes(keyword.toLowerCase())
      )
      
      if (sentences.length > 0) {
        // İlk cümleyi al ve kısalt (100 karakter sınırı)
        const firstSentence = sentences[0].trim()
        return firstSentence.length > 95 
          ? firstSentence.substring(0, 95) + '...'
          : firstSentence
      }
      
      // Cümle bulunamazsa basit açıklama
      return `${keyword} ile ilgili önemli bir kavram.`
      
    } catch (error) {
      return `${keyword} ile ilgili önemli bir kavram.`
    }
  }

  /**
   * Kavram önem skorunu hesapla
   * @param {string} keyword - Anahtar kelime
   * @param {string} content - İçerik
   * @returns {number} Önem skoru (0-1)
   */
  calculateConceptRelevance(keyword, content) {
    try {
      const keywordLower = keyword.toLowerCase()
      const contentLower = content.toLowerCase()
      
      // Geçme sayısını hesapla
      const occurrences = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length
      
      // İçerik uzunluğuna göre normalize et
      const contentLength = contentLower.length
      const frequency = occurrences / contentLength
      
      // Skoru 0-1 arasında sınırla
      return Math.min(1, Math.max(0, frequency * 1000))
      
    } catch (error) {
      return 0.5 // Default skor
    }
  }

  /**
   * Kavram ilişkilerini oluştur
   * @param {string} documentId - Document ID
   * @param {Object} chapter - Chapter bilgileri
   * @returns {Object} Relationship result
   */
  async createConceptRelationships(documentId, chapter) {
    try {
      let relationshipCount = 0
      
      // Chapter'daki tüm kavramları topla
      const chapterConcepts = []
      
      for (const lesson of chapter.content.lessons) {
        const lessonContent = this.combineLessonContent(lesson)
        const keywords = this.extractAdvancedKeywords(lessonContent)
        chapterConcepts.push(...keywords.slice(0, 3)) // Her lesson'dan 3 kavram
      }
      
      // Benzersiz kavramları al
      const uniqueConcepts = [...new Set(chapterConcepts)]
      
      // Kavramlar arası ilişkiler oluştur
      for (let i = 0; i < uniqueConcepts.length; i++) {
        for (let j = i + 1; j < uniqueConcepts.length; j++) {
          const concept1 = uniqueConcepts[i]
          const concept2 = uniqueConcepts[j]
          
          // İlişki skorunu hesapla
          const relationshipScore = this.calculateRelationshipScore(concept1, concept2, chapter)
          
          if (relationshipScore > 0.3) { // Minimum skor
            // İlişkiyi kaydet
            const storeResult = await knowledgeBaseService.storeConceptRelationship(
              concept1,
              concept2,
              relationshipScore,
              {
                document_id: documentId,
                chapter_title: chapter.title,
                relationship_type: 'semantic_similarity'
              }
            )
            
            if (storeResult.success) {
              relationshipCount++
            }
          }
        }
      }
      
      return {
        success: true,
        data: {
          relationshipCount: relationshipCount,
          chapterTitle: chapter.title
        }
      }
      
    } catch (error) {
      console.error('Relationship creation hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * İki kavram arasındaki ilişki skorunu hesapla
   * @param {string} concept1 - İlk kavram
   * @param {string} concept2 - İkinci kavram
   * @param {Object} chapter - Chapter bilgileri
   * @returns {number} İlişki skoru (0-1)
   */
  calculateRelationshipScore(concept1, concept2, chapter) {
    try {
      let totalScore = 0
      let lessonCount = 0
      
      // Her lesson'da kavramların birlikte geçme durumunu kontrol et
      for (const lesson of chapter.content.lessons) {
        const lessonContent = this.combineLessonContent(lesson)
        const contentLower = lessonContent.toLowerCase()
        
        const concept1Present = contentLower.includes(concept1.toLowerCase())
        const concept2Present = contentLower.includes(concept2.toLowerCase())
        
        if (concept1Present && concept2Present) {
          // Aynı lesson'da geçiyorlarsa yüksek skor
          totalScore += 0.8
        } else if (concept1Present || concept2Present) {
          // Sadece biri geçiyorsa düşük skor
          totalScore += 0.2
        }
        
        lessonCount++
      }
      
      // Ortalama skoru hesapla
      return lessonCount > 0 ? totalScore / lessonCount : 0
      
    } catch (error) {
      return 0.5 // Default skor
    }
  }

  /**
   * Beklenen içerik derinliğini hesapla
   * @param {number} chapterIndex - Chapter index'i
   * @param {number} totalChapters - Toplam chapter sayısı
   * @returns {string} Beklenen derinlik
   */
  getExpectedDepth(chapterIndex, totalChapters) {
    if (chapterIndex === 0) return 'Temel (Giriş)'
    if (chapterIndex === totalChapters - 1) return 'İleri (Sentez)'
    if (chapterIndex < totalChapters * 0.3) return 'Orta (Geliştirme)'
    if (chapterIndex < totalChapters * 0.7) return 'İleri (Uygulama)'
    return 'Uzman (Derinleştirme)'
  }

  /**
   * Chapter için AI ile tüm lesson'ları tek seferde üret
   * @param {string} documentId - Document ID
   * @param {Object} chapter - Chapter bilgileri
   * @param {Object} courseStructure - Kurs yapısı
   * @param {string} segmentContent - Birleştirilmiş segment içeriği (sadece text)
   * @param {Object} ragContext - RAG context (opsiyonel)
   * @returns {Object} Chapter content
   */
  async generateChapterContentWithAI(documentId, chapter, courseStructure, segmentContent, ragContext = null) {
    try {
      console.log(`🤖 Chapter için AI content üretimi başlatılıyor: ${chapter.title}`)
      
      // Chapter için optimize edilmiş prompt oluştur (RAG context ile)
      const prompt = this.createChapterPrompt(chapter, courseStructure, segmentContent, ragContext)
      
      console.log(`📤 AI'ya gönderilen prompt uzunluğu: ${prompt.length} karakter`)
      if (ragContext) {
        console.log(`🔍 RAG context kullanıldı: ${ragContext.contextLength} karakter`)
      }
      
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
            contentLength: JSON.stringify(structuredContent.data).length,
            ragContextUsed: !!ragContext,
            ragContextSize: ragContext ? ragContext.contextLength : 0
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
   * Chapter için AI prompt oluştur (Gelişmiş Prompt Engineering)
   * @param {Object} chapter - Chapter bilgileri
   * @param {Object} courseStructure - Kurs yapısı
   * @param {string} segmentContent - Birleştirilmiş segment içeriği (sadece text)
   * @param {Object} ragContext - RAG context (opsiyonel)
   * @returns {string} AI prompt
   */
  createChapterPrompt(chapter, courseStructure, segmentContent, ragContext = null) {
    // Gelişmiş prompt sections
    const previousChaptersSummary = this.createPreviousChaptersSummary(ragContext)
    const relatedConceptsSection = this.createRelatedConceptsSection(ragContext)
    const consistencyGuidelines = this.createConsistencyGuidelines(ragContext, chapter, courseStructure)
    const enhancedInstructions = this.createEnhancedInstructions(ragContext, chapter, courseStructure)
    
    return `
    ========================================
    GELİŞMİŞ EĞİTİM İÇERİĞİ ÜRETİM PROMPT'U
    ========================================
    
    📚 KURS BİLGİLERİ:
    Kurs Adı: ${courseStructure.title}
    Chapter: ${chapter.title}
    Lesson Sayısı: ${chapter.lessons.length}
    Chapter Sırası: ${this.getChapterOrder(chapter, courseStructure)}
    
    ${previousChaptersSummary}
    
    ${relatedConceptsSection}
    
    ${consistencyGuidelines}
    
    📖 LESSON'LAR:
    ${chapter.lessons.map((lesson, index) => `${index + 1}. ${lesson.title}`).join('\n')}
    
    📄 SEGMENT İÇERİĞİ (PDF'den çıkarılan gerçek metin, tablolar ve görsel açıklamaları):
    ${segmentContent || 'Segment içeriği bulunamadı.'}
    
    ${enhancedInstructions}
    
    🎯 İÇERİK TÜRLERİ (Her lesson için zorunlu):
    1. **Açıklayıcı Metin** - Konuyu detaylı açıklayan paragraflar (minimum 400 karakter)
    2. **Madde Listeleri** - Önemli noktaları listeleyen maddeler (en az 6 madde)
    3. **Tablo** - Karşılaştırma veya özet tabloları (eğer uygunsa)
    4. **Kod Blokları** - Örnek kodlar (eğer uygunsa)
    5. **Pratik Örnekler** - Gerçek hayat örnekleri (en az 3 örnek)
    6. **Özet** - Ders özeti (minimum 200 karakter)
    7. **Cross-References** - Önceki chapter'lara referanslar (eğer varsa)
    
    📋 JSON FORMATI:
    {
      "lessons": [
        {
          "lessonId": "lesson-1-1",
          "title": "Lesson Başlığı",
          "content": {
            "explanatory_text": "Detaylı açıklayıcı metin...",
            "key_points": ["Madde 1", "Madde 2", "Madde 3", "Madde 4", "Madde 5", "Madde 6"],
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
                "description": "Detaylı örnek açıklaması"
              }
            ],
            "cross_references": [
              {
                "chapter": "Önceki Chapter Adı",
                "reference": "İlgili kavram veya konu"
              }
            ],
            "summary": "Detaylı ders özeti..."
          }
        }
      ]
    }
    
    ⚠️ ÖNEMLİ: Sadece JSON döndür, başka açıklama ekleme.
    `
  }

  /**
   * Chapter AI response'unu parse et ve yapılandır (Gelişmiş)
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
            cross_references: Array.isArray(lessonData.content?.cross_references) ? lessonData.content.cross_references : [],
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