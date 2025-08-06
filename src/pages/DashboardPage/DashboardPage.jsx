import React, { useState, useEffect, useRef } from 'react'
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader'
import * as THREE from 'three'
import CoursesPage from '../CoursesPage/CoursesPage'
import CreateCoursePage from '../CreateCoursePage/CreateCoursePage'
import AvatarPage from '../AvatarPage/AvatarPage'
import OnlineLessonsPage from '../OnlineLessonsPage/OnlineLessonsPage'
import TeachersPage from '../TeachersPage/TeachersPage'
import TestsPage from '../TestsPage/TestsPage'
import './DashboardPage.css'

const DashboardPage = () => {
  const bgRef = useRef(null)
  const [activeTab, setActiveTab] = useState('courses')

  // Three.js panorama arka plan
  useEffect(() => {
    if (!bgRef.current) return

    // Scene, camera, renderer setup
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
    bgRef.current.appendChild(renderer.domElement)

    // Sphere geometry (iç yüzey)
    const geometry = new THREE.SphereGeometry(500, 60, 40)
    geometry.scale(-1, 1, 1)

    // Texture yükle
    const texture = new THREE.TextureLoader().load(
      '/mdzjusxg.png'
    )
    const material = new THREE.MeshBasicMaterial({ map: texture })
    const sphere = new THREE.Mesh(geometry, material)
    scene.add(sphere)

    // Animate: yavaşça dönsün
    const animate = () => {
      sphere.rotation.y += 0.0005
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }
    animate()

    // Resize handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [])



  const renderActiveTab = () => {
    switch (activeTab) {
      // Production Components - Her zaman erişilebilir
      case 'courses':
        return <CoursesPage />
      case 'avatar':
        return <AvatarPage />
      case 'lessons':
        return <TeachersPage />
      case 'course-create':
        return <CreateCoursePage />
            case 'online-lessons':
        return <OnlineLessonsPage />
      case 'tests':
        return <TestsPage />
      
      default:
        return <CoursesPage />
    }
  }

  return (
    <div className="dashboard-page" ref={bgRef}>
      <DashboardHeader />
      <div className="dashboard-content">
        <div className="page-navigation">
          <button
            className={`page-nav-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            🏠 Ana Sayfa
          </button>
          <button
            className={`page-nav-btn ${activeTab === 'avatar' ? 'active' : ''}`}
            onClick={() => setActiveTab('avatar')}
          >
            🎭 Avatarlarım
          </button>
          <button
            className={`page-nav-btn ${activeTab === 'lessons' ? 'active' : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            🏆 Öğretmenlerim
          </button>
          <button
            className={`page-nav-btn ${activeTab === 'course-create' ? 'active' : ''}`}
            onClick={() => setActiveTab('course-create')}
          >
            📚 Derslerim
          </button>
          <button
            className={`page-nav-btn ${activeTab === 'online-lessons' ? 'active' : ''}`}
            onClick={() => setActiveTab('online-lessons')}
          >
            💻 Gelecek Özellikler
          </button>
          <button
            className={`page-nav-btn ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={() => setActiveTab('tests')}
          >
            🧪 Testler
          </button>
        </div>
        {renderActiveTab()}
      </div>
    </div>
  )
}

export default DashboardPage 