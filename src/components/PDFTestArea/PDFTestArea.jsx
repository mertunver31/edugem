import React, { useState, useEffect } from 'react'
import { uploadPDF, getDocuments } from '../../services/pdfService'
import './PDFTestArea.css'

const PDFTestArea = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [testResults, setTestResults] = useState([])
  const [existingDocuments, setExistingDocuments] = useState([])

  // Mevcut PDF'leri yükle
  useEffect(() => {
    loadExistingDocuments()
  }, [])

  const loadExistingDocuments = async () => {
    try {
      const result = await getDocuments()
      if (result.success) {
        setExistingDocuments(result.documents || [])
      } else {
        console.error('PDF\'ler yüklenemedi:', result.error)
      }
    } catch (error) {
      console.error('PDF yükleme hatası:', error)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Sadece PDF dosyaları kabul edilir!')
        e.target.value = ''
        return
      }
      
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        alert('Dosya boyutu 20MB\'dan büyük olamaz!')
        e.target.value = ''
        return
      }
      
      setSelectedFile(file)
      setUploadStatus('PDF seçildi. Test et butonuna tıklayın.')
    }
  }

  const handleTestUpload = async () => {
    if (!selectedFile) {
      alert('Önce bir PDF dosyası seçin!')
      return
    }

    setIsLoading(true)
    setUploadStatus('PDF yükleniyor ve test ediliyor...')
    
    try {
      const startTime = Date.now()
      
      // PDF yükle
      const result = await uploadPDF(selectedFile)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Test sonucunu kaydet
      const testResult = {
        id: Date.now(),
        fileName: selectedFile.name,
        sanitizedFileName: result.fileName,
        fileSize: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
        pageCount: result.pageCount || 'Hesaplanamadı',
        metadata: result.metadata,
        isEstimated: result.isEstimated || false,
        pageCountError: result.pageCountError,
        metadataError: result.metadataError,
        uploadTime: duration + ' ms',
        status: 'Başarılı',
        result: result,
        timestamp: new Date().toLocaleString('tr-TR')
      }
      
      setTestResults(prev => [testResult, ...prev])
      
      // Status mesajını oluştur
      let statusMessage = `✅ Test başarılı! Yükleme süresi: ${duration}ms`
      if (result.pageCount) {
        statusMessage += `, Sayfa sayısı: ${result.pageCount}`
      } else {
        statusMessage += `, Sayfa sayısı: Hesaplanamadı`
        if (result.pageCountError) {
          statusMessage += ` (${result.pageCountError})`
        }
      }
      
      if (result.metadata && result.metadata.title) {
        statusMessage += `, Başlık: ${result.metadata.title}`
      }
      
      setUploadStatus(statusMessage)
      
      // Dosya input'unu temizle
      setSelectedFile(null)
      const fileInput = document.getElementById('test-file-input')
      if (fileInput) {
        fileInput.value = ''
      }
      
      // Mevcut PDF listesini yenile
      await loadExistingDocuments()
      
    } catch (error) {
      console.error('PDF test hatası:', error)
      
      const testResult = {
        id: Date.now(),
        fileName: selectedFile.name,
        sanitizedFileName: 'Hata',
        fileSize: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
        pageCount: 'Hata',
        metadata: null,
        isEstimated: false,
        pageCountError: null,
        metadataError: null,
        uploadTime: 'Hata',
        status: 'Başarısız',
        error: error.message,
        result: null,
        timestamp: new Date().toLocaleString('tr-TR')
      }
      
      setTestResults(prev => [testResult, ...prev])
      setUploadStatus(`❌ Test başarısız: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
    setSelectedFile(null)
    setUploadStatus('')
  }

  const refreshDocuments = async () => {
    await loadExistingDocuments()
  }

  // Metadata bilgilerini render et
  const renderMetadata = (metadata) => {
    if (!metadata) return null
    
    return (
      <div className="metadata-section">
        <h5>📋 PDF Metadata</h5>
        <div className="metadata-grid">
          {metadata.title && (
            <div><strong>Başlık:</strong> {metadata.title}</div>
          )}
          {metadata.author && (
            <div><strong>Yazar:</strong> {metadata.author}</div>
          )}
          {metadata.subject && (
            <div><strong>Konu:</strong> {metadata.subject}</div>
          )}
          {metadata.creator && (
            <div><strong>Oluşturan:</strong> {metadata.creator}</div>
          )}
          {metadata.producer && (
            <div><strong>Üretici:</strong> {metadata.producer}</div>
          )}
          {metadata.creationDate && (
            <div><strong>Oluşturma Tarihi:</strong> {metadata.creationDate}</div>
          )}
          {metadata.modificationDate && (
            <div><strong>Değiştirme Tarihi:</strong> {metadata.modificationDate}</div>
          )}
          {metadata.keywords && (
            <div><strong>Anahtar Kelimeler:</strong> {metadata.keywords}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="pdf-test-area">
      <div className="test-header">
        <h3>🔬 PDF Upload Test Alanı</h3>
        <p>Webhook, Edge Function ve Metadata testleri için PDF yükleme alanı</p>
      </div>

      {/* Mevcut PDF'ler Bölümü */}
      <div className="existing-documents-section">
        <div className="section-header">
          <h4>📄 Mevcut PDF'ler</h4>
          <button onClick={refreshDocuments} className="refresh-button">
            🔄 Yenile
          </button>
        </div>
        
        {existingDocuments.length > 0 ? (
          <div className="documents-list">
            {existingDocuments.map(doc => (
              <div key={doc.id} className="document-item">
                <div className="document-info">
                  <span className="document-name">{doc.file_path.split('/').pop()}</span>
                  <span className="document-details">
                    {doc.page_count} sayfa • {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <div className="document-status">
                  <span className={`status-badge ${doc.status}`}>
                    {doc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-documents">
            <p>Henüz yüklenmiş PDF bulunmuyor.</p>
          </div>
        )}
      </div>

      <div className="test-controls">
        <div className="file-selection">
          <label htmlFor="test-file-input" className="file-input-label">
            {selectedFile ? 'Dosya Değiştir' : 'PDF Seç'}
          </label>
          <input
            id="test-file-input"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="test-file-input"
          />
          {selectedFile && (
            <div className="selected-file-info">
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        <div className="test-actions">
          <button
            onClick={handleTestUpload}
            disabled={!selectedFile || isLoading}
            className="test-button"
          >
            {isLoading ? 'Yükleniyor...' : 'Testi Başlat'}
          </button>
          <button
            onClick={clearResults}
            disabled={testResults.length === 0 && !selectedFile}
            className="clear-button"
          >
            Sonuçları Temizle
          </button>
        </div>
        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.startsWith('error') ? 'error' : 'success'}`}>
            {uploadStatus}
          </div>
        )}
      </div>

      {testResults.length > 0 && (
        <div className="test-results">
          <h4>Test Sonuçları</h4>
          <div className="results-list">
            {testResults.map((result) => (
              <div key={result.id} className={`result-item ${result.status === 'Başarılı' ? 'success' : 'error'}`}>
                <div className="result-header">
                  <span className="result-status">{result.status}</span>
                  <span className="result-time">{new Date(result.id).toLocaleString()}</span>
                </div>
                <div className="result-details">
                  <div><strong>Orijinal Ad:</strong> {result.fileName}</div>
                  <div><strong>Temizlenmiş Ad:</strong> {result.sanitizedFileName}</div>
                  <div><strong>Boyut:</strong> {result.fileSize}</div>
                  <div><strong>Sayfa Sayısı:</strong> {result.pageCount}</div>
                  {result.pageCountError && (
                    <div><strong>Sayfa Sayısı Hatası:</strong> {result.pageCountError}</div>
                  )}
                  {result.metadataError && (
                    <div><strong>Metadata Hatası:</strong> {result.metadataError}</div>
                  )}
                  <div><strong>Süre:</strong> {result.uploadTime}</div>
                  {result.error && (
                    <div><strong>Hata:</strong> {result.error}</div>
                  )}
                </div>
                
                {/* Metadata bölümü */}
                {result.metadata && renderMetadata(result.metadata)}
                
                {result.result && (
                  <div className="result-data">
                    <details>
                      <summary>Ham Sonuçları Göster</summary>
                      <pre>{JSON.stringify(result.result, null, 2)}</pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PDFTestArea 