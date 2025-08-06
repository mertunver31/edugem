import React, { useState, useRef, useEffect } from 'react'
import { masterPipelineService } from '../../services/masterPipelineService'
import mindMapGeneratorService from '../../services/mindMapGeneratorService'
import learningPathGeneratorService from '../../services/learningPathGeneratorService'
import { useAuth } from '../../hooks/useAuth'
import { getCurrentUser } from '../../services/authService'
import { supabase } from '../../config/supabase'
import mindMapService from '../../services/mindMapService'
import learningPathService from '../../services/learningPathService'
import CustomButton from '../../components/CustomButton/CustomButton'
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
  
  // Derslerim için state'ler
  const [documents, setDocuments] = useState([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [showDocumentDetail, setShowDocumentDetail] = useState(false)
  const [mindMap, setMindMap] = useState(null)
  const [learningPath, setLearningPath] = useState(null)
  const [isLoadingMindMap, setIsLoadingMindMap] = useState(false)
  const [isLoadingLearningPath, setIsLoadingLearningPath] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  const [activeSection, setActiveSection] = useState('courses') // 'courses' veya 'create'

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setIsLoadingDocuments(true)
    try {
      const userResult = await getCurrentUser()
      if (!userResult.success) {
        throw new Error('Kullanıcı bilgileri alınamadı')
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userResult.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Dökümanlar alınamadı: ${error.message}`)
      }

      setDocuments(data || [])
    } catch (error) {
      console.error('Döküman yükleme hatası:', error)
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  const handleDocumentClick = async (document) => {
    setSelectedDocument(document)
    setShowDocumentDetail(true)
    setActiveTab('content')
    
    // Mind Map ve Learning Path verilerini yükle
    await loadMindMapAndLearningPath(document.id)
  }

  const loadMindMapAndLearningPath = async (documentId) => {
    try {
      console.log('🧠 Mind map ve learning path yükleniyor:', documentId)
      
      // Mind map verilerini yükle
      const mindMapResult = await mindMapService.getAllMindMaps(documentId)
      if (mindMapResult.success && mindMapResult.data.length > 0) {
        const latestMindMap = mindMapResult.data[0]
        setMindMap(latestMindMap)
        console.log('✅ Mind map verisi yüklendi:', latestMindMap)
      }
      
      // Learning path verilerini yükle
      const learningPathResult = await learningPathService.getAllLearningPaths(documentId)
      if (learningPathResult.success && learningPathResult.data.length > 0) {
        const latestLearningPath = learningPathResult.data[0]
        setLearningPath(latestLearningPath)
        console.log('✅ Learning path verisi yüklendi:', latestLearningPath)
      }
    } catch (error) {
      console.error('❌ Mind map ve learning path yükleme hatası:', error)
    }
  }

  const handleCloseDocumentDetail = () => {
    setShowDocumentDetail(false)
    setSelectedDocument(null)
    setMindMap(null)
    setLearningPath(null)
  }

  const handleDeleteDocument = async (documentId, event) => {
    event.stopPropagation()
    
    if (!confirm('Bu dersi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (error) {
        throw new Error(`Ders silme hatası: ${error.message}`)
      }

      // Documents listesini güncelle
      setDocuments(documents.filter(doc => doc.id !== documentId))
      console.log('✅ Ders başarıyla silindi')
    } catch (error) {
      console.error('❌ Ders silme hatası:', error)
      alert('Ders silinirken hata oluştu: ' + error.message)
    }
  }

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
      
      // Master pipeline'ı başlat
      const pipelineResult = await masterPipelineService.runFullPipeline(selectedFile, user.id, courseTitle.trim())
      
      // Master pipeline sonucunu kontrol et
      if (pipelineResult.success) {
        setCourseResult(pipelineResult)
        setProgress(100)
        setCurrentStage('Tamamlandı!')
        setCourseCreated(true)
        
        console.log('✅ Ders başarıyla oluşturuldu:', pipelineResult)
        
        // Master pipeline başarılı olduktan sonra mind map ve learning path oluştur
        try {
          console.log('🧠🛤️ Mind Map ve Learning Path oluşturma başlatılıyor...')
          
          // Document ID'yi al
          const documentId = pipelineResult.documentId || pipelineResult.data?.documentId
          
          if (documentId) {
            const mindMapLearningPathResult = await createMindMapAndLearningPathWithDocumentId(
              selectedFile, 
              courseTitle.trim(), 
              documentId
            )
            
            if (mindMapLearningPathResult.success) {
              console.log('✅ Mind Map ve Learning Path oluşturuldu:', mindMapLearningPathResult)
            } else {
              console.warn('⚠️ Mind Map ve Learning Path oluşturulamadı:', mindMapLearningPathResult.error)
            }
          } else {
            console.warn('⚠️ Document ID bulunamadı, Mind Map ve Learning Path oluşturulamadı')
          }
        } catch (error) {
          console.error('❌ Mind Map ve Learning Path oluşturma hatası:', error)
        }
      } else {
        const error = pipelineResult.status === 'rejected' ? pipelineResult.reason : pipelineResult.value?.error
        setError(error || 'Ders oluşturma sırasında hata oluştu.')
        setProgress(pipelineResult.value?.progress || 0)
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

  const createMindMapAndLearningPathWithDocumentId = async (pdfFile, courseTitle, documentId) => {
    try {
      console.log('🧠🛤️ Mind Map ve Learning Path oluşturma başlatılıyor (Document ID ile)...')
      
      // PDF'i base64'e çevir
      const base64PDF = await fileToBase64(pdfFile)
      
      // Mind Map oluştur (documentId ile)
      const mindMapOptions = {
        documentId: documentId,
        courseTitle: courseTitle,
        type: 'course_mindmap',
        maxBranches: 6,
        maxSubtopics: 3
      }
      
      const mindMapResult = await mindMapGeneratorService.generateMindMap(mindMapOptions)
      
      // Learning Path oluştur (documentId ile)
      const learningPathOptions = {
        documentId: documentId,
        courseTitle: courseTitle,
        maxSteps: 6,
        difficultyLevel: 'intermediate',
        targetAudience: 'genel'
      }
      
      const learningPathResult = await learningPathGeneratorService.generateLearningPath(learningPathOptions)
      
      return {
        success: true,
        mindMap: mindMapResult,
        learningPath: learningPathResult
      }
      
    } catch (error) {
      console.error('❌ Mind Map ve Learning Path oluşturma hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  const createMindMapAndLearningPath = async (pdfFile, courseTitle) => {
    try {
      console.log('🧠🛤️ Mind Map ve Learning Path oluşturma başlatılıyor...')
      
      // PDF'i base64'e çevir
      const base64PDF = await fileToBase64(pdfFile)
      
      // Mind Map oluştur
      const mindMapOptions = {
        pdfContent: base64PDF,
        courseTitle: courseTitle,
        type: 'course_mindmap',
        maxBranches: 6,
        maxSubtopics: 3
      }
      
      const mindMapResult = await mindMapGeneratorService.generateMindMapFromPDF(mindMapOptions)
      
      // Learning Path oluştur
      const learningPathOptions = {
        pdfContent: base64PDF,
        courseTitle: courseTitle,
        maxSteps: 6,
        difficultyLevel: 'intermediate',
        targetAudience: 'genel'
      }
      
      const learningPathResult = await learningPathGeneratorService.generateLearningPathFromPDF(learningPathOptions)
      
      return {
        success: true,
        mindMap: mindMapResult,
        learningPath: learningPathResult
      }
      
    } catch (error) {
      console.error('❌ Mind Map ve Learning Path oluşturma hatası:', error)
      return {
        success: false,
        error: error.message
      }
      }
    }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result.split(',')[1] // data:application/pdf;base64, kısmını çıkar
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
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
          <h1>📚 Derslerim / Ders Oluştur</h1>
          <p>Mevcut derslerinizi görüntüleyin veya yeni ders oluşturun</p>
          
          {/* Section Toggle Buttons */}
          <div className="section-toggle">
            <CustomButton
              text="📚 Derslerim"
              onClick={() => setActiveSection('courses')}
              variant={activeSection === 'courses' ? 'primary' : 'secondary'}
              className="toggle-btn"
            />
            <CustomButton
              text="➕ Yeni Ders Oluştur"
              onClick={() => setActiveSection('create')}
              variant={activeSection === 'create' ? 'primary' : 'secondary'}
              className="toggle-btn"
            />
          </div>
        </div>

        {/* Derslerim Section */}
        {activeSection === 'courses' && (
          <div className="courses-list-section">
            <div className="section-header">
              <h2>Derslerim</h2>
              <p>Yüklediğiniz PDF'lerden oluşturulan enhanced content'leri görüntüleyin</p>
            </div>

            {/* Enhanced Content Dökümanları */}
            <div className="documents-section">
              {isLoadingDocuments ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Dersler yükleniyor...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📚</div>
                  <h3>Henüz ders yok</h3>
                  <p>PDF yükleyerek enhanced content oluşturabilirsiniz</p>
                  <CustomButton
                    text="➕ İlk Dersimi Oluştur"
                    onClick={() => setActiveSection('create')}
                    variant="primary"
                    className="create-first-course-btn"
                  />
                </div>
              ) : (
                <div className="documents-grid">
                  {documents.map((document) => (
                    <div 
                      key={document.id} 
                      className="document-card"
                      onClick={() => handleDocumentClick(document)}
                    >
                      <div className="document-card-header">
                        <div className="document-icon">📄</div>
                        <button 
                          className="delete-btn"
                          onClick={(e) => handleDeleteDocument(document.id, e)}
                          title="Dersi Sil"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="document-info">
                        <h3>{document.course_title || document.file_name}</h3>
                        <p className="document-date">
                          {new Date(document.created_at).toLocaleDateString('tr-TR')}
                        </p>
                        <div className="document-status">
                          {document.enhanced_content ? (
                            <span className="status-badge success">✅ Enhanced Content Hazır</span>
                          ) : (
                            <span className="status-badge pending">⏳ İşleniyor...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Yeni Ders Oluştur Section */}
        {activeSection === 'create' && (
          <div className="course-creation-section">
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
                  <button 
                    className="action-btn primary-btn"
                    onClick={() => {
                      setCourseCreated(false)
                      setSelectedFile(null)
                      setCourseTitle('')
                      setCourseResult(null)
                      setActiveSection('courses')
                      loadDocuments()
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                  >
                    📚 Derslerime Git
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
        )}
      </div>

      {/* Enhanced Content Detay Modal */}
      {showDocumentDetail && selectedDocument && (
        <div className="document-detail-modal">
          <div className="modal-overlay" onClick={handleCloseDocumentDetail}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedDocument.title || selectedDocument.file_name}</h2>
              <div className="modal-actions">
                <button className="close-button" onClick={handleCloseDocumentDetail}>×</button>
              </div>
            </div>
            <div className="modal-body">
              <div className="modal-tabs">
                <div className="tab-buttons">
                  <button className="tab-button active" onClick={() => setActiveTab('content')}>
                    📚 Enhanced Content
                  </button>
                  <button className="tab-button" onClick={() => setActiveTab('mindmap')}>
                    🧠 Mind Map
                  </button>
                  <button className="tab-button" onClick={() => setActiveTab('learningpath')}>
                    🛤️ Learning Path
                  </button>
                </div>
                
                <div className="tab-content">
                  {/* Enhanced Content Tab */}
                  {activeTab === 'content' && (
                    <div className="content-tab">
                      {selectedDocument.enhanced_content ? (
                        <div className="enhanced-content">
                          {selectedDocument.enhanced_content.chapters?.map((chapter, chapterIndex) => (
                            <div key={chapterIndex} className="chapter-section">
                              <h3 className="chapter-title">📖 {chapter.title}</h3>
                              {chapter.content?.lessons?.map((lesson, lessonIndex) => (
                                <div key={lessonIndex} className="lesson-section">
                                  <h4 className="lesson-title">🎯 {lesson.title}</h4>
                                  <div className="lesson-content">
                                    {lesson.content?.explanatory_text && (
                                      <div className="content-section">
                                        <h5>📝 Açıklayıcı Metin</h5>
                                        <p>{lesson.content.explanatory_text}</p>
                                      </div>
                                    )}
                                    {lesson.content?.key_points?.length > 0 && (
                                      <div className="content-section">
                                        <h5>✅ Anahtar Noktalar</h5>
                                        <ul>
                                          {lesson.content.key_points.map((point, pointIndex) => (
                                            <li key={pointIndex}>{point}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {lesson.content?.tables?.length > 0 && (
                                      <div className="content-section">
                                        <h5>📊 Tablolar</h5>
                                        {lesson.content.tables.map((table, tableIndex) => (
                                          <div key={tableIndex} className="table-container">
                                            <h6>{table.title}</h6>
                                            <table>
                                              {table.headers && (
                                                <thead>
                                                  <tr>
                                                    {table.headers.map((header, headerIndex) => (
                                                      <th key={headerIndex}>{header}</th>
                                                    ))}
                                                  </tr>
                                                </thead>
                                              )}
                                              <tbody>
                                                {table.rows?.map((row, rowIndex) => (
                                                  <tr key={rowIndex}>
                                                    {row.map((cell, cellIndex) => (
                                                      <td key={cellIndex}>{cell}</td>
                                                    ))}
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {lesson.content?.code_examples?.length > 0 && (
                                      <div className="content-section">
                                        <h5>💻 Kod Örnekleri</h5>
                                        {lesson.content.code_examples.map((example, exampleIndex) => (
                                          <div key={exampleIndex} className="code-example">
                                            <h6>{example.title}</h6>
                                            <pre><code className={`language-${example.language}`}>{example.code}</code></pre>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {lesson.content?.practical_examples?.length > 0 && (
                                      <div className="content-section">
                                        <h5>🔍 Pratik Örnekler</h5>
                                        {lesson.content.practical_examples.map((example, exampleIndex) => (
                                          <div key={exampleIndex} className="practical-example">
                                            <h6>{example.title}</h6>
                                            <p>{example.description}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {lesson.content?.summary && (
                                      <div className="content-section">
                                        <h5>📋 Özet</h5>
                                        <p>{lesson.content.summary}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-content">
                          <div className="no-content-icon">⏳</div>
                          <h3>Enhanced Content Henüz Hazır Değil</h3>
                          <p>PDF işleniyor ve enhanced content oluşturuluyor. Lütfen biraz bekleyin.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mind Map Tab */}
                  {activeTab === 'mindmap' && (
                    <div className="mindmap-tab">
                      {isLoadingMindMap ? (
                        <div className="loading-state">
                          <div className="loading-spinner"></div>
                          <p>Mind Map yükleniyor...</p>
                        </div>
                      ) : mindMap ? (
                        <div className="mindmap-content">
                          <h3>🧠 {mindMap.title}</h3>
                          <p className="mindmap-central-topic">Merkezi Konu: {mindMap.central_topic}</p>
                          
                          {/* JSON Content Display */}
                          <div className="json-content-section">
                            <h4>📋 Mind Map JSON Yapısı</h4>
                            <div className="json-display">
                              <pre className="json-code">
                                {JSON.stringify(mindMap.content, null, 2)}
                              </pre>
                            </div>
                          </div>
                          
                          {/* Parsed Content Display */}
                          <div className="parsed-content-section">
                            <h4>🌳 Mind Map Ağacı</h4>
                            <div className="mindmap-branches">
                              {mindMap.content?.branches?.map((branch, index) => (
                                <div key={index} className="mindmap-branch">
                                  <div className="branch-header">
                                    <h4>{branch.topic}</h4>
                                    {branch.importance && (
                                      <span className="importance-badge">Önem: {Math.round(branch.importance * 100)}%</span>
                                    )}
                                  </div>
                                  <div className="branch-subtopics">
                                    {branch.subtopics?.map((subtopic, subIndex) => (
                                      <div key={subIndex} className="subtopic-item">
                                        • {subtopic}
                                      </div>
                                    ))}
                                  </div>
                                  {branch.connections?.length > 0 && (
                                    <div className="branch-connections">
                                      <small>Bağlantılar: {branch.connections.join(', ')}</small>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Metadata Display */}
                          {mindMap.content?.metadata && (
                            <div className="metadata-section">
                              <h4>📊 Meta Veriler</h4>
                              <div className="metadata-grid">
                                <div className="metadata-item">
                                  <strong>Toplam Dal:</strong> {mindMap.content.metadata.total_branches}
                                </div>
                                <div className="metadata-item">
                                  <strong>Toplam Alt Konu:</strong> {mindMap.content.metadata.total_subtopics}
                                </div>
                                <div className="metadata-item">
                                  <strong>Oluşturulma Tarihi:</strong> {new Date(mindMap.content.metadata.generated_at).toLocaleString('tr-TR')}
                                </div>
                                <div className="metadata-item">
                                  <strong>Model:</strong> {mindMap.content.metadata.model_used}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="no-content">
                          <div className="no-content-icon">🧠</div>
                          <h3>Mind Map Henüz Oluşturulmadı</h3>
                          <p>Bu ders için henüz mind map oluşturulmamış.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Learning Path Tab */}
                  {activeTab === 'learningpath' && (
                    <div className="learningpath-tab">
                      {isLoadingLearningPath ? (
                        <div className="loading-state">
                          <div className="loading-spinner"></div>
                          <p>Learning Path yükleniyor...</p>
                        </div>
                      ) : learningPath ? (
                        <div className="learningpath-content">
                          <h3>🛤️ {learningPath.title}</h3>
                          <p className="learningpath-description">{learningPath.description}</p>
                          
                          {/* JSON Content Display */}
                          <div className="json-content-section">
                            <h4>📋 Learning Path JSON Yapısı</h4>
                            <div className="json-display">
                              <pre className="json-code">
                                {JSON.stringify(learningPath.steps, null, 2)}
                              </pre>
                            </div>
                          </div>
                          
                          {/* Parsed Content Display */}
                          <div className="parsed-content-section">
                            <h4>🛤️ Öğrenme Yolu</h4>
                            
                            <div className="learningpath-info">
                              <div className="info-item">
                                <strong>Zorluk Seviyesi:</strong> {learningPath.difficulty_level}
                              </div>
                              <div className="info-item">
                                <strong>Tahmini Süre:</strong> {learningPath.estimated_duration}
                              </div>
                              {learningPath.prerequisites?.length > 0 && (
                                <div className="info-item">
                                  <strong>Ön Koşullar:</strong>
                                  <ul>
                                    {learningPath.prerequisites.map((prereq, index) => (
                                      <li key={index}>{prereq}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            
                            <div className="learningpath-steps">
                              <h4>Öğrenme Adımları</h4>
                              {learningPath.steps?.map((step, index) => (
                                <div key={index} className="learning-step">
                                  <div className="step-header">
                                    <h5>Adım {step.step}: {step.title}</h5>
                                    <span className="step-duration">{step.duration}</span>
                                  </div>
                                  <div className="step-content">
                                    {step.chapters?.length > 0 && (
                                      <div className="step-chapters">
                                        <strong>Bölümler:</strong>
                                        <ul>
                                          {step.chapters.map((chapter, chapIndex) => (
                                            <li key={chapIndex}>{chapter}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {step.prerequisites?.length > 0 && (
                                      <div className="step-prerequisites">
                                        <strong>Ön Koşullar:</strong>
                                        <ul>
                                          {step.prerequisites.map((prereq, prereqIndex) => (
                                            <li key={prereqIndex}>{prereq}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {step.objectives?.length > 0 && (
                                      <div className="step-objectives">
                                        <strong>Hedefler:</strong>
                                        <ul>
                                          {step.objectives.map((objective, objIndex) => (
                                            <li key={objIndex}>{objective}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {step.activities?.length > 0 && (
                                      <div className="step-activities">
                                        <strong>Aktiviteler:</strong>
                                        <ul>
                                          {step.activities.map((activity, actIndex) => (
                                            <li key={actIndex}>{activity}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Metadata Display */}
                          {learningPath.metadata && (
                            <div className="metadata-section">
                              <h4>📊 Meta Veriler</h4>
                              <div className="metadata-grid">
                                <div className="metadata-item">
                                  <strong>Toplam Adım:</strong> {learningPath.metadata.total_steps}
                                </div>
                                <div className="metadata-item">
                                  <strong>Toplam Süre (Saat):</strong> {learningPath.metadata.total_duration_hours}
                                </div>
                                <div className="metadata-item">
                                  <strong>Oluşturulma Tarihi:</strong> {new Date(learningPath.metadata.generated_at).toLocaleString('tr-TR')}
                                </div>
                                <div className="metadata-item">
                                  <strong>Model:</strong> {learningPath.metadata.model_used}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="no-content">
                          <div className="no-content-icon">🛤️</div>
                          <h3>Learning Path Henüz Oluşturulmadı</h3>
                          <p>Bu ders için henüz learning path oluşturulmamış.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateCoursePage