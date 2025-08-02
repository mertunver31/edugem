import { genAI, MODELS } from './geminiService'
import { supabase } from '../config/supabase'
import { getCurrentUser } from './authService'

// Gemini Document Understanding Service
export class DocumentUnderstandingService {
  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: MODELS.DOCUMENT_UNDERSTANDING 
    })
  }

  // PDF dosyasını Gemini'ye yükle ve outline çıkar
  async extractDocumentOutline(documentId) {
    try {
      console.log('Document Understanding başlatılıyor...', documentId)
      
      // 1. Kullanıcı kontrolü
      const userResult = await getCurrentUser()
      if (!userResult.success || !userResult.user) {
        throw new Error('Kullanıcı girişi yapılmamış')
      }

      // 2. Edge Function'ı çağır
      console.log('Edge Function çağrılıyor...')
      const { data, error } = await supabase.functions.invoke('gemini_document_understanding', {
        body: {
          documentId: documentId,
          userId: userResult.user.id
        }
      })

      if (error) {
        console.error('Edge Function hatası:', error)
        throw new Error('Document Understanding işlemi başarısız: ' + error.message)
      }

      if (!data.success) {
        throw new Error(data.error || 'Document Understanding başarısız')
      }

      console.log('Document Understanding tamamlandı')
      return data

    } catch (error) {
      console.error('Document Understanding hatası:', error)
      
      // Database'e hata durumunu kaydet
      try {
        await supabase
          .from('documents')
          .update({
            status: 'outline_failed',
            error_message: error.message
          })
          .eq('id', documentId)
      } catch (dbError) {
        console.error('Error kaydetme hatası:', dbError)
      }

      return {
        success: false,
        error: error.message,
        documentId: documentId
      }
    }
  }



  // Rate limiting kontrolü
  async checkRateLimits() {
    // Basit rate limiting kontrolü
    // Gerçek uygulamada Redis veya database kullanılır
    return {
      canMakeRequest: true,
      remainingRequests: 60,
      resetTime: new Date(Date.now() + 60000)
    }
  }



  // Test fonksiyonu
  async testDocumentUnderstanding(documentId) {
    console.log('Document Understanding test başlatılıyor...')
    
    const result = await this.extractDocumentOutline(documentId)
    
    if (result.success) {
      console.log('✅ Document Understanding test başarılı')
      return true
    } else {
      console.log('❌ Document Understanding test başarısız:', result.error)
      return false
    }
  }
}

// Singleton instance
export const documentUnderstandingService = new DocumentUnderstandingService() 