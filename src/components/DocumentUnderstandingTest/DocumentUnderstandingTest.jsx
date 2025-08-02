import React, { useState, useEffect } from 'react'
import { documentUnderstandingService } from '../../services/documentUnderstandingService'
import { getDocuments } from '../../services/pdfService'
import './DocumentUnderstandingTest.css'

const DocumentUnderstandingTest = () => {
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState([])
  const [testStatus, setTestStatus] = useState('')

  // Kullanıcının PDF'lerini yükle
  useEffect(() => {
    loadUserDocuments()
  }, [])

  const loadUserDocuments = async () => {
    try {
      const result = await getDocuments()
      if (result.success) {
        setDocuments(result.documents || [])
      } else {
        console.error('PDF\'ler yüklenemedi:', result.error)
        setDocuments([])
      }
    } catch (error) {
      console.error('PDF yükleme hatası:', error)
      setDocuments([])
    }
  }

  // Document Understanding testi
  const handleDocumentUnderstandingTest = async () => {
    if (!selectedDocument) {
      setTestStatus('error: Lütfen bir PDF seçin.')
      return
    }

    setIsLoading(true)
    setTestStatus('🔍 Document Understanding başlatılıyor...')
    
    try {
      const startTime = Date.now()
      
      const result = await documentUnderstandingService.extractDocumentOutline(selectedDocument.id)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      const testResult = {
        id: Date.now(),
        documentId: selectedDocument.id,
        documentName: selectedDocument.file_path.split('/').pop(), // Dosya adını path'den çıkar
        status: result.success ? 'Başarılı' : 'Başarısız',
        duration: duration + ' ms',
        details: result.success ? 
          `Outline çıkarıldı (${result.outline?.headings?.length || 0} başlık, ${result.outline?.sections?.length || 0} bölüm)` : 
          result.error,
        outline: result.success ? result.outline : null,
        rawResponse: result.success ? result.rawResponse : null,
        timestamp: new Date().toLocaleString('tr-TR')
      }
      
      setTestResults(prev => [testResult, ...prev])
      setTestStatus(result.success ? '✅ Document Understanding başarılı!' : '❌ Document Understanding başarısız')
      
    } catch (error) {
      console.error('Document Understanding test hatası:', error)
      setTestStatus('❌ Test hatası: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Rate limiting testi
  const handleRateLimitTest = async () => {
    setIsLoading(true)
    setTestStatus('⏱️ Rate limiting kontrol ediliyor...')
    
    try {
      const startTime = Date.now()
      const rateInfo = await documentUnderstandingService.checkRateLimits()
      const endTime = Date.now()
      const duration = endTime - startTime
      
      const testResult = {
        id: Date.now(),
        testName: 'Rate Limiting Testi',
        status: 'Başarılı',
        duration: duration + ' ms',
        details: `Kalan istek: ${rateInfo.remainingRequests}, Reset: ${rateInfo.resetTime.toLocaleTimeString()}`,
        rateInfo: rateInfo,
        timestamp: new Date().toLocaleString('tr-TR')
      }
      
      setTestResults(prev => [testResult, ...prev])
      setTestStatus('✅ Rate limiting kontrolü başarılı!')
      
    } catch (error) {
      console.error('Rate limit test hatası:', error)
      setTestStatus('❌ Test hatası: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
    setTestStatus('')
  }

  // Test sonuçlarını render et
  const renderTestResult = (result) => {
    return (
      <div key={result.id} className={`test-result ${result.status === 'Başarılı' ? 'success' : 'error'}`}>
        <div className="result-header">
          <span className="result-title">
            {result.documentName ? `Document Understanding: ${result.documentName}` : result.testName}
          </span>
          <span className={`result-status ${result.status === 'Başarılı' ? 'success' : 'error'}`}>
            {result.status === 'Başarılı' ? '✅' : '❌'} {result.status}
          </span>
        </div>
        
        <div className="result-details">
          <div><strong>Süre:</strong> {result.duration}</div>
          <div><strong>Detay:</strong> {result.details}</div>
          <div><strong>Tarih:</strong> {result.timestamp}</div>
        </div>
        
        {result.outline && (
          <div className="result-outline">
            <strong>📋 Çıkarılan Outline:</strong>
            <div className="outline-content">
              <div><strong>Başlık:</strong> {result.outline.title}</div>
              <div><strong>Yazar:</strong> {result.outline.author || 'Belirtilmemiş'}</div>
              <div><strong>Toplam Sayfa:</strong> {result.outline.total_pages}</div>
              <div><strong>Başlık Sayısı:</strong> {result.outline.headings?.length || 0}</div>
              <div><strong>Bölüm Sayısı:</strong> {result.outline.sections?.length || 0}</div>
            </div>
          </div>
        )}
        
        {result.outline?.headings && result.outline.headings.length > 0 && (
          <div className="result-data">
            <details>
              <summary>📝 Başlıklar</summary>
              <div className="headings-list">
                {result.outline.headings.map((heading, index) => (
                  <div key={index} className="heading-item">
                    <span className="heading-level">H{heading.level}</span>
                    <span className="heading-text">{heading.text}</span>
                    <span className="heading-page">Sayfa {heading.page}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
        
        {result.outline?.sections && result.outline.sections.length > 0 && (
          <div className="result-data">
            <details>
              <summary>📚 Bölümler</summary>
              <div className="sections-list">
                {result.outline.sections.map((section, index) => (
                  <div key={index} className="section-item">
                    <div className="section-title">{section.title}</div>
                    <div className="section-details">
                      <span>Sayfa {section.start_page}-{section.end_page}</span>
                      <span className={`content-type ${section.content_type}`}>
                        {section.content_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
        
        {result.rawResponse && (
          <div className="result-data">
            <details>
              <summary>🔍 Ham Gemini Response</summary>
              <pre>{result.rawResponse}</pre>
            </details>
          </div>
        )}
        
        {result.rateInfo && (
          <div className="result-data">
            <details>
              <summary>⏱️ Rate Limit Bilgileri</summary>
              <pre>{JSON.stringify(result.rateInfo, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="document-understanding-test">
      <div className="test-header">
        <h3>🔍 Document Understanding Test Alanı</h3>
        <p>Gemini Document Understanding entegrasyonunu test etmek için</p>
      </div>

      <div className="test-controls">
        <div className="document-selection">
          <div className="selection-header">
            <label htmlFor="document-select">PDF Seçin:</label>
            <button onClick={loadUserDocuments} className="refresh-button">
              🔄 Yenile
            </button>
          </div>
          <select
            id="document-select"
            value={selectedDocument?.id || ''}
            onChange={(e) => {
              const doc = documents.find(d => d.id === e.target.value)
              setSelectedDocument(doc || null)
            }}
            className="document-select"
          >
            <option value="">PDF seçin...</option>
            {documents.map(doc => (
              <option key={doc.id} value={doc.id}>
                {doc.file_path.split('/').pop()} ({doc.page_count} sayfa)
              </option>
            ))}
          </select>
        </div>

        <div className="test-buttons">
          <button
            onClick={handleDocumentUnderstandingTest}
            disabled={!selectedDocument || isLoading}
            className="test-button understanding"
          >
            🔍 Document Understanding
          </button>
          
          <button
            onClick={handleRateLimitTest}
            disabled={isLoading}
            className="test-button rate"
          >
            ⏱️ Rate Limiting
          </button>
        </div>

        {testResults.length > 0 && (
          <button onClick={clearResults} className="clear-button">
            🗑️ Sonuçları Temizle
          </button>
        )}

        {testStatus && (
          <div className={`test-status ${testStatus.includes('❌') ? 'error' : 'success'}`}>
            {testStatus}
          </div>
        )}
      </div>

      {testResults.length > 0 && (
        <div className="test-results">
          <h4>📊 Test Sonuçları</h4>
          <div className="results-list">
            {testResults.map(renderTestResult)}
          </div>
        </div>
      )}

      {documents.length === 0 && (
        <div className="no-documents">
          <p>📄 Henüz yüklenmiş PDF bulunmuyor.</p>
          <p>Önce PDF Test alanından bir PDF yükleyin.</p>
        </div>
      )}
    </div>
  )
}

export default DocumentUnderstandingTest 