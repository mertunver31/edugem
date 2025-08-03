import React, { useState, useEffect } from 'react'
import { isDevelopmentMode } from '../../config/development'
import './DevelopmentModeIndicator.css'

const DevelopmentModeIndicator = () => {
  const [devMode, setDevMode] = useState(isDevelopmentMode())

  useEffect(() => {
    setDevMode(isDevelopmentMode())
  }, [])

  if (!devMode) {
    return null
  }

  return (
    <div className="dev-mode-indicator">
      <div className="dev-mode-content">
        <span className="dev-icon">🔧</span>
        <span className="dev-text">Development Mode</span>
        <div className="dev-pulse"></div>
      </div>
    </div>
  )
}

export default DevelopmentModeIndicator 