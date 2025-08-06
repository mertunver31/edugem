import React, { useState } from 'react'
import CustomButton from '../CustomButton/CustomButton'
import CustomInput from '../CustomInput/CustomInput'
import './LoginForm.css'

const LoginForm = ({ onLogin, onRegister, isLoading, error }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
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
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-posta gerekli'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin'
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Şifre gerekli'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı'
    }

    if (isRegisterMode) {
      if (!formData.name.trim()) {
        newErrors.name = 'Ad gerekli'
      }
      
      if (!formData.confirmPassword.trim()) {
        newErrors.confirmPassword = 'Şifre tekrarı gerekli'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifreler eşleşmiyor'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      if (isRegisterMode) {
        onRegister(formData)
      } else {
        onLogin(formData)
      }
    }
  }

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode)
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    })
    setErrors({})
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {isRegisterMode && (
        <CustomInput
          type="text"
          name="name"
          placeholder="Ad Soyad"
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name}
          disabled={isLoading}
        />
      )}
      
      <CustomInput
        type="email"
        name="email"
        placeholder="E-posta"
        value={formData.email}
        onChange={handleInputChange}
        error={errors.email}
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

      {isRegisterMode && (
        <CustomInput
          type="password"
          name="confirmPassword"
          placeholder="Şifre Tekrarı"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={errors.confirmPassword}
          disabled={isLoading}
        />
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <CustomButton
        type="submit"
        text={isLoading ? (isRegisterMode ? "Kayıt Yapılıyor..." : "Giriş Yapılıyor...") : (isRegisterMode ? "Kayıt Ol" : "Giriş Yap")}
        disabled={isLoading}
        className="login-button"
      />

      <div className="toggle-mode">
        <button 
          type="button" 
          onClick={toggleMode}
          className="toggle-button"
          disabled={isLoading}
        >
          {isRegisterMode ? "Zaten hesabınız var mı? Giriş yapın" : "Hesabınız yok mu? Kayıt olun"}
        </button>
      </div>
    </form>
  )
}

export default LoginForm 