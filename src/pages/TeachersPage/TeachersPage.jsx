import React, { useState, useEffect } from 'react'
import './TeachersPage.css'

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Mock data - gerçek uygulamada Supabase'den gelecek
  useEffect(() => {
    setTeachers([
      {
        id: 1,
        name: 'Prof. Dr. Matematik',
        subject: 'Matematik',
        specialty: 'Kalkülüs, Analiz',
        personality: 'Sabırlı ve Destekleyici',
        experience: 8,
        totalLessons: 15,
        status: 'active'
      },
      {
        id: 2,
        name: 'Dr. Fizik Uzmanı',
        subject: 'Fizik',
        specialty: 'Kuantum Fiziği',
        personality: 'Ciddi ve Akademik',
        experience: 6,
        totalLessons: 8,
        status: 'active'
      }
    ])
  }, [])

  return (
    <div className="teachers-page">
      <div className="teachers-section">
        <div className="section-header">
          <h1>AI Öğretmenlerim</h1>
          <p>Kişiselleştirilmiş AI öğretmenlerinizi yönetin ve yenilerini oluşturun</p>
        </div>

        {/* İstatistikler */}
        <div className="teachers-stats">
          <div className="stat-card">
            <div className="stat-icon">🤖</div>
            <div className="stat-content">
              <h3>Toplam AI Öğretmen</h3>
              <div className="stat-number">{teachers.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>Verilen Dersler</h3>
              <div className="stat-number">{teachers.reduce((sum, t) => sum + t.totalLessons, 0)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>Ortalama Deneyim</h3>
              <div className="stat-number">{Math.round(teachers.reduce((sum, t) => sum + t.experience, 0) / teachers.length || 0)}</div>
            </div>
          </div>
        </div>

        {/* Öğretmen Listesi */}
        <div className="teachers-list">
          <div className="teachers-header">
            <h2>🎓 Mevcut AI Öğretmenler</h2>
            <button 
              className="create-teacher-btn"
              onClick={() => setShowCreateForm(true)}
            >
              ➕ Yeni AI Öğretmen Oluştur
            </button>
          </div>

          <div className="teachers-grid">
            {teachers.map(teacher => (
              <div key={teacher.id} className="teacher-card">
                <div className="teacher-avatar">
                  <div className="avatar-circle">
                    <span className="teacher-icon">👨‍🏫</span>
                  </div>
                  <div className="status-badge active">Aktif</div>
                </div>

                <div className="teacher-info">
                  <h3>{teacher.name}</h3>
                  <p className="teacher-subject">{teacher.subject} - {teacher.specialty}</p>
                  
                  <div className="teacher-details">
                    <div className="detail-item">
                      <span className="detail-icon">🎭</span>
                      <span>Kişilik: {teacher.personality}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⭐</span>
                      <span>Deneyim: {teacher.experience}/10</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">📚</span>
                      <span>Verilen Ders: {teacher.totalLessons}</span>
                    </div>
                  </div>
                </div>

                <div className="teacher-actions">
                  <button className="action-btn chat-btn">
                    💬 Konuş
                  </button>
                  <button className="action-btn edit-btn">
                    ✏️ Düzenle
                  </button>
                  <button className="action-btn delete-btn">
                    🗑️ Sil
                  </button>
                </div>
              </div>
            ))}

            {/* Boş slot */}
            <div className="empty-teacher-slot" onClick={() => setShowCreateForm(true)}>
              <div className="empty-content">
                <span className="plus-icon">+</span>
                <h3>Yeni AI Öğretmen</h3>
                <p>Özel AI öğretmeninizi oluşturun</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hızlı AI Öğretmen Oluştur */}
        {showCreateForm && (
          <div className="create-teacher-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>🤖 Yeni AI Öğretmen Oluştur</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowCreateForm(false)}
                >
                  ✕
                </button>
              </div>

              <div className="teacher-form">
                <div className="form-section">
                  <h3>📋 Temel Bilgiler</h3>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>AI Öğretmen Adı</label>
                      <input type="text" placeholder="Örn: Prof. Dr. Ahmet" />
                    </div>
                    <div className="form-field">
                      <label>Branş</label>
                      <select>
                        <option>Matematik</option>
                        <option>Fizik</option>
                        <option>Kimya</option>
                        <option>Biyoloji</option>
                        <option>Türkçe</option>
                        <option>Tarih</option>
                        <option>İngilizce</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Uzmanlık Alanı</label>
                      <input type="text" placeholder="Örn: Kalkülüs, Analiz" />
                    </div>
                    <div className="form-field">
                      <label>Eğitim Seviyesi</label>
                      <select>
                        <option>İlkokul</option>
                        <option>Ortaokul</option>
                        <option>Lise</option>
                        <option>Üniversite</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>🎭 Kişilik ve Stil</h3>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Kişilik Tipi</label>
                      <select>
                        <option>Dostane ve Samimi</option>
                        <option>Ciddi ve Akademik</option>
                        <option>Eğlenceli ve Yaratıcı</option>
                        <option>Sabırlı ve Destekleyici</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Öğretim Stili</label>
                      <select>
                        <option>Etkileşimli ve Soru-Cevap</option>
                        <option>Adım Adım Açıklama</option>
                        <option>Görsel ve Örnek Destekli</option>
                        <option>Pratik ve Uygulama Odaklı</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Deneyim Seviyesi (1-10)</label>
                      <input type="range" min="1" max="10" defaultValue="5" />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>💭 Özel Karakter</h3>
                  <div className="form-field full-width">
                    <label>AI Öğretmen Karakteri</label>
                    <textarea 
                      placeholder="AI öğretmenin nasıl davranacağını, konuşma tarzını ve yaklaşımını tanımlayın..."
                      rows="4"
                    ></textarea>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    className="cancel-btn"
                    onClick={() => setShowCreateForm(false)}
                  >
                    İptal
                  </button>
                  <button className="create-btn">
                    🤖 AI Öğretmen Oluştur
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeachersPage