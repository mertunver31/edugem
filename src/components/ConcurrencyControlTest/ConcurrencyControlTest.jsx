import React, { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import concurrencyManager from '../../services/concurrencyManagerService'
import queueManager from '../../services/queueManagerService'
import workerCoordinator from '../../services/workerCoordinatorService'
import './ConcurrencyControlTest.css'

const ConcurrencyControlTest = () => {
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState('')
  const [segments, setSegments] = useState([])
  const [selectedSegment, setSelectedSegment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  
  // Stats state
  const [workerStats, setWorkerStats] = useState({})
  const [queueStats, setQueueStats] = useState({})
  const [segmentStats, setSegmentStats] = useState({})
  const [activeWorkers, setActiveWorkers] = useState([])
  const [activeSegments, setActiveSegments] = useState([])

  useEffect(() => {
    loadDocuments()
    loadStats()
    
    // Stats güncelleme interval'i
    const statsInterval = setInterval(loadStats, 2000)
    
    return () => clearInterval(statsInterval)
  }, [])

  useEffect(() => {
    if (selectedDocument) {
      loadSegments(selectedDocument)
    }
  }, [selectedDocument])

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Document yükleme hatası:', error)
    }
  }

  const loadSegments = async (documentId) => {
    try {
      const { data, error } = await supabase
        .from('segments')
        .select('*')
        .eq('document_id', documentId)
        .order('seg_no', { ascending: true })

      if (error) throw error
      setSegments(data || [])
    } catch (error) {
      console.error('Segment yükleme hatası:', error)
    }
  }

  const loadStats = () => {
    // Worker stats
    setWorkerStats(concurrencyManager.getWorkerStats())
    setActiveWorkers(concurrencyManager.getActiveWorkers())
    
    // Queue stats
    setQueueStats(queueManager.getQueueStats())
    
    // Segment stats
    setSegmentStats(workerCoordinator.getSegmentStats())
    setActiveSegments(workerCoordinator.getActiveSegments())
  }

  const handleProcessSegment = async () => {
    if (!selectedSegment) {
      setError('Lütfen bir segment seçin')
      return
    }

    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      console.log(`Segment işleme başlatılıyor: ${selectedSegment}`)
      
      // Worker koordinasyonu başlat
      const result = await workerCoordinator.coordinateSegmentWorkers(
        selectedSegment,
        ['TEXT_WORKER', 'IMAGE_WORKER'],
        {
          priority: 'MEDIUM',
          continueOnError: false,
          timeout: 300000 // 5 dakika
        }
      )

      setResults(result)
      console.log('Segment işleme tamamlandı:', result)
      
    } catch (error) {
      console.error('Segment işleme hatası:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessTextOnly = async () => {
    if (!selectedSegment) {
      setError('Lütfen bir segment seçin')
      return
    }

    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      console.log(`Text Worker başlatılıyor: ${selectedSegment}`)
      
      const result = await workerCoordinator.coordinateSegmentWorkers(
        selectedSegment,
        ['TEXT_WORKER'],
        {
          priority: 'HIGH',
          continueOnError: false
        }
      )

      setResults(result)
      console.log('Text Worker tamamlandı:', result)
      
    } catch (error) {
      console.error('Text Worker hatası:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessImageOnly = async () => {
    if (!selectedSegment) {
      setError('Lütfen bir segment seçin')
      return
    }

    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      console.log(`Image Worker başlatılıyor: ${selectedSegment}`)
      
      const result = await workerCoordinator.coordinateSegmentWorkers(
        selectedSegment,
        ['IMAGE_WORKER'],
        {
          priority: 'MEDIUM',
          continueOnError: false
        }
      )

      setResults(result)
      console.log('Image Worker tamamlandı:', result)
      
    } catch (error) {
      console.error('Image Worker hatası:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('tr-TR')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING': return '#4CAF50'
      case 'COMPLETED': return '#2196F3'
      case 'FAILED': return '#F44336'
      case 'RETRYING': return '#FF9800'
      case 'PENDING': return '#9E9E9E'
      default: return '#757575'
    }
  }

  return (
    <div className="concurrency-control-test">
      <div className="test-header">
        <h2>🔄 Concurrency Control Test</h2>
        <p>Worker koordinasyonu ve senkronizasyon test alanı</p>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stats-section">
          <h3>📊 Worker İstatistikleri</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Toplam</span>
              <span className="stat-value">{workerStats.total || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Çalışan</span>
              <span className="stat-value">{workerStats.running || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Bekleyen</span>
              <span className="stat-value">{workerStats.registered || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Retry</span>
              <span className="stat-value">{workerStats.retrying || 0}</span>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h3>📋 Queue İstatistikleri</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Bekleyen</span>
              <span className="stat-value">{queueStats.pending || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">İşlenen</span>
              <span className="stat-value">{queueStats.processing || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Tamamlanan</span>
              <span className="stat-value">{queueStats.completed || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Başarısız</span>
              <span className="stat-value">{queueStats.failed || 0}</span>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h3>🎯 Segment İstatistikleri</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Toplam</span>
              <span className="stat-value">{segmentStats.total || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Koordinasyon</span>
              <span className="stat-value">{segmentStats.coordinating || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Tamamlanan</span>
              <span className="stat-value">{segmentStats.completed || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Başarısız</span>
              <span className="stat-value">{segmentStats.failed || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="test-controls">
        <div className="control-section">
          <h3>📄 Document Seçimi</h3>
          <select 
            value={selectedDocument} 
            onChange={(e) => setSelectedDocument(e.target.value)}
            className="document-select"
          >
            <option value="">Document seçin...</option>
            {documents.map(doc => (
              <option key={doc.id} value={doc.id}>
                {doc.file_path.split('/').pop()} ({doc.page_count} sayfa)
              </option>
            ))}
          </select>
        </div>

        <div className="control-section">
          <h3>📝 Segment Seçimi</h3>
          <select 
            value={selectedSegment} 
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="segment-select"
            disabled={!selectedDocument}
          >
            <option value="">Segment seçin...</option>
            {segments.map(segment => (
              <option key={segment.id} value={segment.id}>
                Segment {segment.seg_no}: {segment.title || 'Başlıksız'}
              </option>
            ))}
          </select>
        </div>

        <div className="control-section">
          <h3>🚀 İşlem Seçenekleri</h3>
          <div className="action-buttons">
            <button 
              onClick={handleProcessSegment}
              disabled={!selectedSegment || isLoading}
              className="action-button primary"
            >
              {isLoading ? '⏳ İşleniyor...' : '🔄 Text + Image Worker'}
            </button>
            
            <button 
              onClick={handleProcessTextOnly}
              disabled={!selectedSegment || isLoading}
              className="action-button secondary"
            >
              📝 Sadece Text Worker
            </button>
            
            <button 
              onClick={handleProcessImageOnly}
              disabled={!selectedSegment || isLoading}
              className="action-button secondary"
            >
              🎨 Sadece Image Worker
            </button>
          </div>
        </div>
      </div>

      {/* Active Workers */}
      {activeWorkers.length > 0 && (
        <div className="active-section">
          <h3>⚡ Aktif Worker'lar</h3>
          <div className="active-list">
            {activeWorkers.map(worker => (
              <div key={worker.id} className="active-item">
                <div className="active-header">
                  <span className="worker-type">{worker.type}</span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(worker.status) }}
                  >
                    {worker.status}
                  </span>
                </div>
                <div className="active-details">
                  <p><strong>ID:</strong> {worker.id}</p>
                  <p><strong>Segment:</strong> {worker.segmentId}</p>
                  <p><strong>Başlangıç:</strong> {formatDate(worker.startedAt)}</p>
                  {worker.errorCount > 0 && (
                    <p><strong>Hata Sayısı:</strong> {worker.errorCount}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Segments */}
      {activeSegments.length > 0 && (
        <div className="active-section">
          <h3>🎯 Aktif Segment'ler</h3>
          <div className="active-list">
            {activeSegments.map(segment => (
              <div key={segment.id} className="active-item">
                <div className="active-header">
                  <span className="segment-id">Segment {segment.id}</span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(segment.status) }}
                  >
                    {segment.status}
                  </span>
                </div>
                <div className="active-details">
                  <p><strong>Worker'lar:</strong> {segment.workerTypes.join(', ')}</p>
                  <p><strong>Tamamlanan:</strong> {segment.completedWorkers.join(', ') || 'Yok'}</p>
                  <p><strong>Başarısız:</strong> {segment.failedWorkers.join(', ') || 'Yok'}</p>
                  <p><strong>Başlangıç:</strong> {formatDate(segment.startedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <h4>❌ Hata</h4>
          <p>{error}</p>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="results-section">
          <h3>✅ Sonuçlar</h3>
          <div className="results-content">
            <p><strong>Segment ID:</strong> {results.segmentId}</p>
            <p><strong>Başarılı:</strong> {results.success ? 'Evet' : 'Hayır'}</p>
            
            {results.results && Object.keys(results.results).length > 0 && (
              <div className="worker-results">
                <h4>Worker Sonuçları:</h4>
                {Object.entries(results.results).map(([workerType, result]) => (
                  <div key={workerType} className="worker-result">
                    <h5>{workerType}</h5>
                    <p><strong>Task ID:</strong> {result.taskId}</p>
                    <p><strong>Başarılı:</strong> {result.workerResult?.success ? 'Evet' : 'Hayır'}</p>
                    {result.workerResult?.error && (
                      <p><strong>Hata:</strong> {result.workerResult.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ConcurrencyControlTest 