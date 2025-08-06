import { GoogleGenerativeAI } from '@google/generative-ai'

// Gemini API Konfigürasyonu
const GEMINI_API_KEY = 'AIzaSyBEmpNEoDdPWAUnQxgDguPHygn8MuNlU-M'

// Gemini client oluştur
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

// Kullanılacak modeller
const MODELS = {
  DOCUMENT_UNDERSTANDING: 'gemini-2.5-flash-lite',
  TEXT_GENERATION: 'gemini-2.5-flash-lite',
  VISUAL_GENERATION: 'gemini-2.0-flash-preview-image-generation'
}

// Rate limiting ayarları (gemini-2.5-flash-lite için)
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
    console.log('Document Understanding başlatılıyor...')
    
    const model = genAI.getGenerativeModel({ 
      model: MODELS.DOCUMENT_UNDERSTANDING 
    })
    
    // PDF dosyasını yükle
    const fileData = {
      mimeType: 'application/pdf',
      uri: fileUrl
    }
    
    const prompt = `
    Bu PDF dosyasının yapısını analiz et ve JSON formatında döndür:
    
    {
      "title": "PDF başlığı",
      "author": "Yazar bilgisi",
      "total_pages": sayfa_sayısı,
      "headings": [
        {
          "text": "Başlık metni",
          "page": sayfa_numarası,
          "level": başlık_seviyesi
        }
      ],
      "sections": [
        {
          "title": "Bölüm başlığı",
          "start_page": başlangıç_sayfası,
          "end_page": bitiş_sayfası,
          "content_type": "text|image|table|mixed"
        }
      ]
    }
    
    Sadece JSON döndür, başka açıklama ekleme.
    `
    
    const result = await model.generateContent([
      prompt,
      fileData
    ])
    
    const response = await result.response
    const text = response.text()
    
    console.log('Document Understanding tamamlandı')
    
    // JSON parse et
    try {
      const outline = JSON.parse(text)
      return {
        success: true,
        outline: outline,
        rawResponse: text
      }
    } catch (parseError) {
      console.error('JSON parse hatası:', parseError)
      return {
        success: false,
        error: 'JSON parse hatası',
        rawResponse: text
      }
    }
    
  } catch (error) {
    console.error('Document Understanding hatası:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Gemini Text Generation
export const generateTextContent = async (prompt, context = '') => {
  try {
    console.log('Text generation başlatılıyor...')
    
    const model = genAI.getGenerativeModel({ 
      model: MODELS.TEXT_GENERATION 
    })
    
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
    
    // JSON formatında yanıt vermemesi için ek talimat ekle
    const enhancedPrompt = `${fullPrompt}\n\nÖNEMLİ: Yanıtını sadece düz metin olarak ver, JSON formatında verme. Sadece doğrudan yanıtını yaz.`
    
    const result = await model.generateContent(enhancedPrompt)
    const response = await result.response
    const text = response.text()
    
    console.log('Text generation tamamlandı')
    
    // Eğer yanıt JSON formatında ise, sadece content kısmını al
    let cleanText = text
    try {
      const jsonResponse = JSON.parse(text)
      if (jsonResponse.content) {
        cleanText = jsonResponse.content
      }
    } catch (parseError) {
      // JSON parse edilemezse, orijinal text'i kullan
      cleanText = text
    }
    
    return {
      success: true,
      content: cleanText,
      tokens: estimateTokens(cleanText)
    }
    
  } catch (error) {
    console.error('Text generation hatası:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Gemini Visual Generation
export const generateVisualContent = async (prompt, context = '') => {
  try {
    console.log('Visual generation başlatılıyor...')
    
    const model = genAI.getGenerativeModel({ 
      model: MODELS.VISUAL_GENERATION 
    })
    
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
    
    const result = await model.generateContent([
      fullPrompt
    ], {
      generationConfig: {
        responseMimeType: 'image/png'
      }
    })
    
    const response = await result.response
    const imageData = response.candidates[0].content.parts[0].inlineData
    
    console.log('Visual generation tamamlandı')
    
    return {
      success: true,
      imageData: imageData,
      mimeType: 'image/png'
    }
    
  } catch (error) {
    console.error('Visual generation hatası:', error)
    return {
      success: false,
      error: error.message
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
    console.log('Gemini API bağlantısı test ediliyor...')
    
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
    console.log('Gemini generateContent çağrılıyor...')
    
    const model = genAI.getGenerativeModel({ 
      model: options.model || MODELS.TEXT_GENERATION 
    })
    
    const generationConfig = {
      maxOutputTokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7
    }
    
    // PDF içeriği varsa PDF ile birlikte gönder
    if (options.pdfContent) {
      console.log('📄 PDF içeriği ile generateContent çağrılıyor...')
      
      // PDF boyutunu kontrol et (20MB limit)
      const pdfSizeInBytes = Math.ceil((options.pdfContent.length * 3) / 4)
      const pdfSizeInMB = pdfSizeInBytes / (1024 * 1024)
      
      console.log(`📊 PDF boyutu: ${pdfSizeInMB.toFixed(2)} MB`)
      
      if (pdfSizeInMB > 20) {
        console.warn('⚠️ PDF çok büyük, text-only mode\'a geçiliyor...')
        throw new Error('PDF boyutu çok büyük')
      }
      
      try {
        // PDF zaten base64 formatında, direkt kullan
        const result = await model.generateContent([
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: options.pdfContent
            }
          }
        ], { generationConfig })
        
        const response = await result.response
        const text = response.text()
        
        console.log('✅ Gemini generateContent (PDF ile) başarılı')
        
        return {
          success: true,
          data: text,
          tokens: estimateTokens(text)
        }
      } catch (pdfError) {
        console.error('❌ PDF işleme hatası:', pdfError)
        // PDF işleme başarısız olursa normal text generation'a geç
        console.log('🔄 PDF olmadan normal text generation deneniyor...')
        
        // PDF'den text çıkarmaya çalış
        try {
          const pdfText = await extractTextFromPDF(options.pdfContent)
          const enhancedPrompt = `${prompt}\n\nPDF İÇERİĞİ:\n${pdfText}`
          
          const result = await model.generateContent(enhancedPrompt, { generationConfig })
          const response = await result.response
          const text = response.text()
          
          console.log('✅ Gemini generateContent (PDF text ile) başarılı')
          
          return {
            success: true,
            data: text,
            tokens: estimateTokens(text)
          }
        } catch (textError) {
          console.error('❌ PDF text çıkarma hatası:', textError)
          // Son çare: sadece prompt ile
          const result = await model.generateContent(prompt, { generationConfig })
          const response = await result.response
          const text = response.text()
          
          console.log('✅ Gemini generateContent (text only) başarılı')
          
          return {
            success: true,
            data: text,
            tokens: estimateTokens(text)
          }
        }
      }
    } else {
      // Normal text generation
      const result = await model.generateContent(prompt, { generationConfig })
      const response = await result.response
      const text = response.text()
      
      console.log('✅ Gemini generateContent başarılı')
      
      return {
        success: true,
        data: text,
        tokens: estimateTokens(text)
      }
    }
    
  } catch (error) {
    console.error('❌ Gemini generateContent hatası:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export {
  genAI,
  MODELS,
  RATE_LIMITS
} 