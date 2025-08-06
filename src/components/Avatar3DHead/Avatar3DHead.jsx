import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import './Avatar3DHead.css'

const Avatar3DHead = ({ avatarUrl, className = '' }) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const avatarRef = useRef(null)

  useEffect(() => {
    if (!avatarUrl || !mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera setup - positioned to show only the head
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 1.5, 2) // Positioned to focus on head
    camera.lookAt(0, 1.5, 0)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      preserveDrawingBuffer: true
    })
    renderer.setSize(120, 120) // Larger size for better visibility
    renderer.setClearColor(0x000000, 0) // Transparent background
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Load avatar
    const loader = new GLTFLoader()
    loader.load(
      avatarUrl,
      (gltf) => {
        const avatar = gltf.scene
        
        // Scale and position for head focus
        avatar.scale.set(1, 1, 1)
        avatar.position.set(0, 0, 0)
        
        // Rotate to face camera
        avatar.rotation.y = Math.PI
        
        scene.add(avatar)
        avatarRef.current = avatar

        // Start animation loop
        animate()
      },
      (progress) => {
        console.log('Avatar head loading progress:', (progress.loaded / progress.total * 100) + '%')
      },
      (error) => {
        console.error('Avatar head loading error:', error)
        // Show fallback icon
        showFallbackIcon()
      }
    )

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      
      // Gentle rotation for the head
      if (avatarRef.current) {
        avatarRef.current.rotation.y += 0.01
      }
      
      renderer.render(scene, camera)
    }

    // Mount renderer
    mountRef.current.appendChild(renderer.domElement)

    // Cleanup function
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      
      // Dispose of resources
      if (renderer) {
        renderer.dispose()
      }
      if (scene) {
        scene.traverse((child) => {
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
      }
    }
  }, [avatarUrl])

  const showFallbackIcon = () => {
    if (mountRef.current) {
      mountRef.current.innerHTML = '<span class="fallback-icon">👤</span>'
    }
  }

  return (
    <div 
      ref={mountRef} 
      className={`avatar-3d-head ${className}`}
      title="3D Avatar"
    />
  )
}

export default Avatar3DHead 