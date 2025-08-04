import { supabase } from '../config/supabase'

// PDF.js için worker yolu - CORS sorununu çözmek için
import * as pdfjsLib from 'pdfjs-dist'

// Worker'ı local olarak yükle (CORS sorunu olmaz)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

// Tesseract.js için OCR
import { createWorker } from 'tesseract.js'

/**
 * PDF Text Extraction Service
 * PDF'den metin, görsel ve tablo içeriklerini çıkarır
 */
class PDFTextExtractionService {
  constructor() {
    this.supportedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp']
  }

  /**
   * PDF'den tüm içeriği çıkar (metin, görsel, tablo)
   * @param {File} pdfFile - PDF dosyası
   * @param {number} startPage - Başlangıç sayfası (1-based)
   * @param {number} endPage - Bitiş sayfası (1-based)
   * @returns {Object} Çıkarılan içerik
   */
  async extractContentFromPDF(pdfFile, startPage = 1, endPage = null) {
    try {
      console.log(`PDF içerik çıkarma başlatılıyor: ${pdfFile.name}, Sayfa ${startPage}-${endPage || 'son'}`)

      // PDF dosyasını ArrayBuffer'a çevir
      const arrayBuffer = await pdfFile.arrayBuffer()
      
      // PDF.js ile yükle
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      // Sayfa aralığını belirle
      const totalPages = pdf.numPages
      const actualEndPage = endPage || totalPages
      
      console.log(`PDF yüklendi: ${totalPages} sayfa, işlenecek: ${startPage}-${actualEndPage}`)

      const extractedContent = {
        text: '',
        images: [],
        tables: [],
        metadata: {
          totalPages: totalPages,
          processedPages: actualEndPage - startPage + 1,
          startPage: startPage,
          endPage: actualEndPage,
          fileName: pdfFile.name,
          fileSize: pdfFile.size
        }
      }

      // Her sayfayı işle
      for (let pageNum = startPage; pageNum <= actualEndPage; pageNum++) {
        console.log(`Sayfa ${pageNum} işleniyor...`)
        
        const page = await pdf.getPage(pageNum)
        const pageContent = await this.extractPageContent(page, pageNum)
        
        // İçerikleri birleştir
        extractedContent.text += `\n\n--- SAYFA ${pageNum} ---\n\n${pageContent.text}`
        extractedContent.images.push(...pageContent.images)
        extractedContent.tables.push(...pageContent.tables)
      }

      console.log(`PDF içerik çıkarma tamamlandı: ${extractedContent.text.length} karakter metin, ${extractedContent.images.length} görsel, ${extractedContent.tables.length} tablo`)
      
      return {
        success: true,
        data: extractedContent
      }

    } catch (error) {
      console.error('PDF içerik çıkarma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Tek sayfadan içerik çıkar
   * @param {Object} page - PDF sayfası
   * @param {number} pageNum - Sayfa numarası
   * @returns {Object} Sayfa içeriği
   */
  async extractPageContent(page, pageNum) {
    const pageContent = {
      text: '',
      images: [],
      tables: []
    }

    try {
      // 1. Metin çıkar
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      pageContent.text = pageText

      // 2. Görselleri çıkar
      const images = await this.extractImagesFromPage(page, pageNum)
      pageContent.images = images

      // 3. Tabloları tespit et
      const tables = this.detectTablesFromText(pageText, pageNum)
      pageContent.tables = tables

    } catch (error) {
      console.error(`Sayfa ${pageNum} işleme hatası:`, error)
    }

    return pageContent
  }

  /**
   * Sayfadan görselleri çıkar
   * @param {Object} page - PDF sayfası
   * @param {number} pageNum - Sayfa numarası
   * @returns {Array} Görsel listesi
   */
  async extractImagesFromPage(page, pageNum) {
    const images = []
    
    try {
      // Sayfa operatörlerini al
      const ops = await page.getOperatorList()
      
      // Görsel operatörlerini bul
      for (let i = 0; i < ops.fnArray.length; i++) {
        if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
          const imageName = ops.argsArray[i][0]
          
          try {
            // Görsel objesini al - daha güvenli yöntem
            const image = await page.objs.get(imageName)
            
            if (image && image.data) {
              // Canvas'a çiz
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              
              canvas.width = image.width
              canvas.height = image.height
              
              const imageData = ctx.createImageData(image.width, image.height)
              imageData.data.set(image.data)
              ctx.putImageData(imageData, 0, 0)
              
              // Base64'e çevir
              const base64 = canvas.toDataURL('image/png')
              
              images.push({
                pageNum: pageNum,
                imageName: imageName,
                width: image.width,
                height: image.height,
                base64: base64,
                type: 'png'
              })
            }
          } catch (imgError) {
            // Görsel çıkarılamadıysa, en azından varlığını kaydet
            console.warn(`Görsel ${imageName} çıkarılamadı, varlığı kaydediliyor:`, imgError)
            images.push({
              pageNum: pageNum,
              imageName: imageName,
              width: 0,
              height: 0,
              base64: null,
              type: 'unknown',
              error: imgError.message,
              exists: true
            })
          }
        }
      }
      
      // Alternatif yöntem: Sayfa görüntüsü olarak çıkar
      if (images.length === 0) {
        try {
          const viewport = page.getViewport({ scale: 1.0 })
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          canvas.width = viewport.width
          canvas.height = viewport.height
          
          await page.render({
            canvasContext: ctx,
            viewport: viewport
          }).promise
          
          const base64 = canvas.toDataURL('image/png')
          
          images.push({
            pageNum: pageNum,
            imageName: `page_${pageNum}_screenshot`,
            width: viewport.width,
            height: viewport.height,
            base64: base64,
            type: 'png',
            isScreenshot: true
          })
          
          console.log(`Sayfa ${pageNum} görüntüsü alındı`)
        } catch (screenshotError) {
          console.warn(`Sayfa ${pageNum} görüntüsü alınamadı:`, screenshotError)
        }
      }
    } catch (error) {
      console.error(`Sayfa ${pageNum} görsel çıkarma hatası:`, error)
    }

    return images
  }

  /**
   * Metinden tabloları tespit et
   * @param {string} text - Sayfa metni
   * @param {number} pageNum - Sayfa numarası
   * @returns {Array} Tablo listesi
   */
  detectTablesFromText(text, pageNum) {
    const tables = []
    
    try {
      // Satırları böl
      const lines = text.split('\n').filter(line => line.trim())
      
      // Gelişmiş tablo pattern'leri
      const tablePatterns = [
        /\|\s*[^|]+\s*\|/g,  // | sütun | sütun |
        /\t+/g,              // Tab ile ayrılmış
        /\s{3,}/g,           // 3+ boşluk ile ayrılmış
        /^[A-Za-z0-9\s]+\s+[A-Za-z0-9\s]+\s+[A-Za-z0-9\s]+$/g, // 3+ sütunlu düzenli metin
        /^[0-9]+\s+[A-Za-z0-9\s]+\s+[A-Za-z0-9\s]+$/g, // Sayı ile başlayan satırlar
        /^[A-Za-z]+\s+[0-9]+\s+[A-Za-z0-9\s]+$/g // Harf + sayı + metin
      ]
      
      let currentTable = null
      let tableLines = []
      let consecutiveTableRows = 0
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const isTableRow = tablePatterns.some(pattern => pattern.test(line))
        
        if (isTableRow) {
          consecutiveTableRows++
          if (!currentTable) {
            currentTable = {
              pageNum: pageNum,
              startLine: i + 1,
              headers: [],
              rows: [],
              confidence: 0
            }
          }
          tableLines.push(line)
        } else {
          // Tablo bitti, işle
          if (currentTable && tableLines.length > 0 && consecutiveTableRows >= 2) {
            currentTable.endLine = i
            currentTable.rawData = tableLines
            currentTable.confidence = Math.min(consecutiveTableRows / 10, 1) // Güven skoru
            currentTable = this.parseTableData(currentTable)
            tables.push(currentTable)
            
            currentTable = null
            tableLines = []
            consecutiveTableRows = 0
          } else if (currentTable && tableLines.length > 0) {
            // Tek satırlık tablo da kaydet
            currentTable.endLine = i
            currentTable.rawData = tableLines
            currentTable.confidence = 0.5
            currentTable = this.parseTableData(currentTable)
            tables.push(currentTable)
            
            currentTable = null
            tableLines = []
            consecutiveTableRows = 0
          }
        }
      }
      
      // Son tabloyu işle
      if (currentTable && tableLines.length > 0) {
        currentTable.endLine = lines.length
        currentTable.rawData = tableLines
        currentTable.confidence = Math.min(consecutiveTableRows / 10, 1)
        currentTable = this.parseTableData(currentTable)
        tables.push(currentTable)
      }
      
      // Eğer hiç tablo bulunamadıysa, potansiyel tablo alanlarını ara
      if (tables.length === 0) {
        const potentialTables = this.findPotentialTableAreas(lines, pageNum)
        tables.push(...potentialTables)
      }
      
    } catch (error) {
      console.error(`Sayfa ${pageNum} tablo tespit hatası:`, error)
    }

    return tables
  }

  findPotentialTableAreas(lines, pageNum) {
    const potentialTables = []
    
    try {
      // Sayısal veri içeren satırları ara
      const numericPattern = /^[0-9]+\s+[A-Za-z0-9\s]+$/
      const numericLines = lines.filter(line => numericPattern.test(line))
      
      if (numericLines.length >= 3) {
        potentialTables.push({
          pageNum: pageNum,
          startLine: 1,
          endLine: lines.length,
          rawData: numericLines,
          headers: ['Sıra', 'İçerik'],
          rows: numericLines.map(line => {
            const parts = line.split(/\s+/)
            return [parts[0], parts.slice(1).join(' ')]
          }),
          summary: {
            columnCount: 2,
            rowCount: numericLines.length,
            hasHeaders: false
          },
          confidence: 0.7,
          type: 'numeric_list'
        })
      }
      
      // Başlık + içerik formatını ara
      const titleContentPattern = /^[A-Z][A-Za-z\s]+\s*:\s*[A-Za-z0-9\s]+$/
      const titleContentLines = lines.filter(line => titleContentPattern.test(line))
      
      if (titleContentLines.length >= 2) {
        potentialTables.push({
          pageNum: pageNum,
          startLine: 1,
          endLine: lines.length,
          rawData: titleContentLines,
          headers: ['Başlık', 'İçerik'],
          rows: titleContentLines.map(line => {
            const parts = line.split(/\s*:\s*/)
            return [parts[0], parts[1] || '']
          }),
          summary: {
            columnCount: 2,
            rowCount: titleContentLines.length,
            hasHeaders: false
          },
          confidence: 0.6,
          type: 'title_content'
        })
      }
      
    } catch (error) {
      console.error(`Potansiyel tablo alanları tespit hatası:`, error)
    }
    
    return potentialTables
  }

  /**
   * Ham tablo verisini yapılandır
   * @param {Object} table - Ham tablo verisi
   * @returns {Object} Yapılandırılmış tablo
   */
  parseTableData(table) {
    try {
      if (!table.rawData || table.rawData.length === 0) {
        return table
      }

      // İlk satırı header olarak al
      const headerLine = table.rawData[0]
      table.headers = this.parseTableRow(headerLine)
      
      // Diğer satırları data olarak al
      table.rows = table.rawData.slice(1).map(line => this.parseTableRow(line))
      
      // Tablo özeti
      table.summary = {
        columnCount: table.headers.length,
        rowCount: table.rows.length,
        hasHeaders: table.headers.length > 0
      }

    } catch (error) {
      console.error('Tablo verisi parse hatası:', error)
    }

    return table
  }

  /**
   * Tablo satırını parse et
   * @param {string} line - Tablo satırı
   * @returns {Array} Hücre listesi
   */
  parseTableRow(line) {
    // Farklı ayırıcıları dene
    const separators = ['|', '\t', '  ']
    
    for (const separator of separators) {
      if (line.includes(separator)) {
        return line.split(separator)
          .map(cell => cell.trim())
          .filter(cell => cell.length > 0)
      }
    }
    
    // Ayırıcı bulunamazsa tek hücre olarak döndür
    return [line.trim()]
  }

  /**
   * Segment için PDF içeriği çıkar
   * @param {string} documentId - Document ID
   * @param {Array} segmentIds - Segment ID'leri
   * @returns {Object} Segment içerikleri
   */
  async extractSegmentContent(documentId, segmentIds) {
    try {
      console.log(`Segment içerik çıkarma başlatılıyor: ${segmentIds.length} segment`)

      // Segment bilgilerini al
      const { data: segments, error } = await supabase
        .from('segments')
        .select('*')
        .in('id', segmentIds)
        .order('seg_no', { ascending: true })

      if (error) {
        throw new Error(`Segment bilgileri alınamadı: ${error.message}`)
      }

      // Document bilgilerini al
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (docError) {
        throw new Error(`Document bilgileri alınamadı: ${docError.message}`)
      }

      console.log('Document bilgileri:', {
        id: document.id,
        file_path: document.file_path,
        file_name: document.file_name
      })

      // PDF dosyasını al (Supabase Storage'dan)
      const pdfFile = await this.getPDFFileFromStorage(document)
      if (!pdfFile) {
        throw new Error('PDF dosyası bulunamadı')
      }

      const segmentContents = []

      // Her segment için içerik çıkar
      for (const segment of segments) {
        console.log(`Segment ${segment.seg_no} işleniyor: Sayfa ${segment.p_start}-${segment.p_end}`)
        
        const content = await this.extractContentFromPDF(pdfFile, segment.p_start, segment.p_end)
        
        if (content.success) {
          segmentContents.push({
            segmentId: segment.id,
            segmentNo: segment.seg_no,
            title: segment.title,
            pageRange: `${segment.p_start}-${segment.p_end}`,
            content: content.data
          })
        } else {
          console.warn(`Segment ${segment.seg_no} içerik çıkarılamadı:`, content.error)
        }
      }

      return {
        success: true,
        data: {
          documentId: documentId,
          segments: segmentContents,
          totalSegments: segmentContents.length
        }
      }

    } catch (error) {
      console.error('Segment içerik çıkarma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Supabase Storage'dan PDF dosyasını al
   * @param {Object} document - Document objesi
   * @returns {File|null} PDF dosyası
   */
  async getPDFFileFromStorage(document) {
    try {
      // File path'i kullan - tam yolu koru
      let filePath = document.file_path
      
      // Eğer file_path yoksa, file_name kullan
      if (!filePath && document.file_name) {
        filePath = document.file_name
      }
      
      // Eğer hala file path yoksa, document ID ile dosya ara
      if (!filePath) {
        console.log('File path bulunamadı, document ID ile arama yapılıyor...')
        const { data: files, error: listError } = await supabase.storage
          .from('student-pdfs')
          .list('', {
            search: document.id
          })
        
        if (listError) {
          console.error('Dosya listesi alınamadı:', listError)
          return null
        }
        
        if (files && files.length > 0) {
          filePath = files[0].name
          console.log('Bulunan dosya:', filePath)
        } else {
          console.error('Document ID ile dosya bulunamadı')
          return null
        }
      }

      console.log('PDF dosyası indiriliyor:', filePath)

      const { data, error } = await supabase.storage
        .from('student-pdfs')
        .download(filePath)

      if (error) {
        console.error('PDF dosyası indirme hatası:', error)
        return null
      }

      return data

    } catch (error) {
      console.error('PDF dosyası alma hatası:', error)
      return null
    }
  }

  /**
   * Çıkarılan içeriği segment'e kaydet
   * @param {string} segmentId - Segment ID
   * @param {Object} content - Çıkarılan içerik
   * @returns {Object} Kaydetme sonucu
   */
  async saveExtractedContent(segmentId, content) {
    try {
      const { data, error } = await supabase
        .from('segments')
        .update({
          content: content.text,
          extracted_content: {
            text: content.text,
            images: content.images,
            tables: content.tables,
            metadata: content.metadata,
            extracted_at: new Date().toISOString()
          },
          text_status: 'COMPLETED'
        })
        .eq('id', segmentId)
        .select()

      if (error) {
        throw new Error(`İçerik kaydedilemedi: ${error.message}`)
      }

      return {
        success: true,
        data: data[0]
      }

    } catch (error) {
      console.error('İçerik kaydetme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Service instance'ı oluştur ve export et
export const pdfTextExtractionService = new PDFTextExtractionService() 