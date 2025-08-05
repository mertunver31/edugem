import { supabase } from '../config/supabase'
import { getCurrentUser } from './authService'

// PDF-lib import - kesin sonuç için
import { PDFDocument } from 'pdf-lib'

// Dosya adını temizleme fonksiyonu
const sanitizeFileName = (fileName) => {
  // Türkçe karakterleri ve özel karakterleri değiştir
  const turkishChars = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'I': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
    'é': 'e', 'è': 'e', 'ê': 'e',
    'à': 'a', 'â': 'a', 'ä': 'a',
    'î': 'i', 'ï': 'i',
    'ô': 'o', 'ù': 'u', 'û': 'u', 'ÿ': 'y'
  }
  
  let sanitized = fileName
  
  // Türkçe karakterleri değiştir
  Object.keys(turkishChars).forEach(char => {
    sanitized = sanitized.replace(new RegExp(char, 'g'), turkishChars[char])
  })
  
  // Özel karakterleri kaldır veya değiştir
  sanitized = sanitized
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Sadece harf, rakam, nokta ve tire bırak
    .replace(/_+/g, '_') // Birden fazla alt çizgiyi tek alt çizgi yap
    .replace(/^_|_$/g, '') // Başta ve sonda alt çizgi varsa kaldır
  
  return sanitized
}

// PDF metadata çıkarma fonksiyonu
export const extractPDFMetadata = async (file) => {
  try {
    console.log('PDF metadata çıkarılıyor...')
    
    // File'ı ArrayBuffer'a çevir
    const arrayBuffer = await file.arrayBuffer()
    
    // PDF-lib ile dosyayı yükle
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    
    // Metadata bilgilerini çıkar
    const metadata = {
      title: null,
      author: null,
      subject: null,
      creator: null,
      producer: null,
      creationDate: null,
      modificationDate: null,
      keywords: null,
      pageCount: pdfDoc.getPageCount(),
      fileSize: file.size,
      fileName: file.name
    }
    
    // PDF metadata'sını al (PDF-lib'de getInfo() fonksiyonu yok, sadece sayfa sayısını alıyoruz)
    metadata.pageCount = pdfDoc.getPageCount()
    
    console.log('PDF metadata başarıyla çıkarıldı:', metadata)
    return metadata
    
  } catch (error) {
    console.error('PDF metadata çıkarma hatası:', error)
    
    // Hata durumunda temel bilgileri döndür
    return {
      title: null,
      author: null,
      subject: null,
      creator: null,
      producer: null,
      creationDate: null,
      modificationDate: null,
      keywords: null,
      pageCount: null,
      fileSize: file.size,
      fileName: file.name,
      error: error.message
    }
  }
}

// PDF sayfa sayısı sayma fonksiyonu (kesin sonuç - PDF-lib ile)
export const getPDFPageCount = async (file) => {
  try {
    console.log('PDF sayfa sayısı hesaplanıyor (PDF-lib ile)...')
    
    // File'ı ArrayBuffer'a çevir
    const arrayBuffer = await file.arrayBuffer()
    console.log('ArrayBuffer oluşturuldu, boyut:', arrayBuffer.byteLength)
    
    // PDF-lib ile dosyayı yükle
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pageCount = pdfDoc.getPageCount()
    
    console.log('PDF yüklendi (PDF-lib), kesin sayfa sayısı:', pageCount)
    return pageCount
    
  } catch (error) {
    console.error('PDF sayfa sayısı hesaplama hatası (PDF-lib):', error)
    
    // Detaylı hata analizi
    if (error.message.includes('Invalid PDF')) {
      throw new Error('Geçersiz PDF dosyası')
    } else if (error.message.includes('PDF header')) {
      throw new Error('PDF dosyası bulunamadı')
    } else {
      throw new Error('PDF sayfa sayısı hesaplanamadı: ' + error.message)
    }
  }
}

