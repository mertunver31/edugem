import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import CustomButton from '../CustomButton/CustomButton'
import Avatar3DLoader from '../Avatar3DLoader/Avatar3DLoader'
import forceGraph3DService from '../../services/forceGraph3DService'
import './PanoramicViewer.css'

const PanoramicViewer = ({ imageFile, onClose, isCinemaMode, selectedAvatar, selectedDers }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isViewerReady, setIsViewerReady] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [isViewerActive, setIsViewerActive] = useState(false)
  const [isAvatarLoading, setIsAvatarLoading] = useState(false)
  const [mindMapData, setMindMapData] = useState(null)
  const [learningPathData, setLearningPathData] = useState(null)
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
    if (selectedDers && selectedDers.id) {
      loadMindMapAndLearningPath(selectedDers.id)
    }
  }, [selectedDers])



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

  const loadMindMapAndLearningPath = async (documentId) => {
    try {
      console.log('🧠 Mind map ve learning path yükleniyor:', documentId)
      
      // Mind map ve learning path servislerini import et
      const mindMapService = (await import('../../services/mindMapService')).default
      const learningPathService = (await import('../../services/learningPathService')).default
      
      // Mind map verilerini yükle
      const mindMapResult = await mindMapService.getAllMindMaps(documentId)
      if (mindMapResult.success && mindMapResult.data.length > 0) {
        const latestMindMap = mindMapResult.data[0] // En son oluşturulan
        setMindMapData({
          centralTopic: latestMindMap.central_topic,
          content: latestMindMap.content
        })
        console.log('✅ Mind map verisi yüklendi:', latestMindMap)
      }
      
      // Learning path verilerini yükle
      const learningPathResult = await learningPathService.getAllLearningPaths(documentId)
      if (learningPathResult.success && learningPathResult.data.length > 0) {
        const latestLearningPath = learningPathResult.data[0] // En son oluşturulan
        setLearningPathData({
          title: latestLearningPath.title,
          description: latestLearningPath.description,
          steps: latestLearningPath.steps,
          estimatedDuration: latestLearningPath.estimated_duration,
          difficultyLevel: latestLearningPath.difficulty_level
        })
        console.log('✅ Learning path verisi yüklendi:', latestLearningPath)
      }
      
    } catch (error) {
      console.error('❌ Mind map ve learning path yükleme hatası:', error)
    }
  }

  const initialize3DViewer = () => {
    if (!viewerRef.current || !imageUrl) return

    try {
      // Three.js'i global olarak erişilebilir yap
      window.THREE = THREE
      
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
      
      // Kamera referansını sakla
      rendererRef.current.camera = camera

      // CSS3DRenderer: HTML elementleri 3B sahneye gömmek için
      const cssRenderer = new CSS3DRenderer()
      cssRenderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight)
      cssRenderer.domElement.style.position = 'absolute'
      cssRenderer.domElement.style.top = '0'
      cssRenderer.domElement.style.left = '0'
      cssRenderer.domElement.style.pointerEvents = 'auto'
      rendererRef.current.cssRenderer = cssRenderer

      // Container'ı temizle ve renderer'ları ekle
      viewerRef.current.innerHTML = ''
      viewerRef.current.appendChild(renderer.domElement)
      viewerRef.current.appendChild(cssRenderer.domElement)

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

      // Dev ekran yüzeyi oluştur (monitör görünümü)
      const screenGeometry = new THREE.PlaneGeometry(100, 60) // 100x60 birim boyut
      const screenMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x1a1a1a, // Koyu siyah monitör ekranı
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      })
      const devScreen = new THREE.Mesh(screenGeometry, screenMaterial)
      devScreen.position.set(0, 0, -200) // Z = -200 konumunda
      devScreen.name = 'devScreen'
      scene.add(devScreen)

      // Enhanced content için HTML overlay oluştur
      if (selectedDers && selectedDers.enhanced_content) {
        createEnhancedContentOverlay(scene, selectedDers)
      }

      // Mind Map ve Learning Path 3D objelerini oluştur
      if (mindMapData) {
        createMindMap3DObjects(scene)
      }
      if (learningPathData) {
        createLearningPath3DObjects(scene)
      }

      // Monitör çerçevesi oluştur
      const frameGeometry = new THREE.BoxGeometry(102, 62, 4)
      const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x2c2c2c }) // Koyu gri monitör çerçevesi
      const frame = new THREE.Mesh(frameGeometry, frameMaterial)
      frame.position.set(0, 0, -202)
      scene.add(frame)

      // Monitör arka kısmı oluştur
      const backGeometry = new THREE.BoxGeometry(104, 64, 8)
      const backMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a1a }) // Koyu siyah monitör arkası
      const back = new THREE.Mesh(backGeometry, backMaterial)
      back.position.set(0, 0, -206)
      scene.add(back)

      // Monitör tabanı oluştur
      const standGeometry = new THREE.BoxGeometry(20, 4, 20)
      const standMaterial = new THREE.MeshBasicMaterial({ color: 0x404040 }) // Orta gri taban
      const stand = new THREE.Mesh(standGeometry, standMaterial)
      stand.position.set(0, -32, -200)
      scene.add(stand)

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
      const controls = new OrbitControls(camera, cssRenderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.minDistance = 50
      controls.maxDistance = 800
      controls.enabled = true // Başlangıçta etkin
      controlsRef.current = controls

      // Mouse click event handler
      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2()

      const handleMouseClick = (event) => {
        const rect = renderer.domElement.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(scene.children)

        for (const intersect of intersects) {
          if (intersect.object.name === 'devScreen' && intersect.object.userData.element) {
            const element = intersect.object.userData.element
            element.style.display = element.style.display === 'none' ? 'block' : 'none'
            break
          }
        }
      }

      cssRenderer.domElement.addEventListener('click', handleMouseClick)

      // Animation loop
      const animate = () => {
        animationRef.current = requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
        renderer.cssRenderer.render(scene, camera)
      }
      animate()

      // Window resize handler
      const handleResize = () => {
        camera.aspect = viewerRef.current.clientWidth / viewerRef.current.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight)
        renderer.cssRenderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight)
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
      const avatar = await avatarLoaderRef.current.loadAvatar(
        scene, 
        selectedAvatar.avatar_url, 
        { x: 0, y: -30, z: 50 } // Userpath Y pozisyonuna eşitle (-30)
      )
      
      // Avatar takip kamerası sistemini başlat
      if (avatar) {
        initializeAvatarFollowCamera(avatar, scene)
      }
    } catch (error) {
      console.error('Avatar yükleme hatası:', error)
    } finally {
      setIsAvatarLoading(false)
    }
  }

  const initializeAvatarFollowCamera = (avatar, scene) => {
    // Avatar takip kamerası sistemi
    const followCamera = () => {
      if (!avatar || !rendererRef.current?.camera) return
      
      const camera = rendererRef.current.camera
      
      // Avatar'ın arkasında sabit mesafede takip et
      const offsetX = 0
      const offsetY = 20  // Biraz yukarıda
      const offsetZ = 30  // Arkada
      
      // Yeni kamera pozisyonu
      const newCameraX = avatar.position.x + offsetX
      const newCameraY = avatar.position.y + offsetY
      const newCameraZ = avatar.position.z + offsetZ
      
      // Kamerayı güncelle
      camera.position.set(newCameraX, newCameraY, newCameraZ)
      
      // Avatar'a bak
      camera.lookAt(avatar.position)
      
      // OrbitControls target'ını da güncelle
      if (controlsRef.current) {
        controlsRef.current.target.copy(avatar.position)
      }
    }
    
    // Her frame'de kamera pozisyonunu güncelle
    const updateCamera = () => {
      followCamera()
      requestAnimationFrame(updateCamera)
    }
    
    // Kamera takip sistemini başlat
    updateCamera()
    
    console.log('Avatar takip kamerası başlatıldı')
  }

  const createEnhancedContentOverlay = (scene, selectedDers) => {
    // 1) HTML içeriği barındıracak bir div oluşturun
    const element = document.createElement('div')
    element.innerHTML = renderEnhancedContent(selectedDers)
    Object.assign(element.style, {
      width: '100px',
      height: '60px',
      background: 'white',
      borderRadius: '2px',
      boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)',
      overflow: 'auto',
      pointerEvents: 'auto',
      border: '1px solid #1a1a1a',
      display: 'none',
      userSelect: 'none'
    })

    // 2) Bu div'i CSS3DObject'e sarın
    const cssObject = new CSS3DObject(element)
    const devScreen = scene.getObjectByName('devScreen')
    if (!devScreen) return

    // Monitörün gerçek ölçülerine göre ölçekleyin
    const [w, h] = [100, 60]  // PlaneGeometry args'ınız
    element.style.transformOrigin = 'center'
    cssObject.scale.set(1, 1, 1)  // 1:1 ölçek (100×60px → 100×60 birim)
    cssObject.position.set(0, 0, -199.5)  // Monitörün tam ön yüzünde
    cssObject.rotation.copy(devScreen.rotation)
    scene.add(cssObject)

    // 3) Kapatma butonu artık div'in içinde çalışacak
    const closeBtn = document.createElement('button')
    closeBtn.textContent = '×'
    Object.assign(closeBtn.style, {
      position: 'absolute', 
      top: '3px', 
      right: '3px',
      background: '#e74c3c', 
      color: 'white',
      border: 'none', 
      borderRadius: '50%',
      width: '12px', 
      height: '12px', 
      cursor: 'pointer',
      fontSize: '8px',
      zIndex: '1001'
    })
    closeBtn.onclick = (e) => {
      e.stopPropagation() // Event'in yukarı yayılmasını engelle
      element.style.display = 'none'
    }
    element.appendChild(closeBtn)

    // Dev screen'e tıklama eventi ekle
    devScreen.userData.cssObject = cssObject
    devScreen.userData.element = element
  }

  const renderEnhancedContent = (selectedDers) => {
    const { enhanced_content } = selectedDers
    
    let content = `
      <div style="padding: 6px; height: 100%; overflow-y: auto; font-size: 0.6rem;">
        <h2 style="color: #2c3e50; margin-bottom: 8px; border-bottom: 1px solid #3498db; padding-bottom: 4px; font-size: 0.8rem;">
          ${selectedDers.title || selectedDers.file_name}
        </h2>
    `

    if (enhanced_content.chapters) {
      enhanced_content.chapters.forEach((chapter, chapterIndex) => {
        content += `
          <div style="margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0;">
            <h3 style="color: #2c3e50; font-size: 0.7rem; margin-bottom: 5px;">📖 ${chapter.title}</h3>
        `

        if (chapter.content && chapter.content.lessons) {
          chapter.content.lessons.forEach((lesson, lessonIndex) => {
            content += `
              <div style="margin-bottom: 8px; padding: 5px; background: #f8f9fa; border-radius: 3px; border-left: 2px solid #3498db;">
                <h4 style="color: #34495e; font-size: 0.65rem; margin-bottom: 5px;">🎯 ${lesson.title}</h4>
            `

            if (lesson.content) {
              if (lesson.content.explanatory_text) {
                content += `
                  <div style="margin-bottom: 5px;">
                    <h5 style="color: #2c3e50; font-size: 0.6rem; margin-bottom: 3px;">📝 Açıklayıcı Metin</h5>
                    <p style="line-height: 1.2; color: #555; font-size: 0.55rem;">${lesson.content.explanatory_text}</p>
                  </div>
                `
              }

              if (lesson.content.key_points && lesson.content.key_points.length > 0) {
                content += `
                  <div style="margin-bottom: 5px;">
                    <h5 style="color: #2c3e50; font-size: 0.6rem; margin-bottom: 3px;">✅ Anahtar Noktalar</h5>
                    <ul style="padding-left: 8px;">
                      ${lesson.content.key_points.map(point => `<li style="margin-bottom: 2px; color: #555; font-size: 0.55rem;">${point}</li>`).join('')}
                    </ul>
                  </div>
                `
              }

              if (lesson.content.summary) {
                content += `
                  <div style="margin-bottom: 5px;">
                    <h5 style="color: #2c3e50; font-size: 0.6rem; margin-bottom: 3px;">📋 Özet</h5>
                    <p style="line-height: 1.2; color: #555; font-size: 0.55rem;">${lesson.content.summary}</p>
                  </div>
                `
              }
            }

            content += `</div>`
          })
        }

        content += `</div>`
      })
    }

    content += `</div>`
    return content
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
      if (rendererRef.current.cssRenderer) {
        rendererRef.current.cssRenderer.domElement.remove()
        rendererRef.current.cssRenderer = null
      }
      rendererRef.current = null
    }
    if (sceneRef.current) {
      // Scene'deki tüm objeleri temizle
      while(sceneRef.current.children.length > 0) {
        const child = sceneRef.current.children[0]
        sceneRef.current.remove(child)
      }
      sceneRef.current = null
    }
    if (controlsRef.current) {
      controlsRef.current.dispose()
      controlsRef.current = null
    }
    if (avatarLoaderRef.current && sceneRef.current) {
      avatarLoaderRef.current.removeAvatar(sceneRef.current)
      avatarLoaderRef.current = null
    }
    
    // Kamera referansını temizle
    if (rendererRef.current) {
      rendererRef.current.camera = null
    }

    // 3D Force Graph'ları temizle
    forceGraph3DService.cleanup()

    console.log('3D viewer temizlendi')
  }

  const createMindMap3DObjects = (scene) => {
    if (!mindMapData) return

    try {
      console.log('🧠 Mind Map 3D objeleri oluşturuluyor...')
      
      // Merkez gezegen (ana konu)
      const centralGeometry = new THREE.SphereGeometry(8, 32, 32)
      const centralMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xff6b6b,
        emissive: 0x330000,
        emissiveIntensity: 0.2
      })
      const centralPlanet = new THREE.Mesh(centralGeometry, centralMaterial)
      centralPlanet.position.set(-150, 50, -100)
      centralPlanet.name = 'mindMapCentral'
      scene.add(centralPlanet)

      // Merkez gezegen etiketi
      const centralLabel = create3DLabel(mindMapData.centralTopic || mindMapData.central_topic || 'Merkez Konu', 0xff6b6b)
      centralLabel.position.set(-150, 70, -100)
      scene.add(centralLabel)

      // Ana dal gezegenleri
      const branches = mindMapData.content || mindMapData.branches
      if (branches && Array.isArray(branches)) {
        branches.forEach((branch, index) => {
          const angle = (index / branches.length) * Math.PI * 2
          const radius = 40
          const x = -150 + Math.cos(angle) * radius
          const y = 50 + Math.sin(angle) * radius * 0.5
          const z = -100 + Math.sin(angle) * radius * 0.3

          // Ana dal gezegeni
          const branchGeometry = new THREE.SphereGeometry(4, 24, 24)
          const branchMaterial = new THREE.MeshLambertMaterial({ 
            color: getBranchColor(index),
            emissive: getBranchColor(index),
            emissiveIntensity: 0.1
          })
          const branchPlanet = new THREE.Mesh(branchGeometry, branchMaterial)
          branchPlanet.position.set(x, y, z)
          branchPlanet.name = `mindMapBranch_${index}`
          scene.add(branchPlanet)

          // Merkez ile bağlantı
          const connectionGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-150, 50, -100),
            new THREE.Vector3(x, y, z)
          ])
          const connectionMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.6, transparent: true })
          const connection = new THREE.Line(connectionGeometry, connectionMaterial)
          scene.add(connection)

          // Ana dal etiketi
          const branchLabel = create3DLabel(branch.topic || `Dal ${index + 1}`, getBranchColor(index))
          branchLabel.position.set(x, y + 8, z)
          scene.add(branchLabel)

          // Alt konu gezegenleri
          if (branch.subtopics && Array.isArray(branch.subtopics)) {
            branch.subtopics.forEach((subtopic, subIndex) => {
              const subAngle = (subIndex / branch.subtopics.length) * Math.PI * 2
              const subRadius = 15
              const subX = x + Math.cos(subAngle) * subRadius
              const subY = y + Math.sin(subAngle) * subRadius * 0.5
              const subZ = z + Math.sin(subAngle) * subRadius * 0.3

              // Alt konu gezegeni
              const subtopicGeometry = new THREE.SphereGeometry(2, 16, 16)
              const subtopicMaterial = new THREE.MeshLambertMaterial({ 
                color: lightenColor(getBranchColor(index), 0.3),
                emissive: lightenColor(getBranchColor(index), 0.3),
                emissiveIntensity: 0.1
              })
              const subtopicPlanet = new THREE.Mesh(subtopicGeometry, subtopicMaterial)
              subtopicPlanet.position.set(subX, subY, subZ)
              subtopicPlanet.name = `mindMapSubtopic_${index}_${subIndex}`
              scene.add(subtopicPlanet)

              // Ana dal ile bağlantı
              const subConnectionGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x, y, z),
                new THREE.Vector3(subX, subY, subZ)
              ])
              const subConnectionMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, opacity: 0.4, transparent: true })
              const subConnection = new THREE.Line(subConnectionGeometry, subConnectionMaterial)
              scene.add(subConnection)
            })
          }
        })
      }

      console.log('✅ Mind Map 3D objeleri oluşturuldu')
    } catch (error) {
      console.error('❌ Mind Map 3D objeleri oluşturma hatası:', error)
    }
  }

  const createLearningPath3DObjects = (scene) => {
    if (!learningPathData) return

    try {
      console.log('🛤️ Learning Path 3D objeleri oluşturuluyor...')
      
      // Başlangıç gezegeni
      const startGeometry = new THREE.SphereGeometry(6, 32, 32)
      const startMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x4ecdc4,
        emissive: 0x004d4d,
        emissiveIntensity: 0.2
      })
      const startPlanet = new THREE.Mesh(startGeometry, startMaterial)
      startPlanet.position.set(150, 50, -100)
      startPlanet.name = 'learningPathStart'
      scene.add(startPlanet)

      // Başlangıç etiketi
      const startLabel = create3DLabel('Başlangıç', 0x4ecdc4)
      startLabel.position.set(150, 70, -100)
      scene.add(startLabel)

      // Adım gezegenleri
      if (learningPathData.steps && Array.isArray(learningPathData.steps)) {
        learningPathData.steps.forEach((step, index) => {
          const angle = (index / learningPathData.steps.length) * Math.PI * 2
          const radius = 35
          const x = 150 + Math.cos(angle) * radius
          const y = 50 + Math.sin(angle) * radius * 0.5
          const z = -100 + Math.sin(angle) * radius * 0.3

          // Adım gezegeni
          const stepGeometry = new THREE.SphereGeometry(3, 24, 24)
          const stepMaterial = new THREE.MeshLambertMaterial({ 
            color: getStepColor(index, learningPathData.steps.length),
            emissive: getStepColor(index, learningPathData.steps.length),
            emissiveIntensity: 0.1
          })
          const stepPlanet = new THREE.Mesh(stepGeometry, stepMaterial)
          stepPlanet.position.set(x, y, z)
          stepPlanet.name = `learningPathStep_${index}`
          scene.add(stepPlanet)

          // Önceki adım ile bağlantı
          const prevX = index === 0 ? 150 : 150 + Math.cos((index - 1) / learningPathData.steps.length * Math.PI * 2) * radius
          const prevY = index === 0 ? 50 : 50 + Math.sin((index - 1) / learningPathData.steps.length * Math.PI * 2) * radius * 0.5
          const prevZ = index === 0 ? -100 : -100 + Math.sin((index - 1) / learningPathData.steps.length * Math.PI * 2) * radius * 0.3

          const connectionGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(prevX, prevY, prevZ),
            new THREE.Vector3(x, y, z)
          ])
          const connectionMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.6, transparent: true })
          const connection = new THREE.Line(connectionGeometry, connectionMaterial)
          scene.add(connection)

          // Adım etiketi
          const stepLabel = create3DLabel(step.title || `Adım ${index + 1}`, getStepColor(index, learningPathData.steps.length))
          stepLabel.position.set(x, y + 6, z)
          scene.add(stepLabel)
        })
      }

      // Hedef gezegeni
      const endGeometry = new THREE.SphereGeometry(6, 32, 32)
      const endMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xff6b6b,
        emissive: 0x4d0000,
        emissiveIntensity: 0.2
      })
      const endPlanet = new THREE.Mesh(endGeometry, endMaterial)
      endPlanet.position.set(150, 50, -100)
      endPlanet.name = 'learningPathEnd'
      scene.add(endPlanet)

      // Hedef etiketi
      const endLabel = create3DLabel('Hedef', 0xff6b6b)
      endLabel.position.set(150, 70, -100)
      scene.add(endLabel)

      console.log('✅ Learning Path 3D objeleri oluşturuldu')
    } catch (error) {
      console.error('❌ Learning Path 3D objeleri oluşturma hatası:', error)
    }
  }

  const create3DLabel = (text, color) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 256
    canvas.height = 64

    context.fillStyle = '#ffffff'
    context.font = 'bold 14px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(text, canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      color: color
    })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.scale.set(8, 2, 1)
    
    return sprite
  }

  const getBranchColor = (index) => {
    const colors = [0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7, 0xdda0dd, 0x98d8c8]
    return colors[index % colors.length]
  }

  const getStepColor = (stepIndex, totalSteps) => {
    const progress = stepIndex / (totalSteps - 1)
    const colors = [0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7, 0xff6b6b]
    const colorIndex = Math.floor(progress * (colors.length - 1))
    return colors[colorIndex]
  }

  const lightenColor = (hex, percent) => {
    const num = parseInt(hex.toString(16), 16)
    const amt = Math.round(2.55 * percent * 100)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return 0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
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
        <>
          <div 
            ref={viewerRef} 
            className={`panoramic-viewer${isCinemaMode ? ' cinema-viewer' : ''}`}
          ></div>
          
          {/* 3D Mind Map ve Learning Path Bilgi Paneli */}
          {(mindMapData || learningPathData) && (
            <div className="info-panel">
              <div className="info-content">
                <h4>🌌 Evren Bilgileri</h4>
                {mindMapData && (
                  <div className="info-item">
                    <span className="info-icon">🧠</span>
                    <span className="info-text">Mind Map Sistemi Aktif</span>
                  </div>
                )}
                {learningPathData && (
                  <div className="info-item">
                    <span className="info-icon">🛤️</span>
                    <span className="info-text">Learning Path Sistemi Aktif</span>
                  </div>
                )}
                <p className="info-hint">
                  Gezegenleri keşfetmek için fare ile döndürün ve yakınlaştırın
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PanoramicViewer 