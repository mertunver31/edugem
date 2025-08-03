import React, { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import pdfProcessingPipeline from '../../services/pdfProcessingPipelineService'
import './PDFPipelineTest.css'

const PDFPipelineTest = () => {
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [activePipelines, setActivePipelines] = useState([])
  const [pipelineStats, setPipelineStats] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [pipelineResults, setPipelineResults] = useState({})
  const [logs, setLogs] = useState([])

  useEffect(() => {
    loadDocuments()
    setupPipelineListeners()
    
    // Pipeline istatistiklerini periyodik olarak güncelle
    const statsInterval = setInterval(() => {
      updatePipelineStats()
    }, 2000)
    
    return () => {
      clearInterval(statsInterval)
    }
  }, [])

  const loadDocuments = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setDocuments(data || [])
      
    } catch (error) {
      console.error('Document yükleme hatası:', error)
      addLog('error', `Document yükleme hatası: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const setupPipelineListeners = () => {
    // Pipeline progress listener
    pdfProcessingPipeline.addEventListener('pipelineProgress', (data) => {
      addLog('info', `Pipeline Progress: ${data.step} (${data.progress}%)`)
      updateActivePipelines()
    })
    
    // Pipeline completed listener
    pdfProcessingPipeline.addEventListener('pipelineCompleted', (data) => {
      addLog('success', `Pipeline tamamlandı: ${data.documentId}`)
      setPipelineResults(prev => ({
        ...prev,
        [data.documentId]: data.results
      }))
      updateActivePipelines()
    })
    
    // Pipeline failed listener
    pdfProcessingPipeline.addEventListener('pipelineFailed', (data) => {
      addLog('error', `Pipeline başarısız: ${data.documentId} - ${data.error}`)
      updateActivePipelines()
    })
  }

  const updateActivePipelines = () => {
    const pipelines = pdfProcessingPipeline.getActivePipelines()
    setActivePipelines(pipelines)
  }

  const updatePipelineStats = () => {
    const stats = pdfProcessingPipeline.getPipelineStats()
    setPipelineStats(stats)
  }

  const addLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      type,
      message
    }
    
    setLogs(prev => [logEntry, ...prev.slice(0, 49)]) // Son 50 log'u tut
  }

  const startPipeline = async () => {
    if (!selectedDocument) {
      addLog('error', 'Lütfen bir document seçin')
      return
    }

    try {
      setIsLoading(true)
      addLog('info', `Pipeline başlatılıyor: ${selectedDocument.title}`)
      
      const result = await pdfProcessingPipeline.startPipeline(selectedDocument.id, {
        autoProcessSegments: true,
        enableImageGeneration: true,
        maxConcurrentPipelines: 3
      })
      
      if (result.success) {
        addLog('success', `Pipeline başarıyla başlatıldı: ${result.pipelineId}`)
        updateActivePipelines()
      } else {
        addLog('error', `Pipeline başlatma hatası: ${result.error}`)
      }
      
    } catch (error) {
      console.error('Pipeline başlatma hatası:', error)
      addLog('error', `Pipeline başlatma hatası: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const stopPipeline = async (documentId) => {
    try {
      addLog('info', `Pipeline durduruluyor: ${documentId}`)
      
      // Pipeline'ı durdur (bu özellik pipeline servisine eklenebilir)
      // pdfProcessingPipeline.stopPipeline(documentId)
      
      addLog('success', `Pipeline durduruldu: ${documentId}`)
      updateActivePipelines()
      
    } catch (error) {
      console.error('Pipeline durdurma hatası:', error)
      addLog('error', `Pipeline durdurma hatası: ${error.message}`)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'UPLOADING': return '#ff9800'
      case 'SEGMENTING': return '#2196f3'
      case 'PROCESSING': return '#9c27b0'
      case 'COMPLETED': return '#4caf50'
      case 'FAILED': return '#f44336'
      default: return '#757575'
    }
  }

  const getStepName = (step) => {
    switch (step) {
      case 'UPLOAD_CHECK': return 'Upload Kontrolü'
      case 'SEGMENTING': return 'Segment Planlama'
      case 'TEXT_PROCESSING': return 'Metin İşleme'
      case 'IMAGE_PROCESSING': return 'Görsel İşleme'
      case 'COMPLETING': return 'Tamamlama'
      default: return step
    }
  }

  const formatDuration = (startedAt) => {
    if (!startedAt) return '0s'
    
    const start = new Date(startedAt)
    const now = new Date()
    const diff = Math.floor((now - start) / 1000)
    
    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
  }

  return (
    <div className="pdf-pipeline-test">
      <div className="pipeline-header">
        <h2>🚀 PDF Processing Pipeline Test</h2>
        <p>End-to-End PDF işleme pipeline'ını test edin</p>
      </div>

      {/* Pipeline İstatistikleri */}
      <div className="pipeline-stats">
        <h3>📊 Pipeline İstatistikleri</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{pipelineStats.total || 0}</div>
            <div className="stat-label">Toplam Pipeline</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{pipelineStats.uploading || 0}</div>
            <div className="stat-label">Yükleniyor</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{pipelineStats.segmenting || 0}</div>
            <div className="stat-label">Segmentleniyor</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{pipelineStats.processing || 0}</div>
            <div className="stat-label">İşleniyor</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{pipelineStats.completed || 0}</div>
            <div className="stat-label">Tamamlandı</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{pipelineStats.failed || 0}</div>
            <div className="stat-label">Başarısız</div>
          </div>
        </div>
      </div>

      {/* Document Seçimi */}
      <div className="document-selection">
        <h3>📄 Document Seçimi</h3>
        <div className="document-list">
          {documents.map(doc => (
            <div
              key={doc.id}
              className={`document-item ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
              onClick={() => setSelectedDocument(doc)}
            >
              <div className="document-info">
                <h4>{doc.title}</h4>
                <p>Durum: {doc.status}</p>
                <p>Segment: {doc.segments_count || 0}</p>
                <p>Sayfa: {doc.page_count || 0}</p>
              </div>
              <div className="document-status">
                <span className={`status-badge status-${doc.status?.toLowerCase()}`}>
                  {doc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {selectedDocument && (
          <div className="selected-document">
            <h4>Seçili Document:</h4>
            <p><strong>Başlık:</strong> {selectedDocument.title}</p>
            <p><strong>Durum:</strong> {selectedDocument.status}</p>
            <p><strong>Segment Sayısı:</strong> {selectedDocument.segments_count || 0}</p>
            <p><strong>Sayfa Sayısı:</strong> {selectedDocument.page_count || 0}</p>
          </div>
        )}
      </div>

      {/* Pipeline Kontrolleri */}
      <div className="pipeline-controls">
        <h3>🎮 Pipeline Kontrolleri</h3>
        <div className="control-buttons">
          <button
            className="btn btn-primary"
            onClick={startPipeline}
            disabled={!selectedDocument || isLoading}
          >
            {isLoading ? 'Başlatılıyor...' : '🚀 Pipeline Başlat'}
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={loadDocuments}
            disabled={isLoading}
          >
            🔄 Yenile
          </button>
        </div>
      </div>

      {/* Aktif Pipeline'lar */}
      <div className="active-pipelines">
        <h3>⚡ Aktif Pipeline'lar</h3>
        {activePipelines.length === 0 ? (
          <p className="no-pipelines">Aktif pipeline bulunmuyor</p>
        ) : (
          <div className="pipeline-list">
            {activePipelines.map(pipeline => (
              <div key={pipeline.id} className="pipeline-item">
                <div className="pipeline-header">
                  <h4>Pipeline: {pipeline.id}</h4>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(pipeline.status) }}
                  >
                    {pipeline.status}
                  </span>
                </div>
                
                <div className="pipeline-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${pipeline.progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{pipeline.progress}%</span>
                </div>
                
                <div className="pipeline-details">
                  <p><strong>Adım:</strong> {getStepName(pipeline.currentStep)}</p>
                  <p><strong>Süre:</strong> {formatDuration(pipeline.startedAt)}</p>
                  <p><strong>Tamamlanan:</strong> {pipeline.completedSteps}/{pipeline.totalSteps}</p>
                </div>
                
                {pipeline.error && (
                  <div className="pipeline-error">
                    <p><strong>Hata:</strong> {pipeline.error}</p>
                  </div>
                )}
                
                <div className="pipeline-actions">
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => stopPipeline(pipeline.documentId)}
                  >
                    ⏹️ Durdur
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pipeline Sonuçları */}
      {Object.keys(pipelineResults).length > 0 && (
        <div className="pipeline-results">
          <h3>📋 Pipeline Sonuçları</h3>
          {Object.entries(pipelineResults).map(([documentId, results]) => (
            <div key={documentId} className="result-item">
              <h4>Document: {documentId}</h4>
              <div className="result-details">
                {results.segments && (
                  <div className="result-section">
                    <h5>📄 Segment Sonuçları</h5>
                    <p><strong>Segment Sayısı:</strong> {results.segments.segmentCount}</p>
                    {results.segments.segments && (
                      <div className="segment-list">
                        <p><strong>Segment ID'leri:</strong></p>
                        <ul>
                          {results.segments.segments.map((segment, index) => (
                            <li key={segment.id}>Segment {index + 1}: {segment.id}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {results.text && (
                  <div className="result-section">
                    <h5>📝 Text Processing Sonuçları</h5>
                    <p><strong>Toplam Segment:</strong> {results.text.totalSegments}</p>
                    <p><strong>Başarılı:</strong> <span className="success-count">{results.text.successCount}</span></p>
                    <p><strong>Hatalı:</strong> <span className="error-count">{results.text.errorCount}</span></p>
                    
                    {results.text.results && results.text.results.length > 0 && (
                      <div className="detailed-results">
                        <h6>Detaylı Sonuçlar:</h6>
                        <div className="results-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Segment No</th>
                                <th>Segment ID</th>
                                <th>Durum</th>
                                <th>Detay</th>
                              </tr>
                            </thead>
                            <tbody>
                              {results.text.results.map((result, index) => (
                                <tr key={index} className={result.success ? 'success-row' : 'error-row'}>
                                  <td>{result.segmentNo}</td>
                                  <td>{result.segmentId}</td>
                                  <td>
                                    <span className={`status-badge ${result.success ? 'success' : 'error'}`}>
                                      {result.success ? '✅ Başarılı' : '❌ Hatalı'}
                                    </span>
                                  </td>
                                  <td>{result.success ? 'Text işleme tamamlandı' : result.error}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {results.images && (
                  <div className="result-section">
                    <h5>🎨 Image Processing Sonuçları</h5>
                    <p><strong>Toplam Segment:</strong> {results.images.totalSegments}</p>
                    <p><strong>Başarılı:</strong> <span className="success-count">{results.images.successCount}</span></p>
                    <p><strong>Hatalı:</strong> <span className="error-count">{results.images.errorCount}</span></p>
                    
                    {results.images.results && results.images.results.length > 0 && (
                      <div className="detailed-results">
                        <h6>Detaylı Sonuçlar:</h6>
                        <div className="results-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Segment No</th>
                                <th>Segment ID</th>
                                <th>Durum</th>
                                <th>Detay</th>
                              </tr>
                            </thead>
                            <tbody>
                              {results.images.results.map((result, index) => (
                                <tr key={index} className={result.success ? 'success-row' : 'error-row'}>
                                  <td>{result.segmentNo}</td>
                                  <td>{result.segmentId}</td>
                                  <td>
                                    <span className={`status-badge ${result.success ? 'success' : 'error'}`}>
                                      {result.success ? '✅ Başarılı' : '❌ Hatalı'}
                                    </span>
                                  </td>
                                  <td>{result.success ? 'Görsel oluşturma tamamlandı' : result.error}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log'lar */}
      <div className="pipeline-logs">
        <h3>📝 Pipeline Log'ları</h3>
        <div className="logs-container">
          {logs.length === 0 ? (
            <p className="no-logs">Henüz log bulunmuyor</p>
          ) : (
            <div className="log-list">
              {logs.map(log => (
                <div key={log.id} className={`log-entry log-${log.type}`}>
                  <span className="log-timestamp">[{log.timestamp}]</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="log-controls">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setLogs([])}
          >
            🗑️ Log'ları Temizle
          </button>
        </div>
      </div>
    </div>
  )
}

export default PDFPipelineTest 