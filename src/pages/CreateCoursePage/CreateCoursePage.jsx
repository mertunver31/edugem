import React, { useState, useRef } from 'react'
import { masterPipelineService } from '../../services/masterPipelineService'
import { useAuth } from '../../hooks/useAuth'
import './CreateCoursePage.css'

const CreateCoursePage = () => {
  const { user } = useAuth()
  const [selectedFile, setSelectedFile] = useState(null)
  const [courseTitle, setCourseTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState('')
  const [error, setError] = useState(null)
  const [courseCreated, setCourseCreated] = useState(false)
  const [courseResult, setCourseResult] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/pdf') {
      // Dosya boyutu kontrolü (20MB)
      if (file.size > 20 * 1024 * 1024) {
        setError('Dosya boyutu 20MB\'dan büyük olamaz!')
        return
      }
      
      setSelectedFile(file)
      setError(null)
      setCourseCreated(false)
    } else {
      setError('Lütfen geçerli bir PDF dosyası seçin.')
      setSelectedFile(null)
    }
  }

  const handleFileDrop = (event) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      // Dosya boyutu kontrolü (20MB)
      if (file.size > 20 * 1024 * 1024) {
        setError('Dosya boyutu 20MB\'dan büyük olamaz!')
        return
      }
      
      setSelectedFile(file)
      setError(null)
      setCourseCreated(false)
    } else {
      setError('Lütfen geçerli bir PDF dosyası seçin.')
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }
    
  const startCourseCreation = async () => {
    if (!selectedFile || !user) {
      setError('PDF dosyası seçin ve giriş yapın.')
      return
    }

    if (!courseTitle.trim()) {
      setError('Lütfen dersin adını girin.')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setCurrentStage('Başlatılıyor...')
    setError(null)
    setCourseCreated(false)

    try {
      console.log('🚀 Ders oluşturma başlatılıyor...')
      
      const pipelineResult = await masterPipelineService.runFullPipeline(selectedFile, user.id, courseTitle.trim())
      
      if (pipelineResult.success) {
        setCourseResult(pipelineResult)
        setProgress(100)
        setCurrentStage('Tamamlandı!')
        setCourseCreated(true)
        
        console.log('✅ Ders başarıyla oluşturuldu:', pipelineResult)
      } else {
        setError(pipelineResult.error || 'Ders oluşturma sırasında hata oluştu.')
        setProgress(pipelineResult.progress || 0)
        setCurrentStage('Hata!')
      }
    } catch (error) {
      console.error('❌ Ders oluşturma hatası:', error)
      setError(error.message || 'Beklenmeyen bir hata oluştu.')
      setCurrentStage('Hata!')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="create-course-page">
      <div className="courses-section">
        <div className="section-header">
          <h1>📚 Akıllı Ders Oluşturucu</h1>
          <p>PDF'inizi yükleyin, AI sizin için mükemmel bir ders hazırlasın!</p>
        </div>

        {!courseCreated ? (
          <div className="course-creation-container">
            {/* PDF Upload Alanı */}
            <div className="upload-section">
              <div 
                className={`upload-area ${selectedFile ? 'has-file' : ''}`}
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="file-selected">
                    <div className="file-icon">📄</div>
                    <div className="file-info">
                      <h3>{selectedFile.name}</h3>
                      <p>{formatFileSize(selectedFile.size)}</p>
            </div>
                    <button 
                      className="change-file-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                    >
                      Değiştir
                    </button>
          </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📎</div>
                    <h3>PDF'inizi buraya sürükleyin veya tıklayın</h3>
                    <p>Maksimum dosya boyutu: 20MB</p>
                    <p>Sadece PDF formatı desteklenir</p>
            </div>
                )}
        </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {error && (
                <div className="error-message">
                  ❌ {error}
                </div>
              )}
                </div>

            {/* Ders Adı Giriş Alanı */}
            <div className="course-title-section">
              <div className="input-group">
                <label htmlFor="courseTitle" className="input-label">
                  📚 Dersin Adı
                </label>
                <input
                  id="courseTitle"
                  type="text"
                  className="course-title-input"
                  placeholder="Örn: Matematik 101, Fizik Temelleri, Kimya Laboratuvarı..."
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  maxLength={255}
                />
                <p className="input-help">
                  Bu isim Supabase'de dersinizi tanımlamak için kullanılacak
                </p>
              </div>
            </div>

            {/* Ders Oluştur Butonu */}
            <div className="create-section">
              <button
                className="create-course-btn"
                onClick={startCourseCreation}
                disabled={!selectedFile || !courseTitle.trim() || isProcessing || !user}
              >
                {isProcessing ? '🔄 İşleniyor...' : '🚀 Dersimi Oluştur'}
                </button>
              <p className="create-note">
                AI, PDF'inizi analiz edip size özel bir ders hazırlayacak
              </p>
            </div>

            {/* Progress Section */}
            {isProcessing && (
              <div className="progress-section">
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

                <div className="processing-stages">
                  <div className="stage-item">
                    <span className="stage-icon">📖</span>
                    <span className="stage-text">PDF analiz ediliyor...</span>
              </div>
                  <div className="stage-item">
                    <span className="stage-icon">🏗️</span>
                    <span className="stage-text">Ders yapısı oluşturuluyor...</span>
              </div>
                  <div className="stage-item">
                    <span className="stage-icon">🎨</span>
                    <span className="stage-text">Görseller hazırlanıyor...</span>
            </div>
                  <div className="stage-item">
                    <span className="stage-icon">📚</span>
                    <span className="stage-text">İçerik zenginleştiriliyor...</span>
                </div>
                </div>
              </div>
            )}
            </div>
        ) : (
          /* Ders Oluşturuldu Sayfası */
          <div className="course-created-container">
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h2>Dersiniz Başarıyla Oluşturuldu!</h2>
              <p>AI, PDF'inizi analiz edip size özel bir ders hazırladı.</p>
            </div>

            {courseResult && (
              <div className="course-summary">
                <div className="summary-card">
                  <h3>📚 Ders Özeti</h3>
                  <div className="summary-items">
                    <div className="summary-item">
                      <span className="item-icon">📖</span>
                      <span className="item-label">Bölüm Sayısı:</span>
                      <span className="item-value">
                        {courseResult.data?.courseStructure?.chapters?.length || 0}
                      </span>
              </div>
                    <div className="summary-item">
                      <span className="item-icon">📝</span>
                      <span className="item-label">Ders Sayısı:</span>
                      <span className="item-value">
                        {courseResult.data?.courseStructure?.chapters?.reduce((total, chapter) => 
                          total + (chapter.lessons?.length || 0), 0) || 0}
                      </span>
              </div>
                    <div className="summary-item">
                      <span className="item-icon">🖼️</span>
                      <span className="item-label">Görsel Materyal:</span>
                      <span className="item-value">
                        {courseResult.data?.courseImages?.length || 0}
                      </span>
            </div>
                    <div className="summary-item">
                      <span className="item-icon">⏱️</span>
                      <span className="item-label">Tahmini Süre:</span>
                      <span className="item-value">
                        {courseResult.data?.courseStructure?.estimatedDuration || '8-10 saat'}
                      </span>
              </div>
            </div>
                </div>
              </div>
            )}

            <div className="course-actions">
              <button className="action-btn primary-btn">
                🚀 Derse Başla
              </button>
              <button className="action-btn secondary-btn">
                📋 Ders Detayları
              </button>
              <button 
                className="action-btn secondary-btn"
                onClick={() => {
                  setCourseCreated(false)
                  setSelectedFile(null)
                  setCourseTitle('')
                  setCourseResult(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
              >
                ➕ Yeni Ders Oluştur
                  </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateCoursePage