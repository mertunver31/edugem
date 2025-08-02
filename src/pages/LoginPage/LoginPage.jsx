import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginForm from '../../components/LoginForm/LoginForm'
import { signIn } from '../../services/authService'
import './LoginPage.css'

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (credentials) => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signIn(credentials.username, credentials.password)
      
      if (result.success) {
        console.log('Başarılı giriş:', result.user)
        navigate('/dashboard')
      } else {
        setError(result.error || 'Giriş başarısız')
      }
    } catch (error) {
      console.error('Login hatası:', error)
      setError('Giriş sırasında bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Panoramik Sınıflar</h1>
          <p>360° Sınıf Deneyimi</p>
        </div>
        <LoginForm onLogin={handleLogin} isLoading={isLoading} error={error} />
      </div>
    </div>
  )
}

export default LoginPage 