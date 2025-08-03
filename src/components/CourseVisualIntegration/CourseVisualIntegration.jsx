import React, { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import { courseStructureService } from '../../services/courseStructureService'
import { courseVisualService } from '../../services/courseVisualService'
import './CourseVisualIntegration.css'

const CourseVisualIntegration = () => {
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState('')
  const [courseStructure, setCourseStructure] = useState(null)
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [userProgress, setUserProgress] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [visualPrompts, setVisualPrompts] = useState(null)
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false)
  const [courseImages, setCourseImages] = useState(null)
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [isFullIntegrationTest, setIsFullIntegrationTest] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    if (selectedDocument) {
      loadCourseStructure()
    }
  }, [selectedDocument])

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, file_path, status, course_structure_generated_at')
        .not('course_structure_generated_at', 'is', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Document yükleme hatası:', error)
        return
      }

      setDocuments(data || [])
    } catch (error) {
      console.error('Document yükleme hatası:', error)
    }
  }

  const loadCourseStructure = async () => {
    if (!selectedDocument) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await courseStructureService.getCourseStructure(selectedDocument)
      
      if (result.success) {
        setCourseStructure(result.data.courseStructure)
        // İlk bölümü seç
        if (result.data.courseStructure.chapters.length > 0) {
          setSelectedChapter(result.data.courseStructure.chapters[0])
        }
        
        // Görsel prompt'ları da yükle
        await loadVisualPrompts()
        
        // Kurs görsellerini de yükle
        await loadCourseImages()
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadVisualPrompts = async () => {
    if (!selectedDocument) return

    try {
      const result = await courseVisualService.getVisualPrompts(selectedDocument)
      if (result.success) {
        setVisualPrompts(result.data.visualPrompts)
      }
    } catch (error) {
      console.error('Görsel prompt\'lar yüklenemedi:', error)
    }
  }

  const loadCourseImages = async () => {
    if (!selectedDocument) return

    try {
      const result = await courseVisualService.getCourseImages(selectedDocument)
      if (result.success) {
        setCourseImages(result.data.courseImages)
      }
    } catch (error) {
      console.error('Kurs görselleri yüklenemedi:', error)
    }
  }

  const generateVisualPrompts = async () => {
    if (!selectedDocument) {
      setError('Lütfen bir kurs seçin')
      return
    }

    setIsGeneratingPrompts(true)
    setError(null)

    try {
      console.log('🎨 Görsel prompt\'lar üretiliyor...')
      const result = await courseVisualService.generateVisualPrompts(selectedDocument)

      if (result.success) {
        setVisualPrompts(result.visualPrompts)
        console.log('✅ Görsel prompt\'lar başarıyla üretildi:', result)
      } else {
        setError(result.error)
        console.error('❌ Görsel prompt\'lar üretilemedi:', result.error)
      }
    } catch (error) {
      setError(error.message)
      console.error('Görsel prompt\'lar üretme hatası:', error)
    } finally {
      setIsGeneratingPrompts(false)
    }
  }

  const generateCourseImages = async () => {
    if (!selectedDocument) {
      setError('Lütfen bir kurs seçin')
      return
    }

    if (!visualPrompts || visualPrompts.length === 0) {
      setError('Önce görsel prompt\'ları üretin')
      return
    }

    setIsGeneratingImages(true)
    setError(null)

    try {
      console.log('🎨 Kurs görselleri üretiliyor...')
      const result = await courseVisualService.generateCourseImages(selectedDocument)

      if (result.success) {
        setCourseImages(result.generatedImages)
        console.log('✅ Kurs görselleri başarıyla üretildi:', result)
        alert(`Görsel üretimi tamamlandı!\n\nToplam Bölüm: ${result.metadata.totalChapters}\nToplam Görsel: ${result.metadata.totalImages}\nBaşarılı: ${result.metadata.successfulImages}\nBaşarı Oranı: %${result.metadata.successRate}`)
      } else {
        setError(result.error)
        console.error('❌ Kurs görselleri üretilemedi:', result.error)
      }
    } catch (error) {
      setError(error.message)
      console.error('Kurs görselleri üretme hatası:', error)
    } finally {
      setIsGeneratingImages(false)
    }
  }

  const testVisualIntegration = async () => {
    if (!selectedDocument) {
      setError('Lütfen bir kurs seçin')
      return
    }

    setIsGeneratingPrompts(true)
    setError(null)

    try {
      console.log('🧪 Course Visual Integration test ediliyor...')
      const result = await courseVisualService.testVisualIntegration(selectedDocument)

      if (result.success) {
        setVisualPrompts(result.visualPrompts)
        console.log('✅ Course Visual Integration test başarılı:', result)
        alert(`Test başarılı!\n\nToplam Bölüm: ${result.metadata.totalChapters}\nToplam Prompt: ${result.metadata.totalPrompts}\n\nValidation: ${result.validation.isValid ? '✅ Geçerli' : '❌ Hatalı'}`)
      } else {
        setError(result.error)
        console.error('❌ Course Visual Integration test başarısız:', result.error)
      }
    } catch (error) {
      setError(error.message)
      console.error('Course Visual Integration test hatası:', error)
    } finally {
      setIsGeneratingPrompts(false)
    }
  }

  const testFullVisualIntegration = async () => {
    if (!selectedDocument) {
      setError('Lütfen bir kurs seçin')
      return
    }

    setIsFullIntegrationTest(true)
    setError(null)

    try {
      console.log('🧪 Tam Course Visual Integration test ediliyor...')
      const result = await courseVisualService.testFullVisualIntegration(selectedDocument)

      if (result.success) {
        setVisualPrompts(result.prompts)
        setCourseImages(result.images)
        console.log('✅ Tam Course Visual Integration test başarılı:', result)
        
        const evaluation = result.evaluation
        alert(`Tam Test Başarılı!\n\n📊 Değerlendirme Sonuçları:\nGenel Skor: %${evaluation.overallScore}\nPrompt Kalitesi: %${evaluation.promptQuality}\nGörsel Kalitesi: %${evaluation.imageQuality}\nEntegrasyon Kalitesi: %${evaluation.integrationQuality}\n\n📈 İstatistikler:\nToplam Bölüm: ${result.metadata.totalChapters}\nToplam Prompt: ${result.metadata.totalPrompts}\nToplam Görsel: ${result.metadata.totalImages}\nBaşarılı Görsel: ${result.metadata.successfulImages}\nBaşarı Oranı: %${result.metadata.successRate}`)
      } else {
        setError(result.error)
        console.error('❌ Tam Course Visual Integration test başarısız:', result.error)
      }
    } catch (error) {
      setError(error.message)
      console.error('Tam Course Visual Integration test hatası:', error)
    } finally {
      setIsFullIntegrationTest(false)
    }
  }

  const handleChapterSelect = (chapter) => {
    setSelectedChapter(chapter)
    setSelectedLesson(null)
  }

  const handleLessonSelect = (lesson) => {
    setSelectedLesson(lesson)
    // Progress güncelle
    setUserProgress(prev => ({
      ...prev,
      [lesson.id]: Math.min((prev[lesson.id] || 0) + 10, 100)
    }))
  }

  const getProgressPercentage = (lessonId) => {
    return userProgress[lessonId] || 0
  }

  const getChapterProgress = (chapter) => {
    if (!chapter.lessons || chapter.lessons.length === 0) return 0
    
    const totalProgress = chapter.lessons.reduce((sum, lesson) => {
      return sum + getProgressPercentage(lesson.id)
    }, 0)
    
    return Math.round(totalProgress / chapter.lessons.length)
  }

  const filteredChapters = courseStructure?.chapters?.filter(chapter => {
    if (!searchQuery) return true
    
    const chapterMatch = chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        chapter.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const lessonMatch = chapter.lessons?.some(lesson => 
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    return chapterMatch || lessonMatch
  }) || []

  const getDocumentStatus = (document) => {
    if (document.course_structure_generated_at) {
      return '✅ Kurs Yapısı Hazır'
    } else {
      return '📄 Yüklendi'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('tr-TR')
  }

  const getChapterImages = (chapterId) => {
    if (!courseImages) return []
    
    const chapterImage = courseImages.find(chapter => chapter.chapterId === chapterId)
    return chapterImage ? chapterImage.images : []
  }

  const getLessonImages = (lessonId) => {
    if (!courseImages) return []
    
    for (const chapterImage of courseImages) {
      const lessonImage = chapterImage.images.find(img => img.lessonId === lessonId)
      if (lessonImage) return [lessonImage]
    }
    
    return []
  }

  return (
    <div className="course-visual-integration">
      <div className="integration-header">
        <h2>🎨 Course Visual Integration</h2>
        <p>Kurs yapısını görsel olarak entegre etme ve kullanıcı deneyimi</p>
      </div>

      <div className="course-selector">
        <div className="document-selector">
          <label htmlFor="document-select">Kurs Seçin:</label>
          <select
            id="document-select"
            value={selectedDocument}
            onChange={(e) => setSelectedDocument(e.target.value)}
          >
            <option value="">Kurs seçin...</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.file_path.split('/').pop()} - {getDocumentStatus(doc)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={loadDocuments}
          className="refresh-btn"
        >
          🔄 Listeyi Yenile
        </button>

        <button
          onClick={generateVisualPrompts}
          disabled={!selectedDocument || isGeneratingPrompts}
          className="generate-prompts-btn"
        >
          {isGeneratingPrompts ? '🎨 Üretiliyor...' : '🎨 Görsel Prompt\'lar Üret'}
        </button>

        <button
          onClick={generateCourseImages}
          disabled={!selectedDocument || !visualPrompts || isGeneratingImages}
          className="generate-images-btn"
        >
          {isGeneratingImages ? '🎨 Görseller Üretiliyor...' : '🎨 Kurs Görselleri Üret'}
        </button>

        <button
          onClick={testVisualIntegration}
          disabled={!selectedDocument || isGeneratingPrompts}
          className="test-integration-btn"
        >
          🧪 Visual Integration Test
        </button>

        <button
          onClick={testFullVisualIntegration}
          disabled={!selectedDocument || isFullIntegrationTest}
          className="test-full-integration-btn"
        >
          {isFullIntegrationTest ? '🧪 Tam Test Yapılıyor...' : '🧪 Tam Visual Integration Test'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <h3>❌ Hata</h3>
          <p>{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="loading-message">
          <h3>🔄 Yükleniyor...</h3>
          <p>Kurs yapısı yükleniyor...</p>
        </div>
      )}

      {courseStructure && (
        <div className="course-visual-container">
          {/* Course Overview */}
          <div className="course-overview-section">
            <div className="course-header">
              <div className="course-title-section">
                <h1>{courseStructure.title}</h1>
                <p className="course-description">{courseStructure.description}</p>
                <div className="course-meta">
                  <span className="difficulty">📊 {courseStructure.difficultyLevel}</span>
                  <span className="duration">⏱️ {courseStructure.estimatedDuration}</span>
                </div>
              </div>
              
              <div className="course-objectives">
                <h3>🎯 Öğrenme Hedefleri</h3>
                <ul>
                  {courseStructure.learningObjectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-section">
            <div className="search-container">
              <input
                type="text"
                placeholder="Bölüm veya ders ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>

          {/* Course Content */}
          <div className="course-content">
            <div className="chapters-grid">
              {filteredChapters.map((chapter, chapterIndex) => {
                const chapterImages = getChapterImages(chapter.id)
                
                return (
                  <div 
                    key={chapter.id} 
                    className={`chapter-card ${selectedChapter?.id === chapter.id ? 'selected' : ''}`}
                    onClick={() => handleChapterSelect(chapter)}
                  >
                    <div className="chapter-header">
                      <div className="chapter-info">
                        <h3>Bölüm {chapter.order}</h3>
                        <h4>{chapter.title}</h4>
                        <p>{chapter.description}</p>
                      </div>
                      
                      <div className="chapter-meta">
                        <span className="chapter-duration">⏱️ {chapter.estimatedDuration}</span>
                        <span className="lesson-count">📚 {chapter.lessons.length} ders</span>
                        {chapterImages.length > 0 && (
                          <span className="image-count">🎨 {chapterImages.filter(img => img.success).length} görsel</span>
                        )}
                      </div>
                    </div>

                    <div className="chapter-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${getChapterProgress(chapter)}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{getChapterProgress(chapter)}% tamamlandı</span>
                    </div>

                    {/* Chapter Images Preview */}
                    {chapterImages.length > 0 && (
                      <div className="chapter-images-preview">
                        <h5>🎨 Bölüm Görselleri</h5>
                        <div className="images-grid">
                          {chapterImages.slice(0, 3).map((image, imageIndex) => (
                            <div key={imageIndex} className={`image-preview ${image.success ? 'success' : 'error'}`}>
                              {image.success ? (
                                <img src={image.imageUrl} alt={image.title} />
                              ) : (
                                <div className="image-error">
                                  <span>❌</span>
                                  <p>Görsel üretilemedi</p>
                                </div>
                              )}
                              <span className="image-type">{image.type}</span>
                            </div>
                          ))}
                          {chapterImages.length > 3 && (
                            <div className="more-images">
                              <span>+{chapterImages.length - 3} daha</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedChapter?.id === chapter.id && (
                      <div className="lessons-container">
                        <h5>📚 Dersler</h5>
                        <div className="lessons-grid">
                          {chapter.lessons.map((lesson, lessonIndex) => {
                            const lessonImages = getLessonImages(lesson.id)
                            
                            return (
                              <div 
                                key={lesson.id} 
                                className={`lesson-tile ${selectedLesson?.id === lesson.id ? 'selected' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleLessonSelect(lesson)
                                }}
                              >
                                <div className="lesson-header">
                                  <span className="lesson-number">{lesson.order}</span>
                                  <h6>{lesson.title}</h6>
                                </div>
                                
                                <p className="lesson-description">{lesson.description}</p>
                                
                                <div className="lesson-meta">
                                  <span className="lesson-duration">⏱️ {lesson.estimatedDuration}</span>
                                  <span className="lesson-type">📝 {lesson.contentType}</span>
                                  {lessonImages.length > 0 && (
                                    <span className="lesson-images">🎨 {lessonImages.filter(img => img.success).length} görsel</span>
                                  )}
                                </div>

                                <div className="lesson-progress">
                                  <div className="progress-bar">
                                    <div 
                                      className="progress-fill" 
                                      style={{ width: `${getProgressPercentage(lesson.id)}%` }}
                                    ></div>
                                  </div>
                                  <span className="progress-text">{getProgressPercentage(lesson.id)}%</span>
                                </div>

                                {/* Lesson Images Preview */}
                                {lessonImages.length > 0 && (
                                  <div className="lesson-images-preview">
                                    <div className="images-grid">
                                      {lessonImages.map((image, imageIndex) => (
                                        <div key={imageIndex} className={`image-preview ${image.success ? 'success' : 'error'}`}>
                                          {image.success ? (
                                            <img src={image.imageUrl} alt={image.title} />
                                          ) : (
                                            <div className="image-error">
                                              <span>❌</span>
                                            </div>
                                          )}
                                          <span className="image-type">{image.type}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {lesson.learningPoints && lesson.learningPoints.length > 0 && (
                                  <div className="learning-points">
                                    <strong>Öğrenme Noktaları:</strong>
                                    <ul>
                                      {lesson.learningPoints.slice(0, 2).map((point, pointIndex) => (
                                        <li key={pointIndex}>{point}</li>
                                      ))}
                                      {lesson.learningPoints.length > 2 && (
                                        <li>... ve {lesson.learningPoints.length - 2} tane daha</li>
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Lesson Detail Panel */}
            {selectedLesson && (
              <div className="lesson-detail-panel">
                <div className="lesson-detail-header">
                  <h3>📖 {selectedLesson.title}</h3>
                  <button 
                    className="close-btn"
                    onClick={() => setSelectedLesson(null)}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="lesson-detail-content">
                  <div className="lesson-info">
                    <p className="lesson-description">{selectedLesson.description}</p>
                    <div className="lesson-meta">
                      <span>⏱️ {selectedLesson.estimatedDuration}</span>
                      <span>📝 {selectedLesson.contentType}</span>
                      <span>📊 {getProgressPercentage(selectedLesson.id)}% tamamlandı</span>
                    </div>
                  </div>

                  {/* Lesson Images */}
                  {(() => {
                    const lessonImages = getLessonImages(selectedLesson.id)
                    if (lessonImages.length > 0) {
                      return (
                        <div className="lesson-images-detail">
                          <h4>🎨 Ders Görselleri</h4>
                          <div className="images-grid">
                            {lessonImages.map((image, imageIndex) => (
                              <div key={imageIndex} className={`image-detail ${image.success ? 'success' : 'error'}`}>
                                {image.success ? (
                                  <img src={image.imageUrl} alt={image.title} />
                                ) : (
                                  <div className="image-error">
                                    <span>❌</span>
                                    <p>Görsel üretilemedi: {image.error}</p>
                                  </div>
                                )}
                                <div className="image-info">
                                  <h5>{image.title}</h5>
                                  <p>{image.description}</p>
                                  <span className="image-type">{image.type}</span>
                                  <span className="image-size">{image.size}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}

                  {selectedLesson.learningPoints && selectedLesson.learningPoints.length > 0 && (
                    <div className="learning-points-detail">
                      <h4>🎯 Öğrenme Noktaları</h4>
                      <ul>
                        {selectedLesson.learningPoints.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="lesson-actions">
                    <button className="start-lesson-btn">
                      🚀 Dersi Başlat
                    </button>
                    <button className="bookmark-btn">
                      🔖 Favorilere Ekle
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual Prompts Display */}
      {visualPrompts && visualPrompts.length > 0 && (
        <div className="visual-prompts-section">
          <h3>🎨 Üretilen Görsel Prompt'lar</h3>
          <div className="prompts-grid">
            {visualPrompts.map((chapterPrompt, chapterIndex) => (
              <div key={chapterPrompt.chapterId} className="chapter-prompts">
                <h4>📖 {chapterPrompt.chapterTitle}</h4>
                <div className="prompts-list">
                  {chapterPrompt.prompts.map((prompt, promptIndex) => (
                    <div key={prompt.id} className="prompt-item">
                      <div className="prompt-header">
                        <span className="prompt-type">{prompt.type}</span>
                        <span className="prompt-size">{prompt.size}</span>
                      </div>
                      <h5>{prompt.title}</h5>
                      <p className="prompt-description">{prompt.description}</p>
                      <div className="prompt-text">
                        <strong>Prompt:</strong>
                        <p>{prompt.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Images Display */}
      {courseImages && courseImages.length > 0 && (
        <div className="course-images-section">
          <h3>🎨 Üretilen Kurs Görselleri</h3>
          <div className="images-grid-full">
            {courseImages.map((chapterImage, chapterIndex) => (
              <div key={chapterImage.chapterId} className="chapter-images">
                <h4>📖 {chapterImage.chapterTitle}</h4>
                <div className="images-grid">
                  {chapterImage.images.map((image, imageIndex) => (
                    <div key={imageIndex} className={`image-item ${image.success ? 'success' : 'error'}`}>
                      {image.success ? (
                        <img src={image.imageUrl} alt={image.title} />
                      ) : (
                        <div className="image-error">
                          <span>❌</span>
                          <p>Görsel üretilemedi</p>
                          <small>{image.error}</small>
                        </div>
                      )}
                      <div className="image-info">
                        <h5>{image.title}</h5>
                        <p>{image.description}</p>
                        <div className="image-meta">
                          <span className="image-type">{image.type}</span>
                          <span className="image-size">{image.size}</span>
                          {image.success && image.metadata && (
                            <span className="image-model">{image.metadata.model}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="integration-info">
        <h4>ℹ️ Course Visual Integration Özellikleri</h4>
        <ul>
          <li>🎨 <strong>Görsel Kurs Yapısı:</strong> Modern ve kullanıcı dostu arayüz</li>
          <li>🔍 <strong>Arama ve Filtreleme:</strong> Bölüm ve ders arama</li>
          <li>📊 <strong>İlerleme Takibi:</strong> Kullanıcı ilerleme göstergeleri</li>
          <li>📱 <strong>Responsive Tasarım:</strong> Tüm cihazlarda uyumlu</li>
          <li>🎯 <strong>Etkileşimli Elementler:</strong> Açılır/kapanır bölümler ve dersler</li>
          <li>📖 <strong>Detay Paneli:</strong> Ders detayları ve öğrenme noktaları</li>
          <li>🤖 <strong>AI-Powered Prompts:</strong> Gemini AI ile akıllı görsel prompt'lar</li>
          <li>🎨 <strong>Visual-Learning Mapping:</strong> Görsel-öğrenme eşleştirmesi</li>
          <li>📚 <strong>Course Media Library:</strong> Kurs medya kütüphanesi</li>
          <li>🖼️ <strong>Image Generation:</strong> Stable Diffusion XL ile görsel üretimi</li>
          <li>📊 <strong>Quality Assessment:</strong> Görsel kalite değerlendirmesi</li>
          <li>🔄 <strong>Full Integration Test:</strong> Tam entegrasyon testi</li>
        </ul>
      </div>
    </div>
  )
}

export default CourseVisualIntegration 