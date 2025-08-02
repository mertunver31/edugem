import React from 'react'
import CustomButton from '../CustomButton/CustomButton'
import './PanoramicImageList.css'

const PanoramicImageList = ({ images, onSelectImage, onDeleteImage, isLoading, onEnterClass }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="panoramic-image-list">
        <div className="loading-spinner"></div>
        <p>Görüntüler yükleniyor...</p>
      </div>
    )
  }

  if (!images || images.length === 0) {
    return (
      <div className="panoramic-image-list">
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <h3>Henüz panoramik görüntü yok</h3>
          <p>İlk panoramik görüntünüzü yükleyerek başlayın</p>
        </div>
      </div>
    )
  }

  return (
    <div className="panoramic-image-list">
      <div className="list-header">
        <h3>Panoramik Görüntülerim</h3>
        <span className="image-count">{images.length} görüntü</span>
      </div>

      <div className="image-grid">
        {images.map((image) => (
          <div key={image.id} className="image-card">
            <div className="image-preview">
              <div className="preview-placeholder">
                <span className="preview-icon">🖼️</span>
                <span className="preview-text">Panoramik Görüntü</span>
              </div>
            </div>

            <div className="image-info">
              <h4 className="image-title">{image.title}</h4>
              {image.description && (
                <p className="image-description">{image.description}</p>
              )}
              <div className="image-details">
                <span className="file-size">{formatFileSize(image.file_size)}</span>
                <span className="upload-date">{formatDate(image.created_at)}</span>
              </div>
            </div>

            <div className="image-actions">
              <CustomButton
                text="Görüntüle"
                onClick={() => onSelectImage(image)}
                className="view-button"
              />
              <CustomButton
                text="Sil"
                onClick={() => onDeleteImage(image.id)}
                variant="secondary"
                className="delete-button"
              />
            </div>
            <div className="image-cinema-action">
              <CustomButton
                text="Derse Gir"
                onClick={() => onEnterClass && onEnterClass(image)}
                variant="primary"
                className="cinema-button"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PanoramicImageList 