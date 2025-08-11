import { supabase } from '../config/supabase';

// Kullanılacak modeller
const MODELS = {
  DOCUMENT_UNDERSTANDING: 'gemini-1.5-flash-latest',
  TEXT_GENERATION: 'gemini-1.5-flash-latest',
  VISUAL_GENERATION: 'gemini-1.5-flash-latest'
}

// Rate limiting ayarları (gemini-1.5-flash-latest için)
const RATE_LIMITS = {
  REQUESTS_PER_MINUTE: 15,  // 15 RPM
  REQUESTS_PER_DAY: 1000,   // 1000 RPD
  TOKENS_PER_REQUEST: 250000 // 250k TPM
}

// PDF Chunking Algoritması
export const createPDFChunks = (totalPages, chunkSize = 20) => {
  console.log(`PDF chunking başlatılıyor: ${totalPages} sayfa, ${chunkSize} sayfa/chunk`)
  
  const chunks = []
  
  for (let i = 0; i < totalPages; i += chunkSize) {
    const startPage = i + 1
    const endPage = Math.min(i + chunkSize, totalPages)
    
    chunks.push({
      id: `chunk_${chunks.length + 1}`,
      start: startPage,
      end: endPage,
      size: endPage - startPage + 1,
      overlap: i > 0 ? 2 : 0 // İlk chunk hariç 2 sayfa overlap
    })
  }
  
  console.log(`${chunks.length} chunk oluşturuldu:`, chunks)
  return chunks
}

// Token hesaplama (yaklaşık)
export const estimateTokens = (text) => {
  // 4 karakter ≈ 1 token (yaklaşık)
  return Math.ceil(text.length / 4)
}

// PDF'den text çıkarma
export const extractTextFromPDF = async (base64PDF) => {
  try {
    console.log('📄 PDF\'den text çıkarılıyor...')
    
    // PDF.js kullanarak text çıkar
    const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf']
    if (!pdfjsLib) {
      throw new Error('PDF.js kütüphanesi yüklenmedi')
    }
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    
    // Base64'ten ArrayBuffer'a çevir
    const binaryString = atob(base64PDF)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
    
    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(' ')
      fullText += pageText + '\n'
    }
    
    console.log('✅ PDF text çıkarıldı, uzunluk:', fullText.length)
    return fullText
    
  } catch (error) {
    console.error('❌ PDF text çıkarma hatası:', error)
    throw error
  }
}

// Gemini Document Understanding
export const extractDocumentOutline = async (fileUrl) => {
  try {
    console.log('Document Understanding başlatılıyor (via Supabase)...');
    
    const { data, error } = await supabase.functions.invoke('gemini_proxy', {
      body: {
        endpoint: 'extractDocumentOutline',
        fileUrl: fileUrl,
      }
    });

    if (error) throw error;

    console.log('Document Understanding tamamlandı');
    return data;
    
  } catch (error) {
    console.error('Document Understanding hatası:', error);
    return {
      success: false,
      error: error.message || (error.context ? error.context.message : 'Bilinmeyen bir hata oluştu.')
    };
  }
}

// Gemini Text Generation
export const generateTextContent = async (prompt, context = '') => {
  try {
    console.log('Text generation başlatılıyor (via Supabase)...');

    const { data, error } = await supabase.functions.invoke('gemini_proxy', {
      body: {
        endpoint: 'generateTextContent',
        prompt: prompt,
        context: context
      }
    });
    
    if (error) throw error;

    console.log('Text generation tamamlandı');
    return data;

  } catch (error) {
    console.error('Text generation hatası:', error);
    return {
      success: false,
      error: error.message || (error.context ? error.context.message : 'Bilinmeyen bir hata oluştu.')
    };
  }
}

// Gemini Visual Generation
export const generateVisualContent = async (prompt, context = '') => {
  try {
    console.log('Visual generation başlatılıyor (via Supabase)...');

    const { data, error } = await supabase.functions.invoke('gemini_proxy', {
      body: {
        endpoint: 'generateVisualContent',
        prompt: prompt,
        context: context
      }
    });

    if (error) throw error;

    console.log('Visual generation tamamlandı');
    return data;

  } catch (error) {
    console.error('Visual generation hatası:', error);
    return {
      success: false,
      error: error.message || (error.context ? error.context.message : 'Bilinmeyen bir hata oluştu.')
    }
  }
}

// Rate limiting kontrolü
export const checkRateLimits = () => {
  // Basit rate limiting kontrolü
  // Gerçek uygulamada Redis veya database kullanılır
  return {
    canMakeRequest: true,
    remainingRequests: RATE_LIMITS.REQUESTS_PER_MINUTE,
    resetTime: new Date(Date.now() + 60000) // 1 dakika sonra
  }
}

// Test fonksiyonu
export const testGeminiConnection = async () => {
  try {
    console.log('Gemini API bağlantısı test ediliyor (via Supabase)...')
    
    const result = await generateTextContent('Merhaba, bu bir test mesajıdır.')
    
    if (result.success) {
      console.log('✅ Gemini API bağlantısı başarılı')
      return true
    } else {
      console.log('❌ Gemini API bağlantısı başarısız:', result.error)
      return false
    }
    
  } catch (error) {
    console.error('❌ Gemini API test hatası:', error)
    return false
  }
}

// Default export için generateContent fonksiyonu
export const generateContent = async (prompt, options = {}) => {
  try {
    console.log('Gemini generateContent çağrılıyor (via Supabase)...');

    const { data, error } = await supabase.functions.invoke('gemini_proxy', {
        body: {
            endpoint: 'generateContent',
            prompt: prompt,
            options: options
        }
    });

    if (error) throw error;

    console.log('✅ Gemini generateContent başarılı');
    return data;

  } catch (error) {
    console.error('❌ Gemini generateContent hatası:', error);
    return {
      success: false,
      error: error.message || (error.context ? error.context.message : 'Bilinmeyen bir hata oluştu.')
    }
  }
}

export {
  MODELS,
  RATE_LIMITS
} 