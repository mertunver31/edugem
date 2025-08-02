import React, { useState } from 'react'
import { AvatarCreator } from '@readyplayerme/react-avatar-creator'
import CustomButton from '../CustomButton/CustomButton'
import './AvatarCreator.css'

const AvatarCreatorComponent = ({ onAvatarCreated, onClose }) => {
  const [isCreating, setIsCreating] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)

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

  const handleOnAvatarExported = (event) => {
    console.log(`Avatar URL is: ${event.data.url}`)
    setAvatarUrl(event.data.url)
    setIsCreating(false)
    
    if (onAvatarCreated) {
      onAvatarCreated(event.data.url)
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
            <p>Başlamak için aşağıdaki butona tıklayın. Avatar oluşturucu açılacak ve istediğiniz gibi özelleştirebileceksiniz.</p>
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

      {avatarUrl && (
        <div className="avatar-success">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h4>Avatar Başarıyla Oluşturuldu!</h4>
            <p>Avatarınız hazır. Kaydetmek için profil sayfasına gidebilirsiniz.</p>
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