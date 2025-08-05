import React, { useState, useEffect } from 'react'
import CustomButton from '../../components/CustomButton/CustomButton'
import AvatarCreatorComponent from '../../components/AvatarCreator/AvatarCreator'
import AvatarPreview from '../../components/AvatarPreview/AvatarPreview'
import { getUserAvatars, deleteAvatar } from '../../services/avatarService'
import { getCurrentUser } from '../../services/authService'
import './AvatarPage.css'

const AvatarPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [showCreator, setShowCreator] = useState(false)
  const [createdAvatarUrl, setCreatedAvatarUrl] = useState(null)
  const [avatars, setAvatars] = useState([])
  const [loadingAvatars, setLoadingAvatars] = useState(true)

  // Mevcut avatarları yükle
  useEffect(() => {
    loadAvatars()
  }, [])

  const loadAvatars = async () => {
    try {
      setLoadingAvatars(true)
      const avatarsData = await getUserAvatars()
      setAvatars(avatarsData)
    } catch (error) {
      console.error('Avatarlar yüklenirken hata:', error)
    } finally {
      setLoadingAvatars(false)
    }
  }

  const handleCreateAvatar = () => {
    setShowCreator(true)
  }

  const handleAvatarCreated = async (avatarUrl) => {
    setCreatedAvatarUrl(avatarUrl)
    console.log('Avatar oluşturuldu:', avatarUrl)
    // Yeni avatar oluşturulduktan sonra listeyi yenile
    await loadAvatars()
  }

  const handleDeleteAvatar = async (avatarId) => {
    if (window.confirm('Bu avatarı silmek istediğinizden emin misiniz?')) {
      try {
        const result = await deleteAvatar(avatarId)
        if (result.success) {
          await loadAvatars() // Listeyi yenile
          alert('Avatar başarıyla silindi!')
        } else {
          alert('Avatar silinirken hata oluştu: ' + result.error)
        }
      } catch (error) {
        console.error('Avatar silme hatası:', error)
        alert('Avatar silinirken hata oluştu: ' + error.message)
      }
    }
  }

  const handleCloseCreator = () => {
    setShowCreator(false)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR')
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
              <h3>✅ Avatar Başarıyla Oluşturuldu ve Kaydedildi!</h3>
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
          
          {loadingAvatars ? (
            <div className="loading-avatars">
              <div className="loading-spinner">⏳</div>
              <p>Avatarlar yükleniyor...</p>
            </div>
          ) : (
            <div className="saved-avatars-grid">
              {avatars.length > 0 ? (
                avatars.map((avatar) => (
                  <div key={avatar.id} className="saved-avatar-card">
                    <div className="avatar-thumbnail">
                      <span className="avatar-icon">🎭</span>
                    </div>
                    <div className="avatar-details">
                      <h4>{avatar.name}</h4>
                      <p>Oluşturulma: {formatDate(avatar.created_at)}</p>
                      <span className="avatar-status active">Aktif</span>
                    </div>
                    <div className="avatar-card-actions">
                      <button 
                        className="use-btn"
                        onClick={() => window.open(avatar.avatar_url, '_blank')}
                      >
                        Görüntüle
                      </button>
                      <button 
                        className="edit-btn"
                        onClick={() => window.open(avatar.avatar_url, '_blank')}
                      >
                        Düzenle
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteAvatar(avatar.id)}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-avatars-message">
                  <span className="no-avatars-icon">🎭</span>
                  <h4>Henüz avatar oluşturmadınız</h4>
                  <p>İlk avatarınızı oluşturmak için yukarıdaki butona tıklayın.</p>
                </div>
              )}
              
              <div className="empty-avatar-slot" onClick={() => setShowCreator(true)}>
                <span className="plus-icon">+</span>
                <p>Yeni Avatar Oluştur</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreator && (
        <AvatarCreatorComponent
          onAvatarCreated={handleAvatarCreated}
          onClose={handleCloseCreator}
        />
      )}
    </div>
  )
}

export default AvatarPage 