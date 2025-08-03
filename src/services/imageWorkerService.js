import { supabase } from '../config/supabase'
import { HfInference } from '@huggingface/inference'

/**
 * Image Worker Service
 * GÜN 7 - AŞAMA 3: Image Worker - Görsel İçerik İşleme
 * Segment içeriğine uygun görseller oluşturma ve işleme
 */
class ImageWorkerService {
  constructor() {
    this.workerId = `image-worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Hugging Face API Key
    const hfApiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY || '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'
    this.hf = new HfInference(hfApiKey)
    
    // Stable Diffusion XL (SDXL) modeli
    this.models = {
      stableDiffusion: 'stabilityai/stable-diffusion-xl-base-1.0'
    }
  }

  /**
   * Segment için görsel içerik oluştur
   * @param {string} segmentId - Segment ID
   * @returns {Object} Görsel işleme sonucu
   */
  async processSegmentImages(segmentId) {
    try {
      console.log(`Segment ${segmentId} görsel işleme başlatılıyor...`)

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

      // Görsel prompt'ları oluştur
      const imagePrompts = await this.generateImagePrompts(segmentInfo.data, documentInfo.data)
      if (!imagePrompts.success) {
        throw new Error(`Görsel prompt'ları oluşturulamadı: ${imagePrompts.error}`)
      }

      // Görselleri oluştur
      const generatedImages = await this.generateImages(imagePrompts.data)
      if (!generatedImages.success) {
        throw new Error(`Görseller oluşturulamadı: ${generatedImages.error}`)
      }

      // Görselleri kaydet
      const saveResult = await this.saveProcessedImages(segmentId, generatedImages.data)
      if (!saveResult.success) {
        throw new Error(`Görseller kaydedilemedi: ${saveResult.error}`)
      }

