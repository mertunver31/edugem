import React, { useState, useEffect } from 'react'
import { getAITeachers } from '../../services/aiTeacherService'
import Avatar3DPreview from '../Avatar3DPreview/Avatar3DPreview'
import './AITeacherSelector.css'

const AITeacherSelector = ({ isOpen, onClose, onTeacherSelected }) => {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadTeachers()
    }
  }, [isOpen])

  const loadTeachers = async () => {
    try {
      setLoading(true)
      const result = await getAITeachers()
      if (result.success) {
        setTeachers(result.teachers)
      } else {
        console.error('AI öğretmenler yüklenirken hata:', result.error)
      }
    } catch (error) {
      console.error('AI öğretmenler yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTeacherSelect = (teacher) => {
    setSelectedTeacher(teacher)
  }

  const handleConfirm = () => {
    if (selectedTeacher && onTeacherSelected) {
      onTeacherSelected(selectedTeacher)
      // onClose() çağrılmayacak çünkü handleTeacherSelected içinde zaten kapanıyor
    }
  }

  const handleSkip = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="ai-teacher-selector-modal">
      <div className="selector-content">
        <div className="selector-header">
          <h2>👨‍🏫 AI Öğretmen Seç</h2>
          <p>Panoramik sınıfa hangi AI öğretmeni davet etmek istiyorsunuz?</p>
        </div>

        {loading ? (
          <div className="loading-section">
            <div className="loading-spinner">⏳</div>
            <p>AI öğretmenler yükleniyor...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👨‍🏫</div>
            <h3>Henüz AI Öğretmeniniz Yok</h3>
            <p>Panoramik sınıfa girmek için önce bir AI öğretmen oluşturmanız gerekiyor.</p>
            <button className="create-teacher-btn" onClick={onClose}>
              AI Öğretmen Oluştur
            </button>
          </div>
        ) : (
          <>
            <div className="teachers-grid">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className={`teacher-card ${selectedTeacher?.id === teacher.id ? 'selected' : ''}`}
                  onClick={() => handleTeacherSelect(teacher)}
                >
                  <div className="teacher-avatar">
                    {teacher.avatar_url ? (
                      <Avatar3DPreview avatarUrl={teacher.avatar_url} />
                    ) : (
                      <span className="teacher-icon">👨‍🏫</span>
                    )}
                  </div>
                  <div className="teacher-info">
                    <h4>{teacher.name}</h4>
                    <p className="teacher-subject">{teacher.subject}</p>
                    <p className="teacher-specialty">{teacher.specialty}</p>
                    <div className="teacher-stats">
                      <span className="experience">⭐ {teacher.experience_level}/10</span>
                      <span className="personality">{teacher.personality_type}</span>
                    </div>
                  </div>
                  {selectedTeacher?.id === teacher.id && (
                    <div className="selected-indicator">✓</div>
                  )}
                </div>
              ))}
            </div>

            <div className="selector-actions">
              <button className="skip-btn" onClick={handleSkip}>
                Öğretmensiz Gir
              </button>
              <button
                className="confirm-btn"
                onClick={handleConfirm}
                disabled={!selectedTeacher}
              >
                {selectedTeacher ? `${selectedTeacher.name} ile Gir` : 'Öğretmen Seç'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AITeacherSelector 