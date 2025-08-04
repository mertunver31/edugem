import React, { useState, useEffect } from 'react'
import { enhancedContentService } from '../../services/enhancedContentService'
import { supabase } from '../../config/supabase'
import './EnhancedContentTest.css'

const EnhancedContentTest = () => {
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState(null)
  const [enhancedContent, setEnhancedContent] = useState(null)
  const [activeTab, setActiveTab] = useState('test')

  // Document'ları yükle
  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Document\'lar yüklenemedi:', error)
        return
      }

      setDocuments(data)
      console.log('Document\'lar yüklendi:', data)
    } catch (error) {
      console.error('Document yükleme hatası:', error)
    }
  }

  const handleGenerateEnhancedContent = async () => {
    if (!selectedDocument) {
      alert('Lütfen bir document seçin')
      return
    }

    setIsGenerating(true)
    setGenerationResult(null)

    try {
      console.log(`Enhanced Content Generation başlatılıyor: ${selectedDocument}`)
      
      const result = await enhancedContentService.generateEnhancedContent(selectedDocument)
      
      setGenerationResult(result)
      
      if (result.success) {
        console.log('✅ Enhanced Content Generation başarılı')
        console.log('📊 Metadata:', result.metadata)
        
        if (result.qualityAssessment) {
          console.log('📈 Kalite Değerlendirmesi:', result.qualityAssessment.overall_score)
        }
        
        // Enhanced content'i yükle
        await loadEnhancedContent(selectedDocument)
      } else {
        console.error('❌ Enhanced Content Generation başarısız:', result.error)
      }

    } catch (error) {
      console.error('Enhanced Content Generation hatası:', error)
      setGenerationResult({
        success: false,
        error: error.message
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const loadEnhancedContent = async (documentId) => {
    try {
      const result = await enhancedContentService.getEnhancedContent(documentId)
      
      if (result.success) {
        setEnhancedContent(result.data)
        console.log('Enhanced content yüklendi:', result.data)
      } else {
        console.error('Enhanced content yüklenemedi:', result.error)
      }
    } catch (error) {
      console.error('Enhanced content yükleme hatası:', error)
    }
  }

  const handleLoadEnhancedContent = async () => {
    if (!selectedDocument) {
      alert('Lütfen bir document seçin')
      return
    }

    await loadEnhancedContent(selectedDocument)
  }



  const renderContentPreview = (content) => {
    if (!content) return <p>İçerik bulunamadı</p>

    return (
      <div className="content-preview">
        <h3>📝 Açıklayıcı Metin</h3>
        <div className="content-section">
          {content.explanatory_text || 'Açıklayıcı metin bulunamadı'}
        </div>

        <h3>🔑 Anahtar Noktalar</h3>
        <div className="content-section">
          {content.key_points && content.key_points.length > 0 ? (
            <ul>
              {content.key_points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          ) : (
            'Anahtar noktalar bulunamadı'
          )}
        </div>

        <h3>📊 Tablolar</h3>
        <div className="content-section">
          {content.tables && content.tables.length > 0 ? (
            content.tables.map((table, index) => (
              <div key={index} className="table-preview">
                <h4>{table.title}</h4>
                <table>
                  <thead>
                    <tr>
                      {table.headers.map((header, i) => (
                        <th key={i}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            'Tablo bulunamadı'
          )}
        </div>

        <h3>💻 Kod Örnekleri</h3>
        <div className="content-section">
          {content.code_examples && content.code_examples.length > 0 ? (
            content.code_examples.map((example, index) => (
              <div key={index} className="code-preview">
                <h4>{example.title} ({example.language})</h4>
                <pre><code>{example.code}</code></pre>
              </div>
            ))
          ) : (
            'Kod örneği bulunamadı'
          )}
        </div>

        <h3>🎯 Pratik Örnekler</h3>
        <div className="content-section">
          {content.practical_examples && content.practical_examples.length > 0 ? (
            content.practical_examples.map((example, index) => (
              <div key={index} className="example-preview">
                <h4>{example.title}</h4>
                <p>{example.description}</p>
              </div>
            ))
          ) : (
            'Pratik örnek bulunamadı'
          )}
        </div>

        <h3>📋 Özet</h3>
        <div className="content-section">
          {content.summary || 'Özet bulunamadı'}
        </div>
      </div>
    )
  }

  const renderQualityAssessment = (assessment) => {
    if (!assessment) return <p>Kalite değerlendirmesi bulunamadı</p>

    return (
      <div className="quality-assessment">
        <h3>📈 Kalite Değerlendirmesi</h3>
        
        <div className="overall-score">
          <h4>Genel Puan: {assessment.overall_score}/100</h4>
          <div className="score-bar">
            <div 
              className="score-fill" 
              style={{ width: `${assessment.overall_score}%` }}
            ></div>
          </div>
        </div>

        <h4>Chapter Puanları:</h4>
        <div className="chapter-scores">
          {assessment.chapter_scores.map((chapter, index) => (
            <div key={index} className="chapter-score">
              <span className="chapter-title">{chapter.title}</span>
              <span className="chapter-score-value">{chapter.score}/100</span>
              {chapter.issues.length > 0 && (
                <div className="chapter-issues">
                  <strong>Sorunlar:</strong>
                  <ul>
                    {chapter.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {assessment.recommendations.length > 0 && (
          <div className="recommendations">
            <h4>Öneriler:</h4>
            <ul>
              {assessment.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="enhanced-content-test">
      <div className="test-header">
        <h1>🤖 Enhanced Content Generation Test</h1>
        <p>AI destekli detaylı eğitim içeriği üretimi ve yönetimi</p>
      </div>

      <div className="test-tabs">
        <button 
          className={`tab-button ${activeTab === 'test' ? 'active' : ''}`}
          onClick={() => setActiveTab('test')}
        >
          🧪 Test
        </button>
        <button 
          className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          📝 İçerik
        </button>
        <button 
          className={`tab-button ${activeTab === 'quality' ? 'active' : ''}`}
          onClick={() => setActiveTab('quality')}
        >
          📈 Kalite
        </button>
      </div>

      <div className="test-content">
        {activeTab === 'test' && (
          <div className="test-section">
            <div className="test-controls">
              <div className="control-group">
                <label>Document Seç:</label>
                <select 
                  value={selectedDocument} 
                  onChange={(e) => setSelectedDocument(e.target.value)}
                >
                  <option value="">Document seçin...</option>
                  {documents.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.file_path || doc.file_name || `Document ${doc.id}`} 
                      {doc.course_structure_generated_at ? ' ✅' : ' ❌'} 
                      {doc.enhanced_content_generated_at ? ' 📝' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="control-buttons">
                <button 
                  className="generate-btn"
                  onClick={handleGenerateEnhancedContent}
                  disabled={isGenerating || !selectedDocument}
                >
                  {isGenerating ? '🔄 Üretiliyor...' : '🚀 Enhanced Content Üret'}
                </button>

                <button 
                  className="load-btn"
                  onClick={handleLoadEnhancedContent}
                  disabled={!selectedDocument}
                >
                  📂 Enhanced Content Yükle
                </button>


              </div>
            </div>

            {generationResult && (
              <div className={`result-section ${generationResult.success ? 'success' : 'error'}`}>
                <h3>{generationResult.success ? '✅ Başarılı' : '❌ Başarısız'}</h3>
                
                {generationResult.success ? (
                  <div className="success-details">
                    <p><strong>Document ID:</strong> {generationResult.documentId}</p>
                    <p><strong>Üretim Tarihi:</strong> {generationResult.metadata.generated_at}</p>
                    <p><strong>Toplam Chapter:</strong> {generationResult.metadata.total_chapters}</p>
                    <p><strong>Toplam Lesson:</strong> {generationResult.metadata.total_lessons}</p>
                    
                    <h4>İçerik Türleri:</h4>
                    <div className="content-types">
                      {Object.entries(generationResult.metadata.content_types.content_types).map(([type, count]) => (
                        <span key={type} className="content-type-badge">
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="error-details">
                    <p><strong>Hata:</strong> {generationResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'content' && (
          <div className="content-section">
            <h3>📝 Enhanced Content Önizleme</h3>
            
            {enhancedContent ? (
              <div className="enhanced-content-display">
                <div className="content-info">
                  <p><strong>Üretim Tarihi:</strong> {enhancedContent.generated_at}</p>
                </div>
                
                {enhancedContent.enhanced_content && enhancedContent.enhanced_content.chapters ? (
                  enhancedContent.enhanced_content.chapters.map((chapter, index) => (
                    <div key={index} className="chapter-content">
                      <h2>📚 {chapter.title}</h2>
                      
                      {chapter.content && chapter.content.lessons ? (
                        chapter.content.lessons.map((lesson, lessonIndex) => (
                          <div key={lessonIndex} className="lesson-content">
                            <h3>📖 {lesson.title}</h3>
                            {renderContentPreview(lesson.content)}
                          </div>
                        ))
                      ) : (
                        <p>Lesson içeriği bulunamadı</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p>Enhanced content bulunamadı</p>
                )}
              </div>
            ) : (
              <p>Enhanced content yüklenmedi. Önce bir document seçin ve "Enhanced Content Yükle" butonuna tıklayın.</p>
            )}
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="quality-section">
            <h3>📈 Kalite Değerlendirmesi</h3>
            
            {generationResult && generationResult.qualityAssessment ? (
              renderQualityAssessment(generationResult.qualityAssessment)
            ) : (
              <p>Kalite değerlendirmesi bulunamadı. Önce Enhanced Content Generation çalıştırın.</p>
            )}
          </div>
        )}
      </div>

      <div className="integration-info">
        <h3>🔗 Entegrasyon Bilgileri</h3>
        <ul>
          <li><strong>Enhanced Content Service:</strong> AI destekli detaylı içerik üretimi</li>
          <li><strong>Content Types:</strong> Açıklayıcı metin, madde listeleri, tablolar, kod örnekleri, pratik örnekler, özetler</li>
          <li><strong>Quality Assessment:</strong> Otomatik içerik kalitesi değerlendirmesi</li>
          <li><strong>Database Integration:</strong> Enhanced content veritabanında saklanır</li>
          <li><strong>Course Structure Integration:</strong> Mevcut kurs yapısı ile entegre çalışır</li>
        </ul>
      </div>
    </div>
  )
}

export default EnhancedContentTest 