import React, { useState, useRef } from 'react'
import { masterPipelineService } from '../../services/masterPipelineService'
import { useAuth } from '../../hooks/useAuth'
import './FullPipelineTest.css'

const FullPipelineTest = () => {
  const { user } = useAuth()
  const [selectedFile, setSelectedFile] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [pipelineId, setPipelineId] = useState(null)
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [pipelineHistory, setPipelineHistory] = useState([])
  const fileInputRef = useRef(null)

  const stages = [
    { name: 'PDF Upload & Validation', weight: 5 },
    { name: 'Document Understanding', weight: 15 },
    { name: 'Segment Planning', weight: 10 },
    { name: 'PDF Text Extraction', weight: 25 },
    { name: 'Course Structure Generation', weight: 15 },
    { name: 'Course Visual Generation', weight: 20 },
    { name: 'Enhanced Content Generation', weight: 10 }
  ]

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setError(null)
    } else {
      setError('Lütfen geçerli bir PDF dosyası seçin.')
      setSelectedFile(null)
    }
  }

  const handleFileDrop = (event) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setError(null)
    } else {
      setError('Lütfen geçerli bir PDF dosyası seçin.')
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const startPipeline = async () => {
    if (!selectedFile || !user) {
      setError('PDF dosyası seçin ve giriş yapın.')
      return
    }

    setIsRunning(true)
    setProgress(0)
    setCurrentStage('Başlatılıyor...')
    setResult(null)
    setError(null)

    try {
      console.log('🚀 Full Pipeline başlatılıyor...')
      
      const pipelineResult = await masterPipelineService.runFullPipeline(selectedFile, user.id)
      
      if (pipelineResult.success) {
        setPipelineId(pipelineResult.pipelineId)
        setResult(pipelineResult)
        setProgress(100)
        setCurrentStage('Tamamlandı!')
        
        // Pipeline geçmişini güncelle
        loadPipelineHistory()
        
        console.log('✅ Pipeline başarıyla tamamlandı:', pipelineResult)
      } else {
        setError(pipelineResult.error || 'Pipeline sırasında hata oluştu.')
        setProgress(pipelineResult.progress || 0)
        setCurrentStage('Hata!')
      }
    } catch (error) {
      console.error('❌ Pipeline hatası:', error)
      setError(error.message || 'Beklenmeyen bir hata oluştu.')
      setCurrentStage('Hata!')
    } finally {
      setIsRunning(false)
    }
  }

  const loadPipelineHistory = async () => {
    if (!user) return

    try {
      const historyResult = await masterPipelineService.getUserPipelines(user.id)
      if (historyResult.success) {
        setPipelineHistory(historyResult.data)
      }
    } catch (error) {
      console.error('Pipeline geçmişi yüklenemedi:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return '#10b981'
      case 'FAILED': return '#ef4444'
      case 'IN_PROGRESS': return '#3b82f6'
      case 'STARTED': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A'
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    
    if (minutes > 0) {
      return `${minutes}d ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  React.useEffect(() => {
    loadPipelineHistory()
  }, [user])

  return (
    <div className="full-pipeline-test">
      <div className="pipeline-header">
        <h2>🚀 Full Pipeline Test</h2>
        <p>PDF yükleyin ve tek tıkla tam eğitim kursu oluşturun!</p>
      </div>

      <div className="pipeline-container">
        {/* File Upload Section */}
        <div className="upload-section">
          <div 
            className={`file-drop-zone ${selectedFile ? 'has-file' : ''}`}
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {selectedFile ? (
              <div className="file-info">
                <div className="file-icon">📄</div>
                <div className="file-details">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">{formatFileSize(selectedFile.size)}</div>
                </div>
                <button 
                  className="change-file-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                    fileInputRef.current.value = ''
                  }}
                >
                  Değiştir
                </button>
              </div>
            ) : (
              <div className="upload-prompt">
                <div className="upload-icon">📁</div>
                <div className="upload-text">
                  <strong>PDF dosyasını buraya sürükleyin</strong>
                  <span>veya tıklayarak seçin</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <button
            className="start-pipeline-btn"
            onClick={startPipeline}
            disabled={!selectedFile || isRunning || !user}
          >
            {isRunning ? '🔄 İşleniyor...' : '🚀 Ders Oluştur'}
          </button>
        </div>

        {/* Progress Section */}
        {isRunning && (
          <div className="progress-section">
            <div className="progress-header">
              <h3>Pipeline İlerlemesi</h3>
              <div className="pipeline-id">ID: {pipelineId}</div>
            </div>

            <div className="progress-bar-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-text">{progress}%</div>
            </div>

            <div className="current-stage">
              <strong>Mevcut Aşama:</strong> {currentStage}
            </div>

            <div className="stages-list">
              {stages.map((stage, index) => (
                <div key={index} className="stage-item">
                  <div className="stage-name">{stage.name}</div>
                  <div className="stage-weight">{stage.weight}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="result-section">
            <div className="result-header">
              <h3>✅ Pipeline Tamamlandı!</h3>
              <div className="result-meta">
                <span>Document ID: {result.documentId}</span>
                <span>Pipeline ID: {result.pipelineId}</span>
              </div>
            </div>

            <div className="result-details">
              <div className="result-item">
                <strong>Oluşturulan Segment Sayısı:</strong> 
                {result.data.segments?.length || 0}
              </div>
              <div className="result-item">
                <strong>Kurs Yapısı:</strong> 
                {result.data.courseStructure?.chapters?.length || 0} Bölüm
              </div>
              <div className="result-item">
                <strong>Görsel Sayısı:</strong> 
                {result.data.courseImages?.length || 0}
              </div>
              <div className="result-item">
                <strong>Gelişmiş İçerik:</strong> 
                {result.data.enhancedContent ? '✅ Oluşturuldu' : '❌ Oluşturulamadı'}
              </div>
            </div>

            <div className="result-actions">
              <button className="view-course-btn">
                👁️ Kursu Görüntüle
              </button>
              <button className="download-course-btn">
                📥 Kursu İndir
              </button>
            </div>
          </div>
        )}

        {/* Pipeline History */}
        {pipelineHistory.length > 0 && (
          <div className="history-section">
            <h3>📋 Pipeline Geçmişi</h3>
            <div className="history-list">
              {pipelineHistory.slice(0, 5).map((pipeline) => (
                <div key={pipeline.id} className="history-item">
                  <div className="history-status">
                    <div 
                      className="status-dot"
                      style={{ backgroundColor: getStatusColor(pipeline.status) }}
                    ></div>
                    <span className="status-text">{pipeline.status}</span>
                  </div>
                  <div className="history-details">
                    <div className="history-stage">{pipeline.current_stage}</div>
                    <div className="history-progress">{pipeline.progress_percentage}%</div>
                    <div className="history-time">
                      {formatDuration(pipeline.duration_seconds)}
                    </div>
                  </div>
                  <div className="history-date">
                    {new Date(pipeline.started_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FullPipelineTest 