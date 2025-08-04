import React, { useState, useEffect } from 'react'
import { getUserPanoramicImages } from '../../services/panoramicImageService'
import CustomButton from '../CustomButton/CustomButton'
import './SinifSecimi.css'

const SinifSecimi = ({ selectedDers, onSinifSec, onClose, onGeriDon }) => {
  const [images, setImages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  const handleSinifSec = (image) => {
    setSelectedImage(image)
  }

  const handleDevamEt = () => {
    if (selectedImage) {
      onSinifSec(selectedImage)
    }
  }

  const handleIptal = () => {
    onClose()
  }

  const handleGeriDon = () => {
    onGeriDon()
  }

  return (
    <div className="sinif-secimi-modal">
      <div className="modal-overlay" onClick={handleIptal}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h2>🏫 Hangi Sınıfta Çalışmak İstiyorsun?</h2>
          <button className="close-button" onClick={handleIptal}>×</button>
        </div>
        
        <div className="modal-body">
          {selectedDers && (
            <div className="selected-ders-info">
              <h3>Seçilen Ders: {selectedDers.title || selectedDers.file_name}</h3>
            </div>
          )}
          
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Sınıflar yükleniyor...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏫</div>
              <h3>Henüz Sınıf Yok</h3>
              <p>Panoramik görüntü yükleyerek sınıf oluşturabilirsiniz</p>
            </div>
          ) : (
            <>
              <div className="sinif-grid">
                {images.map((image) => (
                  <div 
                    key={image.id} 
                    className={`sinif-card ${selectedImage?.id === image.id ? 'selected' : ''}`}
                    onClick={() => handleSinifSec(image)}
                  >
                    <div className="sinif-preview">
                      <img 
                        src={image.file_path} 
                        alt={image.title || image.file_name}
                        className="sinif-image"
                      />
                    </div>
                    <div className="sinif-info">
                      <h3>{image.title || image.file_name}</h3>
                      <p className="sinif-date">
                        {new Date(image.created_at).toLocaleDateString('tr-TR')}
                      </p>
                      <div className="sinif-status">
                        <span className="status-badge success">✅ Hazır</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="modal-actions">
                <CustomButton
                  text="Geri Dön"
                  onClick={handleGeriDon}
                  variant="secondary"
                />
                <CustomButton
                  text="İptal"
                  onClick={handleIptal}
                  variant="secondary"
                />
                <CustomButton
                  text="Sınıfa Gir"
                  onClick={handleDevamEt}
                  disabled={!selectedImage}
                  variant="primary"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SinifSecimi 