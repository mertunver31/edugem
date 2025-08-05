import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * 3D Force Graph Service
 * Mind map ve learning path'i 3D olarak görselleştirme
 */
class ForceGraph3DService {
  constructor() {
    this.scene = null
    this.camera = null
    this.renderer = null
    this.controls = null
    this.container = null
    this.nodes = []
    this.links = []
    this.animationId = null
  }

  /**
   * Mind map'i 3D olarak görselleştir
   * @param {Object} mindMapData - Mind map verisi
   * @param {HTMLElement} container - Container elementi
   * @returns {Object} Graph instance
   */
  createMindMap3D(mindMapData, container) {
    try {
      console.log('🧠 Mind map 3D görselleştirme başlatılıyor:', mindMapData)

      // Container'ı temizle
      if (container) {
        container.innerHTML = ''
        this.container = container
      }

      // Graph verisini hazırla
      const graphData = this.convertMindMapToGraphData(mindMapData)
      console.log('📊 Graph verisi hazırlandı:', graphData)

      // 3D scene oluştur
      this.create3DScene(container, graphData)

      console.log('✅ Mind map 3D görselleştirme tamamlandı')
      return this

    } catch (error) {
      console.error('❌ Mind map 3D görselleştirme hatası:', error)
      throw error
    }
  }

  /**
   * Learning path'i 3D olarak görselleştir
   * @param {Object} learningPathData - Learning path verisi
   * @param {HTMLElement} container - Container elementi
   * @returns {Object} Graph instance
   */
  createLearningPath3D(learningPathData, container) {
    try {
      console.log('🛤️ Learning path 3D görselleştirme başlatılıyor:', learningPathData)

      // Container'ı temizle
      if (container) {
        container.innerHTML = ''
        this.container = container
      }

      // Graph verisini hazırla
      const graphData = this.convertLearningPathToGraphData(learningPathData)
      console.log('📊 Learning path graph verisi hazırlandı:', graphData)

      // 3D scene oluştur
      this.create3DScene(container, graphData)

      console.log('✅ Learning path 3D görselleştirme tamamlandı')
      return this

    } catch (error) {
      console.error('❌ Learning path 3D görselleştirme hatası:', error)
      throw error
    }
  }

  /**
   * 3D scene oluştur
   * @param {HTMLElement} container - Container
   * @param {Object} graphData - Graph verisi
   */
  create3DScene(container, graphData) {
    // Scene oluştur
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000000)

