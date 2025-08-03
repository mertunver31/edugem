import React, { useState, useEffect } from 'react'
import imageWorkerService from '../../services/imageWorkerService'
import { getDocuments } from '../../services/pdfService'
import { supabase } from '../../config/supabase'
import './ImageWorkerTest.css'

const ImageWorkerTest = () => {
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [segments, setSegments] = useState([])
  const [selectedSegment, setSelectedSegment] = useState(null)
  const [processingResults, setProcessingResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('select')

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    if (selectedDocument) {
      loadDocumentSegments(selectedDocument.id)
    }
  }, [selectedDocument])

  const loadDocuments = async () => {
    try {
      const result = await getDocuments()
      if (result.success) {
        setDocuments(result.documents)
      } else {
        setError('Document\'lar yüklenemedi: ' + result.error)
      }
    } catch (error) {
      setError('Document yükleme hatası: ' + error.message)
    }
  }

  const loadDocumentSegments = async (documentId) => {
    try {
      const { data, error } = await supabase
        .from('segments')
        .select('*')
        .eq('document_id', documentId)
        .order('seg_no', { ascending: true })

      if (error) {
        throw new Error(`Segment'ler alınamadı: ${error.message}`)
      }

      setSegments(data || [])
      setError(null)
    } catch (error) {
      setError('Segment yükleme hatası: ' + error.message)
    }
  }

  const handleDocumentSelect = (document) => {
    setSelectedDocument(document)
    setSelectedSegment(null)
    setProcessingResults([])
    setError(null)
  }

  const handleSegmentSelect = (segment) => {
    setSelectedSegment(segment)
    setError(null)
  }

  const handleProcessSegment = async () => {
    if (!selectedSegment) {
      setError('Lütfen bir segment seçin')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`Segment ${selectedSegment.id} görsel işleme başlatılıyor...`)
      const result = await imageWorkerService.processSegmentImages(selectedSegment.id)
      
      if (result.success) {
        console.log('Segment görsel işleme başarılı:', result)
        setProcessingResults(prev => [result, ...prev])
        setError(null)
      } else {
        setError('Segment görsel işleme başarısız: ' + result.error)
      }
    } catch (error) {
      setError('Segment görsel işleme hatası: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessAllSegments = async () => {
    if (!selectedDocument || segments.length === 0) {
      setError('Lütfen bir document ve segment seçin')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`${segments.length} segment için görsel işleme başlatılıyor...`)
      const results = []
      
      for (const segment of segments) {
        console.log(`Segment ${segment.seg_no} görsel işleme...`)
        const result = await imageWorkerService.processSegmentImages(segment.id)
        results.push({
          segment: segment,
          result: result
        })
        
        // API rate limit için bekleme
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      setProcessingResults(results.map(r => r.result).filter(r => r.success))
      console.log(`${results.filter(r => r.result.success).length} segment başarıyla işlendi`)
      setError(null)
    } catch (error) {
      setError('Toplu görsel işleme hatası: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR')
  }

  const formatPrompt = (prompt) => {
    if (!prompt) return 'Prompt bulunamadı'
    
    // İlk 100 karakteri göster
    const preview = prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt
    return preview
  }

  return (
    <div className="image-worker-test">
      <h2>🎨 Image Worker Test</h2>
      <p>GÜN 7 - AŞAMA 3: Image Worker - Görsel İçerik İşleme test alanı</p>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'select' ? 'active' : ''}`}
          onClick={() => setActiveTab('select')}
        >
          🎯 Segment Seçimi
        </button>
        <button 
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          🖼️ Görsel Sonuçları
        </button>
      </div>

      {/* Segment Selection Tab */}
      {activeTab === 'select' && (
        <div className="selection-section">
          <h3>📄 Document Seçimi</h3>
          {documents.length === 0 ? (
            <div className="no-documents">
              <p>⚠️ Document bulunamadı</p>
              <p>Önce PDF yükleyin ve segment oluşturun</p>
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
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedDocument && (
            <div className="segments-section">
              <h3>📋 Segment Listesi</h3>
              {segments.length === 0 ? (
                <div className="no-segments">
                  <p>⚠️ Bu document için segment bulunamadı</p>
                  <p>Önce Segment Planner ile segment oluşturun</p>
                </div>
              ) : (
                <div className="segments-list">
                  {segments.map((segment) => (
                    <div
                      key={segment.id}
                      className={`segment-item ${selectedSegment?.id === segment.id ? 'selected' : ''}`}
                      onClick={() => handleSegmentSelect(segment)}
                    >
                      <div className="segment-info">
                        <h4>{segment.title || `Segment ${segment.seg_no}`}</h4>
                        <p>📄 Sayfa {segment.p_start}-{segment.p_end}</p>
                        <p>📅 {formatDate(segment.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedSegment && (
                <div className="processing-actions">
                  <h3>🎨 Görsel İşleme</h3>
                  <div className="action-buttons">
                    <button
                      onClick={handleProcessSegment}
                      disabled={loading}
                      className="process-btn single"
                    >
                      {loading ? '⏳ Görseller Oluşturuluyor...' : '🎨 Seçili Segment\'e Görsel Oluştur'}
                    </button>
                    <button
                      onClick={handleProcessAllSegments}
                      disabled={loading}
                      className="process-btn all"
                    >
                      {loading ? '⏳ Görseller Oluşturuluyor...' : `🎨 Tüm Segment'lere Görsel Oluştur (${segments.length})`}
                    </button>
                  </div>
                  <p className="processing-info">
                    <strong>Image Processing:</strong> Segment içeriğine uygun görseller oluşturur<br/>
                    <strong>Görsel Türleri:</strong> Ana konu, konsept diyagramı ve örnek görselleri
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="results-section">
          <h3>🖼️ Görsel İşleme Sonuçları</h3>
          <div className="results-controls">
            <button onClick={() => setActiveTab('select')} className="back-btn">
              ← Geri Dön
            </button>
          </div>

          {processingResults.length === 0 ? (
            <div className="no-results">
              <p>📭 Henüz görsel işleme sonucu bulunmuyor</p>
              <p>Segment seçip görsel işleme yapın</p>
            </div>
          ) : (
            <div className="results-list">
              {processingResults.map((result, index) => (
                <div key={index} className="result-card">
                  <div className="result-header">
                    <div className="result-title">
                      🎨 Segment {result.segmentId}
                    </div>
                    <div className="result-status success">
                      ✅ Başarılı
                    </div>
                  </div>
                  
                  <div className="result-details">
                    <div className="result-metadata">
                      <h4>📊 Metadata</h4>
                      <p><strong>Worker ID:</strong> {result.metadata.worker_id}</p>
                      <p><strong>İşlenme Tarihi:</strong> {formatDate(result.metadata.processed_at)}</p>
                      <p><strong>Görsel Sayısı:</strong> {result.metadata.image_count} adet</p>
                      <p><strong>Prompt Sayısı:</strong> {result.metadata.prompts_used} adet</p>
                    </div>

                    <div className="result-images">
                      <h4>🖼️ Oluşturulan Görseller</h4>
                      <div className="images-grid">
                        {result.generatedImages.map((image, imgIndex) => (
                          <div key={imgIndex} className="image-item">
                            <div className="image-container">
                              <img 
                                src={image.image_url} 
                                alt={image.description}
                                className="generated-image"
                                onError={(e) => {
                                  e.target.src = `https://via.placeholder.com/300x300/9B9B9B/FFFFFF?text=Görsel+Yüklenemedi`
                                }}
                              />
                            </div>
                            <div className="image-info">
                              <h5>{image.type}</h5>
                              <p><strong>Açıklama:</strong> {image.description}</p>
                              <p><strong>Stil:</strong> {image.style}</p>
                              <p><strong>Prompt:</strong> {formatPrompt(image.prompt)}</p>
                              <p><strong>Model:</strong> {image.metadata.model}</p>
                                                             <p><strong>Boyut:</strong> {image.metadata.width}x{image.metadata.height}px</p>
                              {image.metadata.generation_time && (
                                <p><strong>Oluşturma Süresi:</strong> {image.metadata.generation_time.toFixed(1)}s</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          <h3>❌ Hata</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}

export default ImageWorkerTest 