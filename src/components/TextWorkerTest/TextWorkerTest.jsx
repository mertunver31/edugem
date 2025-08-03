import React, { useState, useEffect } from 'react'
import textWorkerService from '../../services/textWorkerService'
import { getDocuments } from '../../services/pdfService'
import { supabase } from '../../config/supabase'
import './TextWorkerTest.css'

const TextWorkerTest = () => {
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
      console.log(`Segment ${selectedSegment.id} text işleme başlatılıyor...`)
      const result = await textWorkerService.processSegmentText(selectedSegment.id)
      
      if (result.success) {
        console.log('Segment text işleme başarılı:', result)
        setProcessingResults(prev => [result, ...prev])
        setError(null)
      } else {
        setError('Segment text işleme başarısız: ' + result.error)
      }
    } catch (error) {
      setError('Segment text işleme hatası: ' + error.message)
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
      console.log(`${segments.length} segment için text işleme başlatılıyor...`)
      const results = []
      
      for (const segment of segments) {
        console.log(`Segment ${segment.seg_no} işleniyor...`)
        const result = await textWorkerService.processSegmentText(segment.id)
        results.push({
          segment: segment,
          result: result
        })
        
        // Kısa bir bekleme süresi
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      setProcessingResults(results.map(r => r.result).filter(r => r.success))
      console.log(`${results.filter(r => r.result.success).length} segment başarıyla işlendi`)
      setError(null)
    } catch (error) {
      setError('Toplu işleme hatası: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR')
  }

  const formatContent = (content) => {
    if (!content) return 'İçerik bulunamadı'
    
    // İlk 200 karakteri göster
    const preview = content.length > 200 ? content.substring(0, 200) + '...' : content
    return preview.replace(/\n/g, '<br>')
  }

  return (
    <div className="text-worker-test">
      <h2>📝 Text Worker Test</h2>
      <p>GÜN 6 - AŞAMA 2: Text Worker - Segment Text Processing test alanı</p>

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
          📊 İşleme Sonuçları
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
                  <h3>🔧 Text İşleme</h3>
                  <div className="action-buttons">
                    <button
                      onClick={handleProcessSegment}
                      disabled={loading}
                      className="process-btn single"
                    >
                      {loading ? '⏳ İşleniyor...' : '📝 Seçili Segment\'i İşle'}
                    </button>
                    <button
                      onClick={handleProcessAllSegments}
                      disabled={loading}
                      className="process-btn all"
                    >
                      {loading ? '⏳ İşleniyor...' : `📝 Tüm Segment'leri İşle (${segments.length})`}
                    </button>
                  </div>
                  <p className="processing-info">
                    <strong>Text Processing:</strong> Segment içeriğini analiz eder, temizler ve yapılandırır<br/>
                    <strong>İçerik Analizi:</strong> Karmaşıklık seviyesi, içerik türü ve istatistikler hesaplanır
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
          <h3>📊 İşleme Sonuçları</h3>
          <div className="results-controls">
            <button onClick={() => setActiveTab('select')} className="back-btn">
              ← Geri Dön
            </button>
          </div>

          {processingResults.length === 0 ? (
            <div className="no-results">
              <p>📭 Henüz işleme sonucu bulunmuyor</p>
              <p>Segment seçip text işleme yapın</p>
            </div>
          ) : (
            <div className="results-list">
              {processingResults.map((result, index) => (
                <div key={index} className="result-card">
                  <div className="result-header">
                    <div className="result-title">
                      📝 Segment {result.segmentId}
                    </div>
                    <div className="result-status success">
                      ✅ Başarılı
                    </div>
                  </div>
                  
                  <div className="result-details">
                                         <div className="result-metadata">
                       <h4>📊 Metadata</h4>
                       <p><strong>Worker ID:</strong> {result.metadata.worker_id}</p>
                       <p><strong>Task ID:</strong> {result.task_id || 'Geçici (Task Queue devre dışı)'}</p>
                       <p><strong>İşlenme Tarihi:</strong> {formatDate(result.metadata.processed_at)}</p>
                       <p><strong>Metin Uzunluğu:</strong> {result.metadata.text_length} karakter</p>
                       <p><strong>Kelime Sayısı:</strong> {result.metadata.word_count} kelime</p>
                     </div>

                    <div className="result-structure">
                      <h4>🏗️ Yapı Analizi</h4>
                      <p><strong>İçerik Türü:</strong> {result.processedText.structure.content_type}</p>
                      <p><strong>Karmaşıklık:</strong> {result.processedText.structure.complexity_level}</p>
                      <p><strong>Başlık Var:</strong> {result.processedText.structure.has_title ? 'Evet' : 'Hayır'}</p>
                      <p><strong>Outline Var:</strong> {result.processedText.structure.has_outline ? 'Evet' : 'Hayır'}</p>
                    </div>

                    <div className="result-statistics">
                      <h4>📈 İstatistikler</h4>
                      <p><strong>Karakter Sayısı:</strong> {result.processedText.statistics.character_count}</p>
                      <p><strong>Kelime Sayısı:</strong> {result.processedText.statistics.word_count}</p>
                      <p><strong>Cümle Sayısı:</strong> {result.processedText.statistics.sentence_count}</p>
                      <p><strong>Paragraf Sayısı:</strong> {result.processedText.statistics.paragraph_count}</p>
                    </div>

                    <div className="result-content">
                      <h4>📄 İşlenmiş İçerik (Önizleme)</h4>
                      <div 
                        className="content-preview"
                        dangerouslySetInnerHTML={{ 
                          __html: formatContent(result.processedText.content) 
                        }}
                      />
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

export default TextWorkerTest 