import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginForm from '../../components/LoginForm/LoginForm'
import { signIn, signUp } from '../../services/authService'
import * as THREE from 'three'
import './LoginPage.css'

const LoginPage = () => {
  // 1) background canvas için ref
  const bgRef = useRef(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // 2) Sphere panorama setup
  useEffect(() => {
    if (!bgRef.current) return

    // a) scene, camera, renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 0.1)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    // canvas'ı container'a ekle
    bgRef.current.appendChild(renderer.domElement)

    // b) sphere geometry (iç yüzey)
    const geometry = new THREE.SphereGeometry(500, 60, 40)
    geometry.scale(-1, 1, 1)

    // c) texture yükle
    const texture = new THREE.TextureLoader().load(
      '/login.jpg'
    )
    const material = new THREE.MeshBasicMaterial({ map: texture })
    const sphere = new THREE.Mesh(geometry, material)
    scene.add(sphere)

    // d) animate: yavaşça dönsün
    const animate = () => {
      sphere.rotation.y += 0.0005
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }
    animate()

    // e) resize handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // cleanup
    return () => {
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [])

  const handleLogin = async (credentials) => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signIn(credentials.email, credentials.password)
      
      if (result.success) {
        console.log('Başarılı giriş:', result.user)
        navigate('/dashboard')
      } else {
        setError(result.error || 'Giriş başarısız')
      }
    } catch (error) {
      console.error('Login hatası:', error)
      setError('Giriş sırasında bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (credentials) => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signUp(credentials.email, credentials.password, credentials.name)
      
      if (result.success) {
        console.log('Başarılı kayıt:', result.user)
        setError('Kayıt başarılı! E-posta adresinizi doğrulayın.')
      } else {
        setError(result.error || 'Kayıt başarısız')
      }
    } catch (error) {
      console.error('Kayıt hatası:', error)
      setError('Kayıt sırasında bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // 3) ref'u verirseniz arka plan sphere buraya render olacak
    <div className="login-page" ref={bgRef}>
      <div className="login-container">
        <div className="login-header">
          <h1>EduGem</h1>
          <p>360° Sınıf Deneyimi</p>
        </div>
        <LoginForm 
          onLogin={handleLogin} 
          onRegister={handleRegister}
          isLoading={isLoading} 
          error={error} 
        />
      </div>
    </div>
  )
}

export default LoginPage 