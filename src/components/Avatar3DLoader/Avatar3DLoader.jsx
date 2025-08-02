import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import AvatarMovementController from '../AvatarMovementController/AvatarMovementController'

class Avatar3DLoader {
  constructor() {
    this.loader = new GLTFLoader()
    this.currentAvatar = null
    this.movementController = null
  }

  async loadAvatar(scene, avatarUrl, position = { x: 0, y: 0, z: 0 }) {
    try {
      // Önceki avatarı temizle
      this.removeAvatar(scene)

      return new Promise((resolve, reject) => {
        this.loader.load(
          avatarUrl,
          (gltf) => {
            const avatar = gltf.scene
            
            // Avatar boyutunu ayarla - daha büyük yap
            avatar.scale.set(10, 10, 10)
            
            // Avatar pozisyonunu ayarla - kameraya daha yakın
            avatar.position.set(position.x, position.y, position.z)
            
            // Avatarı sahneye ekle
            scene.add(avatar)
            
            // Avatar referansını sakla
            this.currentAvatar = avatar
            
            // Hareket kontrolcüsünü başlat
            this.initializeMovementController(avatar, scene)
            
            // Avatar animasyonlarını başlat (varsa)
            if (gltf.animations && gltf.animations.length > 0) {
              this.setupAnimations(avatar, gltf.animations)
            }
            
            console.log('Avatar başarıyla yüklendi:', avatar)
            resolve(avatar)
          },
          (progress) => {
            console.log('Avatar yükleme ilerlemesi:', (progress.loaded / progress.total * 100) + '%')
          },
          (error) => {
            console.error('Avatar yükleme hatası:', error)
            reject(error)
          }
        )
      })
    } catch (error) {
      console.error('Avatar yükleme hatası:', error)
      throw error
    }
  }

  setupAnimations(avatar, animations) {
    // Ready Player Me avatarları genellikle idle animasyonu içerir
    // Burada animasyon mixer'ı kurulabilir
    console.log('Avatar animasyonları yüklendi:', animations.length)
  }

  initializeMovementController(avatar, scene) {
    // Önceki hareket kontrolcüsünü durdur
    if (this.movementController) {
      this.movementController.stop()
    }
    
    // Yeni hareket kontrolcüsünü oluştur ve başlat
    this.movementController = new AvatarMovementController(avatar, scene)
    this.movementController.start()
    
    console.log('Avatar hareket kontrolcüsü başlatıldı')
  }

  removeAvatar(scene) {
    if (this.currentAvatar) {
      scene.remove(this.currentAvatar)
      
      // Avatar geometrisini ve materyallerini temizle
      this.currentAvatar.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose()
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
      
      this.currentAvatar = null
    }
    
    // Hareket kontrolcüsünü durdur
    if (this.movementController) {
      this.movementController.stop()
      this.movementController = null
    }
  }

  updateAvatarPosition(position) {
    if (this.currentAvatar) {
      this.currentAvatar.position.set(position.x, position.y, position.z)
    }
  }

  getCurrentAvatar() {
    return this.currentAvatar
  }

  getMovementController() {
    return this.movementController
  }

  setMovementSpeed(speed) {
    if (this.movementController) {
      this.movementController.setMovementSpeed(speed)
    }
  }
}

export default Avatar3DLoader 