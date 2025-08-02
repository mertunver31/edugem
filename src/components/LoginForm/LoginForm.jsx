import React, { useState } from 'react'
import CustomButton from '../CustomButton/CustomButton'
import CustomInput from '../CustomInput/CustomInput'
import './LoginForm.css'

const LoginForm = ({ onLogin, isLoading, error }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
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
    
    if (!formData.username.trim()) {
      newErrors.username = 'Kullanıcı adı gerekli'
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Şifre gerekli'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      onLogin(formData)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <CustomInput
        type="text"
        name="username"
        placeholder="Kullanıcı Adı"
        value={formData.username}
        onChange={handleInputChange}
        error={errors.username}
        disabled={isLoading}
      />
      
      <CustomInput
        type="password"
        name="password"
        placeholder="Şifre"
        value={formData.password}
        onChange={handleInputChange}
        error={errors.password}
        disabled={isLoading}
      />
      
      {error && <div className="error-message">{error}</div>}
      
      <CustomButton
        type="submit"
        text={isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
        disabled={isLoading}
        className="login-button"
      />
    </form>
  )
}

export default LoginForm 