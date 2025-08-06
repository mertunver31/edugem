import { useEffect, useRef } from 'react'

class AvatarMovementController {
  constructor(avatar, scene) {
    this.avatar = avatar
    this.scene = scene
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false
    }
    this.movementSpeed = 1.5
    this.isActive = false
    this.animationId = null
  }

  start() {
    if (this.isActive) return
    this.isActive = true
    this.setupEventListeners()
    this.startMovementLoop()
  }

  stop() {
    if (!this.isActive) return
    this.isActive = false
    this.removeEventListeners()
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  setupEventListeners() {
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    
    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('keyup', this.handleKeyUp)
  }

  removeEventListeners() {
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('keyup', this.handleKeyUp)
  }

  handleKeyDown(event) {
    const key = event.key.toLowerCase()
    if (this.keys.hasOwnProperty(key)) {
      this.keys[key] = true
    }
  }

  handleKeyUp(event) {
    const key = event.key.toLowerCase()
    if (this.keys.hasOwnProperty(key)) {
      this.keys[key] = false
    }
  }

  startMovementLoop() {
    const moveAvatar = () => {
      if (!this.isActive || !this.avatar) return

      let moved = false
      const currentPosition = this.avatar.position.clone()
      let rotationY = this.avatar.rotation.y

      // W tuşu - Z ekseninde ileri (negatif yönde)
      if (this.keys.w) {
        currentPosition.z -= this.movementSpeed
        rotationY = Math.PI // Güneye bak
        moved = true
      }

      // S tuşu - Z ekseninde geri (pozitif yönde)
      if (this.keys.s) {
        currentPosition.z += this.movementSpeed
        rotationY = 0 // Kuzeye bak
        moved = true
      }

      // A tuşu - X ekseninde sol (negatif yönde)
      if (this.keys.a) {
        currentPosition.x -= this.movementSpeed
        rotationY = -Math.PI / 2 // Doğuya bak
        moved = true
      }

      // D tuşu - X ekseninde sağ (pozitif yönde)
      if (this.keys.d) {
        currentPosition.x += this.movementSpeed
        rotationY = Math.PI / 2 // Batıya bak
        moved = true
      }

      // Y pozisyonunu sabit tut (userpath üzerinde kal)
      currentPosition.y = -30

      // Userpath sınırlarını kontrol et (X ekseni: -50 ile +50 arası)
      const userpathWidth = 100
      const userpathHalfWidth = userpathWidth / 2
      
      if (currentPosition.x < -userpathHalfWidth) {
        currentPosition.x = -userpathHalfWidth
      }
      if (currentPosition.x > userpathHalfWidth) {
        currentPosition.x = userpathHalfWidth
      }

      // Z ekseni sınırlarını kontrol et (userpath alanı içinde kal)
      const zMin = -200 // Userpath başlangıcı
      const zMax = 100  // Kameraya yakın sınır
      // Portal collision kontrolü (portal z pozisyonu: 180)
      const portalZ = 180
      const portalCollisionDistance = 115 // Portal'a yaklaşma mesafesi
      
      if (currentPosition.z < zMin) {
        currentPosition.z = zMin
      }
      if (currentPosition.z > zMax) {
        currentPosition.z = zMax
      }
      
      // Portal'a çok yaklaştıysa ilerlemeyi engelle
      if (currentPosition.z >= portalZ - portalCollisionDistance) {
        currentPosition.z = portalZ - portalCollisionDistance
      }

      // === TELESKOP 1 ÇARPIŞMA KONTROLÜ ===
      // PanoramicViewer'da teleskop1: x=40, y=yaklaşık -18, z=0, scale=10
      const telescope1X = 40
      const telescope1Z = 0
      const telescopeCollisionRadius = 18 // Teleskop çevresinde çarpışma yarıçapı
      if (
        Math.abs(currentPosition.x - telescope1X) < telescopeCollisionRadius &&
        Math.abs(currentPosition.z - telescope1Z) < telescopeCollisionRadius
      ) {
        // X ekseninden yaklaşıyorsa geri it
        if (currentPosition.x > telescope1X) {
          currentPosition.x = telescope1X + telescopeCollisionRadius
        } else {
          currentPosition.x = telescope1X - telescopeCollisionRadius
        }
      }

      // === TELESKOP 2 ÇARPIŞMA KONTROLÜ ===
      // PanoramicViewer'da teleskop2: x=-40, y=yaklaşık -18, z=0, scale=10
      const telescope2X = -40
      const telescope2Z = 0
      if (
        Math.abs(currentPosition.x - telescope2X) < telescopeCollisionRadius &&
        Math.abs(currentPosition.z - telescope2Z) < telescopeCollisionRadius
      ) {
        if (currentPosition.x > telescope2X) {
          currentPosition.x = telescope2X + telescopeCollisionRadius
        } else {
          currentPosition.x = telescope2X - telescopeCollisionRadius
        }
      }

      // Avatarı hareket ettir ve döndür
      if (moved) {
        this.avatar.position.copy(currentPosition)
        this.avatar.rotation.y = rotationY
      }

      this.animationId = requestAnimationFrame(moveAvatar)
    }

    moveAvatar()
  }

  updateAvatar(newAvatar) {
    this.avatar = newAvatar
  }

  setMovementSpeed(speed) {
    this.movementSpeed = speed
  }
}

export default AvatarMovementController 