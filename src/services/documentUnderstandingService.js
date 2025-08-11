import { extractDocumentOutline as geminiExtractDocumentOutline } from './geminiService';
import { supabase } from '../config/supabase';
import { getCurrentUser } from './authService';

// Gemini Document Understanding Service
export class DocumentUnderstandingService {
  constructor() {
    // Bu constructor artık boş olabilir çünkü model başlatma işlemi
    // gemini_proxy Edge Function içinde yapılıyor.
  }

  // PDF dosyasını Gemini'ye yükle ve outline çıkar
  async extractDocumentOutline(documentId) {
    try {
      console.log('Document Understanding başlatılıyor...', documentId);
      
      // 1. Kullanıcı kontrolü
      const userResult = await getCurrentUser();
      if (!userResult.success || !userResult.user) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      // 2. Belge URL'sini al
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('file_url')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        throw new Error('Belge bulunamadı veya URL alınamadı.');
      }
      
      // 3. geminiService üzerinden yeni proxy fonksiyonunu çağır
      console.log('geminiService aracılığıyla proxy çağrılıyor...');
      const result = await geminiExtractDocumentOutline(document.file_url);

      if (!result.success) {
        throw new Error(result.error || 'Document Understanding işlemi başarısız');
      }

      // Başarılı sonucu veritabanına kaydetme mantığı buraya eklenebilir,
      // ancak şimdilik bu sorumluluk proxy'de veya başka bir serviste olabilir.
      // Şimdilik sadece sonucu döndürüyoruz.

      console.log('Document Understanding tamamlandı');
      return { ...result, documentId: documentId };

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
      };
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
    
    const result = await this.extractDocumentOutline(documentId);
    
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
export const documentUnderstandingService = new DocumentUnderstandingService(); 