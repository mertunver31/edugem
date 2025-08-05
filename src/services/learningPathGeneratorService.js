import { generateContent } from './geminiService'
import learningPathService from './learningPathService'

/**
 * Learning Path Generator Service
 * Gemini API kullanarak learning path oluşturma
 */
class LearningPathGeneratorService {
  constructor() {
    this.model = 'gemini-1.5-flash'
    this.fallbackModels = ['gemini-1.5-pro']
  }

  /**
   * Learning path oluştur (mevcut sistem için)
   * @param {Object} options - Generation seçenekleri
   * @returns {Object} Generation sonucu
   */
  async generateLearningPath(options) {
    try {
      console.log('🛤️ Learning path generation başlatılıyor:', options.documentId)

      const startTime = Date.now()

      // 1. Prompt hazırla
      const prompt = this.buildLearningPathPrompt(options)
      console.log('📝 Learning path prompt hazırlandı')

      // 2. Gemini API çağrısı
      const generationResult = await this.callGeminiAPI(prompt, options)
      if (!generationResult.success) {
        throw new Error(generationResult.error)
      }

      // 3. Response parse et
      const parsedLearningPath = this.parseLearningPathResponse(generationResult.data)
      if (!parsedLearningPath.success) {
        throw new Error(parsedLearningPath.error)
      }

      // 4. Database'e kaydet
      const saveResult = await learningPathService.createLearningPath({
        documentId: options.documentId,
        title: parsedLearningPath.data.title,
        description: parsedLearningPath.data.description,
        steps: parsedLearningPath.data.steps,
        estimatedDuration: parsedLearningPath.data.estimatedDuration,
        difficultyLevel: parsedLearningPath.data.difficultyLevel,
        prerequisites: parsedLearningPath.data.prerequisites,
        modelUsed: this.model,
        metadata: {
          generationTime: Date.now() - startTime,
          modelUsed: this.model,
          source: 'gemini_api',
          options: options
        }
      })

      if (!saveResult.success) {
        throw new Error(saveResult.error)
      }

      console.log('✅ Learning path generation tamamlandı:', saveResult.learningPathId)
      return {
        success: true,
        learningPathId: saveResult.learningPathId,
        data: parsedLearningPath.data,
        generationTime: Date.now() - startTime
      }

    } catch (error) {
      console.error('❌ Learning path generation hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * PDF'den direkt learning path oluştur (yeni sistem için)
   * @param {Object} options - Generation seçenekleri
   * @returns {Object} Generation sonucu
   */
  async generateLearningPathFromPDF(options) {
    try {
      console.log('🛤️ PDF\'den learning path generation başlatılıyor:', options.courseTitle)

      const startTime = Date.now()

      // 1. Prompt hazırla
      const prompt = this.buildLearningPathPromptFromPDF(options)
      console.log('📝 PDF learning path prompt hazırlandı')

      // 2. Gemini API çağrısı (PDF ile)
      const generationResult = await this.callGeminiAPIWithPDF(prompt, options)
      if (!generationResult.success) {
        throw new Error(generationResult.error)
      }

      // 3. Response parse et
      const parsedLearningPath = this.parseLearningPathResponse(generationResult.data)
      if (!parsedLearningPath.success) {
        throw new Error(parsedLearningPath.error)
      }

      // 4. Database'e kaydet (documentId olmadan)
      const saveResult = await learningPathService.createLearningPath({
        documentId: null, // PDF'den direkt oluşturulduğu için null
        title: parsedLearningPath.data.title,
        description: parsedLearningPath.data.description,
        steps: parsedLearningPath.data.steps,
        estimatedDuration: parsedLearningPath.data.estimatedDuration,
        difficultyLevel: parsedLearningPath.data.difficultyLevel,
        prerequisites: parsedLearningPath.data.prerequisites,
        modelUsed: this.model,
        metadata: {
          generationTime: Date.now() - startTime,
          modelUsed: this.model,
          source: 'gemini_api_pdf',
          courseTitle: options.courseTitle,
          options: options
        }
      })

      if (!saveResult.success) {
        throw new Error(saveResult.error)
      }

      console.log('✅ PDF\'den learning path generation tamamlandı:', saveResult.learningPathId)
      return {
        success: true,
        learningPathId: saveResult.learningPathId,
        data: parsedLearningPath.data,
        generationTime: Date.now() - startTime
      }

    } catch (error) {
      console.error('❌ PDF\'den learning path generation hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Learning path prompt'u oluştur (PDF için)
   * @param {Object} options - Generation seçenekleri
   * @returns {string} Prompt
   */
  buildLearningPathPromptFromPDF(options) {
    const {
      courseTitle,
      maxSteps = 6,
      difficultyLevel = 'intermediate',
      targetAudience = 'genel'
    } = options

    const prompt = `
Sen bir eğitim tasarımcısısın. Verilen PDF dosyasını analiz ederek etkili bir öğrenme yolu oluşturman gerekiyor.

KURS BİLGİLERİ:
- Başlık: ${courseTitle}
- Zorluk Seviyesi: ${difficultyLevel}
- Hedef Kitle: ${targetAudience}
- Maksimum Adım: ${maxSteps}

GÖREV:
PDF dosyasını analiz et ve aşağıdaki formatta bir öğrenme yolu oluştur:

{
  "title": "Kurs Başlığı",
  "description": "Kurs açıklaması",
  "difficulty_level": "başlangıç/orta/ileri",
  "estimated_duration": "8-10 saat",
  "prerequisites": ["Ön koşul 1", "Ön koşul 2"],
  "steps": [
    {
      "step": 1,
      "title": "Adım 1 Başlığı",
      "duration": "2 saat",
      "objectives": ["Hedef 1", "Hedef 2"],
      "activities": ["Aktivite 1", "Aktivite 2"]
    },
    {
      "step": 2,
      "title": "Adım 2 Başlığı", 
      "duration": "1.5 saat",
      "objectives": ["Hedef 1"],
      "activities": ["Aktivite 1"]
    }
  ]
}

3D GÖRSELLEŞTİRME İÇİN ÖNEMLİ:
- title: Adım gezegenleri için kısa ve net başlık (max 15 karakter)
- Tüm metinler Türkçe olmalı
- Özel karakterler kullanma (sadece harf, rakam, boşluk)
- Adım başlıkları sıralı ve mantıklı olmalı

KURALLAR:
1. Adımlar mantıklı bir sırayla olmalı
2. Her adımın net hedefleri olmalı
3. Aktiviteler pratik ve uygulanabilir olmalı
4. Süreler gerçekçi olmalı
5. Ön koşullar gerekli olmalı
6. Sadece JSON formatında yanıt ver, başka açıklama ekleme

PDF dosyasını analiz et ve öğrenme yolunu oluştur.
`

    return prompt
  }

  /**
   * Learning path prompt'u oluştur (mevcut sistem için)
   * @param {Object} options - Generation seçenekleri
   * @returns {string} Prompt
   */
  buildLearningPathPrompt(options) {
    const {
      courseTitle,
      courseContent,
      courseOutline,
      maxSteps = 6,
      difficultyLevel = 'intermediate',
      targetAudience = 'genel'
    } = options

    const prompt = `
Sen bir eğitim tasarımcısısın. Verilen kurs içeriğine göre etkili bir öğrenme yolu oluşturman gerekiyor.

KURS BİLGİLERİ:
- Başlık: ${courseTitle}
- Zorluk Seviyesi: ${difficultyLevel}
- Hedef Kitle: ${targetAudience}
- Maksimum Adım: ${maxSteps}

KURS İÇERİĞİ:
${courseContent}

KURS YAPISI:
${courseOutline}

GÖREV:
Bu kurs için bir öğrenme yolu oluştur. Öğrenme yolu şu özelliklere sahip olmalı:

1. ADIMLAR: ${maxSteps} adet mantıklı öğrenme adımı
2. SÜRE: Her adım için gerçekçi süre tahmini
3. ÖN KOŞULLAR: Her adımın ön koşulları
4. HEDEFLER: Her adımın öğrenme hedefleri
5. AKTİVİTELER: Her adımda yapılacak aktiviteler
6. TOPLAM SÜRE: Tüm yolun toplam süresi

ÇIKTI FORMATI (JSON):
{
  "title": "Öğrenme Yolu Başlığı",
  "description": "Öğrenme yolu açıklaması",
  "difficulty_level": "${difficultyLevel}",
  "estimated_duration": "8-10 saat",
  "prerequisites": ["Temel bilgi 1", "Temel bilgi 2"],
  "steps": [
    {
      "step": 1,
      "title": "Adım Başlığı",
      "chapters": ["Bölüm 1", "Bölüm 2"],
      "duration": "2-3 saat",
      "prerequisites": [],
      "objectives": ["Hedef 1", "Hedef 2"],
      "activities": ["Aktivite 1", "Aktivite 2"]
    }
  ],
  "metadata": {
    "total_steps": 5,
    "total_duration_hours": 16.5,
    "generated_at": "2024-01-01T00:00:00Z",
    "model_used": "${this.model}"
  }
}

ÖNEMLİ KURALLAR:
- Sadece JSON formatında yanıt ver
- Türkçe kullan
- Gerçekçi süreler belirle
- Mantıklı adım sıralaması yap
- Her adımın hedeflerini net belirle
- Aktiviteleri çeşitlendir
- JSON syntax'ına dikkat et

Yanıtını sadece JSON olarak ver, başka açıklama ekleme.`

    return prompt
  }

  /**
   * Gemini API çağrısı yap
   * @param {string} prompt - AI prompt'u
   * @param {Object} options - Seçenekler
   * @returns {Object} API sonucu
   */
  async callGeminiAPIWithPDF(prompt, options) {
    try {
      console.log('🤖 Gemini API çağrısı yapılıyor (PDF ile)...')

      // Ana model ile dene (PDF desteği ile)
      let result = await generateContent(prompt, {
        model: this.model,
        maxTokens: 4000,
        temperature: 0.7,
        pdfContent: options.pdfContent // PDF base64 içeriği
      })

      if (result.success) {
        console.log('✅ Ana model başarılı (PDF ile):', this.model)
        return result
      }

      // Fallback modeller ile dene
      for (const fallbackModel of this.fallbackModels) {
        console.log(`🔄 Fallback model deneniyor (PDF ile): ${fallbackModel}`)
        
        result = await generateContent(prompt, {
          model: fallbackModel,
          maxTokens: 4000,
          temperature: 0.7,
          pdfContent: options.pdfContent
        })

        if (result.success) {
          console.log('✅ Fallback model başarılı (PDF ile):', fallbackModel)
          this.model = fallbackModel // Başarılı modeli güncelle
          return result
        }
      }

      throw new Error('Tüm modeller başarısız oldu (PDF ile)')

    } catch (error) {
      console.error('❌ Gemini API hatası (PDF ile):', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async callGeminiAPI(prompt, options) {
    try {
      console.log('🤖 Gemini API çağrısı yapılıyor...')

      // Ana model ile dene
      let result = await generateContent(prompt, {
        model: this.model,
        maxTokens: 4000,
        temperature: 0.7
      })

      if (result.success) {
        console.log('✅ Ana model başarılı:', this.model)
        return result
      }

      // Fallback modeller ile dene
      for (const fallbackModel of this.fallbackModels) {
        console.log(`🔄 Fallback model deneniyor: ${fallbackModel}`)
        
        result = await generateContent(prompt, {
          model: fallbackModel,
          maxTokens: 4000,
          temperature: 0.7
        })

        if (result.success) {
          console.log('✅ Fallback model başarılı:', fallbackModel)
          this.model = fallbackModel // Başarılı modeli güncelle
          return result
        }
      }

      throw new Error('Tüm modeller başarısız oldu')

    } catch (error) {
      console.error('❌ Gemini API hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Learning path response'unu parse et
   * @param {string} response - AI response'u
   * @returns {Object} Parse edilmiş learning path
   */
  parseLearningPathResponse(response) {
    try {
      console.log('🔍 Learning path response parse ediliyor...')

      // JSON extract
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON formatı bulunamadı')
      }

      const learningPathData = JSON.parse(jsonMatch[0])

      // Validation
      if (!learningPathData.title || !learningPathData.steps) {
        throw new Error('Eksik learning path verileri')
      }

      // Steps validation
      if (!Array.isArray(learningPathData.steps) || learningPathData.steps.length === 0) {
        throw new Error('Geçersiz steps formatı')
      }

      // Her step'i validate et
      learningPathData.steps.forEach((step, index) => {
        if (!step.title) {
          throw new Error(`Step ${index}: title eksik`)
        }
        if (!Array.isArray(step.objectives)) {
          throw new Error(`Step ${index}: objectives array değil`)
        }
        if (!Array.isArray(step.activities)) {
          throw new Error(`Step ${index}: activities array değil`)
        }
        if (!step.duration) {
          throw new Error(`Step ${index}: duration eksik`)
        }
      })

      console.log('✅ Learning path response parse edildi')
      return {
        success: true,
        data: learningPathData
      }

    } catch (error) {
      console.error('❌ Learning path response parse hatası:', error)
      return {
        success: false,
        error: `Parse hatası: ${error.message}`
      }
    }
  }

  /**
   * Learning path'i güncelle
   * @param {string} learningPathId - Learning path ID
   * @param {Object} options - Güncelleme seçenekleri
   * @returns {Object} Güncelleme sonucu
   */
  async regenerateLearningPath(learningPathId, options) {
    try {
      console.log('🔄 Learning path yeniden oluşturuluyor:', learningPathId)

      // Mevcut learning path'i getir
      const existingLearningPath = await learningPathService.getLearningPath(options.documentId)
      if (!existingLearningPath.success) {
        throw new Error('Mevcut learning path bulunamadı')
      }

      // Yeni learning path oluştur
      const newLearningPath = await this.generateLearningPath(options)
      if (!newLearningPath.success) {
        throw new Error(newLearningPath.error)
      }

      // Eski learning path'i sil
      await learningPathService.deleteLearningPath(learningPathId)

      console.log('✅ Learning path yeniden oluşturuldu')
      return newLearningPath

    } catch (error) {
      console.error('❌ Learning path yeniden oluşturma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Learning path generation istatistikleri
   * @param {string} documentId - Document ID
   * @returns {Object} İstatistikler
   */
  async getGenerationStats(documentId) {
    try {
      console.log('📊 Learning path generation istatistikleri getiriliyor')

      const stats = await learningPathService.getLearningPathStats(documentId)
      if (!stats.success) {
        throw new Error(stats.error)
      }

      // Generation time analizi
      const learningPaths = await learningPathService.getAllLearningPaths(documentId)
      if (learningPaths.success) {
        const avgGenerationTime = learningPaths.data.reduce((sum, learningPath) => {
          return sum + (learningPath.metadata?.generationTime || 0)
        }, 0) / learningPaths.data.length

        stats.data.averageGenerationTime = Math.round(avgGenerationTime)
        stats.data.totalGenerationTime = learningPaths.data.reduce((sum, learningPath) => {
          return sum + (learningPath.metadata?.generationTime || 0)
        }, 0)
      }

      return stats

    } catch (error) {
      console.error('❌ Generation istatistikleri hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Learning path'i analiz et
   * @param {string} learningPathId - Learning path ID
   * @returns {Object} Analiz sonucu
   */
  async analyzeLearningPath(learningPathId) {
    try {
      console.log('📈 Learning path analizi başlatılıyor:', learningPathId)

      const analysis = await learningPathService.analyzeLearningPathSteps(learningPathId)
      if (!analysis.success) {
        throw new Error(analysis.error)
      }

      // Ek analizler
      const learningPath = await learningPathService.getLearningPath(learningPathId)
      if (learningPath.success) {
        const data = learningPath.data
        analysis.data.difficultyLevel = data.difficulty_level
        analysis.data.estimatedDuration = data.estimated_duration
        analysis.data.prerequisites = data.prerequisites?.length || 0
        analysis.data.totalPrerequisites = data.prerequisites || []
      }

      console.log('✅ Learning path analizi tamamlandı')
      return analysis

    } catch (error) {
      console.error('❌ Learning path analizi hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new LearningPathGeneratorService() 