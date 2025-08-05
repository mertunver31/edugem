import { supabase } from '../config/supabase'

/**
 * Learning Path Service
 * Learning path CRUD işlemleri ve yönetimi
 */
class LearningPathService {
  constructor() {
    this.tableName = 'learning_paths'
  }

  /**
   * Learning path oluştur
   * @param {Object} learningPathData - Learning path verileri
   * @returns {Object} Oluşturma sonucu
   */
  async createLearningPath(learningPathData) {
    try {
      console.log('🛤️ Learning path oluşturuluyor:', learningPathData.title)

      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          document_id: learningPathData.documentId,
          title: learningPathData.title,
          description: learningPathData.description,
          steps: learningPathData.steps,
          estimated_duration: learningPathData.estimatedDuration,
          difficulty_level: learningPathData.difficultyLevel || 'intermediate',
          prerequisites: learningPathData.prerequisites || [],
          metadata: {
            ...learningPathData.metadata,
            created_at: new Date().toISOString(),
            model_used: learningPathData.modelUsed || 'gemini-1.5-flash'
          }
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('✅ Learning path oluşturuldu:', data.id)
      return {
        success: true,
        data: data,
        learningPathId: data.id
      }

    } catch (error) {
      console.error('❌ Learning path oluşturma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Document için learning path getir
   * @param {string} documentId - Document ID
   * @returns {Object} Learning path verisi
   */
  async getLearningPath(documentId) {
    try {
      console.log('🔍 Learning path getiriliyor:', documentId)

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'Learning path bulunamadı'
        }
      }

      console.log('✅ Learning path getirildi:', data[0].id)
      return {
        success: true,
        data: data[0]
      }

    } catch (error) {
      console.error('❌ Learning path getirme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Learning path güncelle
   * @param {string} learningPathId - Learning path ID
   * @param {Object} updateData - Güncellenecek veriler
   * @returns {Object} Güncelleme sonucu
   */
  async updateLearningPath(learningPathId, updateData) {
    try {
      console.log('🔄 Learning path güncelleniyor:', learningPathId)

      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...updateData,
          metadata: {
            ...updateData.metadata,
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', learningPathId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('✅ Learning path güncellendi:', data.id)
      return {
        success: true,
        data: data
      }

    } catch (error) {
      console.error('❌ Learning path güncelleme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Learning path sil
   * @param {string} learningPathId - Learning path ID
   * @returns {Object} Silme sonucu
   */
  async deleteLearningPath(learningPathId) {
    try {
      console.log('🗑️ Learning path siliniyor:', learningPathId)

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', learningPathId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('✅ Learning path silindi:', learningPathId)
      return {
        success: true
      }

    } catch (error) {
      console.error('❌ Learning path silme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Document için tüm learning path'leri getir
   * @param {string} documentId - Document ID
   * @returns {Object} Learning path listesi
   */
  async getAllLearningPaths(documentId) {
    try {
      console.log('📋 Tüm learning path\'ler getiriliyor:', documentId)

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('✅ Learning path\'ler getirildi:', data.length)
      return {
        success: true,
        data: data,
        count: data.length
      }

    } catch (error) {
      console.error('❌ Learning path listesi getirme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Learning path istatistikleri
   * @param {string} documentId - Document ID
   * @returns {Object} İstatistikler
   */
  async getLearningPathStats(documentId) {
    try {
      console.log('📊 Learning path istatistikleri getiriliyor:', documentId)

      const { data, error } = await supabase
        .from(this.tableName)
        .select('difficulty_level, estimated_duration, created_at, metadata')
        .eq('document_id', documentId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const stats = {
        total: data.length,
        byDifficulty: {},
        averageDuration: null,
        recentGeneration: null
      }

      let totalDuration = 0
      let durationCount = 0

      data.forEach(learningPath => {
        // Difficulty bazında sayım
        stats.byDifficulty[learningPath.difficulty_level] = 
          (stats.byDifficulty[learningPath.difficulty_level] || 0) + 1

        // Duration hesaplama (basit parsing)
        if (learningPath.estimated_duration) {
          const duration = learningPath.estimated_duration
          const hoursMatch = duration.match(/(\d+)/)
          if (hoursMatch) {
            totalDuration += parseInt(hoursMatch[1])
            durationCount++
          }
        }

        // En son generation
        if (!stats.recentGeneration || new Date(learningPath.created_at) > new Date(stats.recentGeneration)) {
          stats.recentGeneration = learningPath.created_at
        }
      })

      if (durationCount > 0) {
        stats.averageDuration = Math.round(totalDuration / durationCount)
      }

      console.log('✅ Learning path istatistikleri getirildi')
      return {
        success: true,
        data: stats
      }

    } catch (error) {
      console.error('❌ Learning path istatistikleri hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Learning path step'lerini analiz et
   * @param {string} learningPathId - Learning path ID
   * @returns {Object} Step analizi
   */
  async analyzeLearningPathSteps(learningPathId) {
    try {
      console.log('📈 Learning path step analizi:', learningPathId)

      const { data, error } = await supabase
        .from(this.tableName)
        .select('steps, estimated_duration, difficulty_level')
        .eq('id', learningPathId)
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      if (!data) {
        return {
          success: false,
          error: 'Learning path bulunamadı'
        }
      }

      const steps = data.steps || []
      const analysis = {
        totalSteps: steps.length,
        stepDetails: steps.map((step, index) => ({
          stepNumber: step.step || index + 1,
          title: step.title,
          duration: step.duration,
          objectives: step.objectives?.length || 0,
          activities: step.activities?.length || 0,
          prerequisites: step.prerequisites?.length || 0
        })),
        totalObjectives: steps.reduce((sum, step) => sum + (step.objectives?.length || 0), 0),
        totalActivities: steps.reduce((sum, step) => sum + (step.activities?.length || 0), 0),
        averageStepDuration: steps.length > 0 ? 
          steps.reduce((sum, step) => {
            const duration = step.duration
            const hoursMatch = duration?.match(/(\d+)/)
            return sum + (hoursMatch ? parseInt(hoursMatch[1]) : 0)
          }, 0) / steps.length : 0
      }

      console.log('✅ Learning path analizi tamamlandı')
      return {
        success: true,
        data: analysis
      }

    } catch (error) {
      console.error('❌ Learning path analizi hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new LearningPathService() 