    // Camera oluştur
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 0, 50)

    // Renderer oluştur
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(this.renderer.domElement)

    // Controls ekle
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05

    // Işıklandırma ekle
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    this.scene.add(directionalLight)

    // Node'ları oluştur
    this.createNodes(graphData.nodes)

    // Link'leri oluştur
    this.createLinks(graphData.links)

    // Animation loop başlat
    this.animate()

    // Resize handler ekle
    window.addEventListener('resize', () => this.onWindowResize())
  }

  /**
   * Node'ları oluştur
   * @param {Array} nodes - Node verileri
   */
  createNodes(nodes) {
    this.nodes = []
    nodes.forEach((nodeData, index) => {
      // Küre geometrisi oluştur
      const geometry = new THREE.SphereGeometry(nodeData.size, 16, 16)
      const material = new THREE.MeshLambertMaterial({ color: nodeData.color })
      const sphere = new THREE.Mesh(geometry, material)

      // Pozisyonu rastgele ayarla
      const angle = (index / nodes.length) * Math.PI * 2
      const radius = 20
      sphere.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.5,
        0
      )

      // Node verisini sakla
      sphere.userData = nodeData
      this.nodes.push(sphere)
      this.scene.add(sphere)

      // Text label ekle
      this.addTextLabel(sphere, nodeData.label)
    })
  }

  /**
   * Link'leri oluştur
   * @param {Array} links - Link verileri
   */
  createLinks(links) {
    this.links = []
    links.forEach(linkData => {
      const sourceNode = this.nodes.find(n => n.userData.id === linkData.source)
      const targetNode = this.nodes.find(n => n.userData.id === linkData.target)

      if (sourceNode && targetNode) {
        // Çizgi geometrisi oluştur
        const geometry = new THREE.BufferGeometry().setFromPoints([
          sourceNode.position,
          targetNode.position
        ])
        const material = new THREE.LineBasicMaterial({ color: linkData.color })
        const line = new THREE.Line(geometry, material)

        this.links.push(line)
        this.scene.add(line)
      }
    })
  }

  /**
   * Text label ekle
   * @param {Object} node - Node objesi
   * @param {string} text - Label metni
   */
  addTextLabel(node, text) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 256
    canvas.height = 64

    context.fillStyle = '#ffffff'
    context.font = 'bold 16px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(text, canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(spriteMaterial)

    sprite.scale.set(10, 2.5, 1)
    sprite.position.copy(node.position)
    sprite.position.y += node.userData.size + 2

    this.scene.add(sprite)
  }

  /**
   * Animation loop
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate())

    // Node'ları hareket ettir
    this.nodes.forEach((node, index) => {
      const time = Date.now() * 0.001
      const angle = (index / this.nodes.length) * Math.PI * 2 + time * 0.5
      const radius = 20 + Math.sin(time + index) * 5

      node.position.x = Math.cos(angle) * radius
      node.position.y = Math.sin(angle) * radius * 0.5
      node.position.z = Math.sin(time + index) * 5

      // Rotation ekle
      node.rotation.x += 0.01
      node.rotation.y += 0.01
    })

    // Link'leri güncelle
    this.links.forEach((link, index) => {
      const linkData = this.links[index]
      if (linkData && linkData.geometry) {
        const positions = linkData.geometry.attributes.position.array
        const sourceNode = this.nodes.find(n => n.userData.id === linkData.userData?.source)
        const targetNode = this.nodes.find(n => n.userData.id === linkData.userData?.target)

        if (sourceNode && targetNode) {
          positions[0] = sourceNode.position.x
          positions[1] = sourceNode.position.y
          positions[2] = sourceNode.position.z
          positions[3] = targetNode.position.x
          positions[4] = targetNode.position.y
          positions[5] = targetNode.position.z
          linkData.geometry.attributes.position.needsUpdate = true
        }
      }
    })

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Window resize handler
   */
  onWindowResize() {
    if (this.camera && this.renderer && this.container) {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    }
  }

  /**
   * Mind map verisini graph verisine dönüştür
   * @param {Object} mindMapData - Mind map verisi
   * @returns {Object} Graph verisi
   */
  convertMindMapToGraphData(mindMapData) {
    const nodes = []
    const links = []
    let nodeId = 0

         // Merkez konu
     const centralTopic = {
       id: nodeId++,
       label: mindMapData.central_topic || mindMapData.centralTopic || 'Merkez Konu',
       color: '#ff6b6b',
       size: 3,
       type: 'central',
       level: 0
     }
     nodes.push(centralTopic)

         // Ana dallar
     const branches = mindMapData.content || mindMapData.branches
     if (branches && Array.isArray(branches)) {
       branches.forEach((branch, branchIndex) => {
        const branchNode = {
          id: nodeId++,
          label: branch.topic || `Dal ${branchIndex + 1}`,
          color: this.getBranchColor(branchIndex),
          size: 2,
          type: 'branch',
          level: 1,
          branchIndex
        }
        nodes.push(branchNode)

        // Merkez konu ile bağlantı
        links.push({
          source: centralTopic.id,
          target: branchNode.id,
          label: 'ana dal',
          color: '#ffffff'
        })

        // Alt konular
        if (branch.subtopics && Array.isArray(branch.subtopics)) {
          branch.subtopics.forEach((subtopic, subtopicIndex) => {
            const subtopicNode = {
              id: nodeId++,
              label: subtopic.topic || `Alt Konu ${subtopicIndex + 1}`,
              color: this.getSubtopicColor(branchIndex, subtopicIndex),
              size: 1.5,
              type: 'subtopic',
              level: 2,
              branchIndex,
              subtopicIndex
            }
            nodes.push(subtopicNode)

            // Ana dal ile bağlantı
            links.push({
              source: branchNode.id,
              target: subtopicNode.id,
              label: 'alt konu',
              color: '#cccccc'
            })
          })
        }
      })
    }

    return { nodes, links }
  }

  /**
   * Learning path verisini graph verisine dönüştür
   * @param {Object} learningPathData - Learning path verisi
   * @returns {Object} Graph verisi
   */
  convertLearningPathToGraphData(learningPathData) {
    const nodes = []
    const links = []
    let nodeId = 0

    // Başlangıç noktası
    const startNode = {
      id: nodeId++,
      label: 'Başlangıç',
      color: '#4ecdc4',
      size: 2.5,
      type: 'start',
      level: 0
    }
    nodes.push(startNode)

    // Adımlar
    if (learningPathData.steps && Array.isArray(learningPathData.steps)) {
      learningPathData.steps.forEach((step, stepIndex) => {
        const stepNode = {
          id: nodeId++,
          label: step.title || `Adım ${stepIndex + 1}`,
          color: this.getStepColor(stepIndex, learningPathData.steps.length),
          size: 2,
          type: 'step',
          level: stepIndex + 1,
          stepIndex,
          description: step.description,
          duration: step.duration,
          difficulty: step.difficulty
        }
        nodes.push(stepNode)

        // Önceki adım ile bağlantı
        const sourceNode = stepIndex === 0 ? startNode : nodes[nodes.length - 2]
        links.push({
          source: sourceNode.id,
          target: stepNode.id,
          label: step.title || `Adım ${stepIndex + 1}`,
          color: '#ffffff'
        })
      })
    }

    // Bitiş noktası
    const endNode = {
      id: nodeId++,
      label: 'Hedef',
      color: '#ff6b6b',
      size: 2.5,
      type: 'end',
      level: learningPathData.steps ? learningPathData.steps.length + 1 : 1
    }
    nodes.push(endNode)

    // Son adım ile bitiş arası bağlantı
    if (nodes.length > 2) {
      links.push({
        source: nodes[nodes.length - 2].id,
        target: endNode.id,
        label: 'tamamlandı',
        color: '#ff6b6b'
      })
    }

    return { nodes, links }
  }

  /**
   * Dal rengi al
   * @param {number} index - Dal indeksi
   * @returns {string} Renk
   */
  getBranchColor(index) {
    const colors = ['#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8']
    return colors[index % colors.length]
  }

  /**
   * Alt konu rengi al
   * @param {number} branchIndex - Dal indeksi
   * @param {number} subtopicIndex - Alt konu indeksi
   * @returns {string} Renk
   */
  getSubtopicColor(branchIndex, subtopicIndex) {
    const baseColor = this.getBranchColor(branchIndex)
    return this.lightenColor(baseColor, 0.3)
  }

  /**
   * Adım rengi al
   * @param {number} stepIndex - Adım indeksi
   * @param {number} totalSteps - Toplam adım sayısı
   * @returns {string} Renk
   */
  getStepColor(stepIndex, totalSteps) {
    const progress = stepIndex / (totalSteps - 1)
    const colors = ['#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#ff6b6b']
    const colorIndex = Math.floor(progress * (colors.length - 1))
    return colors[colorIndex]
  }

  /**
   * Rengi açık yap
   * @param {string} hex - Hex renk
   * @param {number} percent - Açık yapma yüzdesi
   * @returns {string} Açık renk
   */
  lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent * 100)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  }

  /**
   * Graph'ı temizle
   */
  cleanup() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }

    if (this.controls) {
      this.controls.dispose()
      this.controls = null
    }

    if (this.scene) {
      // Scene'deki tüm objeleri temizle
      while (this.scene.children.length > 0) {
        const child = this.scene.children[0]
        this.scene.remove(child)
        
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
      }
      this.scene = null
    }

    if (this.container) {
      this.container.innerHTML = ''
      this.container = null
    }

    this.nodes = []
    this.links = []
  }

  /**
   * Graph'ı yeniden boyutlandır
   */
  resize() {
    this.onWindowResize()
  }
}

export default new ForceGraph3DService() 