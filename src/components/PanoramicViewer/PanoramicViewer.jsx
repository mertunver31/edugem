import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import CustomButton from '../CustomButton/CustomButton'
import Avatar3DLoader from '../Avatar3DLoader/Avatar3DLoader'
import './PanoramicViewer.css'

const PanoramicViewer = ({ imageFile, onClose, isCinemaMode, selectedAvatar }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isViewerReady, setIsViewerReady] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [isViewerActive, setIsViewerActive] = useState(false)
  const [isAvatarLoading, setIsAvatarLoading] = useState(false)
  const viewerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)
  const animationRef = useRef(null)
  const avatarLoaderRef = useRef(null)

  useEffect(() => {
    if (imageFile) {
      prepareImage()
    }
  }, [imageFile])

  useEffect(() => {
    if (isViewerActive && viewerRef.current) {
      initialize3DViewer()
    }
    return () => {
      cleanup3DViewer()
    }
  }, [isViewerActive])

  const prepareImage = async () => {
    setIsLoading(true)
    try {
      let url
      if (imageFile instanceof File) {
        url = URL.createObjectURL(imageFile)
      } else if (imageFile.file_path) {
        url = imageFile.file_path
      } else {
        throw new Error('Geçersiz görüntü dosyası')
      }
      setImageUrl(url)
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsViewerReady(true)
      setIsLoading(false)
    } catch (error) {
      console.error('Görüntü hazırlama hatası:', error)
      setIsLoading(false)
    }
  }

  const initialize3DViewer = () => {
    if (!viewerRef.current || !imageUrl) return

    try {
      // Scene oluştur
      const scene = new THREE.Scene()
      sceneRef.current = scene

      // Camera oluştur
      const camera = new THREE.PerspectiveCamera(
        75,
        viewerRef.current.clientWidth / viewerRef.current.clientHeight,
        0.1,
        1000
      )
      camera.position.set(0, 0, 100)

      // Renderer oluştur
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight)
      renderer.setClearColor(0x000000)
      rendererRef.current = renderer

      // Container'ı temizle ve renderer'ı ekle
      viewerRef.current.innerHTML = ''
      viewerRef.current.appendChild(renderer.domElement)

      // Panoramik arka plan oluştur (sphere geometry)
      const sphereGeometry = new THREE.SphereGeometry(500, 60, 40)
      sphereGeometry.scale(-1, 1, 1) // İçe doğru yüzey

      // Texture loader ile panoramik görüntüyü yükle
      const textureLoader = new THREE.TextureLoader()
      textureLoader.load(imageUrl, (texture) => {
        const sphereMaterial = new THREE.MeshBasicMaterial({ map: texture })
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
        scene.add(sphere)
      })

      // Dev ekran yüzeyi oluştur (dikdörtgen plane)
      const screenGeometry = new THREE.PlaneGeometry(100, 60) // 100x60 birim boyut
      const screenMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x2c3e50,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })
      const devScreen = new THREE.Mesh(screenGeometry, screenMaterial)
      devScreen.position.set(0, 0, -200) // Z = -200 konumunda
      devScreen.name = 'devScreen'
      scene.add(devScreen)

      // Ekran çerçevesi oluştur
      const frameGeometry = new THREE.BoxGeometry(102, 62, 2)
      const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x34495e })
      const frame = new THREE.Mesh(frameGeometry, frameMaterial)
      frame.position.set(0, 0, -201)
      scene.add(frame)

      // Kullanıcı yolunu oluştur (ekranın altından kullanıcıya doğru uzanan rampa)
      const pathGeometry = new THREE.PlaneGeometry(100, 300) // 100 birim genişlik, 300 birim uzunluk (Z=-200'den Z=100'e)
      const pathMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x7f8c8d,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      })
      const userPath = new THREE.Mesh(pathGeometry, pathMaterial)
      userPath.position.set(0, -30, -50) // Z pozisyonu -50 (yolun merkezi Z=-200 ile Z=100 arasında)
      userPath.rotation.x = Math.PI / 2 // 90 derece açı ile dikey
      userPath.name = 'userPath'
      scene.add(userPath)

      // Yol kenarları (korkuluk) oluştur
      const railingGeometry = new THREE.BoxGeometry(2, 10, 200)
      const railingMaterial = new THREE.MeshBasicMaterial({ color: 0x95a5a6 })
      
      // Sol korkuluk
      const leftRailing = new THREE.Mesh(railingGeometry, railingMaterial)
      leftRailing.position.set(-51, -30, -200)
      leftRailing.rotation.x = Math.PI / 2
      scene.add(leftRailing)
      
      // Sağ korkuluk
      const rightRailing = new THREE.Mesh(railingGeometry, railingMaterial)
      rightRailing.position.set(51, -30, -200)
      rightRailing.rotation.x = Math.PI / 2
      scene.add(rightRailing)

      // Avatar loader'ı başlat
      avatarLoaderRef.current = new Avatar3DLoader()

      // Seçili avatar varsa yükle
      if (selectedAvatar && selectedAvatar.avatar_url) {
        loadSelectedAvatar(scene)
      }

      // Işıklandırma
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(0, 100, 100)
      scene.add(directionalLight)

      // Orbit controls
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.minDistance = 50
      controls.maxDistance = 800
      controlsRef.current = controls

      // Animation loop
      const animate = () => {
        animationRef.current = requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
      }
      animate()

      // Window resize handler
      const handleResize = () => {
        camera.aspect = viewerRef.current.clientWidth / viewerRef.current.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight)
      }
      window.addEventListener('resize', handleResize)

      // Referansları sakla
      viewerRef.current.handleResize = handleResize

    } catch (error) {
      console.error('3D viewer başlatma hatası:', error)
    }
  }

  const loadSelectedAvatar = async (scene) => {
    if (!selectedAvatar || !selectedAvatar.avatar_url || !avatarLoaderRef.current) return

    try {
      setIsAvatarLoading(true)
      await avatarLoaderRef.current.loadAvatar(
        scene, 
        selectedAvatar.avatar_url, 
        { x: 0, y: -30, z: 50 } // Userpath Y pozisyonuna eşitle (-30)
      )
    } catch (error) {
      console.error('Avatar yükleme hatası:', error)
    } finally {
      setIsAvatarLoading(false)
    }
  }

  const cleanup3DViewer = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (viewerRef.current && viewerRef.current.handleResize) {
      window.removeEventListener('resize', viewerRef.current.handleResize)
    }
    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current = null
    }
    if (sceneRef.current) {
      sceneRef.current.dispose()
      sceneRef.current = null
    }
    if (controlsRef.current) {
      controlsRef.current.dispose()
      controlsRef.current = null
    }
    if (avatarLoaderRef.current) {
      avatarLoaderRef.current.removeAvatar(sceneRef.current)
      avatarLoaderRef.current = null
    }
  }

  const handleViewImage = () => {
    if (!isViewerReady) return
    setIsViewerActive(true)
  }

  const handleClose = () => {
    setIsViewerActive(false)
    if (imageUrl && imageFile instanceof File) {
      URL.revokeObjectURL(imageUrl)
    }
    onClose()
  }

  return (
    <div className={`panoramic-viewer-container${isCinemaMode ? ' cinema-fullscreen' : ''}`}>
      <div className={`viewer-header${isCinemaMode ? ' cinema-header' : ''}`}>
        <h3>{imageFile.title || 'Panoramik Görüntü'}</h3>
        <CustomButton
          text="✕"
          onClick={handleClose}
          variant="secondary"
          className={`close-button${isCinemaMode ? ' cinema-close' : ''}`}
        />
      </div>

      {isLoading ? (
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <p>Panoramik görüntü hazırlanıyor...</p>
          <p className="loading-details">3D ortam ve dev ekran hazırlanıyor</p>
          {selectedAvatar && (
            <p className="loading-details">Avatar yükleniyor...</p>
          )}
        </div>
      ) : (
        <div className="viewer-content">
          <div className="image-preview">
            <img 
              src={imageUrl} 
              alt="Panoramik önizleme" 
              className="preview-image"
            />
            <div className="preview-overlay">
              <span className="preview-label">Önizleme</span>
            </div>
          </div>
          <div className="viewer-actions">
            <CustomButton
              text="3D Ortama Gir"
              onClick={handleViewImage}
              disabled={!isViewerReady}
              className="view-button"
            />
            <p className="viewer-info">
              3D panoramik ortam ve dev ekran için görüntüle butonuna tıklayın
            </p>
          </div>
        </div>
      )}

      {/* 3D Panoramik görüntüleyici alanı */}
      {isViewerActive && (
        <div 
          ref={viewerRef} 
          className={`panoramic-viewer${isCinemaMode ? ' cinema-viewer' : ''}`}
        ></div>
      )}
    </div>
  )
}

export default PanoramicViewer 