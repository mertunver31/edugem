import React, { useState, useEffect } from 'react'
import PanoramicUploader from '../../components/PanoramicUploader/PanoramicUploader'
import PanoramicUploadForm from '../../components/PanoramicUploadForm/PanoramicUploadForm'
import PanoramicImageList from '../../components/PanoramicImageList/PanoramicImageList'
import PanoramicViewer from '../../components/PanoramicViewer/PanoramicViewer'
import CinemaPanoramicViewer from '../../components/CinemaPanoramicViewer/CinemaPanoramicViewer'
import AvatarSelector from '../../components/AvatarSelector/AvatarSelector'
import DersSecimi from '../../components/DersSecimi/DersSecimi'
import SinifSecimi from '../../components/SinifSecimi/SinifSecimi'
import CustomButton from '../../components/CustomButton/CustomButton'
import { getUserPanoramicImages, savePanoramicImage, uploadPanoramicFile, deletePanoramicImage } from '../../services/panoramicImageService'
import { getCurrentUser } from '../../services/authService'
import { supabase } from '../../config/supabase'
import './CoursesPage.css'

const CoursesPage = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [showViewer, setShowViewer] = useState(false)
  const [viewerImage, setViewerImage] = useState(null)
  const [images, setImages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingImages, setIsLoadingImages] = useState(true)
  const [cinemaImage, setCinemaImage] = useState(null)
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  
  // Enhanced Content için state'ler
  const [documents, setDocuments] = useState([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [showDocumentDetail, setShowDocumentDetail] = useState(false)
  
  // Ders ve Sınıf Seçimi için state'ler
  const [showDersSecimi, setShowDersSecimi] = useState(false)
  const [showSinifSecimi, setShowSinifSecimi] = useState(false)
  const [selectedDers, setSelectedDers] = useState(null)
  const [selectedSinif, setSelectedSinif] = useState(null)

  useEffect(() => {
    loadImages()
    loadDocuments()
  }, [])

  const loadImages = async () => {
    setIsLoadingImages(true)
    try {
      const result = await getUserPanoramicImages()
      if (result.success) {
        setImages(result.images)
      } else {
        console.error('Görüntüler yüklenemedi:', result.error)
      }
    } catch (error) {
      console.error('Görüntü yükleme hatası:', error)
    } finally {
      setIsLoadingImages(false)
    }
  }

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

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    setShowUploadForm(true)
  }

  const handleUploadFormSubmit = async (formData) => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      // Kullanıcı bilgilerini al
      const userResult = await getCurrentUser()
      if (!userResult.success) {
        throw new Error('Kullanıcı bilgileri alınamadı')
      }

      // Dosyayı Supabase Storage'a yükle
      const fileName = `${Date.now()}_${selectedFile.name.replace(/\.[^/.]+$/, '')}`
      const uploadResult = await uploadPanoramicFile(selectedFile, fileName)
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error)
      }

      // Database'e kaydet
      const imageData = {
        user_id: userResult.user.id,
        file_name: selectedFile.name,
        file_path: uploadResult.publicUrl,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        title: formData.title,
        description: formData.description || null
      }

      const saveResult = await savePanoramicImage(imageData)
      if (saveResult.success) {
        // Listeyi yenile
        await loadImages()
        setShowUploadForm(false)
        setSelectedFile(null)
        alert('Panoramik görüntü başarıyla kaydedildi!')
      } else {
        throw new Error(saveResult.error)
      }
    } catch (error) {
      console.error('Yükleme hatası:', error)
      alert('Görüntü kaydedilirken hata oluştu: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadFormCancel = () => {
    setShowUploadForm(false)
    setSelectedFile(null)
  }

  const handleSelectImage = (image) => {
    setViewerImage(image)
    setShowViewer(true)
  }

  const handleCloseViewer = () => {
    setShowViewer(false)
    setViewerImage(null)
  }

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Bu panoramik görüntüyü silmek istediğinizden emin misiniz?')) {
      return
    }

    setIsLoading(true)
    try {
      const result = await deletePanoramicImage(imageId)
      if (result.success) {
        await loadImages()
        alert('Görüntü başarıyla silindi!')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Silme hatası:', error)
      alert('Görüntü silinirken hata oluştu: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // NEW: Cinema mode handlers
  const handleEnterClass = (image) => {
    setCinemaImage(image)
  }
  const handleCloseCinema = () => {
    setCinemaImage(null)
  }

  // Avatar selection handlers
  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar)
    setShowAvatarSelector(false)
  }

  const handleShowAvatarSelector = () => {
    setShowAvatarSelector(true)
  }

  const handleDocumentClick = (document) => {
    setSelectedDocument(document)
    setShowDocumentDetail(true)
  }

  const handleCloseDocumentDetail = () => {
    setShowDocumentDetail(false)
    setSelectedDocument(null)
  }

  // Ders seçimi handlers
  const handleDersSecimiBaslat = () => {
    setShowDersSecimi(true)
  }

  const handleDersSec = (ders) => {
    setSelectedDers(ders)
    setShowDersSecimi(false)
    setShowSinifSecimi(true)
  }

  const handleDersSecimiIptal = () => {
    setShowDersSecimi(false)
    setSelectedDers(null)
  }

  // Sınıf seçimi handlers
  const handleSinifSec = (sinif) => {
    setSelectedSinif(sinif)
    setShowSinifSecimi(false)
    // Panoramik sınıfa yönlendir
    setCinemaImage(sinif)
  }

  const handleSinifSecimiIptal = () => {
    setShowSinifSecimi(false)
    setSelectedSinif(null)
  }

  const handleSinifSecimiGeriDon = () => {
    setShowSinifSecimi(false)
    setShowDersSecimi(true)
  }

  return (
    <div className="courses-page">
      <div className="main-dashboard">
        <div className="section-header">
          <h1>Ana Sayfa</h1>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card purple">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>Toplam Dersler</h3>
              <div className="stat-number">{documents.length}</div>
            </div>
          </div>
          
          <div className="stat-card blue">
            <div className="stat-icon">🎭</div>
            <div className="stat-content">
              <h3>Avatarlar</h3>
              <div className="stat-number">2</div>
            </div>
          </div>
          
          <div className="stat-card red">
            <div className="stat-icon">💻</div>
            <div className="stat-content">
              <h3>Enhanced Content</h3>
              <div className="stat-number">{documents.filter(doc => doc.enhanced_content).length}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="courses-section">
        <div className="section-header">
          <h2>Derslerim</h2>
          <p>Yüklediğiniz PDF'lerden oluşturulan enhanced content'leri görüntüleyin</p>
          <div className="header-actions">
            <CustomButton
              text="📚 Panoramik Sınıfta Çalış"
              onClick={handleDersSecimiBaslat}
              variant="primary"
              className="panoramic-study-button"
            />
          </div>
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
            </div>
          ) : (
            <div className="documents-grid">
              {documents.map((document) => (
                <div 
                  key={document.id} 
                  className="document-card"
                  onClick={() => handleDocumentClick(document)}
                >
                  <div className="document-icon">📄</div>
                  <div className="document-info">
                    <h3>{document.title || document.file_name}</h3>
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

        <div className="upload-section" style={{display: 'none'}}>
          <PanoramicUploader onFileSelect={handleFileSelect} />
          {selectedFile && (
            <PanoramicUploadForm
              file={selectedFile}
              onSubmit={handleUploadFormSubmit}
              onCancel={handleUploadFormCancel}
              isLoading={isUploading}
            />
          )}
        </div>

        {/* Avatar Seçimi Bölümü */}
        <div className="avatar-selection-section">
          <h3>Ders Avatarı</h3>
          <div className="avatar-selection-content">
            {selectedAvatar ? (
              <div className="selected-avatar-info">
                <span className="avatar-icon">🎭</span>
                <span className="avatar-name">{selectedAvatar.name}</span>
                <CustomButton
                  text="Değiştir"
                  onClick={handleShowAvatarSelector}
                  variant="secondary"
                  className="change-avatar-button"
                />
              </div>
            ) : (
              <CustomButton
                text="Avatar Seç"
                onClick={handleShowAvatarSelector}
                variant="secondary"
                className="select-avatar-button"
              />
            )}
          </div>
          <p className="avatar-info-text">
            Seçtiğiniz avatar panoramik ders ortamında 3D karakteriniz olarak görünecektir.
          </p>
        </div>

        <div className="images-section">
          <PanoramicImageList
            images={images}
            onSelectImage={handleSelectImage}
            onDeleteImage={handleDeleteImage}
            isLoading={isLoadingImages}
            onEnterClass={handleEnterClass}
          />
        </div>
      </div>
      
      {showViewer && viewerImage && (
        <PanoramicViewer 
          imageFile={viewerImage} 
          onClose={handleCloseViewer}
          selectedAvatar={selectedAvatar}
        />
      )}
      {cinemaImage && (
        <CinemaPanoramicViewer
          imageFile={cinemaImage}
          onClose={handleCloseCinema}
          selectedAvatar={selectedAvatar}
          selectedDers={selectedDers}
        />
      )}

      {/* Ders Seçimi Modal */}
      {showDersSecimi && (
        <DersSecimi
          onDersSec={handleDersSec}
          onClose={handleDersSecimiIptal}
        />
      )}

      {/* Sınıf Seçimi Modal */}
      {showSinifSecimi && (
        <SinifSecimi
          selectedDers={selectedDers}
          onSinifSec={handleSinifSec}
          onClose={handleSinifSecimiIptal}
          onGeriDon={handleSinifSecimiGeriDon}
        />
      )}

      {/* Enhanced Content Detay Modal */}
      {showDocumentDetail && selectedDocument && (
        <div className="document-detail-modal">
          <div className="modal-overlay" onClick={handleCloseDocumentDetail}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedDocument.title || selectedDocument.file_name}</h2>
              <button className="close-button" onClick={handleCloseDocumentDetail}>×</button>
            </div>
            <div className="modal-body">
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
          </div>
        </div>
      )}

      {/* Avatar Seçici Modal */}
      {showAvatarSelector && (
        <AvatarSelector
          onAvatarSelect={handleAvatarSelect}
          selectedAvatar={selectedAvatar}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </div>
  )
}

export default CoursesPage 