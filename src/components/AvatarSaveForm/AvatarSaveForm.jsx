import React, { useState } from 'react'
import CustomInput from '../CustomInput/CustomInput'
import CustomButton from '../CustomButton/CustomButton'
import './AvatarSaveForm.css'

const AvatarSaveForm = ({ avatarUrl, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: ''
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

    if (!formData.name.trim()) {
      newErrors.name = 'Avatar adı gerekli'
    }

    if (formData.name.length > 255) {
      newErrors.name = 'Avatar adı 255 karakterden uzun olamaz'
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
    <div className="avatar-save-form">
      <div className="form-header">
        <h3>Avatar Kaydet</h3>
        <p>Oluşturduğunuz avatarı veritabanına kaydedin</p>
      </div>

      <form onSubmit={handleSubmit}>
        <CustomInput
          type="text"
          name="name"
          placeholder="Avatar Adı"
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name}
          disabled={isLoading}
          required
        />

        <div className="avatar-preview-info">
          <div className="preview-label">Ready Player Me Avatar URL:</div>
          <div className="avatar-url-display">
            <a href={avatarUrl} target="_blank" rel="noopener noreferrer" className="avatar-link">
              {avatarUrl}
            </a>
          </div>
          <div className="info-text">
            <span className="info-icon">ℹ️</span>
            <span>Bu URL direkt olarak 3D avatar modelini içerir ve veritabanında saklanacaktır.</span>
          </div>
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

export default AvatarSaveForm 