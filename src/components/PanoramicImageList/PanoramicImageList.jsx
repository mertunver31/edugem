import React, { useRef, useEffect, useState } from 'react'
import CustomButton from '../CustomButton/CustomButton'
import * as THREE from 'three'
import './PanoramicImageList.css'

const PanoramicImageList = ({ images, onSelectImage, onDeleteImage, isLoading, onEnterClass }) => {
  const canvasRefs = useRef({})
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Three.js panorama animasyonu - sadece mevcut görüntü için
  useEffect(() => {
    if (!images.length || currentImageIndex >= images.length) return

    const currentImage = images[currentImageIndex]
    if (!currentImage.file_path || !canvasRefs.current[currentImage.id]) return

    const canvas = canvasRefs.current[currentImage.id]
    const container = canvas.parentElement
    
    // Scene, camera, renderer setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 0.1)

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      antialias: true,
      alpha: true 
    })
    
    // Canvas boyutlarını container'a göre ayarla
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    
    renderer.setSize(containerWidth, containerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // Camera aspect ratio'yu da güncelle
    camera.aspect = containerWidth / containerHeight
    camera.updateProjectionMatrix()

    // Sphere geometry (iç yüzey)
    const geometry = new THREE.SphereGeometry(500, 60, 40)
    geometry.scale(-1, 1, 1)

    // Texture yükle
    const texture = new THREE.TextureLoader().load(
      currentImage.file_path,
      undefined,
      undefined,
      (error) => {
        console.error('Texture yükleme hatası:', error)
      }
    )
    const material = new THREE.MeshBasicMaterial({ map: texture })
    const sphere = new THREE.Mesh(geometry, material)
    scene.add(sphere)

    // Animate: yavaşça dönsün
    let animationId
    const animate = () => {
      sphere.rotation.y += 0.002
      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }
    animate()

    // Resize handler
    const onResize = () => {
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight
      
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    // Resize observer
    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(container)

    // Cleanup function
    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      texture.dispose()
    }
  }, [images, currentImageIndex])

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (isLoading) {
    return (
      <div className="panoramic-image-list">
        <div className="loading-spinner"></div>
        <p>Görüntüler yükleniyor...</p>
      </div>
    )
  }

  if (!images || images.length === 0) {
    return (
      <div className="panoramic-image-list">
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <h3>Henüz panoramik görüntü yok</h3>
          <p>İlk panoramik görüntünüzü yükleyerek başlayın</p>
        </div>
      </div>
    )
  }

  return (
    <div className="panoramic-image-list">
      <div className="list-header">
        <h3>Panoramik Görüntülerim</h3>
        <span className="image-count">{currentImageIndex + 1} / {images.length} görüntü</span>
      </div>

      {images.length > 0 && (
        <div className="single-image-view">
          <div className="image-card">
            <canvas 
              ref={(el) => {
                if (el) canvasRefs.current[images[currentImageIndex].id] = el
              }}
              className="preview-canvas"
            />

            <div className="image-info">
              <h4 className="image-title">{images[currentImageIndex].title}</h4>
              {images[currentImageIndex].description && (
                <p className="image-description">{images[currentImageIndex].description}</p>
              )}
              <div className="image-details">
                <span className="file-size">{formatFileSize(images[currentImageIndex].file_size)}</span>
                <span className="upload-date">{formatDate(images[currentImageIndex].created_at)}</span>
              </div>
            </div>

            <div className="image-actions">
              <CustomButton
                text="Görüntüle"
                onClick={() => onSelectImage(images[currentImageIndex])}
                className="view-button"
              />
              <CustomButton
                text="Sil"
                onClick={() => onDeleteImage(images[currentImageIndex].id)}
                variant="secondary"
                className="delete-button"
              />
            </div>
            <div className="image-cinema-action">
              <CustomButton
                text="Ortama Gir"
                onClick={() => onEnterClass && onEnterClass(images[currentImageIndex])}
                variant="primary"
                className="cinema-button"
              />
            </div>
          </div>

          <div className="image-navigation">
            <CustomButton
              text="◀ Önceki"
              onClick={prevImage}
              variant="secondary"
              className="nav-button"
              disabled={images.length <= 1}
            />
            <CustomButton
              text="Sonraki ▶"
              onClick={nextImage}
              variant="secondary"
              className="nav-button"
              disabled={images.length <= 1}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default PanoramicImageList 