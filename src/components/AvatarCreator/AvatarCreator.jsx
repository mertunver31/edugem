import React, { useState } from 'react'
import { AvatarCreator } from '@readyplayerme/react-avatar-creator'
import CustomButton from '../CustomButton/CustomButton'
import { saveAvatar } from '../../services/avatarService'
import { getCurrentUser } from '../../services/authService'
import './AvatarCreator.css'

const AvatarCreatorComponent = ({ onAvatarCreated, onClose }) => {
  const [isCreating, setIsCreating] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [avatarName, setAvatarName] = useState('')

  const config = {
    clearCache: true,
    bodyType: 'fullbody',
    quickStart: false,
    language: 'tr'
  }

  const style = { 
    width: '100%', 
    height: '600px', 
    border: 'none',
    borderRadius: '15px'
  }

  const handleOnAvatarExported = async (event) => {
    console.log(`Avatar URL is: ${event.data.url}`)
    setAvatarUrl(event.data.url)
    setIsCreating(false)
    setShowNameInput(true) // Avatar oluşturulduğunda isim girişi göster
  }

  const handleAutoSave = async (avatarUrl, customName = null) => {
    setIsSaving(true)
    try {
      // Kullanıcı bilgilerini al
      const userResult = await getCurrentUser()
      if (!userResult.success) {
        throw new Error('Kullanıcı bilgileri alınamadı')
      }

      // Avatar ismini belirle
      const finalName = customName || `Avatar_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`

      // Avatar verilerini hazırla
      const avatarData = {
        user_id: userResult.user.id,
        name: finalName,
        avatar_url: avatarUrl,
        file_path: avatarUrl, // Ready Player Me URL'ini file_path olarak kullan
        file_size: 0,
        file_type: 'model/gltf-binary',
        is_uploaded: false,
        rpm_avatar_url: avatarUrl
      }

      // Database'e kaydet
      const saveResult = await saveAvatar(avatarData)
      if (saveResult.success) {
        console.log('Avatar otomatik olarak kaydedildi!')
        // Başarı mesajını göster
        setTimeout(() => {
          alert('Avatar başarıyla oluşturuldu ve kaydedildi!')
        }, 500)
      } else {
        throw new Error(saveResult.error)
      }
    } catch (error) {
      console.error('Avatar otomatik kaydetme hatası:', error)
      alert('Avatar kaydedilirken hata oluştu: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNameSubmit = async () => {
    if (!avatarName.trim()) {
      alert('Lütfen avatarınız için bir isim girin!')
      return
    }

    await handleAutoSave(avatarUrl, avatarName.trim())
    setShowNameInput(false)
    
    if (onAvatarCreated) {
      onAvatarCreated(avatarUrl)
    }
  }

  const handleSkipName = async () => {
    await handleAutoSave(avatarUrl)
    setShowNameInput(false)
    
    if (onAvatarCreated) {
      onAvatarCreated(avatarUrl)
    }
  }

  const handleStartCreation = () => {
    setIsCreating(true)
  }

  const handleClose = () => {
    setIsCreating(false)
    if (onClose) {
      onClose()
    }
  }

  if (!isCreating) {
    return (
      <div className="avatar-creator-container">
        <div className="creator-header">
          <h3>Avatar Oluşturucu</h3>
          <p>Ready Player Me ile kişiselleştirilmiş 3D avatarınızı oluşturun</p>
        </div>

        <div className="creator-content">
          <div className="creator-info">
            <div className="info-icon">🎭</div>
            <h4>Avatar Oluşturma</h4>
            <p>Başlamak için aşağıdaki butona tıklayın. Avatar oluşturucu açılacak ve istediğiniz gibi özelleştirebileceksiniz. Avatar oluşturulduğunda otomatik olarak kaydedilecektir.</p>
          </div>

          <div className="creator-actions">
            <CustomButton
              text="Avatar Oluşturmaya Başla"
              onClick={handleStartCreation}
              className="start-creation-button"
            />
            <CustomButton
              text="İptal"
              onClick={handleClose}
              variant="secondary"
              className="cancel-button"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="avatar-creator-fullscreen">
      <div className="creator-header-bar">
        <h3>Avatar Oluşturucu</h3>
        <CustomButton
          text="✕"
          onClick={handleClose}
          variant="secondary"
          className="close-creator-button"
        />
      </div>

      <div className="creator-iframe-container">
        <AvatarCreator 
          subdomain="sdg-b5v8ru" 
          config={config} 
          style={style} 
          onAvatarExported={handleOnAvatarExported} 
        />
      </div>

      {isSaving && (
        <div className="avatar-saving-overlay">
          <div className="saving-message">
            <div className="loading-spinner">⏳</div>
            <h4>Avatar Kaydediliyor...</h4>
            <p>Lütfen bekleyin, avatarınız otomatik olarak kaydediliyor.</p>
          </div>
        </div>
      )}

      {showNameInput && (
        <div className="avatar-name-overlay">
          <div className="name-input-modal">
            <div className="name-input-header">
              <h4>🎭 Avatarınızı Adlandırın</h4>
              <p>Avatarınız için bir isim verin (isteğe bağlı)</p>
            </div>
            
            <div className="name-input-content">
              <input
                type="text"
                placeholder="Örn: Benim Avatarım, İş Avatarım, Spor Avatarım..."
                value={avatarName}
                onChange={(e) => setAvatarName(e.target.value)}
                className="avatar-name-input"
                autoFocus
              />
            </div>
            
            <div className="name-input-actions">
              <CustomButton
                text="Kaydet"
                onClick={handleNameSubmit}
                className="save-name-button"
              />
              <CustomButton
                text="Atla"
                onClick={handleSkipName}
                variant="secondary"
                className="skip-name-button"
              />
            </div>
          </div>
        </div>
      )}

      {avatarUrl && !isSaving && !showNameInput && (
        <div className="avatar-success">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h4>Avatar Başarıyla Oluşturuldu ve Kaydedildi!</h4>
            <p>Avatarınız hazır ve veritabanına kaydedildi.</p>
            <CustomButton
              text="Tamam"
              onClick={handleClose}
              className="success-button"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default AvatarCreatorComponent 