      console.log(`Segment ${segmentId} görsel işleme tamamlandı`)
      return {
        success: true,
        segmentId: segmentId,
        generatedImages: generatedImages.data,
        metadata: {
          worker_id: this.workerId,
          processed_at: new Date().toISOString(),
          image_count: generatedImages.data.length,
          prompts_used: imagePrompts.data.length
        }
      }

    } catch (error) {
      console.error('Segment görsel işleme hatası:', error)
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
   * Segment için görsel prompt'ları oluştur
   * @param {Object} segmentInfo - Segment bilgileri
   * @param {Object} documentInfo - Document bilgileri
   * @returns {Object} Görsel prompt'ları
   */
  async generateImagePrompts(segmentInfo, documentInfo) {
    try {
      console.log(`Segment ${segmentInfo.seg_no} için görsel prompt'ları oluşturuluyor...`)

      const prompts = []

      // Ana konu prompt'u
      const mainPrompt = this.createMainImagePrompt(segmentInfo, documentInfo)
      prompts.push({
        type: 'MAIN_TOPIC',
        prompt: mainPrompt,
        description: 'Ana konu görseli',
        style: 'educational, clean, modern'
      })

      // Konsept diyagramı
      const conceptPrompt = this.createConceptDiagramPrompt(segmentInfo)
      prompts.push({
        type: 'CONCEPT_DIAGRAM',
        prompt: conceptPrompt,
        description: 'Konsept diyagramı',
        style: 'diagram, flowchart, educational'
      })

      // Örnek görseli
      const examplePrompt = this.createExampleImagePrompt(segmentInfo)
      prompts.push({
        type: 'EXAMPLE_IMAGE',
        prompt: examplePrompt,
        description: 'Örnek görseli',
        style: 'illustrative, clear, educational'
      })

      return {
        success: true,
        data: prompts
      }

    } catch (error) {
      console.error('Görsel prompt oluşturma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Ana konu görseli için prompt oluştur
   * @param {Object} segmentInfo - Segment bilgileri
   * @param {Object} documentInfo - Document bilgileri
   * @returns {string} Prompt
   */
  createMainImagePrompt(segmentInfo, documentInfo) {
    const title = segmentInfo.title || `Segment ${segmentInfo.seg_no}`
    const subject = this.extractSubjectFromDocument(documentInfo.file_path)
    
    return `Educational illustration of ${title} in ${subject}, clean modern design, clear visual elements, professional academic style, high quality detailed educational content, no text or letters, visual learning material`
  }

  /**
   * Konsept diyagramı için prompt oluştur
   * @param {Object} segmentInfo - Segment bilgileri
   * @returns {string} Prompt
   */
  createConceptDiagramPrompt(segmentInfo) {
    const title = segmentInfo.title || `Segment ${segmentInfo.seg_no}`
    
    return `Concept diagram for ${title}, flowchart style, showing relationships and connections, clean lines, educational design, easy to understand, professional diagram format, no text or letters, visual diagram only`
  }

  /**
   * Örnek görseli için prompt oluştur
   * @param {Object} segmentInfo - Segment bilgileri
   * @returns {string} Prompt
   */
  createExampleImagePrompt(segmentInfo) {
    const title = segmentInfo.title || `Segment ${segmentInfo.seg_no}`
    
    return `Practical example illustration for ${title}, real-world application, step-by-step visual guide, clear educational helpful for learning, professional example format, no text or letters, visual example only`
  }

  /**
   * Document dosya adından konu çıkar
   * @param {string} filePath - Dosya yolu
   * @returns {string} Konu
   */
  extractSubjectFromDocument(filePath) {
    const fileName = filePath.split('/').pop().toLowerCase()
    
    if (fileName.includes('math') || fileName.includes('matematik')) return 'mathematics'
    if (fileName.includes('physics') || fileName.includes('fizik')) return 'physics'
    if (fileName.includes('chemistry') || fileName.includes('kimya')) return 'chemistry'
    if (fileName.includes('biology') || fileName.includes('biyoloji')) return 'biology'
    if (fileName.includes('history') || fileName.includes('tarih')) return 'history'
    if (fileName.includes('geography') || fileName.includes('coğrafya')) return 'geography'
    if (fileName.includes('literature') || fileName.includes('edebiyat')) return 'literature'
    if (fileName.includes('computer') || fileName.includes('bilgisayar')) return 'computer science'
    
    return 'academic subject'
  }

  /**
   * Stable Diffusion ile görseller oluştur
   * @param {Array} prompts - Görsel prompt'ları
   * @returns {Object} Oluşturulan görseller
   */
  async generateImages(prompts) {
    try {
      console.log(`${prompts.length} görsel oluşturuluyor...`)
      
      const generatedImages = []

             for (const promptData of prompts) {
         try {
           // Hugging Face API çağrısı
           const imageResult = await this.callStableDiffusionAPI(promptData.prompt, promptData.type)
           
                       generatedImages.push({
              type: promptData.type,
              prompt: promptData.prompt,
              description: promptData.description,
              style: promptData.style,
              image_url: imageResult.image_url,
              metadata: {
                width: promptData.type === 'CONCEPT_DIAGRAM' ? 1024 : 768,
                height: promptData.type === 'CONCEPT_DIAGRAM' ? 1024 : 768,
                model: imageResult.model,
                generation_time: imageResult.generation_time,
                blob: imageResult.blob
              }
            })

          // API rate limit için bekleme
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
          console.error(`${promptData.type} görseli oluşturulamadı:`, error)
          // Hata durumunda placeholder görsel
          generatedImages.push({
            type: promptData.type,
            prompt: promptData.prompt,
            description: promptData.description,
            style: promptData.style,
            image_url: this.getPlaceholderImage(promptData.type),
            metadata: {
              width: 1024,
              height: 1024,
              model: 'placeholder',
              error: error.message
            }
          })
        }
      }

      return {
        success: true,
        data: generatedImages
      }

    } catch (error) {
      console.error('Görsel oluşturma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Stable Diffusion v2 ile görsel oluştur
   * @param {string} prompt - Görsel prompt'u
   * @param {string} imageType - Görsel türü (MAIN_TOPIC, CONCEPT_DIAGRAM, EXAMPLE_IMAGE)
   * @returns {Object} API sonucu
   */
  async callStableDiffusionAPI(prompt, imageType = 'MAIN_TOPIC') {
    try {
      console.log(`Stable Diffusion XL ile görsel oluşturuluyor: ${imageType}`)
      
      // Görsel türüne göre model ve ayarlar seç
      let model = this.models.stableDiffusion
      let negativePrompt = ''
      let width = 768
      let height = 768
      
      switch (imageType) {
        case 'MAIN_TOPIC':
          model = this.models.stableDiffusion
          negativePrompt = 'text, letters, words, writing, blurry, low quality, distorted, ugly, bad anatomy, watermark, signature'
          break
        case 'CONCEPT_DIAGRAM':
          model = this.models.stableDiffusion
          negativePrompt = 'text, letters, words, writing, photographic, realistic, blurry, low quality, watermark, signature'
          break
        case 'EXAMPLE_IMAGE':
          model = this.models.stableDiffusion
          negativePrompt = 'text, letters, words, writing, watermark, signature, blurry, low quality, distorted'
          break
        default:
          model = this.models.stableDiffusion
          negativePrompt = 'text, letters, words, writing, blurry, low quality, distorted, ugly, bad anatomy, watermark, signature'
      }
      
      const startTime = Date.now()
      
             // Stable Diffusion XL API çağrısı
       const result = await this.hf.textToImage({
         model: model,
         provider: "hf-inference",
         inputs: prompt,
         options: { width: width, height: height }
       })
      
      const generationTime = (Date.now() - startTime) / 1000
      
      // Blob'u URL'e çevir
      const blob = new Blob([result], { type: 'image/png' })
      const imageUrl = URL.createObjectURL(blob)
      
      console.log(`${imageType} görseli başarıyla oluşturuldu (${generationTime.toFixed(1)}s) - Model: ${model}`)
      
      return {
        image_url: imageUrl,
        generation_time: generationTime,
        model: model,
        blob: blob
      }
      
    } catch (error) {
      console.error('Stable Diffusion v2 API hatası:', error)
      
      // Hata durumunda placeholder döndür
      return this.getPlaceholderResult(prompt, imageType)
    }
  }

  /**
   * Placeholder sonuç döndür
   * @param {string} prompt - Görsel prompt'u
   * @param {string} imageType - Görsel türü
   * @returns {Object} Placeholder sonuç
   */
  getPlaceholderResult(prompt, imageType) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const colors = {
          'MAIN_TOPIC': '4A90E2',
          'CONCEPT_DIAGRAM': '7ED321',
          'EXAMPLE_IMAGE': 'F5A623'
        }
        
        const color = colors[imageType] || '9B9B9B'
        const width = imageType === 'CONCEPT_DIAGRAM' ? 1024 : 768
        const height = imageType === 'CONCEPT_DIAGRAM' ? 1024 : 768
        const placeholderUrl = `https://via.placeholder.com/${width}x${height}/${color}/FFFFFF?text=${encodeURIComponent(prompt.substring(0, 30))}`
        
        resolve({
          image_url: placeholderUrl,
          generation_time: Math.random() * 5 + 2,
          model: 'placeholder',
          blob: null
        })
      }, 1000)
    })
  }

  /**
   * Placeholder görsel URL'i al
   * @param {string} type - Görsel türü
   * @returns {string} Placeholder URL
   */
  getPlaceholderImage(type) {
    const colors = {
      'MAIN_TOPIC': '4A90E2',
      'CONCEPT_DIAGRAM': '7ED321',
      'EXAMPLE_IMAGE': 'F5A623'
    }
    
    const color = colors[type] || '9B9B9B'
    const width = type === 'CONCEPT_DIAGRAM' ? 1024 : 768
    const height = type === 'CONCEPT_DIAGRAM' ? 1024 : 768
    return `https://via.placeholder.com/${width}x${height}/${color}/FFFFFF?text=${type}`
  }

  /**
   * İşlenmiş görselleri kaydet
   * @param {string} segmentId - Segment ID
   * @param {Array} generatedImages - Oluşturulan görseller
   * @returns {Object} Kaydetme sonucu
   */
  async saveProcessedImages(segmentId, generatedImages) {
    try {
      // Mevcut kullanıcı ID'sini al
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı')
      }

      // Worker Results tablosuna kaydet
      const { data, error } = await supabase
        .from('worker_results')
        .insert({
          segment_id: segmentId,
          user_id: user.id,
          worker_type: 'IMAGE_WORKER',
          image_url: generatedImages[0]?.image_url || null,
          image_prompt: JSON.stringify(generatedImages.map(img => ({
            type: img.type,
            prompt: img.prompt,
            description: img.description
          }))),
          image_metadata: {
            processing_stage: 'IMAGE_PROCESSING',
            generated_images: generatedImages,
            worker_id: this.workerId,
            total_images: generatedImages.length
          }
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Worker result kaydedilemedi: ${error.message}`)
      }

      console.log(`Görseller kaydedildi: ${data.id}`)
      return {
        success: true,
        result_id: data.id
      }

    } catch (error) {
      console.error('Görsel kaydetme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Segment'in işlenmiş görsellerini al
   * @param {string} segmentId - Segment ID
   * @returns {Object} İşlenmiş görseller
   */
  async getProcessedImages(segmentId) {
    try {
      const { data, error } = await supabase
        .from('worker_results')
        .select('*')
        .eq('segment_id', segmentId)
        .eq('worker_type', 'IMAGE_WORKER')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        throw new Error(`İşlenmiş görseller alınamadı: ${error.message}`)
      }

      return {
        success: true,
        data: data
      }

    } catch (error) {
      console.error('İşlenmiş görsel alma hatası:', error)
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

export default new ImageWorkerService() 