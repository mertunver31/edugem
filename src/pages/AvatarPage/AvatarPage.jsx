import React, { useState } from 'react'
import CustomButton from '../../components/CustomButton/CustomButton'
import AvatarCreatorComponent from '../../components/AvatarCreator/AvatarCreator'
import AvatarSaveForm from '../../components/AvatarSaveForm/AvatarSaveForm'
import AvatarPreview from '../../components/AvatarPreview/AvatarPreview'
import { saveAvatar, uploadAvatarFile } from '../../services/avatarService'
import { getCurrentUser } from '../../services/authService'
import './AvatarPage.css'

const AvatarPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [showCreator, setShowCreator] = useState(false)
  const [createdAvatarUrl, setCreatedAvatarUrl] = useState(null)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleCreateAvatar = () => {
    setShowCreator(true)
  }

  const handleAvatarCreated = (avatarUrl) => {
    setCreatedAvatarUrl(avatarUrl)
    console.log('Avatar oluşturuldu:', avatarUrl)
  }

  const handleSaveAvatar = async (formData) => {
    if (!createdAvatarUrl) return

    setIsSaving(true)
    try {
      // Kullanıcı bilgilerini al
      const userResult = await getCurrentUser()
      if (!userResult.success) {
        throw new Error('Kullanıcı bilgileri alınamadı')
      }

      // Avatar verilerini hazırla
      const avatarData = {
        user_id: userResult.user.id,
        name: formData.name,
        avatar_url: createdAvatarUrl,
        file_size: 0, // Ready Player Me URL kullandığımız için dosya boyutu 0
        file_type: 'model/gltf-binary',
        is_uploaded: false, // Dosya yüklemedik, URL kullandık
        rpm_avatar_url: createdAvatarUrl
      }

      // Database'e kaydet
      const saveResult = await saveAvatar(avatarData)
      if (saveResult.success) {
        setShowSaveForm(false)
        alert('Avatar başarıyla kaydedildi!')
      } else {
        throw new Error(saveResult.error)
      }
    } catch (error) {
      console.error('Avatar kaydetme hatası:', error)
      alert('Avatar kaydedilirken hata oluştu: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveFormCancel = () => {
    setShowSaveForm(false)
  }

  const handleCloseCreator = () => {
    setShowCreator(false)
  }

  return (
    <div className="avatar-page">
      <div className="avatar-create-section">
        <div className="section-header">
          <h1>Avatarlarım</h1>
          <p>3D avatarlarınızı yönetin ve yeni avatarlar oluşturun</p>
        </div>

        {/* Avatar Önizleme */}
        <div className="avatar-preview-section">
          <div className="avatar-preview-card">
            <div className="preview-content">
              <div className="avatar-preview-area">
                <div className="avatar-placeholder-large">
                  <span className="avatar-icon-large">🎭</span>
                  <h3>Avatar Önizlemesi</h3>
                  <p>Avatarınız burada görünecek</p>
                </div>
              </div>
              
              <div className="avatar-controls">
                <h3>Ready Player Me Avatar</h3>
                <p className="description">
                  Ready Player Me teknolojisi ile yüz özelliklerinizi, saç stilinizi, 
                  kıyafetlerinizi ve daha fazlasını özelleştirebilirsiniz.
                </p>
                
                <div className="avatar-features">
                  <div className="feature-item">
                    <span className="feature-icon">👤</span>
                    <span>Yüz özelliklerini özelleştir</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">💇</span>
                    <span>Saç stili ve rengi seç</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">👕</span>
                    <span>Kıyafet ve aksesuar ekle</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🎨</span>
                    <span>Renk paleti özelleştir</span>
                  </div>
                </div>
                
                <button 
                  className="create-avatar-btn"
                  onClick={handleCreateAvatar}
                  disabled={isLoading}
                >
                  🎭 Avatar Oluşturmaya Başla
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Oluşturulan Avatar Sonucu */}
        {createdAvatarUrl && (
          <div className="avatar-result-section">
            <div className="result-card">
              <h3>✅ Avatar Başarıyla Oluşturuldu!</h3>
              <div className="avatar-info">
                <div className="avatar-url-display">
                  <label>Avatar URL:</label>
                  <div className="url-container">
                    <input 
                      type="text" 
                      value={createdAvatarUrl} 
                      readOnly 
                      className="url-input"
                    />
                    <button 
                      className="copy-btn"
                      onClick={() => navigator.clipboard.writeText(createdAvatarUrl)}
                    >
                      📋 Kopyala
                    </button>
                  </div>
                </div>
                
                <div className="avatar-actions">
                  <button 
                    className="download-btn"
                    onClick={() => window.open(createdAvatarUrl, '_blank')}
                  >
                    📥 Avatar Dosyasını İndir
                  </button>
                  <button 
                    className="save-btn"
                    onClick={() => setShowSaveForm(true)}
                    disabled={isSaving}
                  >
                    💾 Avatarı Kaydet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Saved Avatars - En Üstte */}
        <div className="saved-avatars-section">
          <div className="avatars-header">
            <h3>💾 Mevcut Avatarlarım</h3>
            <button 
              className="create-new-avatar-btn"
              onClick={() => setShowCreator(true)}
            >
              ➕ Yeni Avatar Oluştur
            </button>
          </div>
          <div className="saved-avatars-grid">
            <div className="saved-avatar-card">
              <div className="avatar-thumbnail">
                <span className="avatar-icon">🎭</span>
              </div>
              <div className="avatar-details">
                <h4>Avatar 1</h4>
                <p>Oluşturulma: 15.01.2024</p>
                <span className="avatar-status active">Aktif</span>
              </div>
              <div className="avatar-card-actions">
                <button className="use-btn">Kullan</button>
                <button className="edit-btn">Düzenle</button>
                <button className="delete-btn">Sil</button>
              </div>
            </div>

            <div className="saved-avatar-card">
              <div className="avatar-thumbnail">
                <span className="avatar-icon">👨‍💼</span>
              </div>
              <div className="avatar-details">
                <h4>İş Avatarım</h4>
                <p>Oluşturulma: 10.01.2024</p>
                <span className="avatar-status">Pasif</span>
              </div>
              <div className="avatar-card-actions">
                <button className="use-btn">Kullan</button>
                <button className="edit-btn">Düzenle</button>
                <button className="delete-btn">Sil</button>
              </div>
            </div>
            
            <div className="empty-avatar-slot" onClick={() => setShowCreator(true)}>
              <span className="plus-icon">+</span>
              <p>Yeni Avatar Oluştur</p>
            </div>
          </div>
        </div>
      </div>

      {showCreator && (
        <AvatarCreatorComponent
          onAvatarCreated={handleAvatarCreated}
          onClose={handleCloseCreator}
        />
      )}

      {showSaveForm && createdAvatarUrl && (
        <div className="modal-overlay">
          <AvatarSaveForm
            avatarUrl={createdAvatarUrl}
            onSubmit={handleSaveAvatar}
            onCancel={handleSaveFormCancel}
            isLoading={isSaving}
          />
        </div>
      )}
    </div>
  )
}

export default AvatarPage 