import React, { useState, useEffect } from 'react'
import segmentService from '../../services/segmentService'
import { getDocuments } from '../../services/pdfService'
import './SegmentPlannerTest.css'

const SegmentPlannerTest = () => {
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Document'ları yükle
  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const result = await getDocuments()
      if (result.success) {
        // Sadece outline'ı olan document'ları göster
        const documentsWithOutline = result.documents.filter(doc => doc.outline)
        setDocuments(documentsWithOutline)
        console.log('Documents with outline:', documentsWithOutline)
      } else {
        setError('Document\'lar yüklenemedi: ' + result.error)
      }
    } catch (error) {
      setError('Document yükleme hatası: ' + error.message)
    }
  }

  const handleCreateSegments = async () => {
    if (!selectedDocument) {
      setError('Lütfen bir document seçin')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('Segment oluşturuluyor...', selectedDocument)
      
      const result = await segmentService.createSegmentsForDocument(selectedDocument.id)
      
      if (result.success) {
        setResult(result)
        setSegments(result.segments)
        console.log('Segment oluşturma başarılı:', result)
      } else {
        setError('Segment oluşturma başarısız: ' + result.error)
        if (result.details) {
          console.error('Validation detayları:', result.details)
        }
      }
    } catch (error) {
      setError('Segment oluşturma hatası: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentSelect = (document) => {
    setSelectedDocument(document)
    setSegments([])
    setResult(null)
    setError(null)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR')
  }

  return (
    <div className="segment-planner-test">
      <h2>📋 Segment Planner Test</h2>
      <p>PDF outline'larını analiz ederek öğrenme segmentleri oluşturur</p>

      {/* Document Seçimi */}
      <div className="document-selection">
        <h3>📄 Document Seçimi</h3>
        {documents.length === 0 ? (
          <div className="no-documents">
            <p>⚠️ Outline'ı olan document bulunamadı</p>
            <p>Önce Document Understanding testini çalıştırın</p>
          </div>
        ) : (
          <div className="document-list">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`document-item ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                onClick={() => handleDocumentSelect(doc)}
              >
                <div className="document-info">
                  <h4>{doc.file_path.split('/').pop()}</h4>
                  <p>📄 {doc.page_count} sayfa</p>
                  <p>📅 {formatDate(doc.created_at)}</p>
                  <p>📊 {doc.outline?.sections?.length || 0} section</p>
                </div>
                <div className="document-outline">
                  <h5>Outline:</h5>
                  <pre>{JSON.stringify(doc.outline, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Segment Oluşturma */}
      {selectedDocument && (
        <div className="segment-creation">
          <h3>🔧 Segment Oluşturma</h3>
          <button
            onClick={handleCreateSegments}
            disabled={loading}
            className="create-segments-btn"
          >
            {loading ? '⏳ Segment Oluşturuluyor...' : '🚀 Segment Oluştur'}
          </button>
        </div>
      )}

      {/* Sonuçlar */}
      {result && (
        <div className="results">
          <h3>✅ Sonuçlar</h3>
          
          {/* Validation Bilgileri */}
          <div className="validation-info">
            <h4>📊 Validation</h4>
            <div className="validation-details">
              <p><strong>Toplam Segment:</strong> {result.validation.totalSegments}</p>
              <p><strong>Kapsama:</strong> Sayfa {result.validation.coverage.start}-{result.validation.coverage.end} / {result.validation.coverage.total}</p>
              <p><strong>Durum:</strong> {result.validation.isValid ? '✅ Geçerli' : '❌ Hatalı'}</p>
              
              {result.validation.warnings.length > 0 && (
                <div className="warnings">
                  <h5>⚠️ Uyarılar:</h5>
                  <ul>
                    {result.validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Segment Listesi */}
          <div className="segments-list">
            <h4>📋 Oluşturulan Segmentler</h4>
            <div className="segments-grid">
              {segments.map((segment) => (
                <div key={segment.seg_no} className="segment-card">
                  <div className="segment-header">
                    <h5>Segment {segment.seg_no}</h5>
                    <span className="segment-pages">
                      📄 {segment.p_start}-{segment.p_end}
                    </span>
                  </div>
                  <div className="segment-title">
                    <strong>{segment.title}</strong>
                  </div>
                  <div className="segment-details">
                    <p>📝 Tür: {segment.content_type}</p>
                    <p>🏷️ Kaynak: {segment.original_section}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hata Mesajı */}
      {error && (
        <div className="error-message">
          <h3>❌ Hata</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Yenile Butonu */}
      <div className="refresh-section">
        <button onClick={loadDocuments} className="refresh-btn">
          🔄 Document'ları Yenile
        </button>
      </div>
    </div>
  )
}

export default SegmentPlannerTest 