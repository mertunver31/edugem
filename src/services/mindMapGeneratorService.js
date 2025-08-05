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
   * Mind map oluştur
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
   * Mind map prompt'u oluştur
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