import { supabase } from '../config/supabase'
import { courseStructureService } from './courseStructureService'
import imageWorkerService from './imageWorkerService'

class CourseVisualService {
  constructor() {
    this.supabase = supabase
    this.imageWorker = imageWorkerService
  }

  /**
   * Kurs yapısına göre AI ile akıllı görsel prompt'lar üretecek ve görsel entegrasyonu yönetecek.
   */
  async generateVisualPrompts(documentId) {
    try {
      console.log('🎨 Course Visual Prompts üretiliyor:', documentId)

      // Kurs yapısını al
      const courseResult = await courseStructureService.getCourseStructure(documentId)
      if (!courseResult.success) {
        throw new Error('Kurs yapısı alınamadı: ' + courseResult.error)
      }

      const courseStructure = courseResult.data.courseStructure
      const visualPrompts = []

      // Her bölüm için görsel prompt'lar üret
      for (const chapter of courseStructure.chapters) {
        const chapterPrompts = await this.generateChapterVisualPrompts(chapter)
        visualPrompts.push({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          prompts: chapterPrompts
        })
      }

      // Database'e kaydet
      await this.saveVisualPrompts(documentId, visualPrompts)

      return {
        success: true,
        documentId,
        visualPrompts,
        metadata: {
          totalChapters: courseStructure.chapters.length,
          totalPrompts: visualPrompts.reduce((sum, chapter) => sum + chapter.prompts.length, 0),
          generatedAt: new Date().toISOString()
        }
      }

    } catch (error) {
      console.error('❌ Course Visual Prompts hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Bölüm için görsel prompt'lar üretir
   */
  async generateChapterVisualPrompts(chapter) {
    const prompts = []

    // Ana bölüm görseli
    const mainChapterPrompt = this.createMainChapterPrompt(chapter)
    prompts.push({
      id: `chapter-${chapter.id}-main`,
      type: 'main_topic',
      title: `${chapter.title} - Ana Konu`,
      prompt: mainChapterPrompt,
      description: 'Bölümün ana konusunu temsil eden görsel',
      size: '768x768'
    })

    // Her ders için görsel prompt'lar
    for (const lesson of chapter.lessons) {
      const lessonPrompts = this.generateLessonVisualPrompts(lesson, chapter)
      prompts.push(...lessonPrompts)
    }

    return prompts
  }

  /**
   * Ders için görsel prompt'lar üretir
   */
  generateLessonVisualPrompts(lesson, chapter) {
    const prompts = []

    // Ana ders görseli
    const mainLessonPrompt = this.createMainLessonPrompt(lesson, chapter)
    prompts.push({
      id: `lesson-${lesson.id}-main`,
      type: 'main_topic',
      title: `${lesson.title} - Ana Görsel`,
      prompt: mainLessonPrompt,
      description: 'Dersin ana konusunu temsil eden görsel',
      size: '768x768',
      lessonId: lesson.id
    })

    // Kavram diyagramı
    if (lesson.learningPoints && lesson.learningPoints.length > 0) {
      const conceptPrompt = this.createConceptDiagramPrompt(lesson, chapter)
      prompts.push({
        id: `lesson-${lesson.id}-concept`,
        type: 'concept_diagram',
        title: `${lesson.title} - Kavram Diyagramı`,
        prompt: conceptPrompt,
        description: 'Dersin kavramlarını gösteren diyagram',
        size: '1024x1024',
        lessonId: lesson.id
      })
    }

    // Örnek görsel
    const examplePrompt = this.createExamplePrompt(lesson, chapter)
    prompts.push({
      id: `lesson-${lesson.id}-example`,
      type: 'example',
      title: `${lesson.title} - Örnek Görsel`,
      prompt: examplePrompt,
      description: 'Dersin pratik örneğini gösteren görsel',
      size: '768x768',
      lessonId: lesson.id
    })

    return prompts
  }

  /**
   * Ana bölüm görseli için prompt oluşturur
   */
  createMainChapterPrompt(chapter) {
    return `Educational illustration of "${chapter.title}", clean design, no text, professional, modern, educational, concept visualization, high quality, detailed, suitable for learning materials, ${chapter.description ? `representing: ${chapter.description}` : ''}`
  }

  /**
   * Ana ders görseli için prompt oluşturur
   */
  createMainLessonPrompt(lesson, chapter) {
    const context = `Lesson: ${lesson.title} | Chapter: ${chapter.title}`
    const description = lesson.description || ''
    
    return `Educational illustration of "${lesson.title}", clean design, no text, professional, modern, educational, concept visualization, high quality, detailed, suitable for learning materials, ${context}, ${description}`
  }

  /**
   * Kavram diyagramı için prompt oluşturur
   */
  createConceptDiagramPrompt(lesson, chapter) {
    const learningPoints = lesson.learningPoints?.join(', ') || ''
    const context = `Concept diagram for: ${lesson.title}`
    
    return `Concept diagram, infographic style, visual learning, clean design, professional, educational, showing concepts: ${learningPoints}, ${context}, modern design, high quality, suitable for educational materials`
  }

  /**
   * Örnek görsel için prompt oluşturur
   */
  createExamplePrompt(lesson, chapter) {
    const context = `Practical example of: ${lesson.title}`
    const description = lesson.description || ''
    
    return `Practical example illustration, real-world application, clear visualization, educational, professional, modern design, ${context}, ${description}, high quality, suitable for learning materials`
  }

  /**
   * Görsel prompt'ları database'e kaydeder
   */
  async saveVisualPrompts(documentId, visualPrompts) {
    try {
      const { error } = await this.supabase
        .from('documents')
        .update({
          visual_prompts: visualPrompts,
          visual_prompts_generated_at: new Date().toISOString()
        })
        .eq('id', documentId)

      if (error) {
        throw new Error('Görsel prompt\'lar kaydedilemedi: ' + error.message)
      }

      console.log('✅ Görsel prompt\'lar kaydedildi:', documentId)
    } catch (error) {
      console.error('❌ Görsel prompt\'lar kaydetme hatası:', error)
      throw error
    }
  }

  /**
   * Görsel prompt'ları getirir
   */
  async getVisualPrompts(documentId) {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('visual_prompts, visual_prompts_generated_at')
        .eq('id', documentId)
        .single()

      if (error) {
        throw new Error('Görsel prompt\'lar alınamadı: ' + error.message)
      }

      return {
        success: true,
        data: {
          visualPrompts: data.visual_prompts || [],
          generatedAt: data.visual_prompts_generated_at
        }
      }
    } catch (error) {
      console.error('❌ Görsel prompt\'lar getirme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Görsel entegrasyonu test eder
   */
  async testVisualIntegration(documentId) {
    try {
      console.log('🧪 Course Visual Integration test ediliyor:', documentId)

      // 1. Kurs yapısını kontrol et
      const courseResult = await courseStructureService.getCourseStructure(documentId)
      if (!courseResult.success) {
        throw new Error('Kurs yapısı bulunamadı: ' + courseResult.error)
      }

      // 2. Görsel prompt'ları üret
      const promptsResult = await this.generateVisualPrompts(documentId)
      if (!promptsResult.success) {
        throw new Error('Görsel prompt\'lar üretilemedi: ' + promptsResult.error)
      }

      // 3. Sonuçları kontrol et
      const validationResult = this.validateVisualPrompts(promptsResult.visualPrompts)

      return {
        success: true,
        documentId,
        courseStructure: courseResult.data.courseStructure,
        visualPrompts: promptsResult.visualPrompts,
        validation: validationResult,
        metadata: {
          totalChapters: promptsResult.metadata.totalChapters,
          totalPrompts: promptsResult.metadata.totalPrompts,
          testCompletedAt: new Date().toISOString()
        }
      }

    } catch (error) {
      console.error('❌ Course Visual Integration test hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Görsel prompt'ları doğrular
   */
  validateVisualPrompts(visualPrompts) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    }

    if (!Array.isArray(visualPrompts)) {
      validation.isValid = false
      validation.errors.push('Visual prompts array değil')
      return validation
    }

    for (const chapterPrompt of visualPrompts) {
      if (!chapterPrompt.chapterId || !chapterPrompt.prompts) {
        validation.isValid = false
        validation.errors.push(`Chapter ${chapterPrompt.chapterId}: Eksik alanlar`)
        continue
      }

      if (!Array.isArray(chapterPrompt.prompts)) {
        validation.isValid = false
        validation.errors.push(`Chapter ${chapterPrompt.chapterId}: Prompts array değil`)
        continue
      }

      for (const prompt of chapterPrompt.prompts) {
        if (!prompt.id || !prompt.prompt || !prompt.type) {
          validation.isValid = false
          validation.errors.push(`Prompt ${prompt.id}: Eksik alanlar`)
        }

        if (prompt.prompt.length < 10) {
          validation.warnings.push(`Prompt ${prompt.id}: Çok kısa prompt`)
        }
      }
    }

    return validation
  }

  /**
   * Görsel prompt'ları optimize eder
   */
  optimizeVisualPrompts(visualPrompts) {
    const optimized = []

    for (const chapterPrompt of visualPrompts) {
      const optimizedChapter = {
        ...chapterPrompt,
        prompts: chapterPrompt.prompts.map(prompt => ({
          ...prompt,
          prompt: this.optimizePrompt(prompt.prompt)
        }))
      }
      optimized.push(optimizedChapter)
    }

    return optimized
  }

  /**
   * Tek bir prompt'u optimize eder
   */
  optimizePrompt(prompt) {
    // Gereksiz kelimeleri kaldır
    let optimized = prompt
      .replace(/\s+/g, ' ') // Fazla boşlukları temizle
      .replace(/,\s*,/g, ',') // Fazla virgülleri temizle
      .trim()

    // Prompt uzunluğunu kontrol et
    if (optimized.length > 500) {
      optimized = optimized.substring(0, 500) + '...'
    }

    return optimized
  }

  // ===== YENİ GÖRSEL ÜRETİM FONKSİYONLARI =====

  /**
   * Kurs için görselleri üretir (Image Worker entegrasyonu)
   * @param {string} documentId - Document ID
   * @returns {Object} Görsel üretim sonucu
   */
  async generateCourseImages(documentId) {
    try {
      console.log('🎨 Course görselleri üretiliyor:', documentId)

      // 1. Görsel prompt'ları al
      const promptsResult = await this.getVisualPrompts(documentId)
      if (!promptsResult.success) {
        throw new Error('Görsel prompt\'lar alınamadı: ' + promptsResult.error)
      }

      const visualPrompts = promptsResult.data.visualPrompts
      if (!visualPrompts || visualPrompts.length === 0) {
        throw new Error('Görsel prompt\'lar bulunamadı. Önce prompt\'ları üretin.')
      }

      // 2. Her bölüm için görselleri üret
      const generatedImages = []
      let totalImages = 0
      let successfulImages = 0

      for (const chapterPrompt of visualPrompts) {
        console.log(`📖 Bölüm görselleri üretiliyor: ${chapterPrompt.chapterTitle}`)
        
        const chapterImages = await this.generateChapterImages(chapterPrompt)
        generatedImages.push({
          chapterId: chapterPrompt.chapterId,
          chapterTitle: chapterPrompt.chapterTitle,
          images: chapterImages
        })

        totalImages += chapterImages.length
        successfulImages += chapterImages.filter(img => img.success).length
      }

      // 3. Görselleri database'e kaydet
      await this.saveCourseImages(documentId, generatedImages)

      return {
        success: true,
        documentId,
        generatedImages,
        metadata: {
          totalChapters: visualPrompts.length,
          totalImages: totalImages,
          successfulImages: successfulImages,
          successRate: totalImages > 0 ? Math.round((successfulImages / totalImages) * 100) : 0,
          generatedAt: new Date().toISOString()
        }
      }

    } catch (error) {
      console.error('❌ Course görsel üretim hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Bölüm için görselleri üretir
   * @param {Object} chapterPrompt - Bölüm prompt'ları
   * @returns {Array} Üretilen görseller
   */
  async generateChapterImages(chapterPrompt) {
    const chapterImages = []

    for (const prompt of chapterPrompt.prompts) {
      try {
        console.log(`🎨 Görsel üretiliyor: ${prompt.title}`)

        // Image Worker ile görsel üret
        const imageResult = await this.generateSingleImage(prompt)
        
        chapterImages.push({
          promptId: prompt.id,
          title: prompt.title,
          type: prompt.type,
          size: prompt.size,
          prompt: prompt.prompt,
          description: prompt.description,
          success: imageResult.success,
          imageUrl: imageResult.imageUrl,
          error: imageResult.error,
          metadata: imageResult.metadata
        })

        // API rate limit için bekleme
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`❌ Görsel üretim hatası: ${prompt.title}`, error)
        chapterImages.push({
          promptId: prompt.id,
          title: prompt.title,
          type: prompt.type,
          size: prompt.size,
          prompt: prompt.prompt,
          description: prompt.description,
          success: false,
          imageUrl: null,
          error: error.message,
          metadata: null
        })
      }
    }

    return chapterImages
  }

  /**
   * Tek bir görsel üretir
   * @param {Object} prompt - Görsel prompt'u
   * @returns {Object} Görsel üretim sonucu
   */
  async generateSingleImage(prompt) {
    try {
      // Prompt tipini Image Worker formatına çevir
      const imageType = this.mapPromptTypeToImageType(prompt.type)
      
      // Image Worker ile görsel üret
      const imageResult = await this.imageWorker.callStableDiffusionAPI(prompt.prompt, imageType)
      
      return {
        success: true,
        imageUrl: imageResult.image_url,
        metadata: {
          width: prompt.size.split('x')[0],
          height: prompt.size.split('x')[1],
          model: imageResult.model,
          generationTime: imageResult.generation_time,
          type: prompt.type
        }
      }

    } catch (error) {
      console.error('Tek görsel üretim hatası:', error)
      return {
        success: false,
        imageUrl: null,
        error: error.message,
        metadata: null
      }
    }
  }

  /**
   * Prompt tipini Image Worker tipine çevirir
   * @param {string} promptType - Prompt tipi
   * @returns {string} Image Worker tipi
   */
  mapPromptTypeToImageType(promptType) {
    const typeMap = {
      'main_topic': 'MAIN_TOPIC',
      'concept_diagram': 'CONCEPT_DIAGRAM',
      'example': 'EXAMPLE_IMAGE'
    }
    
    return typeMap[promptType] || 'MAIN_TOPIC'
  }

  /**
   * Kurs görsellerini database'e kaydeder
   * @param {string} documentId - Document ID
   * @param {Array} generatedImages - Üretilen görseller
   */
  async saveCourseImages(documentId, generatedImages) {
    try {
      const { error } = await this.supabase
        .from('documents')
        .update({
          course_images: generatedImages,
          course_images_generated_at: new Date().toISOString()
        })
        .eq('id', documentId)

      if (error) {
        throw new Error('Kurs görselleri kaydedilemedi: ' + error.message)
      }

      console.log('✅ Kurs görselleri kaydedildi:', documentId)
    } catch (error) {
      console.error('❌ Kurs görselleri kaydetme hatası:', error)
      throw error
    }
  }

  /**
   * Kurs görsellerini getirir
   * @param {string} documentId - Document ID
   * @returns {Object} Kurs görselleri
   */
  async getCourseImages(documentId) {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('course_images, course_images_generated_at')
        .eq('id', documentId)
        .single()

      if (error) {
        throw new Error('Kurs görselleri alınamadı: ' + error.message)
      }

      return {
        success: true,
        data: {
          courseImages: data.course_images || [],
          generatedAt: data.course_images_generated_at
        }
      }
    } catch (error) {
      console.error('❌ Kurs görselleri getirme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Tam Course Visual Integration test eder (prompt + görsel üretimi)
   * @param {string} documentId - Document ID
   * @returns {Object} Test sonucu
   */
  async testFullVisualIntegration(documentId) {
    try {
      console.log('🧪 Tam Course Visual Integration test ediliyor:', documentId)

      // 1. Görsel prompt'ları üret
      const promptsResult = await this.generateVisualPrompts(documentId)
      if (!promptsResult.success) {
        throw new Error('Görsel prompt\'lar üretilemedi: ' + promptsResult.error)
      }

      // 2. Görselleri üret
      const imagesResult = await this.generateCourseImages(documentId)
      if (!imagesResult.success) {
        throw new Error('Görseller üretilemedi: ' + imagesResult.error)
      }

      // 3. Sonuçları değerlendir
      const evaluation = this.evaluateVisualIntegration(promptsResult.visualPrompts, imagesResult.generatedImages)

      return {
        success: true,
        documentId,
        prompts: promptsResult.visualPrompts,
        images: imagesResult.generatedImages,
        evaluation: evaluation,
        metadata: {
          totalChapters: promptsResult.metadata.totalChapters,
          totalPrompts: promptsResult.metadata.totalPrompts,
          totalImages: imagesResult.metadata.totalImages,
          successfulImages: imagesResult.metadata.successfulImages,
          successRate: imagesResult.metadata.successRate,
          testCompletedAt: new Date().toISOString()
        }
      }

    } catch (error) {
      console.error('❌ Tam Course Visual Integration test hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Görsel entegrasyonu değerlendirir
   * @param {Array} prompts - Görsel prompt'ları
   * @param {Array} images - Üretilen görseller
   * @returns {Object} Değerlendirme sonucu
   */
  evaluateVisualIntegration(prompts, images) {
    const evaluation = {
      overallScore: 0,
      promptQuality: 0,
      imageQuality: 0,
      integrationQuality: 0,
      issues: [],
      recommendations: []
    }

    // Prompt kalitesi değerlendir
    let totalPromptLength = 0
    let validPrompts = 0
    
    for (const chapterPrompt of prompts) {
      for (const prompt of chapterPrompt.prompts) {
        totalPromptLength += prompt.prompt.length
        if (prompt.prompt.length > 20) validPrompts++
      }
    }
    
    evaluation.promptQuality = prompts.length > 0 ? Math.round((validPrompts / prompts.reduce((sum, cp) => sum + cp.prompts.length, 0)) * 100) : 0

    // Görsel kalitesi değerlendir
    let successfulImages = 0
    let totalImages = 0
    
    for (const chapterImage of images) {
      for (const image of chapterImage.images) {
        totalImages++
        if (image.success) successfulImages++
      }
    }
    
    evaluation.imageQuality = totalImages > 0 ? Math.round((successfulImages / totalImages) * 100) : 0

    // Entegrasyon kalitesi
    evaluation.integrationQuality = Math.round((evaluation.promptQuality + evaluation.imageQuality) / 2)

    // Genel skor
    evaluation.overallScore = evaluation.integrationQuality

    // Sorunları tespit et
    if (evaluation.promptQuality < 80) {
      evaluation.issues.push('Prompt kalitesi düşük')
      evaluation.recommendations.push('Prompt optimizasyonu yapılmalı')
    }

    if (evaluation.imageQuality < 80) {
      evaluation.issues.push('Görsel üretim başarı oranı düşük')
      evaluation.recommendations.push('API ayarları kontrol edilmeli')
    }

    if (prompts.length !== images.length) {
      evaluation.issues.push('Prompt ve görsel sayısı uyumsuz')
      evaluation.recommendations.push('Veri tutarlılığı kontrol edilmeli')
    }

    return evaluation
  }
}

export const courseVisualService = new CourseVisualService() 