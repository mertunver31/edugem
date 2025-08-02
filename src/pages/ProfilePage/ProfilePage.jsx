import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../services/authService'
import CustomButton from '../../components/CustomButton/CustomButton'
import './ProfilePage.css'

const ProfilePage = () => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    setIsLoading(true)
    try {
      const result = await getCurrentUser()
      if (result.success) {
        setUser(result.user)
      } else {
        console.error('Kullanıcı bilgileri alınamadı:', result.error)
      }
    } catch (error) {
      console.error('Profil yükleme hatası:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-section">
          <div className="loading-spinner"></div>
          <p>Profil bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-section">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profil" />
            ) : (
              <div className="avatar-placeholder">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h2>{user?.user_metadata?.name || 'Kullanıcı'}</h2>
            <p className="user-email">{user?.email}</p>
            <p className="user-role">Öğrenci</p>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-group">
            <h3>Kişisel Bilgiler</h3>
            <div className="detail-item">
              <span className="detail-label">Ad Soyad:</span>
              <span className="detail-value">{user?.user_metadata?.name || 'Belirtilmemiş'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">E-posta:</span>
              <span className="detail-value">{user?.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Hesap Türü:</span>
              <span className="detail-value">Öğrenci</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Kayıt Tarihi:</span>
              <span className="detail-value">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
              </span>
            </div>
          </div>

          <div className="detail-group">
            <h3>Hesap Durumu</h3>
            <div className="detail-item">
              <span className="detail-label">Durum:</span>
              <span className="detail-value status-active">Aktif</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Son Giriş:</span>
              <span className="detail-value">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('tr-TR') : 'Belirtilmemiş'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <CustomButton
            text="Profili Düzenle"
            variant="secondary"
            className="edit-profile-button"
          />
          <CustomButton
            text="Şifre Değiştir"
            variant="secondary"
            className="change-password-button"
          />
        </div>
      </div>
    </div>
  )
}

export default ProfilePage 