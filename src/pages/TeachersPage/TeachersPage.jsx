import React, { useState, useEffect } from 'react'
import { getAITeachers, createAITeacher, deleteAITeacher, getTeacherStats, updateTeacherAvatar } from '../../services/aiTeacherService'
import AITeacherAvatarCreator from '../../components/AITeacherAvatarCreator/AITeacherAvatarCreator'
import AITeacherEditor from '../../components/AITeacherEditor/AITeacherEditor'
import AITeacherChat from '../../components/AITeacherChat/AITeacherChat'
import Avatar3DPreview from '../../components/Avatar3DPreview/Avatar3DPreview' // Yeni bileşeni import et
import './TeachersPage.css'

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ totalTeachers: 0, totalConversations: 0, averageExperience: 0 })
  const [formData, setFormData] = useState({
    name: '',
    subject: 'Matematik',
    specialty: '',
    personality_type: 'Dostane ve Samimi',
    teaching_style: 'Etkileşimli ve Soru-Cevap',
    experience_level: 5,
    education_level: 'Lise',
    character_description: ''
  })
  const [isCreating, setIsCreating] = useState(false)
  const [showAvatarCreator, setShowAvatarCreator] = useState(false)
  const [selectedTeacherId, setSelectedTeacherId] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState(null)

  // AI öğretmenleri ve istatistikleri yükle
  useEffect(() => {
    loadTeachersAndStats()
  }, [])

  const loadTeachersAndStats = async () => {
    try {
      setIsLoading(true)
      const [teachersResult, statsResult] = await Promise.all([
        getAITeachers(),
        getTeacherStats()
      ])

      if (teachersResult.success) {
        setTeachers(teachersResult.teachers)
      }

      if (statsResult.success) {
        setStats(statsResult.stats)
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCreateTeacher = async () => {
    try {
      setIsCreating(true)
      
      const result = await createAITeacher(formData)
      
      if (result.success) {
        setTeachers(prev => [result.teacher, ...prev])
        setShowCreateForm(false)
        setFormData({
          name: '',
        subject: 'Matematik',
          specialty: '',
          personality_type: 'Dostane ve Samimi',
          teaching_style: 'Etkileşimli ve Soru-Cevap',
          experience_level: 5,
          education_level: 'Lise',
          character_description: ''
        })
        
        // İstatistikleri güncelle
        const statsResult = await getTeacherStats()
        if (statsResult.success) {
          setStats(statsResult.stats)
        }
      } else {
        alert('AI öğretmen oluşturulurken hata: ' + result.error)
      }
    } catch (error) {
      console.error('AI öğretmen oluşturma hatası:', error)
      alert('AI öğretmen oluşturulurken hata oluştu')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm('Bu AI öğretmeni silmek istediğinizden emin misiniz?')) {
      try {
        const result = await deleteAITeacher(teacherId)
        if (result.success) {
          setTeachers(prev => prev.filter(t => t.id !== teacherId))
          
          // İstatistikleri güncelle
          const statsResult = await getTeacherStats()
          if (statsResult.success) {
            setStats(statsResult.stats)
          }
        } else {
          alert('AI öğretmen silinirken hata: ' + result.error)
        }
      } catch (error) {
        console.error('AI öğretmen silme hatası:', error)
        alert('AI öğretmen silinirken hata oluştu')
      }
    }
  }

  const handleAvatarClick = (teacherId) => {
    setSelectedTeacherId(teacherId)
    setShowAvatarCreator(true)
  }

  const handleAvatarCreated = (avatarUrl) => {
    // Öğretmen listesini güncelle
    setTeachers(prev => prev.map(t => 
      t.id === selectedTeacherId ? { ...t, avatar_url: avatarUrl } : t
    ))
  }

  const handleCloseAvatarCreator = () => {
    setShowAvatarCreator(false)
    setSelectedTeacherId(null)
  }

  const handleChatClick = (teacher) => {
    setSelectedTeacher(teacher)
    setShowChat(true)
  }

  const handleEditClick = (teacher) => {
    setSelectedTeacher(teacher)
    setShowEditor(true)
  }

  const handleTeacherUpdated = (updatedTeacher) => {
    setTeachers(prev => prev.map(t => 
      t.id === updatedTeacher.id ? updatedTeacher : t
    ))
  }

  const handleCloseEditor = () => {
    setShowEditor(false)
    setSelectedTeacher(null)
  }

  const handleCloseChat = () => {
    setShowChat(false)
    setSelectedTeacher(null)
  }

  return (
    <div className="teachers-page">
      <div className="teachers-section">
        <div className="section-header">
          <h1>AI Öğretmenlerim</h1>
          <p>Kişiselleştirilmiş AI öğretmenlerinizi yönetin ve yenilerini oluşturun</p>
        </div>

        {/* İstatistikler */}
          <div className="teachers-stats" style={{ color: '#1f2937' }}>
          <div className="stat-card">
            <div className="stat-icon">🤖</div>
            <div className="stat-content">
                <h3 style={{ color: '#1f2937' }}>Toplam AI Öğretmen</h3>
              <div className="stat-number">{stats.totalTeachers}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
                <h3 style={{ color: '#1f2937' }}>Toplam Konuşma</h3>
              <div className="stat-number">{stats.totalConversations}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
                <h3 style={{ color: '#1f2937' }}>Ortalama Deneyim</h3>
              <div className="stat-number">{stats.averageExperience}</div>
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
            {isLoading ? (
              <div className="loading-message">AI öğretmenler yükleniyor...</div>
            ) : teachers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🤖</div>
                <h3>Henüz AI Öğretmeniniz Yok</h3>
                <p>İlk AI öğretmeninizi oluşturarak başlayın</p>
                <button 
                  className="create-first-teacher-btn"
                  onClick={() => setShowCreateForm(true)}
                >
                  ➕ İlk AI Öğretmeni Oluştur
                </button>
              </div>
            ) : (
              teachers.map(teacher => (
              <div key={teacher.id} className="teacher-card">
                <div className="teacher-avatar-container">
                  {teacher.avatar_url ? (
                    <Avatar3DPreview avatarUrl={teacher.avatar_url} />
                  ) : (
                    <div className="teacher-icon-fallback">👨‍🏫</div>
                  )}
                </div>

                <div className="teacher-info">
                  <h3>{teacher.name}</h3>
                  <p className="teacher-subject">{teacher.subject} - {teacher.specialty}</p>
                  
                  <div className="teacher-details">
                    <div className="detail-item">
                      <span className="detail-icon">🎭</span>
                        <span>Kişilik: {teacher.personality_type}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⭐</span>
                        <span>Deneyim: {teacher.experience_level}/10</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-icon">🎓</span>
                        <span>Seviye: {teacher.education_level}</span>
                    </div>
                  </div>
                </div>

                <div className="teacher-actions">
                    <button 
                      className="action-btn chat-btn"
                      onClick={() => handleChatClick(teacher)}
                    >
                    💬 Konuş
                  </button>
                    <button 
                      className="action-btn avatar-btn"
                      onClick={() => handleAvatarClick(teacher.id)}
                    >
                      👤 Avatar
                    </button>
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => handleEditClick(teacher)}
                    >
                    ✏️ Düzenle
                  </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteTeacher(teacher.id)}
                    >
                    🗑️ Sil
                  </button>
                </div>
              </div>
              ))
            )}

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
                      <input 
                        type="text" 
                        placeholder="Örn: Prof. Dr. Ahmet"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Branş</label>
                      <select 
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                      >
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
                      <input 
                        type="text" 
                        placeholder="Örn: Kalkülüs, Analiz"
                        value={formData.specialty}
                        onChange={(e) => handleInputChange('specialty', e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Eğitim Seviyesi</label>
                      <select 
                        value={formData.education_level}
                        onChange={(e) => handleInputChange('education_level', e.target.value)}
                      >
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
                      <select 
                        value={formData.personality_type}
                        onChange={(e) => handleInputChange('personality_type', e.target.value)}
                      >
                        <option>Dostane ve Samimi</option>
                        <option>Ciddi ve Akademik</option>
                        <option>Eğlenceli ve Yaratıcı</option>
                        <option>Sabırlı ve Destekleyici</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Öğretim Stili</label>
                      <select 
                        value={formData.teaching_style}
                        onChange={(e) => handleInputChange('teaching_style', e.target.value)}
                      >
                        <option>Etkileşimli ve Soru-Cevap</option>
                        <option>Adım Adım Açıklama</option>
                        <option>Görsel ve Örnek Destekli</option>
                        <option>Pratik ve Uygulama Odaklı</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Deneyim Seviyesi (1-10): {formData.experience_level}</label>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={formData.experience_level}
                        onChange={(e) => handleInputChange('experience_level', parseInt(e.target.value))}
                      />
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
                      value={formData.character_description}
                      onChange={(e) => handleInputChange('character_description', e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    className="cancel-btn"
                    onClick={() => setShowCreateForm(false)}
                    disabled={isCreating}
                  >
                    İptal
                  </button>
                  <button 
                    className="create-btn"
                    onClick={handleCreateTeacher}
                    disabled={isCreating || !formData.name.trim()}
                  >
                    {isCreating ? '🤖 Oluşturuluyor...' : '🤖 AI Öğretmen Oluştur'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Teacher Avatar Creator Modal */}
        {showAvatarCreator && (
          <AITeacherAvatarCreator
            teacherId={selectedTeacherId}
            onAvatarCreated={handleAvatarCreated}
            onClose={handleCloseAvatarCreator}
          />
        )}

        {/* AI Teacher Editor Modal */}
        <AITeacherEditor
          teacher={selectedTeacher}
          isOpen={showEditor}
          onClose={handleCloseEditor}
          onTeacherUpdated={handleTeacherUpdated}
        />

        {/* AI Teacher Chat Modal */}
        <AITeacherChat
          teacher={selectedTeacher}
          isOpen={showChat}
          onClose={handleCloseChat}
        />
      </div>
    </div>
  )
}

export default TeachersPage