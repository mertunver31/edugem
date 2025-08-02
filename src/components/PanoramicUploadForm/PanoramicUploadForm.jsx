import React, { useState } from 'react'
import CustomInput from '../CustomInput/CustomInput'
import CustomButton from '../CustomButton/CustomButton'
import './PanoramicUploadForm.css'

const PanoramicUploadForm = ({ onSubmit, isLoading, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })
  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Başlık gerekli'
    }

    if (formData.title.length > 255) {
      newErrors.title = 'Başlık 255 karakterden uzun olamaz'
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Açıklama 1000 karakterden uzun olamaz'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="panoramic-upload-form">
      <div className="form-header">
        <h3>Panoramik Görüntü Bilgileri</h3>
        <p>Görüntünüz için gerekli bilgileri girin</p>
      </div>

      <form onSubmit={handleSubmit}>
        <CustomInput
          type="text"
          name="title"
          placeholder="Görüntü Başlığı"
          value={formData.title}
          onChange={handleInputChange}
          error={errors.title}
          disabled={isLoading}
          required
        />

        <div className="form-group">
          <label htmlFor="description">Açıklama (İsteğe bağlı)</label>
          <textarea
            id="description"
            name="description"
            placeholder="Görüntü hakkında açıklama..."
            value={formData.description}
            onChange={handleInputChange}
            disabled={isLoading}
            rows="4"
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <span className="error-text">{errors.description}</span>}
        </div>

        <div className="form-actions">
          <CustomButton
            type="button"
            text="İptal"
            onClick={onCancel}
            variant="secondary"
            disabled={isLoading}
            className="cancel-button"
          />
          <CustomButton
            type="submit"
            text={isLoading ? "Kaydediliyor..." : "Kaydet"}
            disabled={isLoading}
            className="save-button"
          />
        </div>
      </form>
    </div>
  )
}

export default PanoramicUploadForm 