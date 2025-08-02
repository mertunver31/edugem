import React from 'react'
import './CustomButton.css'

const CustomButton = ({ 
  type = 'button', 
  text, 
  onClick, 
  disabled = false, 
  className = '',
  variant = 'primary'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`custom-button ${variant} ${className}`}
    >
      {text}
    </button>
  )
}

export default CustomButton 