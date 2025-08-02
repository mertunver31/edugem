import React from 'react'
import './CustomInput.css'

const CustomInput = ({ 
  type = 'text', 
  name, 
  placeholder, 
  value, 
  onChange, 
  error, 
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`custom-input-container ${className}`}>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`custom-input ${error ? 'error' : ''}`}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  )
}

export default CustomInput 