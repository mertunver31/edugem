import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { getUserAvatars } from '../../services/avatarService'
import CustomButton from '../CustomButton/CustomButton'
import './AvatarPreview.css'

const AvatarPreview = () => {
  const [avatars, setAvatars] = useState([])
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const viewerRef = useRef(null)
  const animationRef = useRef(null) // NEW: store animation frame id

  useEffect(() => {
    loadAvatars()
  }, [])

  useEffect(() => {
    if (selectedAvatar && viewerRef.current) {
      cleanupViewer() // NEW: cleanup before initializing
      initializeViewer()
    }
    return () => {
      cleanupViewer()
    }
  }, [selectedAvatar])

  const cleanupViewer = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (viewerRef.current) {
      if (viewerRef.current.handleResize) {
        window.removeEventListener('resize', viewerRef.current.handleResize)
        viewerRef.current.handleResize = null
      }
      if (viewerRef.current.renderer) {
        viewerRef.current.renderer.dispose()
        viewerRef.current.renderer.forceContextLoss && viewerRef.current.renderer.forceContextLoss()
        viewerRef.current.renderer = null
      }
      if (viewerRef.current.scene) {
        // Remove all children from scene
        while (viewerRef.current.scene.children.length > 0) {
          viewerRef.current.scene.remove(viewerRef.current.scene.children[0])
        }
        viewerRef.current.scene.dispose && viewerRef.current.scene.dispose()
        viewerRef.current.scene = null
      }
      if (viewerRef.current.controls) {
        viewerRef.current.controls.dispose()
        viewerRef.current.controls = null
      }
      viewerRef.current.innerHTML = ''
    }
  }

  const loadAvatars = async () => {
    setIsLoading(true)
    try {
      const result = await getUserAvatars()
      if (result.success) {
        setAvatars(result.avatars)
      } else {
        setError('Avatarlar yüklenemedi')
      }
    } catch (error) {
      console.error('Avatar yükleme hatası:', error)
      setError('Avatar yükleme hatası')
    } finally {
      setIsLoading(false)
    }
  }

  const initializeViewer = () => {
    if (!selectedAvatar || !selectedAvatar.avatar_url) return
    try {
      // Three.js scene oluştur
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf0f0f0)
      // Camera oluştur
      const camera = new THREE.PerspectiveCamera(
        75,
        viewerRef.current.clientWidth / viewerRef.current.clientHeight,
        0.1,
        1000
      )
      camera.position.set(0, 1.6, 3)
      // Renderer oluştur
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      // Container'ı temizle ve renderer'ı ekle
      viewerRef.current.innerHTML = ''
      viewerRef.current.appendChild(renderer.domElement)
      // Işıklandırma
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(5, 5, 5)
      directionalLight.castShadow = true
      scene.add(directionalLight)
      // Orbit controls
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.minDistance = 1
      controls.maxDistance = 10
      controls.maxPolarAngle = Math.PI / 2
      // GLTF Loader ile avatar yükle
      const loader = new GLTFLoader()
      loader.load(
        selectedAvatar.avatar_url,
        (gltf) => {
          const model = gltf.scene
          // Model'i ortala ve ölçeklendir
          const box = new THREE.Box3().setFromObject(model)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          const scale = 2 / maxDim
          model.scale.setScalar(scale)
          model.position.sub(center.multiplyScalar(scale))
          model.position.y = 0
          // Shadow ayarları
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true
              child.receiveShadow = true
            }
          })
          scene.add(model)
        },
        undefined,
        (error) => {
          console.error('Avatar yükleme hatası:', error)
        }
      )
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
      viewerRef.current.scene = scene
      viewerRef.current.camera = camera
      viewerRef.current.renderer = renderer
      viewerRef.current.controls = controls
      viewerRef.current.handleResize = handleResize
    } catch (error) {
      console.error('3D viewer başlatma hatası:', error)
    }
  }

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar)
  }

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

  if (isLoading) {
    return (
      <div className="avatar-preview">
        <div className="preview-placeholder">
          <div className="loading-spinner"></div>
          <p>Avatarlar yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="avatar-preview">
        <div className="preview-placeholder">
          <div className="error-icon">⚠️</div>
          <h3>Hata</h3>
          <p>{error}</p>
          <CustomButton
            text="Tekrar Dene"
            onClick={loadAvatars}
            className="retry-button"
          />
        </div>
      </div>
    )
  }

  if (avatars.length === 0) {
    return (
      <div className="avatar-preview">
        <div className="preview-placeholder">
          <div className="empty-icon">🎭</div>
          <h3>Henüz Avatar Yok</h3>
          <p>İlk avatarınızı oluşturarak başlayın</p>
        </div>
      </div>
    )
  }

  return (
    <div className="avatar-preview">
      <div className="preview-header">
        <h3>Avatar Önizleme</h3>
        <p>Kaydettiğiniz avatarları 3D olarak görüntüleyin</p>
      </div>

      <div className="preview-content">
        <div className="avatar-list">
          <h4>Avatarlarım ({avatars.length})</h4>
          <div className="avatar-items">
            {avatars.map((avatar) => (
              <div
                key={avatar.id}
                className={`avatar-item ${selectedAvatar?.id === avatar.id ? 'active' : ''}`}
                onClick={() => handleAvatarSelect(avatar)}
              >
                <div className="avatar-item-icon">🎭</div>
                <div className="avatar-item-info">
                  <h5>{avatar.name}</h5>
                  <p>{formatFileSize(avatar.file_size)}</p>
                  <small>{formatDate(avatar.created_at)}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="preview-viewer">
          {selectedAvatar ? (
            <>
              <div className="viewer-header">
                <h4>{selectedAvatar.name}</h4>
                <div className="viewer-info">
                  <span>Boyut: {formatFileSize(selectedAvatar.file_size)}</span>
                  <span>Oluşturulma: {formatDate(selectedAvatar.created_at)}</span>
                </div>
              </div>
              <div ref={viewerRef} className="viewer-container"></div>
            </>
          ) : (
            <div className="viewer-placeholder">
              <div className="placeholder-icon">👆</div>
              <h4>Avatar Seçin</h4>
              <p>3D görüntülemek için sol taraftan bir avatar seçin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AvatarPreview 