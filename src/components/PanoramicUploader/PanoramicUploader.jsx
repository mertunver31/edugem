import React, { useState, useRef } from 'react'
import CustomButton from '../CustomButton/CustomButton'
import './PanoramicUploader.css'

const PanoramicUploader = ({ onFileSelect }) => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  console.log('PanoramicUploader render edildi')

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    console.log('Drop event triggered')
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e) => {
    console.log('File input changed:', e.target.files)
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file) => {
    console.log('File selected:', file)
    
    // Dosya tipini kontrol et
    if (!file.type.startsWith('image/')) {
      alert('Lütfen sadece resim dosyası yükleyin!')
      return
    }

    // Dosya boyutunu kontrol et (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('Dosya boyutu 50MB\'dan küçük olmalıdır!')
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Lütfen önce bir dosya seçin!')
      return
    }

    setIsUploading(true)
    
    try {
      // Simüle edilmiş yükleme işlemi
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onFileSelect(selectedFile)
      setSelectedFile(null)
      
      // File input'u temizle
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } catch (error) {
      console.error('Yükleme hatası:', error)
      alert('Dosya yüklenirken bir hata oluştu!')
    } finally {
      setIsUploading(false)
    }
  }

  const handleBrowseClick = () => {
    console.log('Browse button clicked')
    if (fileInputRef.current) {
      fileInputRef.current.click()
    } else {
      console.error('File input ref not found')
    }
  }

  const handleUploadAreaClick = () => {
    if (!selectedFile) {
      handleBrowseClick()
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="panoramic-uploader">
      <div 
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleUploadAreaClick}
        style={{ cursor: 'pointer' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="file-input"
          style={{ display: 'none' }}
        />
        
        {!selectedFile ? (
          <div className="upload-content">
            <div className="upload-icon">📷</div>
            <h3 style={{ color: '#1f2937' }}>Panoramik Görüntü Yükleyin</h3>
            <p style={{ color: '#374151' }}>Dosyayı buraya sürükleyin veya seçmek için tıklayın</p>
            <p className="file-info" style={{ color: '#4b5563' }}>Desteklenen formatlar: JPG, PNG (Max: 50MB)</p>
            <CustomButton
              text="Dosya Seç"
              onClick={handleBrowseClick}
              variant="secondary"
              className="browse-button"
            />
          </div>
        ) : (
          <div className="file-preview">
            <div className="file-info">
              <h4>Seçilen Dosya:</h4>
              <p>{selectedFile.name}</p>
              <p>Boyut: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div className="file-actions">
              <CustomButton
                text="Yükle"
                onClick={handleUpload}
                disabled={isUploading}
                className="upload-button"
              />
              <CustomButton
                text="Kaldır"
                onClick={removeFile}
                variant="secondary"
                className="remove-button"
              />
            </div>
          </div>
        )}
      </div>
      
      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <p>Dosya yükleniyor...</p>
        </div>
      )}
    </div>
  )
}

export default PanoramicUploader 