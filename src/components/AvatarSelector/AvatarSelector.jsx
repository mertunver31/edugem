import React, { useState, useEffect } from 'react'
import CustomButton from '../CustomButton/CustomButton'
import { getUserAvatars } from '../../services/avatarService'
import './AvatarSelector.css'

const AvatarSelector = ({ onAvatarSelect, selectedAvatar, onClose }) => {
  const [avatars, setAvatars] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAvatars()
  }, [])

  const loadAvatars = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const avatarList = await getUserAvatars()
      setAvatars(avatarList)
    } catch (error) {
      setError('Avatar listesi yüklenirken hata oluştu')
      console.error('Avatar yükleme hatası:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarSelect = (avatar) => {
    onAvatarSelect(avatar)
  }

  if (isLoading) {
    return (
      <div className="avatar-selector-overlay">
        <div className="avatar-selector-modal">
          <div className="loading-spinner"></div>
          <p>Avatarlar yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="avatar-selector-overlay">
        <div className="avatar-selector-modal">
          <div className="error-message">
            <p>{error}</p>
            <CustomButton
              text="Tekrar Dene"
              onClick={loadAvatars}
              variant="secondary"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="avatar-selector-overlay">
      <div className="avatar-selector-modal">
        <div className="avatar-selector-header">
          <h3>Avatar Seç</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        <div className="avatar-list">
          {avatars.length === 0 ? (
            <div className="no-avatars">
              <p>Henüz avatar oluşturmadınız</p>
              <p>Avatar oluştur sayfasından avatar oluşturabilirsiniz</p>
            </div>
          ) : (
            avatars.map((avatar) => (
              <div
                key={avatar.id}
                className={`avatar-item ${selectedAvatar?.id === avatar.id ? 'selected' : ''}`}
                onClick={() => handleAvatarSelect(avatar)}
              >
                <div className="avatar-preview">
                  <span className="avatar-icon">🎭</span>
                </div>
                <div className="avatar-info">
                  <h4>{avatar.name}</h4>
                  <p>{new Date(avatar.created_at).toLocaleDateString('tr-TR')}</p>
                </div>
                {selectedAvatar?.id === avatar.id && (
                  <div className="selected-indicator">✓</div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="avatar-selector-actions">
          <CustomButton
            text="İptal"
            onClick={onClose}
            variant="secondary"
          />
          {selectedAvatar && (
            <CustomButton
              text="Seç"
              onClick={() => onAvatarSelect(selectedAvatar)}
              variant="primary"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default AvatarSelector 