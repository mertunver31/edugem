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
    console.log('handleDersSec çağrıldı:', { ders })
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
              <div className="stat-number">0</div>
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
              <div className="stat-number">0</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="courses-section">
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

        <div className="upload-section">
          <div className="section-header">
            <h3>Panoramik Görüntü Yükle</h3>
            <p>Panoramik ders ortamı için görüntü yükleyin</p>
          </div>
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