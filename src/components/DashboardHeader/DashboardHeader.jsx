import React from 'react'
import { useNavigate } from 'react-router-dom'
import CustomButton from '../CustomButton/CustomButton'
import { signOut } from '../../services/authService'
import './DashboardHeader.css'

const DashboardHeader = () => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const result = await signOut()
      if (result.success) {
        console.log('Başarıyla çıkış yapıldı')
        navigate('/')
      } else {
        console.error('Çıkış hatası:', result.error)
      }
    } catch (error) {
      console.error('Çıkış işlemi hatası:', error)
    }
  }

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo-section">
            <div className="logo-circle">
              <span className="logo-text">E</span>
            </div>
            <div className="brand-info">
              <h1>EduGem</h1>
              <span className="subtitle">Eğitim Platformu</span>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="user-greeting">
            <span className="greeting-text">Hoş geldin, alifuat</span>
            <span className="user-email">mankidultt127@gmail.com</span>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Çıkış
          </button>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader 