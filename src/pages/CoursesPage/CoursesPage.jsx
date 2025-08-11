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
import { getUserPanoramicImages, savePanoramicImage, uploadPanoramicFile, deletePanoramicImage, assignDefaultPanoramicImages } from '../../services/panoramicImageService'
import { getCurrentUser } from '../../services/authService'
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
  
  // Ders ve Sınıf Seçimi için state'ler
  const [showDersSecimi, setShowDersSecimi] = useState(false)
  const [showSinifSecimi, setShowSinifSecimi] = useState(false)
  const [selectedDers, setSelectedDers] = useState(null)
  const [selectedSinif, setSelectedSinif] = useState(null)
  
  // Akordiyon state'leri
  const [accordionOpen, setAccordionOpen] = useState(true)

  useEffect(() => {
    loadImages()
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
        // Başarı mesajını console'a yazdır (alert yerine)
        console.log('✅ Panoramik görüntü başarıyla kaydedildi!')
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

  const handleEnterClass = (image) => {
    setCinemaImage(image)
  }

  const handleCloseCinema = () => {
    setCinemaImage(null)
    setSelectedDers(null)
    setSelectedSinif(null)
  }

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar)
    setShowAvatarSelector(false)
  }

  const handleShowAvatarSelector = () => {
    setShowAvatarSelector(true)
  }

  // Ders seçimi handlers
  const handleDersSecimiBaslat = () => {
    console.log('Ders seçimi başlatılıyor')
    setShowDersSecimi(true)
  }

  const handleDersSec = (ders) => {
    console.log('handleDersSec çağrıldı:', { ders });
    // HATA AYIKLAMA: Gelen ders nesnesinin tamamını yazdır
    console.log("DEBUG: Seçilen Ders Nesnesi:", JSON.stringify(ders, null, 2));
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
    console.log('handleSinifSec çağrıldı:', { sinif })
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

  const toggleAccordion = () => {
    setAccordionOpen((prev) => !prev)
  }

  const handleGetDefaultImages = async () => {
    setIsLoading(true)
    try {
      const result = await assignDefaultPanoramicImages()
      if (result.success) {
        console.log('✅ Default panoramic resimler başarıyla atandı!')
        // Listeyi yenile
        await loadImages()
      } else {
        console.error('❌ Default resim atama hatası:', result.error)
      }
    } catch (error) {
      console.error('Default resim atama hatası:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="courses-page">
      <div className="main-dashboard">
        <div className="section-header">
          <h1>Ana Sayfa</h1>
        </div>
        

      </div>
      
      {/* Akordiyon Container */}
      <div className="accordion-container">
        <div className="accordion-header merged" onClick={toggleAccordion}>
          <div className="accordion-title-group">
            <span>Panoramik Ders Ortamı</span>
          </div>
          <span className="accordion-arrow">{accordionOpen ? '▼' : '▶'}</span>
        </div>
        {accordionOpen && (
          <div className="accordion-content-group">
            {/* Yükleme Alanı */}
            <div className="accordion-content">
              <div className="content-section-header">
                <span className="section-icon">📤</span>
                <h3>Panoramik Görüntü Yükle</h3>
              </div>
              <p>Panoramik ders ortamı için görüntü yükleyin</p>
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
            {/* Avatar Alanı */}
            <div className="accordion-content">
              <div className="content-section-header">
                <span className="section-icon">🎭</span>
                <h3>Ders Avatarı</h3>
              </div>
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
            {/* Görüntü Listesi Alanı */}
            <div className="accordion-content">
              <div className="content-section-header">
                <span className="section-icon">🖼️</span>
                <h3>Panoramik Görüntüler</h3>
              </div>
              {images.length === 0 && (
                <div className="no-images-section">
                  <p>Henüz panoramic resminiz yok. Default resimleri alabilir veya kendi resminizi yükleyebilirsiniz.</p>
                  <CustomButton
                    text="🎁 Default Panoramic Resimleri Al"
                    onClick={handleGetDefaultImages}
                    disabled={isLoading}
                    className="default-images-button"
                  />
                </div>
              )}
              <PanoramicImageList
                images={images}
                onSelectImage={handleSelectImage}
                onDeleteImage={handleDeleteImage}
                isLoading={isLoadingImages}
                onEnterClass={handleEnterClass}
              />
            </div>
          </div>
        )}
      </div>

      {/* Panoramik Görüntüler Başlık Kartı */}
      <div className="panoramic-header-card">
        <div className="section-header">
          <h2>Panoramik Görüntüler</h2>
          <p>360° panoramik görüntülerinizi yönetin ve görüntüleyin</p>
          <div className="header-actions">
            <CustomButton
              text="📚 Panoramik Sınıfta Çalış"
              onClick={handleDersSecimiBaslat}
              variant="primary"
              className="panoramic-study-button"
            />
          </div>
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
      {console.log('showDersSecimi:', showDersSecimi)}
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