export const uploadPDF = async (file, courseTitle = null) => {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      throw new Error('Kullanıcı girişi yapılmamış')
    }

    const userId = userResult.user.id

    if (!file || file.type !== 'application/pdf') {
      throw new Error('Sadece PDF dosyaları kabul edilir')
    }

    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      throw new Error('Dosya boyutu 20MB\'dan büyük olamaz')
    }

    // PDF metadata ve sayfa sayısını hesapla
    let pageCount = null
    let metadata = null
    let pageCountError = null
    let metadataError = null
    let isEstimated = false
    
    try {
      // Önce metadata çıkar (sayfa sayısı da dahil)
      metadata = await extractPDFMetadata(file)
      pageCount = metadata.pageCount
      console.log('PDF metadata ve sayfa sayısı başarıyla çıkarıldı:', metadata)
    } catch (metadataError) {
      console.warn('Metadata çıkarılamadı:', metadataError.message)
      
      // Metadata çıkarılamazsa sadece sayfa sayısını dene
      try {
        pageCount = await getPDFPageCount(file)
        console.log('Sadece sayfa sayısı hesaplandı:', pageCount)
      } catch (pageCountError) {
        console.warn('Sayfa sayısı da hesaplanamadı:', pageCountError.message)
        pageCount = null
      }
    }

    const timestamp = Date.now()
    const originalFileName = file.name
    const sanitizedFileName = sanitizeFileName(originalFileName)
    const fileName = `${timestamp}_${sanitizedFileName}`
    const filePath = `${userId}/${fileName}`

    console.log('Dosya yükleme bilgileri:', {
      originalName: originalFileName,
      sanitizedName: sanitizedFileName,
      filePath: filePath,
      fileSize: file.size,
      pageCount: pageCount,
      metadata: metadata,
      isEstimated: isEstimated,
      pageCountError: pageCountError?.message,
      metadataError: metadataError?.message
    })

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('student-pdfs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        metadata: {
          pageCount: pageCount?.toString() || '0',
          originalFileName: originalFileName,
          fileSize: file.size.toString()
        }
      })

    if (uploadError) {
      console.error('PDF upload error:', uploadError)
      throw new Error('PDF yükleme hatası: ' + uploadError.message)
    }

    console.log('PDF uploaded successfully:', uploadData)

    // Storage webhook'u beklemek yerine direkt database'e kayıt ekle
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        file_path: filePath,
        page_count: pageCount || 0,
        status: 'UPLOADED',
        raw_outline: null,
        course_title: courseTitle || null
      })
      .select()
      .single()

    if (documentError) {
      console.error('Document record creation error:', documentError)
      // Storage'da dosya var ama database'de kayıt yok, bu durumu handle et
      console.warn('PDF uploaded to storage but database record creation failed')
    } else {
      console.log('Document record created successfully:', documentData)
    }

    return {
      success: true,
      filePath: filePath,
      fileName: fileName,
      originalFileName: originalFileName,
      pageCount: pageCount,
      metadata: metadata,
      isEstimated: isEstimated,
      pageCountError: pageCountError?.message,
      metadataError: metadataError?.message,
      documentId: documentData?.id,
      message: 'PDF başarıyla yüklendi ve işlenmeye başlandı'
    }

  } catch (error) {
    console.error('PDF upload service error:', error)
    throw error
  }
}

export const getDocuments = async () => {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      throw new Error('Kullanıcı girişi yapılmamış')
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userResult.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Documents fetch error:', error)
      return {
        success: false,
        error: 'Dokümanlar getirilemedi: ' + error.message,
        documents: []
      }
    }

    return {
      success: true,
      documents: data || [],
      error: null
    }
  } catch (error) {
    console.error('Get documents service error:', error)
    return {
      success: false,
      error: error.message,
      documents: []
    }
  }
}

export const getDocumentSegments = async (documentId) => {
  try {
    const { data, error } = await supabase
      .from('segments')
      .select('*')
      .eq('document_id', documentId)
      .order('seg_no', { ascending: true })

    if (error) {
      console.error('Segments fetch error:', error)
      throw new Error('Segmentler getirilemedi: ' + error.message)
    }

    return data || []
  } catch (error) {
    console.error('Get segments service error:', error)
    throw error
  }
}

export const deleteDocument = async (documentId) => {
  try {
    // Önce doküman bilgilerini al
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .single()

    if (fetchError) {
      throw new Error('Doküman bulunamadı: ' + fetchError.message)
    }

    // Storage'dan dosyayı sil
    const { error: storageError } = await supabase.storage
      .from('student-pdfs')
      .remove([document.file_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      // Storage hatası olsa bile devam et
    }

    // Database'den kaydı sil
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      throw new Error('Doküman silinemedi: ' + deleteError.message)
    }

    return { success: true, message: 'Doküman başarıyla silindi' }
  } catch (error) {
    console.error('Delete document service error:', error)
    throw error
  }
}

// Default export - tüm fonksiyonları içeren servis objesi
const pdfService = {
  extractPDFMetadata,
  getPDFPageCount,
  uploadPDF,
  getDocuments,
  getDocumentSegments,
  deleteDocument
}

export default pdfService 