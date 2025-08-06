import React, { useState, useEffect } from 'react'
import { updateAITeacher } from '../../services/aiTeacherService'
import './AITeacherEditor.css'

const AITeacherEditor = ({ teacher, isOpen, onClose, onTeacherUpdated }) => {
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
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name || '',
        subject: teacher.subject || 'Matematik',
        specialty: teacher.specialty || '',
        personality_type: teacher.personality_type || 'Dostane ve Samimi',
        teaching_style: teacher.teaching_style || 'Etkileşimli ve Soru-Cevap',
        experience_level: teacher.experience_level || 5,
        education_level: teacher.education_level || 'Lise',
        character_description: teacher.character_description || ''
      })
    }
  }, [teacher])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    try {
      setIsUpdating(true)
      
      const result = await updateAITeacher(teacher.id, formData)
      
      if (result.success) {
        alert('AI öğretmen başarıyla güncellendi!')
        if (onTeacherUpdated) {
          onTeacherUpdated(result.teacher)
        }
        onClose()
      } else {
        alert('AI öğretmen güncellenirken hata: ' + result.error)
      }
    } catch (error) {
      console.error('AI öğretmen güncelleme hatası:', error)
      alert('AI öğretmen güncellenirken hata oluştu')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isOpen || !teacher) return null

  return (
    <div className="ai-teacher-editor-modal">
      <div className="editor-content">
        <div className="editor-header">
          <h2>✏️ AI Öğretmen Düzenle</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
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
              onClick={onClose}
              disabled={isUpdating}
            >
              İptal
            </button>
            <button 
              className="update-btn"
              onClick={handleSubmit}
              disabled={isUpdating || !formData.name.trim()}
            >
              {isUpdating ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AITeacherEditor 