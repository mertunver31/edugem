import React from 'react'
import PanoramicViewer from '../PanoramicViewer/PanoramicViewer'
import './CinemaPanoramicViewer.css'

const CinemaPanoramicViewer = ({ imageFile, onClose, selectedAvatar }) => {
  return (
    <div className="cinema-modal-overlay">
      <div className="cinema-modal-content">
        <button className="cinema-close-btn" onClick={onClose}>✕</button>
        <div className="cinema-viewer-wrapper">
          <PanoramicViewer imageFile={imageFile} onClose={onClose} isCinemaMode selectedAvatar={selectedAvatar} />
        </div>
      </div>
    </div>
  )
}

export default CinemaPanoramicViewer