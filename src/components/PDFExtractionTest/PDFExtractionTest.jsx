import React, { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import { pdfTextExtractionService } from '../../services/pdfTextExtractionService'
import './PDFExtractionTest.css'

const PDFExtractionTest = () => {
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [segments, setSegments] = useState([])
  const [selectedSegments, setSelectedSegments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [extractionResult, setExtractionResult] = useState(null)
  const [error, setError] = useState(null)

  // Document'ları yükle
  useEffect(() => {
    loadDocuments()
  }, [])

  // Segment'leri yükle
  useEffect(() => {
    if (selectedDocument) {
      loadSegments(selectedDocument.id)
    }
  }, [selectedDocument])

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Document'lar yüklenemedi: ${error.message}`)
      }

      setDocuments(data || [])
      console.log('Document\'lar yüklendi:', data)

    } catch (error) {
      console.error('Document yükleme hatası:', error)
      setError(error.message)
    }
  }

  const loadSegments = async (documentId) => {
    try {
      const { data, error } = await supabase
        .from('segments')
        .select('*')
        .eq('document_id', documentId)
        .order('seg_no', { ascending: true })

      if (error) {
        throw new Error(`Segment'ler yüklenemedi: ${error.message}`)
      }

      setSegments(data || [])
      console.log('Segment\'ler yüklendi:', data)

    } catch (error) {
      console.error('Segment yükleme hatası:', error)
      setError(error.message)
    }
  }

  const handleDocumentChange = (documentId) => {
    const document = documents.find(doc => doc.id === documentId)
    setSelectedDocument(document)
    setSelectedSegments([])
    setExtractionResult(null)
    setError(null)
  }

  const handleSegmentToggle = (segmentId) => {
    setSelectedSegments(prev => {
      if (prev.includes(segmentId)) {
        return prev.filter(id => id !== segmentId)
      } else {
        return [...prev, segmentId]
      }
    })
  }

  const handleExtractContent = async () => {
    if (!selectedDocument || selectedSegments.length === 0) {
      setError('Lütfen bir document ve en az bir segment seçin')
      return
    }

    setIsLoading(true)
    setError(null)
    setExtractionResult(null)

    try {
      console.log(`PDF extraction başlatılıyor: ${selectedSegments.length} segment`)

      const result = await pdfTextExtractionService.extractSegmentContent(
        selectedDocument.id, 
        selectedSegments
      )

      if (result.success) {
        setExtractionResult(result.data)
        console.log('✅ PDF extraction başarılı:', result.data)
      } else {
        throw new Error(result.error)
      }

    } catch (error) {
      console.error('❌ PDF extraction başarısız:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveToDatabase = async () => {
    if (!extractionResult) {
      setError('Önce PDF extraction yapın')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('Segment içerikleri database\'e kaydediliyor...')

      for (const segmentContent of extractionResult.segments) {
        const saveResult = await pdfTextExtractionService.saveExtractedContent(
          segmentContent.segmentId,
          segmentContent.content
        )

        if (!saveResult.success) {
          throw new Error(`Segment ${segmentContent.segmentNo} kaydedilemedi: ${saveResult.error}`)
        }
      }

      console.log('✅ Tüm segment içerikleri kaydedildi')
      alert('Segment içerikleri başarıyla kaydedildi!')

    } catch (error) {
      console.error('❌ Database kaydetme hatası:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const renderDocumentSelector = () => (
    <div className="document-selector">
      <h3>📄 Document Seçin</h3>
      <select 
        value={selectedDocument?.id || ''} 
        onChange={(e) => handleDocumentChange(e.target.value)}
        disabled={isLoading}
      >
        <option value="">Document seçin...</option>
        {documents.map(doc => (
          <option key={doc.id} value={doc.id}>
            {doc.file_path || doc.file_name || `Document ${doc.id}`}
          </option>
        ))}
      </select>
    </div>
  )

  const renderSegmentSelector = () => (
    <div className="segment-selector">
      <h3>📋 Segment Seçin ({selectedSegments.length} seçili)</h3>
      <div className="segments-grid">
        {segments.map(segment => (
          <div 
            key={segment.id} 
            className={`segment-item ${selectedSegments.includes(segment.id) ? 'selected' : ''}`}
            onClick={() => handleSegmentToggle(segment.id)}
          >
            <div className="segment-header">
              <span className="segment-number">#{segment.seg_no}</span>
              <span className="segment-status">
                {segment.content ? '✅' : '❌'} {segment.text_status}
              </span>
            </div>
            <div className="segment-title">{segment.title}</div>
            <div className="segment-pages">Sayfa {segment.p_start}-{segment.p_end}</div>
            {segment.content && (
              <div className="segment-content-preview">
                {segment.content.substring(0, 100)}...
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const renderExtractionControls = () => (
    <div className="extraction-controls">
      <h3>🔧 PDF Extraction Kontrolleri</h3>
      <div className="control-buttons">
        <button 
          onClick={handleExtractContent}
          disabled={isLoading || !selectedDocument || selectedSegments.length === 0}
          className="extract-btn"
        >
          {isLoading ? '⏳ İşleniyor...' : '📖 PDF İçeriği Çıkar'}
        </button>
        
        {extractionResult && (
          <button 
            onClick={handleSaveToDatabase}
            disabled={isLoading}
            className="save-btn"
          >
            💾 Database'e Kaydet
          </button>
        )}
      </div>
    </div>
  )

  const renderExtractionResult = () => {
    if (!extractionResult) return null

    return (
      <div className="extraction-result">
        <h3>📊 Extraction Sonuçları</h3>
        
        <div className="result-summary">
          <div className="summary-item">
            <span className="label">Document:</span>
            <span className="value">{selectedDocument?.file_path}</span>
          </div>
          <div className="summary-item">
            <span className="label">İşlenen Segment:</span>
            <span className="value">{extractionResult.totalSegments}</span>
          </div>
        </div>

        <div className="segments-results">
          {extractionResult.segments.map(segment => (
            <div key={segment.segmentId} className="segment-result">
              <div className="segment-result-header">
                <h4>Segment #{segment.segmentNo}: {segment.title}</h4>
                <span className="page-range">{segment.pageRange}</span>
              </div>
              
              <div className="content-stats">
                <div className="stat-item">
                  <span className="stat-label">Metin Uzunluğu:</span>
                  <span className="stat-value">{segment.content.text.length} karakter</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Görsel Sayısı:</span>
                  <span className="stat-value">{segment.content.images.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Tablo Sayısı:</span>
                  <span className="stat-value">{segment.content.tables.length}</span>
                </div>
              </div>

              <div className="content-preview">
                <h5>Metin Önizleme:</h5>
                <div className="text-preview">
                  {segment.content.text.substring(0, 300)}...
                </div>
              </div>

              {segment.content.images.length > 0 && (
                <div className="images-preview">
                  <h5>Görseller ({segment.content.images.length}):</h5>
                  <div className="images-grid">
                    {segment.content.images.slice(0, 3).map((img, index) => (
                      <div key={index} className="image-item">
                        <img src={img.base64} alt={`Görsel ${index + 1}`} />
                        <span>{img.width}x{img.height}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {segment.content.tables.length > 0 && (
                <div className="tables-preview">
                  <h5>Tablolar ({segment.content.tables.length}):</h5>
                  {segment.content.tables.slice(0, 2).map((table, index) => (
                    <div key={index} className="table-preview">
                      <span>Tablo {index + 1}: {table.summary?.columnCount || 0} sütun, {table.summary?.rowCount || 0} satır</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="pdf-extraction-test">
      <div className="test-header">
        <h2>🔍 PDF Text Extraction Test</h2>
        <p>PDF'den metin, görsel ve tablo içeriklerini çıkarır</p>
      </div>

      {error && (
        <div className="error-message">
          ❌ Hata: {error}
        </div>
      )}

      <div className="test-content">
        {renderDocumentSelector()}
        
        {selectedDocument && renderSegmentSelector()}
        
        {selectedDocument && selectedSegments.length > 0 && renderExtractionControls()}
        
        {renderExtractionResult()}
      </div>
    </div>
  )
}

export default PDFExtractionTest 