import React, { useState } from 'react'
import CustomButton from '../../components/CustomButton/CustomButton'
import { uploadPDF } from '../../services/pdfService'
import './CreateCoursePage.css'

const CreateCoursePage = () => {
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    subject: '',
    grade: '',
    duration: ''
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCourseData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Hata mesajını temizle
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!courseData.title.trim()) {
      newErrors.title = 'Ders başlığı gereklidir'
    }
    
    if (!courseData.subject) {
      newErrors.subject = 'Ders konusu seçilmelidir'
    }
    
    if (!courseData.grade) {
      newErrors.grade = 'Sınıf seviyesi seçilmelidir'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Dosya boyutu kontrolü (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Dosya boyutu 10MB\'dan büyük olamaz!')
        return
      }
      
      // Dosya tipi kontrolü
      if (file.type !== 'application/pdf') {
        alert('Sadece PDF dosyaları desteklenmektedir!')
        return
      }
      
      setSelectedFile(file)
      setUploadStatus('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setUploadStatus('İşlem başlatılıyor...')

    try {
      console.log('Ders verisi:', courseData)
      
      if (selectedFile) {
        setUploadStatus('PDF dosyası yükleniyor...')
        const uploadResult = await uploadPDF(selectedFile)
        
        if (uploadResult.success) {
          console.log('PDF başarıyla yüklendi:', uploadResult.data)
          setUploadStatus('PDF başarıyla yüklendi. Ders oluşturuluyor...')
        } else {
          throw new Error(uploadResult.error)
        }
      } else {
        setUploadStatus('Ders oluşturuluyor...')
      }

      // Simülasyon - gerçek API çağrısı buraya gelecek
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('Ders başarıyla oluşturuldu!')
      
      // Formu temizle
      setCourseData({
        title: '',
        description: '',
        subject: '',
        grade: '',
        duration: ''
      })
      setSelectedFile(null)
      setUploadStatus('')
      setErrors({})
      
      // Dosya input'unu temizle
      const fileInput = document.getElementById('pdf-file')
      if (fileInput) {
        fileInput.value = ''
      }
      
    } catch (error) {
      console.error('İşlem hatası:', error)
      setUploadStatus('Hata: ' + error.message)
      alert('İşlem sırasında hata oluştu: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="create-course-page">
      <div className="courses-section">
        <div className="section-header">
          <h1>Derslerim</h1>
          <p>Çalışma derslerinizi yönetin ve yeni dersler oluşturun</p>
        </div>

        {/* Ders İstatistikleri */}
        <div className="course-stats">
          <div className="stat-item">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <span className="stat-number">4</span>
              <span className="stat-label">Aktif Ders</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <span className="stat-number">8</span>
              <span className="stat-label">Tamamlanan</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <span className="stat-number">24h</span>
              <span className="stat-label">Toplam Süre</span>
            </div>
          </div>
        </div>

        {/* Oluşturulmuş Dersler */}
        <div className="created-courses">
          <div className="courses-header">
            <h2>📖 Mevcut Derslerim</h2>
            <button className="create-new-btn">➕ Yeni Ders Oluştur</button>
          </div>
          <div className="courses-grid">
            <div className="course-card">
              <div className="course-status active">Aktif</div>
              <div className="course-content">
                <h3>efişrenfik</h3>
                <span className="course-subject">Matematik</span>
                <div className="course-info">
                  <span className="info-icon">📚</span>
                  <span>Eğitim seviyesi: Eğitim gevezeliği</span>
                </div>
                <div className="course-info">
                  <span className="info-icon">🕐</span>
                  <span>Süre: yakın</span>
                </div>
              </div>
              <div className="course-actions">
                <button className="action-btn enter-btn">
                  🚪 Derse Gir
                </button>
                <button className="action-btn delete-btn">
                  🗑️ Sil
                </button>
              </div>
            </div>

            <div className="course-card">
              <div className="course-status inactive">Pasif</div>
              <div className="course-content">
                <h3>aaab</h3>
                <span className="course-subject">bbb</span>
                <div className="course-info">
                  <span className="info-icon">📚</span>
                  <span>Eğitim seviyesi: Eğitim gevezeliği</span>
                </div>
                <div className="course-info">
                  <span className="info-icon">🕐</span>
                  <span>Süre: yakın</span>
                </div>
              </div>
              <div className="course-actions">
                <button className="action-btn enter-btn">
                  🚪 Derse Gir
                </button>
                <button className="action-btn delete-btn">
                  🗑️ Sil
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Yeni Çalışma Dersi Oluştur */}
        <div className="create-course-section">
          <h2>Yeni Çalışma Dersi Oluştur</h2>
          
          <div className="form-sections">
            {/* Çalışma Dersi */}
            <div className="form-section">
              <h3>Çalışma Dersi</h3>
              <div className="form-field">
                <label>Çalışacağınız konunun kısa açıklamasını yazın</label>
                <input type="text" placeholder="Çalışacağınız konunun kısa açıklamasını yazın..." className="form-input" />
              </div>
            </div>

            {/* Çalışma Profili */}
            <div className="form-section">
              <h3>Çalışma Profili</h3>
              <div className="form-row">
                <div className="form-field">
                  <label>Eğitim Seviyesi</label>
                  <select className="form-select">
                    <option>Eğitim seviyesi seçin...</option>
                    <option>İlkokul</option>
                    <option>Ortaokul</option>
                    <option>Lise</option>
                    <option>Üniversite</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Bilgi seviyesi seçin</label>
                  <select className="form-select">
                    <option>Bilgi seviyesi seçin...</option>
                    <option>Başlangıç</option>
                    <option>Orta</option>
                    <option>İleri</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bu Konu Hakkında Bilgi */}
            <div className="form-section">
              <h3>Bu Konu Hakkında Bilgi</h3>
              <div className="form-field">
                <label>Çalışma amacınız nedir?</label>
                <select className="form-select">
                  <option>Çalışma amacınızı seçin...</option>
                  <option>Sınav Hazırlığı</option>
                  <option>Genel Bilgi</option>
                  <option>Proje Çalışması</option>
                  <option>Hobisi Olarak</option>
                </select>
              </div>
            </div>

            {/* AI Öğretmen */}
            <div className="form-section">
              <h3>AI Öğretmen Seçimi</h3>
              <div className="form-field">
                <label>AI Öğretmen seçin (opsiyonel)</label>
                <select className="form-select">
                  <option>Seçiniz...</option>
                  <option>Prof. Dr. Matematik</option>
                  <option>Dr. Fizik Uzmanı</option>
                  <option>Kimya Öğretmeni</option>
                </select>
              </div>
              <div className="ai-note">
                💡 Seçenek yok öğretmen dersler sonunda çalışma planları ve bunlara eşlik edeceği yönetimciler olacak.
              </div>
            </div>

            {/* Özel Notlar */}
            <div className="form-section">
              <h3>Özel Notlar</h3>
              <div className="form-field">
                <textarea 
                  placeholder="Konunuzla ilgili özel notlar; detaylarımız, vantajlarımız ödemlendirme kullanarak gösterilebilir"
                  className="form-textarea"
                  rows="4"
                ></textarea>
              </div>
            </div>

            {/* Çalışma Materyali */}
            <div className="form-section material-section">
              <h3>📚 Çalışma Materyali</h3>
              <div className="material-upload">
                <div className="upload-area">
                  <span className="upload-icon">📎</span>
                  <p>Çalışma dosyalarınızı buraya sürükleyin</p>
                  <button type="button" className="upload-btn">
                    📁 Dosya Seç
                  </button>
                </div>
                <div className="upload-note">
                  Desteklenen formatlar: TXT, DOCX (PDF desteği gelecektir)
                </div>
              </div>
            </div>

            {/* AI Asistan İle Çalışma */}
            <div className="form-section ai-section">
              <h3>✨ AI Asistan İle Çalışma Planı</h3>
              <div className="ai-features">
                <div className="feature-item">
                  <span className="feature-icon">🤖</span>
                  <span>Merhaba! Ben AI asistanınızım. Size çalışma planı oluşturmakta yardımcı olacağım.</span>
                </div>
                <div className="ai-actions">
                  <button type="button" className="ai-btn">
                    🎯 Hangi konuyu çalışacağız planını >
                  </button>
                </div>
              </div>
              <div className="ai-note">
                AI asistanım çalışma planı ve bununa şifresisz birimi olacak yapılış lama özteli ki,
                🚀 Hangi konuya özelleştirilecek
              </div>
            </div>
          </div>

          <button className="create-btn">
            ✨ Çalışma Dersini Oluştur
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateCoursePage