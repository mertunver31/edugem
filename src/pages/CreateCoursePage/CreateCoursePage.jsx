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
      if (file.type !== 'application/pdf') {
        alert('Sadece PDF dosyaları kabul edilir!')
        e.target.value = ''
        return
      }
      
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        alert('Dosya boyutu 20MB\'dan büyük olamaz!')
        e.target.value = ''
        return
      }
      
      setSelectedFile(file)
      setUploadStatus('PDF seçildi. Ders oluştur butonuna tıklayarak yükleyebilirsiniz.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault() // Sayfa yenilenmesini engelle
    
    // Form validasyonu
    if (!validateForm()) {
      alert('Lütfen gerekli alanları doldurun!')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Önce PDF yükle (eğer seçilmişse)
      let pdfResult = null
      if (selectedFile) {
        setUploadStatus('PDF yükleniyor...')
        pdfResult = await uploadPDF(selectedFile)
        setUploadStatus('PDF başarıyla yüklendi!')
        console.log('PDF upload result:', pdfResult)
      }

      // Ders oluşturma işlemi
      console.log('Ders oluşturuluyor:', courseData)
      console.log('PDF bilgisi:', pdfResult)
      
      // Simüle edilmiş bekleme
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
      <div className="create-course-container">
        <div className="page-header">
          <h1>Yeni Ders Oluştur</h1>
          <p>Panoramik ders ortamınız için yeni bir ders oluşturun</p>
        </div>

        <form className="course-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Ders Başlığı *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={courseData.title}
              onChange={handleInputChange}
              placeholder="Ders başlığını girin"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Ders Açıklaması</label>
            <textarea
              id="description"
              name="description"
              value={courseData.description}
              onChange={handleInputChange}
              placeholder="Ders hakkında açıklama yazın"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="subject">Ders Konusu *</label>
              <select
                id="subject"
                name="subject"
                value={courseData.subject}
                onChange={handleInputChange}
                className={errors.subject ? 'error' : ''}
              >
                <option value="">Konu seçin</option>
                <option value="matematik">Matematik</option>
                <option value="fizik">Fizik</option>
                <option value="kimya">Kimya</option>
                <option value="biyoloji">Biyoloji</option>
                <option value="tarih">Tarih</option>
                <option value="cografya">Coğrafya</option>
                <option value="edebiyat">Edebiyat</option>
                <option value="ingilizce">İngilizce</option>
                <option value="diger">Diğer</option>
              </select>
              {errors.subject && <span className="error-message">{errors.subject}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="grade">Sınıf Seviyesi *</label>
              <select
                id="grade"
                name="grade"
                value={courseData.grade}
                onChange={handleInputChange}
                className={errors.grade ? 'error' : ''}
              >
                <option value="">Sınıf seçin</option>
                <option value="ilkokul">İlkokul</option>
                <option value="ortaokul">Ortaokul</option>
                <option value="lise">Lise</option>
                <option value="universite">Üniversite</option>
                <option value="genel">Genel</option>
              </select>
              {errors.grade && <span className="error-message">{errors.grade}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Tahmini Süre (Dakika)</label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={courseData.duration}
              onChange={handleInputChange}
              placeholder="45"
              min="1"
              max="180"
            />
          </div>

          {/* PDF Yükleme Bölümü */}
          <div className="form-group">
            <label htmlFor="pdf-file">PDF Materyal Yükle (Opsiyonel)</label>
            <div className="pdf-upload-section">
              <input
                type="file"
                id="pdf-file"
                accept=".pdf"
                onChange={handleFileChange}
                className="file-input"
              />
              <div className="file-info">
                {selectedFile && (
                  <div className="selected-file">
                    <span className="file-name">📄 {selectedFile.name}</span>
                    <span className="file-size">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
                {uploadStatus && (
                  <div className={`upload-status ${uploadStatus.includes('Hata') ? 'error' : 'success'}`}>
                    {uploadStatus}
                  </div>
                )}
              </div>
            </div>
            <small className="form-help">
              Maksimum dosya boyutu: 20MB. Sadece PDF dosyaları kabul edilir. PDF yükleme opsiyoneldir.
            </small>
          </div>

          <div className="form-actions">
            <CustomButton
              type="button"
              text="İptal"
              variant="secondary"
              onClick={() => window.history.back()}
            />
            <CustomButton
              type="submit"
              text={isLoading ? "İşleniyor..." : "Ders Oluştur"}
              variant="primary"
              disabled={isLoading}
            />
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCoursePage 