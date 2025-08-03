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
        <div className="section-header">
          <h1>Profilim</h1>
        </div>

        <div className="profile-content">
          {/* Profil Kartı */}
          <div className="profile-card">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profil" />
                ) : (
                  <div className="avatar-placeholder">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button className="change-avatar-btn">📷 Fotoğraf Değiştir</button>
            </div>

            <div className="profile-info-section">
              <h2>{user?.user_metadata?.name || 'Kullanıcı'}</h2>
              <p className="user-email">{user?.email}</p>
              <div className="user-badges">
                <span className="badge student">🎓 Öğrenci</span>
                <span className="badge active">✅ Aktif</span>
              </div>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-icon">📚</div>
              <div className="stat-info">
                <span className="stat-number">12</span>
                <span className="stat-label">Tamamlanan Ders</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">⏱️</div>
              <div className="stat-info">
                <span className="stat-number">45h</span>
                <span className="stat-label">Toplam Çalışma</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🏆</div>
              <div className="stat-info">
                <span className="stat-number">8</span>
                <span className="stat-label">Başarım</span>
              </div>
            </div>
          </div>

          {/* Profil Detayları */}
          <div className="profile-details-grid">
            <div className="detail-card">
              <h3>📋 Kişisel Bilgiler</h3>
              <div className="detail-list">
                <div className="detail-row">
                  <span className="detail-label">Ad Soyad</span>
                  <span className="detail-value">{user?.user_metadata?.name || 'Belirtilmemiş'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">E-posta</span>
                  <span className="detail-value">{user?.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Kayıt Tarihi</span>
                  <span className="detail-value">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-card">
              <h3>⚙️ Hesap Ayarları</h3>
              <div className="detail-list">
                <div className="detail-row">
                  <span className="detail-label">Hesap Durumu</span>
                  <span className="detail-value status-active">Aktif</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Son Giriş</span>
                  <span className="detail-value">
                    {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('tr-TR') : 'Belirtilmemiş'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Dil</span>
                  <span className="detail-value">Türkçe</span>
                </div>
              </div>
            </div>
          </div>

          {/* Eylem Butonları */}
          <div className="profile-actions">
            <button className="action-btn primary">
              ✏️ Profili Düzenle
            </button>
            <button className="action-btn secondary">
              🔒 Şifre Değiştir
            </button>
            <button className="action-btn secondary">
              🔔 Bildirim Ayarları
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage 