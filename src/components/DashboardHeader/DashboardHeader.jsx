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
          <h1>Panoramik Sınıflar</h1>
          <span className="user-info">Hoş geldiniz, Kullanıcı</span>
        </div>
        <div className="header-right">
          <CustomButton
            text="Çıkış Yap"
            onClick={handleLogout}
            variant="secondary"
            className="logout-button"
          />
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader 