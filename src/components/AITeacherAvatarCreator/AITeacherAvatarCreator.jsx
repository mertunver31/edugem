import React, { useState } from 'react'
import { AvatarCreator } from '@readyplayerme/react-avatar-creator'
import CustomButton from '../CustomButton/CustomButton'
import { updateTeacherAvatar } from '../../services/aiTeacherService'
import './AITeacherAvatarCreator.css'

const AITeacherAvatarCreator = ({ teacherId, onAvatarCreated, onClose }) => {
  const [isCreating, setIsCreating] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

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
    console.log(`AI Teacher Avatar URL is: ${event.data.url}`)
    setAvatarUrl(event.data.url)
    setIsCreating(false)
    
    // Avatar'ı otomatik olarak AI öğretmene kaydet
    await handleAutoSave(event.data.url)
  }

  const handleAutoSave = async (avatarUrl) => {
    setIsSaving(true)
    try {
      // Avatar URL'ini AI öğretmene kaydet
      const updateResult = await updateTeacherAvatar(teacherId, avatarUrl)
      if (updateResult.success) {
        console.log('AI öğretmen avatarı otomatik olarak kaydedildi!')
        // Başarı mesajını göster
        setTimeout(() => {
          alert('AI öğretmen avatarı başarıyla oluşturuldu ve kaydedildi!')
        }, 500)
        
        // Callback ile avatar URL'ini döndür
        if (onAvatarCreated) {
          onAvatarCreated(avatarUrl)
        }
      } else {
        throw new Error(updateResult.error)
      }
    } catch (error) {
      console.error('AI öğretmen avatar kaydetme hatası:', error)
      alert('Avatar kaydedilirken hata oluştu: ' + error.message)
    } finally {
      setIsSaving(false)
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
      <div className="ai-teacher-avatar-creator-container">
        <div className="creator-header">
          <h3>🤖 AI Öğretmen Avatarı Oluştur</h3>
          <p>Ready Player Me ile AI öğretmeniniz için kişiselleştirilmiş 3D avatar oluşturun</p>
        </div>

        <div className="creator-content">
          <div className="creator-info">
            <div className="info-icon">🎭</div>
            <h4>AI Öğretmen Avatarı</h4>
            <p>Başlamak için aşağıdaki butona tıklayın. Avatar oluşturucu açılacak ve AI öğretmeniniz için istediğiniz gibi özelleştirebileceksiniz. Avatar oluşturulduğunda otomatik olarak AI öğretmeninize atanacaktır.</p>
          </div>

          <div className="creator-actions">
            <CustomButton
              text="AI Öğretmen Avatarı Oluştur"
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
    <div className="ai-teacher-avatar-creator-fullscreen">
      <div className="creator-header-bar">
        <h3>🤖 AI Öğretmen Avatarı Oluşturucu</h3>
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
            <h4>AI Öğretmen Avatarı Kaydediliyor...</h4>
            <p>Lütfen bekleyin, avatar otomatik olarak AI öğretmeninize atanıyor.</p>
          </div>
        </div>
      )}

      {avatarUrl && !isSaving && (
        <div className="avatar-success">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h4>AI Öğretmen Avatarı Başarıyla Oluşturuldu!</h4>
            <p>Avatar AI öğretmeninize başarıyla atandı.</p>
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

export default AITeacherAvatarCreator 