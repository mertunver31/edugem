import React, { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import { courseStructureService } from '../../services/courseStructureService'
import './CourseStructureTest.css'

const CourseStructureTest = () => {
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [courseStructure, setCourseStructure] = useState(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, file_path, status, outline_extracted_at, course_structure_generated_at')
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

  const generateCourseStructure = async () => {
    if (!selectedDocument) {
      setError('Lütfen bir document seçin')
      return
    }

    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      console.log('Course Structure Generator başlatılıyor...')
      const result = await courseStructureService.generateCourseStructure(selectedDocument)

      if (result.success) {
        setResult(result)
        setCourseStructure(result.courseStructure)
        console.log('✅ Course Structure Generator başarılı:', result)
      } else {
        setError(result.error)
        console.error('❌ Course Structure Generator başarısız:', result.error)
      }
    } catch (error) {
      setError(error.message)
      console.error('Course Structure Generator hatası:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getCourseStructure = async () => {
    if (!selectedDocument) {
      setError('Lütfen bir document seçin')
      return
    }

    try {
      const result = await courseStructureService.getCourseStructure(selectedDocument)
      
      if (result.success) {
        setCourseStructure(result.data.courseStructure)
        setResult({
          success: true,
          message: 'Kurs yapısı başarıyla yüklendi',
          metadata: {
            generated_at: result.data.generatedAt
          }
        })
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError(error.message)
    }
  }

  const getDocumentStatus = (document) => {
    if (document.course_structure_generated_at) {
      return '✅ Kurs Yapısı Oluşturuldu'
    } else if (document.outline_extracted_at) {
      return '📋 Outline Hazır'
    } else {
      return '📄 Yüklendi'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('tr-TR')
  }

  return (
    <div className="course-structure-test">
      <div className="test-header">
        <h2>📚 Course Structure Generator Test</h2>
        <p>PDF analiz sonuçlarından otomatik kurs yapısı oluşturma</p>
      </div>

      <div className="test-controls">
        <div className="document-selector">
          <label htmlFor="document-select">Document Seçin:</label>
          <select
            id="document-select"
            value={selectedDocument}
            onChange={(e) => setSelectedDocument(e.target.value)}
          >
            <option value="">Document seçin...</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.file_path.split('/').pop()} - {getDocumentStatus(doc)}
              </option>
            ))}
          </select>
        </div>

        <div className="action-buttons">
          <button
            onClick={generateCourseStructure}
            disabled={!selectedDocument || isGenerating}
            className="generate-btn"
          >
            {isGenerating ? '🔄 Oluşturuluyor...' : '🚀 Kurs Yapısı Oluştur'}
          </button>

          <button
            onClick={getCourseStructure}
            disabled={!selectedDocument}
            className="load-btn"
          >
            📋 Mevcut Kurs Yapısını Yükle
          </button>

          <button
            onClick={loadDocuments}
            className="refresh-btn"
          >
            🔄 Listeyi Yenile
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <h3>❌ Hata</h3>
          <p>{error}</p>
        </div>
      )}

      {result && result.success && (
        <div className="success-message">
          <h3>✅ Başarılı</h3>
          <div className="result-details">
            <p><strong>Document ID:</strong> {result.documentId}</p>
            <p><strong>Oluşturulma Tarihi:</strong> {formatDate(result.metadata.generated_at)}</p>
            <p><strong>Toplam Bölüm:</strong> {result.metadata.total_chapters}</p>
            <p><strong>Toplam Ders:</strong> {result.metadata.total_lessons}</p>
            <p><strong>Tahmini Süre:</strong> {result.metadata.estimated_duration}</p>
          </div>
        </div>
      )}

      {courseStructure && (
        <div className="course-structure-display">
          <h3>📚 Oluşturulan Kurs Yapısı</h3>
          
          <div className="course-overview">
            <h4>🎯 Kurs Genel Bakış</h4>
            <div className="overview-grid">
              <div className="overview-item">
                <strong>Başlık:</strong> {courseStructure.title}
              </div>
              <div className="overview-item">
                <strong>Açıklama:</strong> {courseStructure.description}
              </div>
              <div className="overview-item">
                <strong>Zorluk Seviyesi:</strong> {courseStructure.difficultyLevel}
              </div>
              <div className="overview-item">
                <strong>Tahmini Süre:</strong> {courseStructure.estimatedDuration}
              </div>
            </div>
          </div>

          <div className="learning-objectives">
            <h4>🎯 Öğrenme Hedefleri</h4>
            <ul>
              {courseStructure.learningObjectives.map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
            </ul>
          </div>

          <div className="chapters-section">
            <h4>📖 Bölümler</h4>
            {courseStructure.chapters.map((chapter, chapterIndex) => (
              <div key={chapter.id} className="chapter-item">
                <div className="chapter-header">
                  <h5>Bölüm {chapter.order}: {chapter.title}</h5>
                  <span className="chapter-duration">{chapter.estimatedDuration}</span>
                </div>
                <p className="chapter-description">{chapter.description}</p>
                
                <div className="lessons-list">
                  <h6>📚 Dersler:</h6>
                  {chapter.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="lesson-item">
                      <div className="lesson-header">
                        <span className="lesson-number">{lesson.order}.</span>
                        <span className="lesson-title">{lesson.title}</span>
                        <span className="lesson-duration">{lesson.estimatedDuration}</span>
                        <span className="lesson-type">{lesson.contentType}</span>
                      </div>
                      <p className="lesson-description">{lesson.description}</p>
                      
                      {lesson.learningPoints && lesson.learningPoints.length > 0 && (
                        <div className="learning-points">
                          <strong>Öğrenme Noktaları:</strong>
                          <ul>
                            {lesson.learningPoints.map((point, pointIndex) => (
                              <li key={pointIndex}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="lesson-metadata">
                        <small>
                          <strong>Segment ID:</strong> {lesson.segmentId}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="test-info">
        <h4>ℹ️ Nasıl Çalışır?</h4>
        <ol>
          <li>Document Understanding çalıştırılmış bir PDF seçin</li>
          <li>"Kurs Yapısı Oluştur" butonuna tıklayın</li>
          <li>AI, PDF'in yapısını analiz ederek otomatik kurs yapısı oluşturur</li>
          <li>Segment'ler mantıklı bölümlere gruplandırılır</li>
          <li>Her bölüm için dersler ve öğrenme hedefleri belirlenir</li>
        </ol>
      </div>
    </div>
  )
}

export default CourseStructureTest 