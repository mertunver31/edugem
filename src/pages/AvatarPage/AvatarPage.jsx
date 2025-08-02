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
      <div className="avatar-section">
        <div className="section-header">
          <h2>Avatar Oluştur</h2>
          <p>Ready Player Me teknolojisi ile kişiselleştirilmiş 3D avatarınızı oluşturun</p>
        </div>

        <div className="avatar-content">
          <AvatarPreview />

          <div className="avatar-controls">
            <div className="control-group">
              <h3>Ready Player Me Avatar</h3>
              <p>Yüz özelliklerinizi, saç stilini, kıyafetlerinizi ve daha fazlasını özelleştirebilirsiniz.</p>
            </div>

            <div className="action-buttons">
              <CustomButton
                text="Avatar Oluştur"
                onClick={handleCreateAvatar}
                className="create-avatar-button"
              />
            </div>

            {createdAvatarUrl && (
              <div className="avatar-result">
                <h4>Son Oluşturulan Avatar</h4>
                <p>Avatar URL: <a href={createdAvatarUrl} target="_blank" rel="noopener noreferrer" className="avatar-link">{createdAvatarUrl}</a></p>
                <div className="download-info">
                  <span className="download-icon">📥</span>
                  <span className="download-text">Linke tıklayarak avatar dosyasını indirebilirsiniz</span>
                </div>
                <div className="save-avatar-section">
                  <CustomButton
                    text="Avatarı Kaydet"
                    onClick={() => setShowSaveForm(true)}
                    className="save-avatar-button"
                  />
                </div>
              </div>
            )}
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