import React, { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import { getCurrentUser } from '../../services/authService'
import CustomButton from '../CustomButton/CustomButton'
import './DersSecimi.css'

const DersSecimi = ({ onDersSec, onClose }) => {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const userResult = await getCurrentUser()
      if (!userResult.success) {
        throw new Error('Kullanıcı bilgileri alınamadı')
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userResult.user.id)
        .not('enhanced_content', 'is', null)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Dökümanlar alınamadı: ${error.message}`)
      }

      setDocuments(data || [])
    } catch (error) {
      console.error('Döküman yükleme hatası:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDersSec = (document) => {
    setSelectedDocument(document)
  }

  const handleDevamEt = () => {
    if (selectedDocument) {
      onDersSec(selectedDocument)
    }
  }

  const handleIptal = () => {
    onClose()
  }

  return (
    <div className="ders-secimi-modal">
      <div className="modal-overlay" onClick={handleIptal}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h2>📚 Çalışmak İstediğin Dersi Seç</h2>
          <button className="close-button" onClick={handleIptal}>×</button>
        </div>
        
        <div className="modal-body">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Dersler yükleniyor...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>Çalışılacak Ders Yok</h3>
              <p>Enhanced content'i hazır olan dersler burada görünecek</p>
            </div>
          ) : (
            <>
              <div className="ders-grid">
                {documents.map((document) => (
                  <div 
                    key={document.id} 
                    className={`ders-card ${selectedDocument?.id === document.id ? 'selected' : ''}`}
                    onClick={() => handleDersSec(document)}
                  >
                    <div className="ders-icon">📄</div>
                    <div className="ders-info">
                      {document.course_title && (
                        <h4 className="ders-course-title">{document.course_title}</h4>
                      )}
                      <h3>{document.title || document.file_name}</h3>
                      <p className="ders-date">
                        {new Date(document.created_at).toLocaleDateString('tr-TR')}
                      </p>
                      <div className="ders-status">
                        <span className="status-badge success">✅ Hazır</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="modal-actions">
                <CustomButton
                  text="İptal"
                  onClick={handleIptal}
                  variant="secondary"
                />
                <CustomButton
                  text="Devam Et"
                  onClick={handleDevamEt}
                  disabled={!selectedDocument}
                  variant="primary"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DersSecimi 