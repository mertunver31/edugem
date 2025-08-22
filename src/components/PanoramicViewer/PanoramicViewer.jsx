import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import CustomButton from '../CustomButton/CustomButton'
import Avatar3DLoader from '../Avatar3DLoader/Avatar3DLoader'
import AITeacherSelector from '../AITeacherSelector/AITeacherSelector'
import AITeacherChat from '../AITeacherChat/AITeacherChat'
import forceGraph3DService from '../../services/forceGraph3DService'
import podcastService from '../../services/podcastService'
import lessonNotesService from '../../services/lessonNotesService'
import './PanoramicViewer.css'

const PanoramicViewer = ({ imageFile, onClose, isCinemaMode, selectedAvatar, selectedDers }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isViewerReady, setIsViewerReady] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [isViewerActive, setIsViewerActive] = useState(false)
  const [isAvatarLoading, setIsAvatarLoading] = useState(false)
  const [mindMapData, setMindMapData] = useState(null)
  const [learningPathData, setLearningPathData] = useState(null)
  const [cameraMode, setCameraMode] = useState('avatar') // 'avatar' veya 'free'
  const [showAITeacherChat, setShowAITeacherChat] = useState(false)
  const [classroomId, setClassroomId] = useState(null)
  const [showTeacherSelector, setShowTeacherSelector] = useState(false)
  const [selectedAITeacher, setSelectedAITeacher] = useState(null)
  const [aiTeacherAvatar, setAiTeacherAvatar] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedVisualization, setSelectedVisualization] = useState(null) // 'mindmap' veya 'learningpath'
  const [isInfoPanelCollapsed, setIsInfoPanelCollapsed] = useState(false) // Info panel akordiyon için
  const [isToolsCardCollapsed, setIsToolsCardCollapsed] = useState(false) // Tools card akordiyon için
  const [showLessonContent, setShowLessonContent] = useState(false) // Ders içeriği paneli için
  const [extractedLessonData, setExtractedLessonData] = useState(null) // Çıkarılan ders verisi
  const [showMindMapPanel, setShowMindMapPanel] = useState(false) // Mind map veri paneli
  const [activeBranchIndex, setActiveBranchIndex] = useState(null) // Seçili dal
  
  // Audio playback states
  const [isPodcastLoading, setIsPodcastLoading] = useState(false)
  const [podcastData, setPodcastData] = useState(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [podcastScope, setPodcastScope] = useState({ type: 'full' }) // 'full' | 'chapter' | 'lesson'
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(null)
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(null)
  const [audioError, setAudioError] = useState(null)
  const audioRef = useRef(null)

  // Debug için state değişikliklerini takip et
  useEffect(() => {
    console.log('State değişiklikleri:', {
      showTeacherSelector,
      isViewerActive,
      selectedAITeacher: selectedAITeacher?.name,
      aiTeacherAvatar: aiTeacherAvatar,
      hasAvatarLoader: !!avatarLoaderRef.current
    })
  }, [showTeacherSelector, isViewerActive, selectedAITeacher, aiTeacherAvatar])
  const cameraModeRef = useRef('avatar') // Ref ile takip et
  const viewerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)
  const animationRef = useRef(null)
  const avatarLoaderRef = useRef(null)
  const avatarRef = useRef(null)
  const freeCameraPositionRef = useRef({ x: 0, y: 0, z: 100 })
  const keysPressedRef = useRef(new Set())
  const freeCameraRef = useRef({ x: 0, y: 0, z: 100, rotationX: 0, rotationY: 0 })
  const initialAvatarCameraPosition = useRef({ x: 0, y: 20, z: 30 }) // İlk avatar kamera pozisyonu

  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [isNotesLoading, setIsNotesLoading] = useState(false)
  const [notesError, setNotesError] = useState(null)
  const [showNotesPanel, setShowNotesPanel] = useState(false)

  useEffect(() => {
    if (imageFile) {
      prepareImage()
    }
  }, [imageFile])

  useEffect(() => {
    if (selectedDers && selectedDers.id) {
      loadMindMapAndLearningPath(selectedDers.id)
      // Sınıf ID'sini oluştur (gerçek uygulamada veritabanından gelecek)
      setClassroomId(`classroom_${selectedDers.id}_${Date.now()}`)
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

  useEffect(() => {
    // Force-directed görselleştirme sadece kullanıcı bu modu açıkça seçtiğinde çalışsın.
    // Varsayılan panoramik sınıfta gezegen/küre temsilleri aktif kalsın.
    if (!viewerRef.current) return
    if (selectedVisualization === 'mindmap' && mindMapData) {
      console.log('Panoramik sınıfa 3D Mind Map force-directed olarak yüklendi:', mindMapData)
      forceGraph3DService.createMindMap3D(mindMapData, viewerRef.current)
    } else if (selectedVisualization === 'learningpath' && learningPathData) {
      console.log('Panoramik sınıfa 3D Learning Path force-directed olarak yüklendi:', learningPathData)
      forceGraph3DService.createLearningPath3D(learningPathData, viewerRef.current)
    }
  }, [mindMapData, learningPathData, selectedVisualization])

  // Mouse kontrolleri için event listener'lar
  // Not: Mind map'ten çıkışta viewer yeniden oluşturulduğu için
  // isViewerActive değiştiğinde de dinleyicileri yeniden bağlarız
  useEffect(() => {
    let isMouseDown = false
    let lastMouseX = 0
    let lastMouseY = 0

    const handleMouseDown = (event) => {
      if (cameraModeRef.current === 'free') {
        isMouseDown = true
        lastMouseX = event.clientX
        lastMouseY = event.clientY
      }
    }

    const handleMouseMove = (event) => {
      if (cameraModeRef.current === 'free' && isMouseDown) {
        const deltaX = event.clientX - lastMouseX
        const deltaY = event.clientY - lastMouseY
        
        // Mouse hareketi ile kamera rotasyonu
        freeCameraRef.current.rotationY -= deltaX * 0.01
        freeCameraRef.current.rotationX -= deltaY * 0.01
        
        // Rotasyon sınırları
        freeCameraRef.current.rotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, freeCameraRef.current.rotationX))
        
        lastMouseX = event.clientX
        lastMouseY = event.clientY
        
        // Mouse hareketi log'u kaldırıldı - performans için
      }
    }

    const handleMouseUp = () => {
      isMouseDown = false
    }

    // Mouse event'lerini sadece 3D viewer aktifken ekle
    const targetEl = rendererRef.current?.cssRenderer?.domElement || viewerRef.current
    if (isViewerActive && targetEl) {
      targetEl.addEventListener('mousedown', handleMouseDown)
      targetEl.addEventListener('mousemove', handleMouseMove)
      targetEl.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      const cleanupTarget = rendererRef.current?.cssRenderer?.domElement || viewerRef.current
      if (cleanupTarget) {
        cleanupTarget.removeEventListener('mousedown', handleMouseDown)
        cleanupTarget.removeEventListener('mousemove', handleMouseMove)
        cleanupTarget.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [cameraMode, isViewerActive])

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



      // === TELESKOP GLB EKLE ===
      const telescopeLoader = new GLTFLoader()
      telescopeLoader.load(
        '/telescope.glb',
        (gltf) => {
          // UserPath'in merkezine, uygun bir y ve z ile yerleştir
          gltf.scene.position.set(userPath.position.x+40, userPath.position.y+12, 0) // z=0 userpath ortası
          gltf.scene.name = 'telescopeGLB'
          gltf.scene.scale.set(10, 10, 10) // Portal ile benzer büyüklük
          gltf.scene.rotation.y = Math.PI / 2 // Gerekirse döndür
          scene.add(gltf.scene)
          console.log('Teleskop GLB sahneye eklendi:', gltf.scene)
        },
        undefined,
        (error) => {
          console.error('Teleskop GLB yüklenemedi:', error)
        }
      )



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

      // AI öğretmen avatarını yükle
      if (aiTeacherAvatar && avatarLoaderRef.current) {
        console.log('AI öğretmen avatarı yükleniyor:', aiTeacherAvatar)
        console.log('AvatarLoader hazır:', !!avatarLoaderRef.current)
        console.log('Scene hazır:', !!scene)
        
        // Hemen yükle, gecikme olmadan
        loadAITeacherAvatar(scene)
      } else {
        console.log('AI öğretmen avatarı yüklenemedi:', {
          hasAiTeacherAvatar: !!aiTeacherAvatar,
          hasAvatarLoader: !!avatarLoaderRef.current,
          aiTeacherAvatar: aiTeacherAvatar
        })
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
      controls.enabled = cameraMode === 'free' // Sadece serbest modda etkin
      controls.enablePan = true // Pan etkin
      controls.enableZoom = true // Zoom etkin
      controlsRef.current = controls

      // Serbest kamera pozisyonunu sakla
      freeCameraPositionRef.current = { x: camera.position.x, y: camera.position.y, z: camera.position.z }

      // OrbitControls değişiklik event listener'ı
      controls.addEventListener('change', () => {
        if (cameraMode === 'free' && camera) {
          freeCameraPositionRef.current = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
          }
        }
      })

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
          // Dev screen kontrolü
          if (intersect.object.name === 'devScreen') {
            // Ders içeriğini panelde göster
            if (selectedDers && selectedDers.enhanced_content) {
              console.log('Dev screen\'e tıklandı - Ders içeriği çıkarılıyor')
              setExtractedLessonData(selectedDers)
              setShowLessonContent(true)
            }
            // Varsa iliştirilmiş HTML elementini görünürlük açısından toggle et
            if (intersect.object.userData && intersect.object.userData.element) {
              const element = intersect.object.userData.element
              element.style.display = element.style.display === 'none' ? 'block' : 'none'
            }
            break
          }

          // 1. teleskopa tıklandığında learning path gezegenlerini yakından göster
          if (intersect.object.name === 'telescopeGLB' && learningPathData) {
            console.log('1. teleskopa tıklandı - Learning path gezegenleri yakından gösteriliyor')
            // Kamerayı learning path gezegenlerinin olduğu bölgeye taşı
            camera.position.set(150, 50, -100) // Learning path başlangıç pozisyonu
            camera.lookAt(150, 50, -100)
            break
          }
          
          // Mind Map küreleri kontrolü
          if (intersect.object.name === 'mindMapCentral' || intersect.object.name.startsWith('mindMapBranch_')) {
            console.log('🧠 Mind Map küresine tıklandı:', intersect.object.name)
            showMindMapDetails(intersect.object)
            break
          }
          
          // Learning Path küreleri kontrolü
          if (intersect.object.name === 'learningPathStart' || 
              intersect.object.name === 'learningPathEnd' ||
              intersect.object.name.startsWith('learningPathStep_')) {
            console.log('🛤️ Learning Path küresine tıklandı:', intersect.object.name)
            showLearningPathDetails(intersect.object)
            break
          }
        }
      }

      cssRenderer.domElement.addEventListener('click', handleMouseClick)
      // WebGL canvas üzerinde de tıklamayı dinle (sağlamlık için)
      renderer.domElement.addEventListener('click', handleMouseClick)

      // Mouse move handler for hover effects
      const handleMouseMove = (event) => {
        const rect = renderer.domElement.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(scene.children)

        // Tüm küreleri normal boyuta getir
        scene.children.forEach(child => {
          if (child.name && (child.name.startsWith('mindMap') || child.name.startsWith('learningPath'))) {
            child.scale.set(1, 1, 1)
          }
        })

        // Hover edilen küreyi büyüt
        for (const intersect of intersects) {
          if (intersect.object.name && 
              (intersect.object.name.startsWith('mindMap') || intersect.object.name.startsWith('learningPath'))) {
            intersect.object.scale.set(1.2, 1.2, 1.2)
            break
          }
        }
      }

      renderer.domElement.addEventListener('mousemove', handleMouseMove)

      // Event listener referanslarını sakla
      renderer.handleMouseClick = handleMouseClick
      renderer.handleMouseMove = handleMouseMove

      // Animation loop
      const animate = () => {
        animationRef.current = requestAnimationFrame(animate)
        
        // Her zaman updateFreeCamera çağır, içinde kontrol yap
        updateFreeCamera()
        
        renderer.render(scene, camera)
        renderer.cssRenderer.render(scene, camera)
      }
      animate()

      // Window resize handler
      const handleResize = () => {
        if (!viewerRef.current || !camera || !renderer) return
        
        camera.aspect = viewerRef.current.clientWidth / viewerRef.current.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight)
        if (renderer.cssRenderer) {
          renderer.cssRenderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight)
        }
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

  const loadAITeacherAvatar = async (scene) => {
    console.log('loadAITeacherAvatar çağrıldı:', { aiTeacherAvatar, hasAvatarLoader: !!avatarLoaderRef.current })
    
    if (!aiTeacherAvatar || !avatarLoaderRef.current) {
      console.log('AI öğretmen avatar yüklenemedi:', { aiTeacherAvatar, hasAvatarLoader: !!avatarLoaderRef.current })
      return
    }

    try {
      console.log('AI öğretmen avatarı yükleniyor...')
      const teacherAvatar = await avatarLoaderRef.current.loadAvatar(
        scene, 
        aiTeacherAvatar, 
        { x: 0, y: -30, z: -150 } // Dev screen'in önünde
      )
      
      if (teacherAvatar) {
        // AI öğretmen avatarını öğretmen olarak işaretle
        teacherAvatar.name = 'aiTeacher'
        
        // AI öğretmen avatarını dev screen'e doğru döndür
        teacherAvatar.rotation.y = Math.PI // 180 derece döndür
        
        console.log('AI öğretmen avatarı başarıyla yüklendi:', selectedAITeacher?.name, teacherAvatar.position)
        
        // AI öğretmen avatarını takip etmeyecek şekilde ayarla
        // Sadece kullanıcı avatarını takip et
        if (avatarRef.current && avatarRef.current.name !== 'aiTeacher') {
          initializeAvatarFollowCamera(avatarRef.current, scene)
        }
      } else {
        console.log('AI öğretmen avatarı yüklenemedi: teacherAvatar null')
      }
    } catch (error) {
      console.error('AI öğretmen avatar yükleme hatası:', error)
    }
  }

  const initializeAvatarFollowCamera = (avatar, scene) => {
    // Sadece kullanıcı avatarını takip et, AI öğretmen avatarını değil
    if (avatar.name === 'aiTeacher') {
      console.log('AI öğretmen avatarı takip edilmeyecek')
      return
    }
    
    // Avatar referansını sakla
    avatarRef.current = avatar
    
    // İlk avatar kamera pozisyonunu sakla
    initialAvatarCameraPosition.current = {
      x: avatar.position.x,
      y: avatar.position.y + 20,
      z: avatar.position.z + 30
    }
    
    // Avatar takip kamerası sistemi
    const followCamera = () => {
      if (!avatar || !rendererRef.current?.camera || cameraModeRef.current !== 'avatar') return
      
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
        controlsRef.current.enabled = false // Avatar modunda controls devre dışı
      }
    }
    
    // Her frame'de kamera pozisyonunu güncelle
    const updateCamera = () => {
      followCamera()
      requestAnimationFrame(updateCamera)
    }
    
    // Kamera takip sistemini başlat
    updateCamera()
    
    console.log('Kullanıcı avatar takip kamerası başlatıldı')
  }

  const createEnhancedContentOverlay = (scene, selectedDers) => {
    // Dev screen'de hiç içerik görünmesin, sadece tıklanabilir olsun
    const element = document.createElement('div')
    // Boş içerik - sadece tıklanabilir alan
    element.innerHTML = ''
    Object.assign(element.style, {
      width: '100px',
      height: '60px',
      background: 'transparent', // Şeffaf arka plan
      borderRadius: '2px',
      pointerEvents: 'auto',
      cursor: 'pointer', // Tıklanabilir olduğunu göster
      userSelect: 'none',
      display: 'block' // Her zaman görünür olsun
    })

    // CSS3DObject'e sar
    const cssObject = new CSS3DObject(element)
    const devScreen = scene.getObjectByName('devScreen')
    if (!devScreen) return

    // Monitörün gerçek ölçülerine göre ölçekle
    element.style.transformOrigin = 'center'
    cssObject.scale.set(1, 1, 1)  // 1:1 ölçek (100×60px → 100×60 birim)
    cssObject.position.set(0, 0, -199.5)  // Monitörün tam ön yüzünde
    cssObject.rotation.copy(devScreen.rotation)
    scene.add(cssObject)

    // Dev screen'e referansları ekle
    devScreen.userData.cssObject = cssObject
    devScreen.userData.element = element
  }

  const renderLessonContentPanel = (lessonData) => {
    if (!lessonData || !lessonData.enhanced_content) return null
    
    const { enhanced_content } = lessonData
    
    const handleCloseLessonPanel = () => {
      setShowLessonContent(false)
      // Dev screen'de artık gizlenecek içerik yok, sadece panel kapanır
    }
    
    return (
      <div className="lesson-content-panel">
        <div className="lesson-content-header">
          <h2>{lessonData.title || lessonData.file_name}</h2>
          <CustomButton
            text="✕"
            onClick={handleCloseLessonPanel}
            variant="secondary"
            className="close-lesson-button"
          />
        </div>
        <div className="lesson-content-body">
          {enhanced_content.chapters && enhanced_content.chapters.map((chapter, chapterIndex) => (
            <div key={chapterIndex} className="chapter-section">
              <h3 className="chapter-title">📖 {chapter.title}</h3>
              {chapter.content && chapter.content.lessons && chapter.content.lessons.map((lesson, lessonIndex) => (
                <div key={lessonIndex} className="lesson-section">
                  <h4 className="lesson-title">🎯 {lesson.title}</h4>
                  {lesson.content && (
                    <div className="lesson-content">
                      {lesson.content.explanatory_text && (
                        <div className="content-section">
                          <h5>📝 Açıklayıcı Metin</h5>
                          <p>{lesson.content.explanatory_text}</p>
                        </div>
                      )}
                      {lesson.content.key_points && lesson.content.key_points.length > 0 && (
                        <div className="content-section">
                          <h5>✅ Anahtar Noktalar</h5>
                          <ul>
                            {lesson.content.key_points.map((point, pointIndex) => (
                              <li key={pointIndex}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {lesson.content.summary && (
                        <div className="content-section">
                          <h5>📋 Özet</h5>
                          <p>{lesson.content.summary}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
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
    }

    if (viewerRef.current && viewerRef.current.handleResize) {
      try {
        window.removeEventListener('resize', viewerRef.current.handleResize)
      } catch (error) {
        console.warn('Resize event listener removal failed:', error)
      }
    }

    if (rendererRef.current) {
      // Event listener'ları temizle
      if (rendererRef.current.handleMouseClick) {
        rendererRef.current.domElement.removeEventListener('click', rendererRef.current.handleMouseClick)
      }
      if (rendererRef.current.handleMouseMove) {
        rendererRef.current.domElement.removeEventListener('mousemove', rendererRef.current.handleMouseMove)
      }
      
      rendererRef.current.dispose()
      if (rendererRef.current.cssRenderer) {
        rendererRef.current.cssRenderer.domElement.remove()
        rendererRef.current.cssRenderer = null
      }
      // Kamera referansını temizle
      rendererRef.current.camera = null
    }

    // Scene'i ve kontrolleri temizle
    const scene = sceneRef.current
    if (scene) {
      while (scene.children.length > 0) {
        const child = scene.children[0]
        scene.remove(child)
      }
      sceneRef.current = null
    }
    if (controlsRef.current) {
      controlsRef.current.dispose()
      controlsRef.current = null
    }
    if (avatarLoaderRef.current) {
      try {
        if (scene) {
          avatarLoaderRef.current.removeAvatar(scene)
        }
        avatarLoaderRef.current = null
      } catch (error) {
        console.warn('Avatar loader cleanup failed:', error)
      }
    }
    
    // Renderer referansını en sonda sıfırla
    if (rendererRef.current) {
      rendererRef.current = null
    }

    // 3D Force Graph'ları temizle
    forceGraph3DService.cleanup()

    console.log('3D viewer temizlendi')
  }

  const createMindMap3DObjects = (scene) => {
    if (!mindMapData) return

    try {
      console.log('🧠 Mind Map 3D objeleri oluşturuluyor...')
      
      // Veri doğrulama ve temizleme
      const centralTopic = (mindMapData.centralTopic || mindMapData.central_topic || 'Merkez Konu')
        .toString()
        .substring(0, 20)
        .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s]/g, '')
        .trim()
      
      const branches = mindMapData.content || mindMapData.branches || []
      
      if (!Array.isArray(branches) || branches.length === 0) {
        console.warn('⚠️ Mind Map branches verisi bulunamadı veya geçersiz')
        return
      }
      
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
      const centralLabel = create3DLabel(centralTopic, 0xff6b6b)
      centralLabel.position.set(-150, 70, -100)
      scene.add(centralLabel)

      // Ana dal gezegenleri
      if (branches && Array.isArray(branches)) {
        branches.forEach((branch, index) => {
          // Branch veri doğrulama
          if (!branch || typeof branch !== 'object') {
            console.warn(`⚠️ Branch ${index} geçersiz veri formatı`)
            return
          }
          
          const topic = (branch.topic || `Dal ${index + 1}`)
            .toString()
            .substring(0, 15)
            .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s]/g, '')
            .trim()
          
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
          const branchLabel = create3DLabel(topic, getBranchColor(index))
          branchLabel.position.set(x, y + 8, z)
          scene.add(branchLabel)

          // Alt konu gezegenleri
          if (branch.subtopics && Array.isArray(branch.subtopics)) {
            branch.subtopics.forEach((subtopic, subIndex) => {
              // Subtopic veri doğrulama
              const subtopicText = (typeof subtopic === 'string' ? subtopic : `Alt ${subIndex + 1}`)
                .toString()
                .substring(0, 12)
                .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s]/g, '')
                .trim()
              
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
      
      // Veri doğrulama
      const steps = learningPathData.steps || []
      
      if (!Array.isArray(steps) || steps.length === 0) {
        console.warn('⚠️ Learning Path steps verisi bulunamadı veya geçersiz')
        return
      }
      
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
      steps.forEach((step, index) => {
        // Step veri doğrulama
        if (!step || typeof step !== 'object') {
          console.warn(`⚠️ Step ${index} geçersiz veri formatı`)
          return
        }
        
        const stepTitle = (step.title || `Adım ${index + 1}`)
          .toString()
          .substring(0, 15)
          .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s]/g, '')
          .trim()
        
        const angle = (index / steps.length) * Math.PI * 2
        const radius = 35
        const x = 150 + Math.cos(angle) * radius
        const y = 50 + Math.sin(angle) * radius * 0.5
        const z = -100 + Math.sin(angle) * radius * 0.3

        // Adım gezegeni
        const stepGeometry = new THREE.SphereGeometry(3, 24, 24)
        const stepMaterial = new THREE.MeshLambertMaterial({ 
          color: getStepColor(index, steps.length),
          emissive: getStepColor(index, steps.length),
          emissiveIntensity: 0.1
        })
        const stepPlanet = new THREE.Mesh(stepGeometry, stepMaterial)
        stepPlanet.position.set(x, y, z)
        stepPlanet.name = `learningPathStep_${index}`
        scene.add(stepPlanet)

        // Önceki adım ile bağlantı
        const prevX = index === 0 ? 150 : 150 + Math.cos((index - 1) / steps.length * Math.PI * 2) * radius
        const prevY = index === 0 ? 50 : 50 + Math.sin((index - 1) / steps.length * Math.PI * 2) * radius * 0.5
        const prevZ = index === 0 ? -100 : -100 + Math.sin((index - 1) / steps.length * Math.PI * 2) * radius * 0.3

        const connectionGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(prevX, prevY, prevZ),
          new THREE.Vector3(x, y, z)
        ])
        const connectionMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.6, transparent: true })
        const connection = new THREE.Line(connectionGeometry, connectionMaterial)
        scene.add(connection)

        // Adım etiketi
        const stepLabel = create3DLabel(stepTitle, getStepColor(index, steps.length))
        stepLabel.position.set(x, y + 6, z)
        scene.add(stepLabel)
      })

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

  const switchToAvatarCamera = () => {
    setCameraMode('avatar')
    cameraModeRef.current = 'avatar'
    
    // OrbitControls'ı devre dışı bırak
    if (controlsRef.current) {
      controlsRef.current.enabled = false
    }
    
    // Avatar kamerasına geçerken smooth geçiş
    if (rendererRef.current?.camera && avatarRef.current && avatarRef.current.name !== 'aiTeacher') {
      const camera = rendererRef.current.camera
      const avatar = avatarRef.current
      
      // Avatar'ın arkasında sabit mesafede pozisyon
      const offsetX = 0
      const offsetY = 20  // Biraz yukarıda
      const offsetZ = 30  // Arkada
      
      camera.position.set(
        avatar.position.x + offsetX,
        avatar.position.y + offsetY,
        avatar.position.z + offsetZ
      )
      
      // Avatar'a bak
      camera.lookAt(avatar.position)
      
      console.log('👤 Avatar kamerasına geçildi')
    } else {
      console.log('⚠️ Avatar kamerasına geçilemedi - avatar bulunamadı')
    }
  }

  const switchToFreeCamera = () => {
    setCameraMode('free')
    cameraModeRef.current = 'free'
    
    // OrbitControls'ı etkinleştir
    if (controlsRef.current) {
      controlsRef.current.enabled = true
    }
    
    // Serbest kameraya geçerken mevcut pozisyonu kullan
    if (rendererRef.current?.camera) {
      const camera = rendererRef.current.camera
      freeCameraRef.current = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        rotationX: 0,
        rotationY: 0
      }
      
      console.log('🌍 Serbest kameraya geçildi - Mouse ile kontrol edebilirsiniz')
    } else {
      console.log('⚠️ Serbest kameraya geçilemedi - kamera bulunamadı')
    }

    // Mind map veya diğer overlay işlemlerinden sonra
    // event dinleyicilerinin aktif olduğundan emin ol
    try {
      const targetEl = rendererRef.current?.cssRenderer?.domElement || viewerRef.current
      if (targetEl) {
        targetEl.focus?.()
      }
    } catch (e) {
      // no-op
    }
  }

  const updateFreeCamera = () => {
    if (cameraModeRef.current !== 'free' || !rendererRef.current?.camera) return

    const camera = rendererRef.current.camera

    // Mouse ile rotasyon kontrolü
    const rotationX = freeCameraRef.current.rotationX
    const rotationY = freeCameraRef.current.rotationY

            // Debug log'ları kaldırıldı - performans için

    // Kamera pozisyonunu güncelle
    camera.position.set(
      freeCameraRef.current.x,
      freeCameraRef.current.y,
      freeCameraRef.current.z
    )

    // Rotasyon matrisini hesapla
    const matrix = new THREE.Matrix4()
    matrix.makeRotationFromEuler(new THREE.Euler(rotationX, rotationY, 0, 'YXZ'))
    
    // Kameranın bakış yönünü hesapla
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyMatrix4(matrix)
    
    // Kameranın hedef noktasını hesapla
    const target = new THREE.Vector3()
    target.copy(camera.position).add(direction)
    
    // Kamerayı hedefe yönlendir
    camera.lookAt(target)
  }

  const handleViewImage = () => {
    console.log('3D Ortama Gir butonuna tıklandı, isViewerReady:', isViewerReady)
    if (!isViewerReady) return
    console.log('AI öğretmen seçici modal açılıyor')
    setShowTeacherSelector(true)
  }

  const handleTeacherSelected = (teacher) => {
    console.log('AI öğretmen seçildi:', teacher.name, 'Avatar URL:', teacher.avatar_url)
    setSelectedAITeacher(teacher)
    // AI öğretmen avatarını yükle
    if (teacher.avatar_url) {
      console.log('AI öğretmen avatar URL ayarlanıyor:', teacher.avatar_url)
      setAiTeacherAvatar(teacher.avatar_url)
    } else {
      console.log('AI öğretmenin avatar URL i yok')
    }
    setShowTeacherSelector(false) // Modal'ı kapat
    setIsViewerActive(true) // 3D ortamı aç
  }

  const handleSkipTeacher = () => {
    console.log('AI öğretmen seçimi atlandı')
    setShowTeacherSelector(false) // Modal'ı kapat
    setIsViewerActive(true) // 3D ortamı aç
  }

  const handleClose = () => {
    setIsViewerActive(false)
    if (imageUrl && imageFile instanceof File) {
      URL.revokeObjectURL(imageUrl)
    }
    onClose()
  }
  const handleExitFromMindMap = () => {
    // Sadece mind map'i kapat, panoramik sınıfa geri dön
    console.log('Mind map\'ten çıkış yapılıyor, panoramik sınıfa dönülüyor')
    
    // 3D görselleştirmeyi tamamen temizle
    forceGraph3DService.cleanup()
    
    // State'leri sıfırla
    setSelectedVisualization(null)
    setShowSettings(false)
    
    // Panoramik görüntüyü yeniden yüklemek için state'i geçici olarak değiştir
    setIsViewerActive(false)
    setTimeout(() => {
      setIsViewerActive(true)
      // Yeniden aktif olduğunda serbest kamerayı hazırla
      setTimeout(() => {
        switchToFreeCamera()
      }, 0)
    }, 50)
    
    console.log('Mind map tamamen temizlendi, panoramik görüntü yeniden yüklendi')
  }

  // Audio playback functions
  const isScopeSelectionValid = () => {
    if (podcastScope?.type === 'chapter') {
      return Number.isInteger(selectedChapterIndex)
    }
    if (podcastScope?.type === 'lesson') {
      return Number.isInteger(selectedChapterIndex) && Number.isInteger(selectedLessonIndex)
    }
    return true
  }

  const handleFetchAndPlayPodcast = async () => {
    if (!selectedDers || !selectedDers.id) {
      setAudioError('Podcast oluşturmak için bir ders seçilmelidir.');
      return;
    }

    if (!isScopeSelectionValid()) {
      setAudioError('Lütfen geçerli bir bölüm/ders seçin.');
      return
    }

    // Eğer mevcut bir audio nesnemiz ve podcast verimiz varsa ve sadece devam etmek istiyorsak
    if (audioRef.current && podcastData?.audio_url) {
      try {
        await audioRef.current.play();
        setIsAudioPlaying(true);
        return;
      } catch (e) {
        // play başarısız olursa yeniden oluşturmayı deneyeceğiz
      }
    }

    setIsPodcastLoading(true);
    setAudioError(null);

    try {
      // Seçili kapsamı hazırla
      let scope = null
      if (podcastScope?.type === 'chapter' && Number.isInteger(selectedChapterIndex)) {
        scope = { type: 'chapter', chapterIndex: selectedChapterIndex }
      } else if (podcastScope?.type === 'lesson' && Number.isInteger(selectedChapterIndex) && Number.isInteger(selectedLessonIndex)) {
        scope = { type: 'lesson', chapterIndex: selectedChapterIndex, lessonIndex: selectedLessonIndex }
      } else {
        scope = { type: 'full' }
      }

      // Her seferinde güncel kapsam için isteği yap
      const data = await podcastService.getOrCreatePodcastForDocument(selectedDers.id, scope);
      setPodcastData(data);
      if (data.audio_url) {
        handleAudioPlay(data.audio_url);
      }
    } catch (err) {
      console.error("Podcast getirme hatası:", err);
      setAudioError(err.message || 'Podcast oluşturulurken bir hata oluştu.');
    } finally {
      setIsPodcastLoading(false);
    }
  };

  const handleAudioPlay = (audioUrl) => {
    // Aynı kaydı yeniden başlatmak yerine kaldığı yerden devam et
    if (audioRef.current && audioRef.current.src === audioUrl) {
      audioRef.current.play();
      setIsAudioPlaying(true);
      return;
    }
    // Farklı bir kayıt veya ilk kez
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsAudioPlaying(false);
    audio.onpause = () => setIsAudioPlaying(false);
    audio.onerror = () => {
      setIsAudioPlaying(false);
      setAudioError('Ses oynatma hatası.');
    }
    audio.play();
    setIsAudioPlaying(true);
  };

  const handleAudioPause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      // currentTime korunur, tekrar play çağrıldığında devam eder
      setIsAudioPlaying(false);
    }
  };

  const handleAudioStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      try {
        audioRef.current.currentTime = 0;
      } catch (e) {
        // no-op
      }
      setIsAudioPlaying(false);
    }
  };

  const handleAudioClose = () => {
    // Tamamen kapat: durdur + referansları temizle + mevcut podcast verisini temizle
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    } catch (e) {
      // no-op
    } finally {
      audioRef.current = null;
      setIsAudioPlaying(false);
    }
    setPodcastData(null);
    setAudioError(null);
  }

  // Kapsam veya seçim değiştiğinde mevcut podcast ve ses durumunu sıfırla
  useEffect(() => {
    if (!selectedDers?.id) return
    handleAudioClose()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podcastScope?.type, selectedChapterIndex, selectedLessonIndex, selectedDers?.id])

  const formatAudioDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const showMindMapDetails = (clickedObject) => {
    if (!mindMapData) return
    
    console.log('🧠 Mind Map detayları gösteriliyor:', clickedObject.name)
    
    // Hedef dalı belirle ve paneli aç
    if (clickedObject.name === 'mindMapCentral') {
      setActiveBranchIndex(null)
    } else if (clickedObject.name.startsWith('mindMapBranch_')) {
      const branchIndex = parseInt(clickedObject.name.split('_')[1])
      setActiveBranchIndex(Number.isNaN(branchIndex) ? null : branchIndex)
    }
    setShowMindMapPanel(true)
  }

  const showLearningPathDetails = (clickedObject) => {
    if (!learningPathData) return
    
    console.log('🛤️ Learning Path detayları gösteriliyor:', clickedObject.name)
    
    // Tıklanan objenin bilgilerini al
    let details = ''
    let title = ''
    
    if (clickedObject.name === 'learningPathStart') {
      title = 'Başlangıç'
      details = 'Öğrenme yolculuğunuzun başlangıç noktası'
    } else if (clickedObject.name === 'learningPathEnd') {
      title = 'Hedef'
      details = 'Öğrenme yolculuğunuzun hedef noktası'
    } else if (clickedObject.name.startsWith('learningPathStep_')) {
      const stepIndex = parseInt(clickedObject.name.split('_')[2])
      const step = learningPathData.steps?.[stepIndex]
      
      if (step) {
        title = `Adım ${stepIndex + 1}`
        details = step.description || step.content || `Adım ${stepIndex + 1} açıklaması`
      }
    }
    
    // Modal veya overlay ile detayları göster
    showDetailsModal(title, details, 'learningpath')
  }

  const showDetailsModal = (title, details, type) => {
    // Mevcut modal varsa kaldır
    const existingModal = document.getElementById('details-modal')
    if (existingModal) {
      existingModal.remove()
    }
    
    // Yeni modal oluştur
    const modal = document.createElement('div')
    modal.id = 'details-modal'
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      font-family: Arial, sans-serif;
    `
    
    const icon = type === 'mindmap' ? '🧠' : '🛤️'
    const color = type === 'mindmap' ? '#ff6b6b' : '#4ecdc4'
    
    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: ${color}; font-size: 1.5rem;">
          ${icon} ${title}
        </h2>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">
          ×
        </button>
      </div>
      <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">
        ${details}
      </div>
    `
    
    document.body.appendChild(modal)
    
    // 3 saniye sonra otomatik kapat
    setTimeout(() => {
      if (modal.parentElement) {
        modal.remove()
      }
    }, 10000)
  }

  // HATA AYIKLAMA: selectedDers nesnesinin içeriğini konsola yazdır
  useEffect(() => {
    if (selectedDers) {
      console.log("DEBUG: PanoramicViewer'a gelen 'selectedDers' nesnesi:", JSON.stringify(selectedDers, null, 2));
    }
  }, [selectedDers]);

  useEffect(() => {
    const loadNotes = async () => {
      if (!selectedDers?.id) return
      setIsNotesLoading(true)
      setNotesError(null)
      try {
        const data = await lessonNotesService.getNotes(selectedDers.id)
        setNotes(data)
      } catch (e) {
        setNotesError(e.message || 'Notlar yüklenemedi')
      } finally {
        setIsNotesLoading(false)
      }
    }
    loadNotes()
  }, [selectedDers?.id])

  const handleSaveNote = async () => {
    if (!newNote.trim()) return
    setIsNotesLoading(true)
    setNotesError(null)
    try {
      const saved = await lessonNotesService.addNote(selectedDers.id, newNote)
      setNotes(prev => [saved, ...prev])
      setNewNote('')
    } catch (e) {
      setNotesError(e.message || 'Not kaydedilemedi')
    } finally {
      setIsNotesLoading(false)
    }
  }

  return (
    <div className={`panoramic-viewer-container${isCinemaMode ? ' cinema-fullscreen' : ''}`}>
      {!isViewerActive && (
        <div className={`viewer-header${isCinemaMode ? ' cinema-header' : ''}`}>
          <h3>{imageFile.title || 'Panoramik Görüntü'}</h3>
          <CustomButton
            text="✕"
            onClick={handleClose}
            variant="secondary"
            className={`close-button${isCinemaMode ? ' cinema-close' : ''}`}
          />
        </div>
      )}

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
          {/* 3D Ortam Çıkış Butonu (yalnızca mind map veya learning path açıkken) */}
          {(selectedVisualization === 'mindmap' || selectedVisualization === 'learningpath') && (
          <div className="viewer-exit-button">
            <CustomButton
              text="✕ Çıkış"
              onClick={handleExitFromMindMap}
              variant="secondary"
              className="exit-button"
              title="Mind map'ten çık, panoramik sınıfa dön"
            />
          </div>
          )}

          {/* Araçlar Kartı */}
          <div className={`tools-card ${isToolsCardCollapsed ? 'collapsed' : ''}`}>
            <div className="tools-header" onClick={() => setIsToolsCardCollapsed(!isToolsCardCollapsed)}>
              <h4>🛠️ Araçlar</h4>
              <span className="collapse-icon">{isToolsCardCollapsed ? '▶️' : '▼'}</span>
            </div>
            <div className="tools-content">
              {/* Kamera Kontrolleri */}
              <div className="tools-section">
                <h5>📷 Kamera Kontrolleri</h5>
                <div className="tools-buttons">
                  <CustomButton
                    text="👤 Avatar Kamerası"
                    onClick={switchToAvatarCamera}
                    variant={cameraMode === 'avatar' ? 'primary' : 'secondary'}
                    className={`tool-button ${cameraMode === 'avatar' ? 'active' : ''}`}
                    disabled={!selectedAvatar}
                  />
                  <CustomButton
                    text="🌍 Serbest Kamera"
                    onClick={switchToFreeCamera}
                    variant={cameraMode === 'free' ? 'primary' : 'secondary'}
                    className={`tool-button ${cameraMode === 'free' ? 'active' : ''}`}
                  />
                </div>
                {cameraMode === 'free' && (
                  <div className="camera-info">
                    <p>🎮 Mouse ile 360° bakış açısı değiştirebilirsiniz</p>
                  </div>
                )}
              </div>

              {/* 3D Görselleştirme Araçları */}
              <div className="tools-section">
                <h5>🌌 3D Görselleştirme</h5>
                <div className="tools-buttons">
                  {mindMapData && (
                    <CustomButton
                      text="🧠 Mind Map"
                      onClick={() => {
                        setSelectedVisualization('mindmap')
                        if (mindMapData && viewerRef.current) {
                          forceGraph3DService.cleanup()
                          forceGraph3DService.createMindMap3D(mindMapData, viewerRef.current)
                        }
                      }}
                      variant={selectedVisualization === 'mindmap' ? 'primary' : 'secondary'}
                      className="tool-button"
                    />
                  )}
                  {learningPathData && (
                    <CustomButton
                      text="🛤️ Learning Path"
                      onClick={() => {
                        setSelectedVisualization('learningpath')
                        if (learningPathData && viewerRef.current) {
                          forceGraph3DService.cleanup()
                          forceGraph3DService.createLearningPath3D(learningPathData, viewerRef.current)
                        }
                      }}
                      variant={selectedVisualization === 'learningpath' ? 'primary' : 'secondary'}
                      className="tool-button"
                    />
                  )}
                </div>
              </div>

              {/* Ders Podcast Aracı */}
              <div className="tools-section">
                <h5>🎙️ Ders Podcast Özeti</h5>
                {selectedDers ? (
                  <>
                {/* Kapsam Seçimi */}
                <div className="podcast-scope">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <CustomButton
                      text={podcastScope.type === 'full' ? '📘 Tüm İçerik (Seçili)' : '📘 Tüm İçerik'}
                      onClick={() => setPodcastScope({ type: 'full' })}
                      variant={podcastScope.type === 'full' ? 'primary' : 'secondary'}
                      className="tool-button"
                    />
                    <CustomButton
                      text={podcastScope.type === 'chapter' ? '📗 Bölüm' : '📗 Bölüm'}
                      onClick={() => setPodcastScope({ type: 'chapter' })}
                      variant={podcastScope.type === 'chapter' ? 'primary' : 'secondary'}
                      className="tool-button"
                    />
                    <CustomButton
                      text={podcastScope.type === 'lesson' ? '📒 Ders' : '📒 Ders'}
                      onClick={() => setPodcastScope({ type: 'lesson' })}
                      variant={podcastScope.type === 'lesson' ? 'primary' : 'secondary'}
                      className="tool-button"
                    />
                  </div>
                  {(podcastScope.type === 'chapter' || podcastScope.type === 'lesson') && selectedDers?.enhanced_content?.chapters && (
                    <div style={{ marginTop: 8 }}>
                      <label style={{ fontSize: 12, marginRight: 6 }}>Bölüm seç:</label>
                      <select
                        value={selectedChapterIndex ?? ''}
                        onChange={(e) => {
                          const idx = e.target.value === '' ? null : parseInt(e.target.value, 10)
                          setSelectedChapterIndex(Number.isNaN(idx) ? null : idx)
                          setSelectedLessonIndex(null)
                        }}
                        style={{ padding: 4 }}
                      >
                        <option value="">—</option>
                        {selectedDers.enhanced_content.chapters.map((ch, idx) => (
                          <option key={idx} value={idx}>{ch.title || `Bölüm ${idx + 1}`}</option>
                        ))}
                      </select>
                      {podcastScope.type === 'lesson' && Number.isInteger(selectedChapterIndex) && selectedDers.enhanced_content.chapters[selectedChapterIndex]?.content?.lessons && (
                        <>
                          <label style={{ fontSize: 12, margin: '0 6px 0 12px' }}>Ders seç:</label>
                          <select
                            value={selectedLessonIndex ?? ''}
                            onChange={(e) => {
                              const idx = e.target.value === '' ? null : parseInt(e.target.value, 10)
                              setSelectedLessonIndex(Number.isNaN(idx) ? null : idx)
                            }}
                            style={{ padding: 4 }}
                          >
                            <option value="">—</option>
                            {selectedDers.enhanced_content.chapters[selectedChapterIndex].content.lessons.map((ls, lidx) => (
                              <option key={lidx} value={lidx}>{ls.title || `Ders ${lidx + 1}`}</option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="tools-buttons" style={{ gap: 8, display: 'flex', flexWrap: 'wrap' }}>
                  <CustomButton
                        text={
                          isPodcastLoading
                            ? '🔄 Hazırlanıyor...'
                            : (isAudioPlaying
                                ? '⏸️ Duraklat'
                                : (audioRef.current ? '▶️ Devam Et' : '▶️ Örneği Dinle'))
                        }
                        onClick={isAudioPlaying ? handleAudioPause : handleFetchAndPlayPodcast}
                        disabled={isPodcastLoading || !isScopeSelectionValid()}
                        variant={isAudioPlaying ? 'secondary' : 'primary'}
                        className="tool-button podcast-button"
                      />
                      <CustomButton
                        text="⏹️ Durdur"
                        onClick={handleAudioStop}
                        disabled={isPodcastLoading || !audioRef.current}
                        variant="secondary"
                        className="tool-button"
                      />
                      <CustomButton
                        text="🗙 Kapat"
                        onClick={handleAudioClose}
                        disabled={isPodcastLoading || (!audioRef.current && !podcastData)}
                        variant="secondary"
                        className="tool-button"
                      />
                      </div>
                    {podcastData && (
                      <div className="podcast-info">
                        <p>"{podcastData.summary_text.substring(0, 100)}..."</p>
                        {podcastData.duration_seconds > 0 && (
                        <span>Süre: {Math.round(podcastData.duration_seconds)} sn</span>
                        )}
                </div>
                    )}
                {audioError && (
                  <div className="audio-error">
                    <span>❌ {audioError}</span>
                  </div>
                    )}
                  </>
                ) : (
                  <p className="tools-hint">Podcast için önce bir ders seçmelisiniz.</p>
                )}
              </div>

              {/* Sohbet Araçları */}
              <div className="tools-section">
                <h5>💬 Sohbet</h5>
                <div className="tools-buttons">
                  <CustomButton
                    text={showAITeacherChat ? '🗙 AI Öğretmen Sohbetini Kapat' : '👨‍🏫 AI Öğretmen Sohbetini Aç'}
                    onClick={() => setShowAITeacherChat(prev => !prev)}
                    variant={showAITeacherChat ? 'secondary' : 'primary'}
                    className="tool-button"
                    disabled={!selectedAITeacher}
                  />
                </div>
              </div>

              {/* Ana Sayfaya Dön */}
              <div className="tools-section">
                <h5>🏠 Navigasyon</h5>
                <div className="tools-buttons">
                  <CustomButton
                    text="🏠 Ana Sayfaya Dön"
                    onClick={handleClose}
                    variant="secondary"
                    className="tool-button"
                  />
                </div>
              </div>

              {/* Bilgi Paneli */}
              {(mindMapData || learningPathData || selectedAITeacher) && (
                <div className="tools-section">
                  <h5>ℹ️ Evren Bilgileri</h5>
                  <div className="info-list">
                    {selectedAITeacher && (
                      <div className="info-item">
                        <span className="info-icon">👨‍🏫</span>
                        <span className="info-text">{selectedAITeacher.name} - {selectedAITeacher.subject}</span>
                      </div>
                    )}
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
                  </div>
                  <p className="tools-hint">
                    💡 Gezegenleri keşfetmek için fare ile döndürün ve yakınlaştırın
                  </p>
                </div>
              )}
            </div>
          </div>

          <div 
            ref={viewerRef} 
            className={`panoramic-viewer${isCinemaMode ? ' cinema-viewer' : ''}`}
          ></div>
          






          {/* 3D Görselleştirme Ayar Ekranı */}
          {showSettings && (
            <div className="settings-panel">
              <div className="settings-content">
                <h4>🌌 3D Görselleştirme Ayarları</h4>
                <div className="visualization-options">
                  <div className="option-group">
                    <h5>Görselleştirme Seçin:</h5>
                    <div className="option-buttons">
                      <CustomButton
                        text="🧠 Mind Map"
                        onClick={() => {
                          setSelectedVisualization('mindmap')
                          if (mindMapData && viewerRef.current) {
                            forceGraph3DService.cleanup()
                            forceGraph3DService.createMindMap3D(mindMapData, viewerRef.current)
                          }
                        }}
                        variant={selectedVisualization === 'mindmap' ? 'primary' : 'secondary'}
                        className="visualization-btn"
                      />
                      <CustomButton
                        text="🛤️ Learning Path"
                        onClick={() => {
                          setSelectedVisualization('learningpath')
                          if (learningPathData && viewerRef.current) {
                            forceGraph3DService.cleanup()
                            forceGraph3DService.createLearningPath3D(learningPathData, viewerRef.current)
                          }
                        }}
                        variant={selectedVisualization === 'learningpath' ? 'primary' : 'secondary'}
                        className="visualization-btn"
                      />
                    </div>
                  </div>
                  <div className="option-group">
                    <h5>Mevcut Veriler:</h5>
                    <div className="data-status">
                      <div className="status-item">
                        <span className="status-icon">🧠</span>
                        <span className="status-text">
                          Mind Map: {mindMapData ? '✅ Mevcut' : '❌ Yok'}
                        </span>
                      </div>
                      <div className="status-item">
                        <span className="status-icon">🛤️</span>
                        <span className="status-text">
                          Learning Path: {learningPathData ? '✅ Mevcut' : '❌ Yok'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="option-group">
                    <h5>Kontroller:</h5>
                    <div className="control-buttons">
                      <CustomButton
                        text="🔄 Temizle"
                        onClick={handleExitFromMindMap}
                        variant="secondary"
                        className="control-btn"
                      />
                      <CustomButton
                        text="📊 Yenile"
                        onClick={() => {
                          if (selectedVisualization === 'mindmap' && mindMapData) {
                            forceGraph3DService.cleanup()
                            forceGraph3DService.createMindMap3D(mindMapData, viewerRef.current)
                          } else if (selectedVisualization === 'learningpath' && learningPathData) {
                            forceGraph3DService.cleanup()
                            forceGraph3DService.createLearningPath3D(learningPathData, viewerRef.current)
                          }
                        }}
                        variant="secondary"
                        className="control-btn"
                      />
                    </div>
                  </div>
                </div>
                <p className="settings-hint">
                  💡 Seçtiğiniz görselleştirme 3D sahneye yüklenecektir
                </p>
              </div>
            </div>
          )}

          {/* Classroom Chat kaldırıldı */}

          {/* AI Teacher Chat */}
          {showAITeacherChat && selectedAITeacher && (
            <div className="ai-teacher-chat-panel">
              <AITeacherChat 
                teacher={selectedAITeacher}
                isOpen={showAITeacherChat}
                onClose={() => setShowAITeacherChat(false)}
                classroomId={classroomId}
              />
            </div>
          )}

          {/* Notes toggle button */}
          {isViewerActive && (
            <button
              className="notes-toggle-btn"
              onClick={() => setShowNotesPanel(prev => !prev)}
              title="Ders Notları"
            >
              🗒️
            </button>
          )}

          {/* Notes side panel */}
          {showNotesPanel && (
            <div className="notes-panel">
              <div className="notes-header">
                <h4>🗒️ Ders Notları</h4>
                <CustomButton
                  text="✕"
                  onClick={() => setShowNotesPanel(false)}
                  variant="secondary"
                  className="close-graph-button"
                />
              </div>
              <div className="notes-body">
                {selectedDers ? (
                  <>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Bu ders için notlarınızı yazın..."
                      rows={4}
                      className="notes-textarea"
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <CustomButton
                        text={isNotesLoading ? '💾 Kaydediliyor...' : '💾 Notu Kaydet'}
                        onClick={handleSaveNote}
                        disabled={isNotesLoading || !newNote.trim()}
                        variant="primary"
                        className="tool-button"
                      />
                    </div>
                    {notesError && (
                      <div className="audio-error" style={{ marginTop: 8 }}><span>❌ {notesError}</span></div>
                    )}
                    <div className="notes-list-panel">
                      {isNotesLoading && notes.length === 0 && <p>Notlar yükleniyor...</p>}
                      {notes.length === 0 && !isNotesLoading && <p>Henüz not yok.</p>}
                      {notes.length > 0 && (
                        <ul className="notes-items">
                          {notes.map(n => (
                            <li key={n.id} className="notes-item">
                              <div className="notes-item-time">{new Date(n.created_at).toLocaleString()}</div>
                              <div className="notes-item-content">{n.content}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="tools-hint">Not eklemek için önce bir ders seçmelisiniz.</p>
                )}
              </div>
            </div>
          )}

          {/* Mind Map Bilgi Paneli */}
          {showMindMapPanel && mindMapData && (
            <div className="mindmap-panel">
              <div className="mindmap-panel-header">
                <h4>🧠 Mind Map</h4>
                <div className="mindmap-header-actions">
                  {activeBranchIndex !== null && (
                    <CustomButton
                      text="← Geri"
                      onClick={() => setActiveBranchIndex(null)}
                      variant="secondary"
                      className="close-graph-button"
                    />
                  )}
                  <CustomButton
                    text="✕"
                    onClick={() => setShowMindMapPanel(false)}
                    variant="secondary"
                    className="close-graph-button"
                  />
                </div>
              </div>
              <div className="mindmap-panel-body">
                {activeBranchIndex === null ? (
                  <div className="mindmap-section">
                    <div className="mindmap-central"> 
                      <div className="central-title">Merkez Konu</div>
                      <div className="central-text">{mindMapData.centralTopic || mindMapData.central_topic}</div>
                    </div>
                    {(mindMapData.content || mindMapData.branches) && (
                      <div className="branches-list">
                        {(mindMapData.content || mindMapData.branches).map((branch, idx) => (
                          <button
                            key={idx}
                            className="branch-item"
                            onClick={() => setActiveBranchIndex(idx)}
                          >
                            🌿 {branch.topic}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mindmap-section">
                    {(() => {
                      const branch = (mindMapData.content || mindMapData.branches)[activeBranchIndex] || {}
                      return (
                        <>
                          <div className="branch-title">{branch.topic}</div>
                          {Array.isArray(branch.subtopics) && branch.subtopics.length > 0 ? (
                            <ul className="subtopics-list">
                              {branch.subtopics.map((s, i) => (
                                <li key={i}>• {typeof s === 'string' ? s : s?.topic || ''}</li>
                              ))}
                            </ul>
                          ) : (
                            <div className="empty-text">Alt konu bulunamadı.</div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Ders İçeriği Paneli */}
      {showLessonContent && extractedLessonData && (
        renderLessonContentPanel(extractedLessonData)
      )}

      {/* AI Öğretmen Seçici Modal */}
      <AITeacherSelector
        isOpen={showTeacherSelector}
        onClose={handleSkipTeacher}
        onTeacherSelected={handleTeacherSelected}
      />
    </div>
  )
}

export default PanoramicViewer 