import { supabase } from '../config/supabase'

/**
 * Mind Map Service
 * Mind map CRUD işlemleri ve yönetimi
 */
class MindMapService {
  constructor() {
    this.tableName = 'mind_maps'
  }

  /**
   * Mind map oluştur
   * @param {Object} mindMapData - Mind map verileri
   * @returns {Object} Oluşturma sonucu
   */
  async createMindMap(mindMapData) {
    try {
      console.log('🧠 Mind map oluşturuluyor:', mindMapData.title)

      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          document_id: mindMapData.documentId,
          type: mindMapData.type || 'course_mindmap',
          title: mindMapData.title,
          central_topic: mindMapData.centralTopic,
          content: mindMapData.content,
          metadata: {
            ...mindMapData.metadata,
            created_at: new Date().toISOString(),
            model_used: mindMapData.modelUsed || 'gemini-1.5-flash'
          }
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('✅ Mind map oluşturuldu:', data.id)
      return {
        success: true,
        data: data,
        mindMapId: data.id
      }

    } catch (error) {
      console.error('❌ Mind map oluşturma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Document için mind map getir
   * @param {string} documentId - Document ID
   * @param {string} type - Mind map türü (opsiyonel)
   * @returns {Object} Mind map verisi
   */
  async getMindMap(documentId, type = null) {
    try {
      console.log('🔍 Mind map getiriliyor:', documentId, type)

      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('document_id', documentId)

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'Mind map bulunamadı'
        }
      }

      console.log('✅ Mind map getirildi:', data[0].id)
      return {
        success: true,
        data: data[0]
      }

    } catch (error) {
      console.error('❌ Mind map getirme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Mind map güncelle
   * @param {string} mindMapId - Mind map ID
   * @param {Object} updateData - Güncellenecek veriler
   * @returns {Object} Güncelleme sonucu
   */
  async updateMindMap(mindMapId, updateData) {
    try {
      console.log('🔄 Mind map güncelleniyor:', mindMapId)

      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...updateData,
          metadata: {
            ...updateData.metadata,
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', mindMapId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('✅ Mind map güncellendi:', data.id)
      return {
        success: true,
        data: data
      }

    } catch (error) {
      console.error('❌ Mind map güncelleme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Mind map sil
   * @param {string} mindMapId - Mind map ID
   * @returns {Object} Silme sonucu
   */
  async deleteMindMap(mindMapId) {
    try {
      console.log('🗑️ Mind map siliniyor:', mindMapId)

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', mindMapId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('✅ Mind map silindi:', mindMapId)
      return {
        success: true
      }

    } catch (error) {
      console.error('❌ Mind map silme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Document için tüm mind map'leri getir
   * @param {string} documentId - Document ID
   * @returns {Object} Mind map listesi
   */
  async getAllMindMaps(documentId) {
    try {
      console.log('📋 Tüm mind map\'ler getiriliyor:', documentId)

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('✅ Mind map\'ler getirildi:', data.length)
      return {
        success: true,
        data: data,
        count: data.length
      }

    } catch (error) {
      console.error('❌ Mind map listesi getirme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Mind map istatistikleri
   * @param {string} documentId - Document ID
   * @returns {Object} İstatistikler
   */
  async getMindMapStats(documentId) {
    try {
      console.log('📊 Mind map istatistikleri getiriliyor:', documentId)

      const { data, error } = await supabase
        .from(this.tableName)
        .select('type, created_at, metadata')
        .eq('document_id', documentId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const stats = {
        total: data.length,
        byType: {},
        recentGeneration: null
      }

      data.forEach(mindMap => {
        // Type bazında sayım
        stats.byType[mindMap.type] = (stats.byType[mindMap.type] || 0) + 1

        // En son generation
        if (!stats.recentGeneration || new Date(mindMap.created_at) > new Date(stats.recentGeneration)) {
          stats.recentGeneration = mindMap.created_at
        }
      })

      console.log('✅ Mind map istatistikleri getirildi')
      return {
        success: true,
        data: stats
      }

    } catch (error) {
      console.error('❌ Mind map istatistikleri hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new MindMapService() 