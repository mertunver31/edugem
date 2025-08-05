import { generateContent } from './geminiService'
import mindMapService from './mindMapService'

/**
 * Mind Map Generator Service
 * Gemini API kullanarak mind map oluşturma
 */
class MindMapGeneratorService {
  constructor() {
    this.model = 'gemini-1.5-flash'
    this.fallbackModels = ['gemini-1.5-pro']
  }

  /**
   * Mind map oluştur (mevcut sistem için)
   * @param {Object} options - Generation seçenekleri
   * @returns {Object} Generation sonucu
   */
  async generateMindMap(options) {
    try {
      console.log('🧠 Mind map generation başlatılıyor:', options.documentId)

      const startTime = Date.now()

      // 1. Prompt hazırla
      const prompt = this.buildMindMapPrompt(options)
      console.log('📝 Mind map prompt hazırlandı')

      // 2. Gemini API çağrısı
      const generationResult = await this.callGeminiAPI(prompt, options)
      if (!generationResult.success) {
        throw new Error(generationResult.error)
      }

      // 3. Response parse et
      const parsedMindMap = this.parseMindMapResponse(generationResult.data)
      if (!parsedMindMap.success) {
        throw new Error(parsedMindMap.error)
      }

      // 4. Database'e kaydet
      const saveResult = await mindMapService.createMindMap({
        documentId: options.documentId,
        type: options.type || 'course_mindmap',
        title: parsedMindMap.data.title,
        centralTopic: parsedMindMap.data.central_topic, // central_topic -> centralTopic
        content: parsedMindMap.data.branches, // branches -> content
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

      console.log('✅ Mind map generation tamamlandı:', saveResult.mindMapId)
      return {
        success: true,
        mindMapId: saveResult.mindMapId,
        data: parsedMindMap.data,
        generationTime: Date.now() - startTime
      }

    } catch (error) {
      console.error('❌ Mind map generation hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * PDF'den direkt mind map oluştur (yeni sistem için)
   * @param {Object} options - Generation seçenekleri
   * @returns {Object} Generation sonucu
   */
  async generateMindMapFromPDF(options) {
    try {
      console.log('🧠 PDF\'den mind map generation başlatılıyor:', options.courseTitle)

      const startTime = Date.now()

      // 1. Prompt hazırla
      const prompt = this.buildMindMapPromptFromPDF(options)
      console.log('📝 PDF mind map prompt hazırlandı')

      // 2. Gemini API çağrısı (PDF ile)
      const generationResult = await this.callGeminiAPIWithPDF(prompt, options)
      if (!generationResult.success) {
        throw new Error(generationResult.error)
      }

      // 3. Response parse et
      const parsedMindMap = this.parseMindMapResponse(generationResult.data)
      if (!parsedMindMap.success) {
        throw new Error(parsedMindMap.error)
      }

      // 4. Database'e kaydet (documentId olmadan)
      const saveResult = await mindMapService.createMindMap({
        documentId: null, // PDF'den direkt oluşturulduğu için null
        type: options.type || 'course_mindmap',
        title: parsedMindMap.data.title,
        centralTopic: parsedMindMap.data.central_topic,
        content: parsedMindMap.data.branches,
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

      console.log('✅ PDF\'den mind map generation tamamlandı:', saveResult.mindMapId)
      return {
        success: true,
        mindMapId: saveResult.mindMapId,
        data: parsedMindMap.data,
        generationTime: Date.now() - startTime
      }

    } catch (error) {
      console.error('❌ PDF\'den mind map generation hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Mind map prompt'u oluştur (PDF için)
   * @param {Object} options - Generation seçenekleri
   * @returns {string} Prompt
   */
  buildMindMapPromptFromPDF(options) {
    const {
      courseTitle,
      type = 'course_mindmap',
      maxBranches = 6,
      maxSubtopics = 3
    } = options

    const prompt = `
Sen bir eğitim uzmanısın. Verilen PDF dosyasını analiz ederek etkili bir mind map oluşturman gerekiyor.

KURS BİLGİLERİ:
- Başlık: ${courseTitle}
- Tür: ${type}
- Maksimum Ana Dal: ${maxBranches}
- Maksimum Alt Konu: ${maxSubtopics}

GÖREV:
PDF dosyasını analiz et ve aşağıdaki formatta bir mind map oluştur:

{
  "title": "Kurs Başlığı",
  "central_topic": "Merkezi Konu",
  "branches": [
    {
      "topic": "Ana Konu 1",
      "importance": 0.9,
      "subtopics": ["Alt Konu 1.1", "Alt Konu 1.2", "Alt Konu 1.3"],
      "connections": ["Ana Konu 2", "Ana Konu 3"]
    },
    {
      "topic": "Ana Konu 2", 
      "importance": 0.8,
      "subtopics": ["Alt Konu 2.1", "Alt Konu 2.2"],
      "connections": ["Ana Konu 1"]
    }
  ]
}

3D GÖRSELLEŞTİRME İÇİN ÖNEMLİ:
- central_topic: Merkez gezegen için kısa ve net başlık (max 20 karakter)
- topic: Ana dal gezegenleri için kısa başlık (max 15 karakter)
- subtopics: Alt konu gezegenleri için kısa başlıklar (max 12 karakter)
- Tüm metinler Türkçe olmalı
- Özel karakterler kullanma (sadece harf, rakam, boşluk)

KURALLAR:
1. Merkezi konu, PDF'nin ana temasını yansıtmalı
2. Ana dallar, PDF'deki önemli bölümleri temsil etmeli
3. Alt konular, ana dalların detaylarını içermeli
4. Bağlantılar, konular arası ilişkileri gösterir
5. Önem değeri 0.1 ile 1.0 arasında olmalı
6. Sadece JSON formatında yanıt ver, başka açıklama ekleme

PDF dosyasını analiz et ve mind map'i oluştur.
`

    return prompt
  }

  /**
   * Mind map prompt'u oluştur (mevcut sistem için)
   * @param {Object} options - Generation seçenekleri
   * @returns {string} Prompt
   */
  buildMindMapPrompt(options) {
    const {
      courseTitle,
      courseContent,
      courseOutline,
      type = 'course_mindmap',
      maxBranches = 6,
      maxSubtopics = 3
    } = options

    const prompt = `
Sen bir eğitim uzmanısın. Verilen kurs içeriğine göre etkili bir mind map oluşturman gerekiyor.

KURS BİLGİLERİ:
- Başlık: ${courseTitle}
- Tür: ${type}
- Maksimum Ana Dal: ${maxBranches}
- Maksimum Alt Konu: ${maxSubtopics}

KURS İÇERİĞİ:
${courseContent}

KURS YAPISI:
${courseOutline}

GÖREV:
Bu kurs için bir mind map oluştur. Mind map şu özelliklere sahip olmalı:

1. MERKEZİ KONU: Kursun ana teması
2. ANA DALLAR: ${maxBranches} adet ana konu dalı
3. ALT KONULAR: Her dal için ${maxSubtopics} alt konu
4. BAĞLANTILAR: Dallar arası ilişkiler
5. ÖNEM SEVİYELERİ: Her dalın önem derecesi (0.1-1.0)

ÇIKTI FORMATI (JSON):
{
  "type": "${type}",
  "title": "Kurs Başlığı",
  "central_topic": "Ana Konu",
  "branches": [
    {
      "topic": "Ana Dal 1",
      "subtopics": ["Alt Konu 1", "Alt Konu 2", "Alt Konu 3"],
      "importance": 0.9,
      "connections": ["Ana Dal 2", "Ana Dal 3"]
    }
  ],
  "metadata": {
    "total_branches": 5,
    "total_subtopics": 15,
    "generated_at": "2024-01-01T00:00:00Z",
    "model_used": "${this.model}"
  }
}

ÖNEMLİ KURALLAR:
- Sadece JSON formatında yanıt ver
- Türkçe kullan
- Gerçekçi ve eğitici ol
- Konular arası mantıklı bağlantılar kur
- Önem seviyelerini doğru belirle
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
   * Mind map response'unu parse et
   * @param {string} response - AI response'u
   * @returns {Object} Parse edilmiş mind map
   */
  parseMindMapResponse(response) {
    try {
      console.log('🔍 Mind map response parse ediliyor...')

      // JSON extract
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON formatı bulunamadı')
      }

      const mindMapData = JSON.parse(jsonMatch[0])

      // Validation
      if (!mindMapData.title || !mindMapData.central_topic || !mindMapData.branches) {
        throw new Error('Eksik mind map verileri: title, central_topic veya branches eksik')
      }

      // Branches validation
      if (!Array.isArray(mindMapData.branches) || mindMapData.branches.length === 0) {
        throw new Error('Geçersiz branches formatı')
      }

      // Her branch'i validate et
      mindMapData.branches.forEach((branch, index) => {
        if (!branch.topic) {
          throw new Error(`Branch ${index}: topic eksik`)
        }
        if (!Array.isArray(branch.subtopics)) {
          throw new Error(`Branch ${index}: subtopics array değil`)
        }
        if (typeof branch.importance !== 'number' || branch.importance < 0 || branch.importance > 1) {
          throw new Error(`Branch ${index}: geçersiz importance değeri`)
        }
      })

      console.log('✅ Mind map response parse edildi')
      return {
        success: true,
        data: mindMapData
      }

    } catch (error) {
      console.error('❌ Mind map response parse hatası:', error)
      return {
        success: false,
        error: `Parse hatası: ${error.message}`
      }
    }
  }

  /**
   * Mind map'i güncelle
   * @param {string} mindMapId - Mind map ID
   * @param {Object} options - Güncelleme seçenekleri
   * @returns {Object} Güncelleme sonucu
   */
  async regenerateMindMap(mindMapId, options) {
    try {
      console.log('🔄 Mind map yeniden oluşturuluyor:', mindMapId)

      // Mevcut mind map'i getir
      const existingMindMap = await mindMapService.getMindMap(options.documentId)
      if (!existingMindMap.success) {
        throw new Error('Mevcut mind map bulunamadı')
      }

      // Yeni mind map oluştur
      const newMindMap = await this.generateMindMap(options)
      if (!newMindMap.success) {
        throw new Error(newMindMap.error)
      }

      // Eski mind map'i sil
      await mindMapService.deleteMindMap(mindMapId)

      console.log('✅ Mind map yeniden oluşturuldu')
      return newMindMap

    } catch (error) {
      console.error('❌ Mind map yeniden oluşturma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Mind map generation istatistikleri
   * @param {string} documentId - Document ID
   * @returns {Object} İstatistikler
   */
  async getGenerationStats(documentId) {
    try {
      console.log('📊 Mind map generation istatistikleri getiriliyor')

      const stats = await mindMapService.getMindMapStats(documentId)
      if (!stats.success) {
        throw new Error(stats.error)
      }

      // Generation time analizi
      const mindMaps = await mindMapService.getAllMindMaps(documentId)
      if (mindMaps.success) {
        const avgGenerationTime = mindMaps.data.reduce((sum, mindMap) => {
          return sum + (mindMap.metadata?.generationTime || 0)
        }, 0) / mindMaps.data.length

        stats.data.averageGenerationTime = Math.round(avgGenerationTime)
        stats.data.totalGenerationTime = mindMaps.data.reduce((sum, mindMap) => {
          return sum + (mindMap.metadata?.generationTime || 0)
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
}

export default new MindMapGeneratorService() 