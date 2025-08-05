import React, { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import { useAuth } from '../../hooks/useAuth'
import mindMapGeneratorService from '../../services/mindMapGeneratorService'
import learningPathGeneratorService from '../../services/learningPathGeneratorService'
import forceGraph3DService from '../../services/forceGraph3DService'
import CustomButton from '../CustomButton/CustomButton'
import './MindMapLearningPathTest.css'

const MindMapLearningPathTest = () => {
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentAction, setCurrentAction] = useState('')
  const [mindMapData, setMindMapData] = useState(null)
  const [learningPathData, setLearningPathData] = useState(null)
  const [showMindMap3D, setShowMindMap3D] = useState(false)
  const [showLearningPath3D, setShowLearningPath3D] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      loadUserDocuments()
    }
  }, [user])

  useEffect(() => {
    if (showMindMap3D && mindMapData) {
      const container = document.getElementById('mind-map-3d-container')
      if (container) {
        forceGraph3DService.createMindMap3D(mindMapData, container)
      }
    }
  }, [showMindMap3D, mindMapData])

  useEffect(() => {
    if (showLearningPath3D && learningPathData) {
      const container = document.getElementById('learning-path-3d-container')
      if (container) {
        forceGraph3DService.createLearningPath3D(learningPathData, container)
      }
    }
  }, [showLearningPath3D, learningPathData])

  const loadUserDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Dokümanlar yüklenirken hata:', error)
      setError('Dokümanlar yüklenemedi')
    }
  }

  const generateMindMap = async () => {
    if (!selectedDocument) {
      setError('Lütfen bir doküman seçin')
      return
    }

    setIsLoading(true)
    setCurrentAction('Mind Map oluşturuluyor...')
    setError(null)

    try {
      // Doküman içeriğini al
      const { data: segments, error: segmentsError } = await supabase
        .from('segments')
        .select('*')
        .eq('document_id', selectedDocument.id)
        .order('seg_no', { ascending: true })

      if (segmentsError) throw segmentsError

      // Enhanced content'i al
      const { data: enhancedContent, error: enhancedError } = await supabase
        .from('enhanced_content')
        .select('*')
        .eq('document_id', selectedDocument.id)
        .single()

      if (enhancedError && enhancedError.code !== 'PGRST116') {
        console.warn('Enhanced content bulunamadı:', enhancedError)
      }

      // Course structure'ı al
      const { data: courseStructure, error: structureError } = await supabase
        .from('course_structures')
        .select('*')
        .eq('document_id', selectedDocument.id)
        .single()

      if (structureError && structureError.code !== 'PGRST116') {
        console.warn('Course structure bulunamadı:', structureError)
      }

      // Mind map için veri hazırla
      const courseContent = segments?.map(seg => seg.content).join('\n\n') || ''
      const courseOutline = courseStructure?.structure || ''

      const mindMapOptions = {
        documentId: selectedDocument.id,
        courseTitle: selectedDocument.course_title || selectedDocument.file_path,
        courseContent: courseContent,
        courseOutline: courseOutline,
        type: 'course_mindmap',
        maxBranches: 6,
        maxSubtopics: 3
      }

      console.log('🧠 Mind map generation başlatılıyor:', mindMapOptions)

      const result = await mindMapGeneratorService.generateMindMap(mindMapOptions)

      if (result.success) {
        setMindMapData(result.data)
        console.log('✅ Mind map başarıyla oluşturuldu:', result.data)
      } else {
        throw new Error(result.error)
      }

    } catch (error) {
      console.error('❌ Mind map generation hatası:', error)
      setError(`Mind map oluşturma hatası: ${error.message}`)
    } finally {
      setIsLoading(false)
      setCurrentAction('')
    }
  }

  const generateLearningPath = async () => {
    if (!selectedDocument) {
      setError('Lütfen bir doküman seçin')
      return
    }

    setIsLoading(true)
    setCurrentAction('Learning Path oluşturuluyor...')
    setError(null)

    try {
      // Doküman içeriğini al
      const { data: segments, error: segmentsError } = await supabase
        .from('segments')
        .select('*')
        .eq('document_id', selectedDocument.id)
        .order('seg_no', { ascending: true })

      if (segmentsError) throw segmentsError

      // Enhanced content'i al
      const { data: enhancedContent, error: enhancedError } = await supabase
        .from('enhanced_content')
        .select('*')
        .eq('document_id', selectedDocument.id)
        .single()

      if (enhancedError && enhancedError.code !== 'PGRST116') {
        console.warn('Enhanced content bulunamadı:', enhancedError)
      }

      // Course structure'ı al
      const { data: courseStructure, error: structureError } = await supabase
        .from('course_structures')
        .select('*')
        .eq('document_id', selectedDocument.id)
        .single()

      if (structureError && structureError.code !== 'PGRST116') {
        console.warn('Course structure bulunamadı:', structureError)
      }

      // Learning path için veri hazırla
      const courseContent = segments?.map(seg => seg.content).join('\n\n') || ''
      const courseOutline = courseStructure?.structure || ''

      const learningPathOptions = {
        documentId: selectedDocument.id,
        courseTitle: selectedDocument.course_title || selectedDocument.file_path,
        courseContent: courseContent,
        courseOutline: courseOutline,
        maxSteps: 6,
        difficultyLevel: 'intermediate',
        targetAudience: 'genel'
      }

      console.log('🛤️ Learning path generation başlatılıyor:', learningPathOptions)

      const result = await learningPathGeneratorService.generateLearningPath(learningPathOptions)

      if (result.success) {
        setLearningPathData(result.data)
        console.log('✅ Learning path başarıyla oluşturuldu:', result.data)
      } else {
        throw new Error(result.error)
      }

    } catch (error) {
      console.error('❌ Learning path generation hatası:', error)
      setError(`Learning path oluşturma hatası: ${error.message}`)
    } finally {
      setIsLoading(false)
      setCurrentAction('')
    }
  }

  const handleDocumentSelect = (document) => {
    setSelectedDocument(document)
    setMindMapData(null)
    setLearningPathData(null)
    setShowMindMap3D(false)
    setShowLearningPath3D(false)
    setError(null)
  }

  const cleanup3DGraphs = () => {
    forceGraph3DService.cleanup()
  }

  useEffect(() => {
    return () => {
      cleanup3DGraphs()
    }
  }, [])

  return (
    <div className="mind-map-learning-path-test">
      <div className="test-header">
        <h1>🧠 Mind Map & Learning Path Test</h1>
        <p>Akıllı ders oluşturucu tarafından oluşturulan dersler için mind map ve learning path test edin</p>
      </div>

      <div className="test-content">
        {/* Doküman Seçimi */}
        <div className="document-selection">
          <h2>📚 Doküman Seçimi</h2>
          <div className="documents-grid">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`document-card ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                onClick={() => handleDocumentSelect(doc)}
              >
                <div className="document-icon">📄</div>
                <div className="document-info">
                  <h3>{doc.course_title || doc.file_path}</h3>
                  <p>Durum: {doc.status}</p>
                  <p>Sayfa: {doc.page_count}</p>
                  <p>Tarih: {new Date(doc.created_at).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Butonları */}
        {selectedDocument && (
          <div className="test-actions">
            <h2>🚀 Test İşlemleri</h2>
            <div className="action-buttons">
              <CustomButton
                text="🧠 Mind Map Oluştur"
                onClick={generateMindMap}
                disabled={isLoading}
                className="action-button mind-map-btn"
              />
              <CustomButton
                text="🛤️ Learning Path Oluştur"
                onClick={generateLearningPath}
                disabled={isLoading}
                className="action-button learning-path-btn"
              />
            </div>
          </div>
        )}

        {/* Loading ve Error */}
        {isLoading && (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>{currentAction}</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {/* Sonuçlar */}
        <div className="results-section">
          {/* Mind Map Sonucu */}
          {mindMapData && (
            <div className="result-card mind-map-result">
              <div className="result-header">
                <h3>🧠 Mind Map Sonucu</h3>
                <CustomButton
                  text="3D Görüntüle"
                  onClick={() => setShowMindMap3D(!showMindMap3D)}
                  className="view-3d-btn"
                />
              </div>
                             <div className="result-content">
                 <h4>Merkez Konu: {mindMapData.central_topic || mindMapData.centralTopic}</h4>
                 {(mindMapData.content || mindMapData.branches) && (
                   <div className="mind-map-content">
                     {(mindMapData.content || mindMapData.branches).map((branch, index) => (
                       <div key={index} className="branch">
                         <h5>🌿 {branch.topic}</h5>
                         {branch.subtopics && (
                           <ul>
                             {branch.subtopics.map((subtopic, subIndex) => (
                               <li key={subIndex}>• {typeof subtopic === 'string' ? subtopic : subtopic.topic}</li>
                             ))}
                           </ul>
                         )}
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          )}

          {/* Learning Path Sonucu */}
          {learningPathData && (
            <div className="result-card learning-path-result">
              <div className="result-header">
                <h3>🛤️ Learning Path Sonucu</h3>
                <CustomButton
                  text="3D Görüntüle"
                  onClick={() => setShowLearningPath3D(!showLearningPath3D)}
                  className="view-3d-btn"
                />
              </div>
              <div className="result-content">
                <h4>{learningPathData.title}</h4>
                <p>{learningPathData.description}</p>
                {learningPathData.steps && (
                  <div className="learning-steps">
                    {learningPathData.steps.map((step, index) => (
                      <div key={index} className="step">
                        <h5>📋 Adım {index + 1}: {step.title}</h5>
                        <p>{step.description}</p>
                        {step.duration && <p>⏱️ Süre: {step.duration}</p>}
                        {step.difficulty && <p>📊 Zorluk: {step.difficulty}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3D Görselleştirmeler */}
        {showMindMap3D && (
          <div className="graph-container mind-map-3d">
            <div className="graph-header">
              <h3>🧠 Mind Map 3D Görselleştirme</h3>
              <CustomButton
                text="✕"
                onClick={() => setShowMindMap3D(false)}
                className="close-btn"
              />
            </div>
            <div id="mind-map-3d-container" className="graph-content"></div>
          </div>
        )}

        {showLearningPath3D && (
          <div className="graph-container learning-path-3d">
            <div className="graph-header">
              <h3>🛤️ Learning Path 3D Görselleştirme</h3>
              <CustomButton
                text="✕"
                onClick={() => setShowLearningPath3D(false)}
                className="close-btn"
              />
            </div>
            <div id="learning-path-3d-container" className="graph-content"></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MindMapLearningPathTest 