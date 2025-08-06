import * as THREE from 'three'
import ForceGraph3D from '../lib/3d-force-graph/index.js'
import '../lib/3d-force-graph/3d-force-graph.css'

/**
 * 3D Force Graph Service
 * Mind map ve learning path'i 3D olarak görselleştirme
 */
class ForceGraph3DService {
  constructor() {
    this.graph = null
    this.container = null
    this.currentData = null
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

      // Önceki graph'ı temizle
      this.cleanup()

      // Container'ı ayarla
      this.container = container
      if (container) {
        container.innerHTML = ''
      }

      // Graph verisini hazırla
      const graphData = this.convertMindMapToGraphData(mindMapData)
      console.log('📊 Graph verisi hazırlandı:', graphData)

      // 3D Force Graph oluştur
      this.graph = ForceGraph3D()
        .graphData(graphData)
        .nodeColor('color')
        .nodeLabel('label')
        .nodeRelSize(6)
        .linkColor('color')
        .linkWidth(2)
        .linkOpacity(0.6)
        .enableNodeDrag(true)
        .enableNavigationControls(true)
        .backgroundColor('#000000')
        .showNavInfo(false)
        .onNodeDragEnd(node => {
          // Node sürüklendikten sonra pozisyonunu sabitle
          node.fx = node.x
          node.fy = node.y
          node.fz = node.z
          console.log('Node pozisyonu sabitlendi:', node.label, 'x:', node.x, 'y:', node.y, 'z:', node.z)
        })
        .nodeThreeObject(node => {
          // Küre oluştur
          const sphereGeometry = new THREE.SphereGeometry(node.size || 3, 16, 16)
          const sphereMaterial = new THREE.MeshBasicMaterial({ 
            color: node.color || '#ffffff',
            transparent: true,
            opacity: 0.8
          })
          const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
          
          // Text sprite oluştur
          const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this.createTextTexture(node.label, node.color),
            transparent: true,
            opacity: 1.0 // Tam opaklık
          }))
          sprite.scale.set(60, 35, 1) // Boyutları çok daha büyüttük
          sprite.position.y = 25 // Kürenin üstünde daha yüksekte
          
          // Küre ve sprite'ı bir grup içinde birleştir
          const group = new THREE.Group()
          group.add(sphere)
          group.add(sprite)
          
          return group
        })
        .onNodeClick(node => {
          console.log('Node tıklandı:', node)
        })
        .onLinkClick(link => {
          console.log('Link tıklandı:', link)
        })

      // Container'a ekle
      this.graph(container)

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

      // Önceki graph'ı temizle
      this.cleanup()

      // Container'ı ayarla
      this.container = container
      if (container) {
        container.innerHTML = ''
      }

      // Graph verisini hazırla
      const graphData = this.convertLearningPathToGraphData(learningPathData)
      console.log('📊 Learning path graph verisi hazırlandı:', graphData)

      // 3D Force Graph oluştur
      this.graph = ForceGraph3D()
        .graphData(graphData)
        .nodeColor('color')
        .nodeLabel('label')
        .nodeRelSize(6)
        .linkColor('color')
        .linkWidth(2)
        .linkOpacity(0.6)
        .enableNodeDrag(true)
        .enableNavigationControls(true)
        .backgroundColor('#000000')
        .showNavInfo(false)
        .onNodeDragEnd(node => {
          // Node sürüklendikten sonra pozisyonunu sabitle
          node.fx = node.x
          node.fy = node.y
          node.fz = node.z
          console.log('Node pozisyonu sabitlendi:', node.label, 'x:', node.x, 'y:', node.y, 'z:', node.z)
        })
        .nodeThreeObject(node => {
          // Küre oluştur
          const sphereGeometry = new THREE.SphereGeometry(node.size || 3, 16, 16)
          const sphereMaterial = new THREE.MeshBasicMaterial({ 
            color: node.color || '#ffffff',
            transparent: true,
            opacity: 0.8
          })
          const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
          
          // Text sprite oluştur
          const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this.createTextTexture(node.label, node.color),
            transparent: true,
            opacity: 1.0 // Tam opaklık
          }))
          sprite.scale.set(60, 35, 1) // Boyutları çok daha büyüttük
          sprite.position.y = 25 // Kürenin üstünde daha yüksekte
          
          // Küre ve sprite'ı bir grup içinde birleştir
          const group = new THREE.Group()
          group.add(sphere)
          group.add(sprite)
          
          return group
        })
        .onNodeClick(node => {
          console.log('Node tıklandı:', node)
        })
        .onLinkClick(link => {
          console.log('Link tıklandı:', link)
        })

      // Container'a ekle
      this.graph(container)

      console.log('✅ Learning path 3D görselleştirme tamamlandı')
      return this

    } catch (error) {
      console.error('❌ Learning path 3D görselleştirme hatası:', error)
      throw error
    }
  }

  /**
   * Mind map verisini graph verisine dönüştür
   * @param {Object} mindMapData - Mind map verisi
   * @returns {Object} Graph verisi
   */
  convertMindMapToGraphData(mindMapData) {
    console.log('🧠 Mind map verisi dönüştürülüyor:', mindMapData)
    
    const nodes = []
    const links = []
    let nodeId = 0

    // Ana konu (topic)
    const centralTopic = {
      id: nodeId++,
      label: mindMapData.topic || mindMapData.central_topic || mindMapData.centralTopic || 'Merkez Konu',
      color: '#ff6b6b',
      size: 3,
      type: 'central',
      level: 0,
      importance: mindMapData.importance || 1.0
    }
    nodes.push(centralTopic)
    console.log('✅ Ana konu eklendi:', centralTopic)

    // Alt konular (subtopics)
    let subtopics = null
    if (mindMapData.subtopics && Array.isArray(mindMapData.subtopics)) {
      subtopics = mindMapData.subtopics
    } else if (mindMapData.content && Array.isArray(mindMapData.content)) {
      subtopics = mindMapData.content
    } else if (mindMapData.branches && Array.isArray(mindMapData.branches)) {
      subtopics = mindMapData.branches
    } else if (typeof mindMapData.subtopics === 'string') {
      try {
        const parsedSubtopics = JSON.parse(mindMapData.subtopics)
        if (Array.isArray(parsedSubtopics)) {
          subtopics = parsedSubtopics
        }
      } catch (e) {
        console.warn('⚠️ Subtopics JSON parse edilemedi:', e)
      }
    }

    console.log('📊 Bulunan alt konular:', subtopics)

    if (subtopics && Array.isArray(subtopics)) {
      subtopics.forEach((subtopic, subtopicIndex) => {
        console.log(`🔄 Alt konu ${subtopicIndex} işleniyor:`, subtopic)
        
        // Eğer subtopic string ise, object'e çevir
        let subtopicData = subtopic
        if (typeof subtopic === 'string') {
          subtopicData = {
            topic: subtopic,
            title: subtopic,
            name: subtopic
          }
        }
        
        const subtopicNode = {
          id: nodeId++,
          label: subtopicData.topic || subtopicData.title || subtopicData.name || subtopic || `Alt Konu ${subtopicIndex + 1}`,
          color: this.getBranchColor(subtopicIndex),
          size: 2,
          type: 'subtopic',
          level: 1,
          subtopicIndex,
          importance: subtopicData.importance || 0.5
        }
        nodes.push(subtopicNode)
        console.log('✅ Alt konu node eklendi:', subtopicNode)

        // Ana konu ile bağlantı
        links.push({
          source: centralTopic.id,
          target: subtopicNode.id,
          label: 'alt konu',
          color: '#ffffff'
        })
      })
    }

    // Bağlantılar (connections)
    let connections = null
    if (mindMapData.connections && Array.isArray(mindMapData.connections)) {
      connections = mindMapData.connections
    } else if (typeof mindMapData.connections === 'string') {
      try {
        const parsedConnections = JSON.parse(mindMapData.connections)
        if (Array.isArray(parsedConnections)) {
          connections = parsedConnections
        }
      } catch (e) {
        console.warn('⚠️ Connections JSON parse edilemedi:', e)
      }
    }

    console.log('🔗 Bulunan bağlantılar:', connections)

    if (connections && Array.isArray(connections)) {
      connections.forEach((connection, connectionIndex) => {
        console.log(`🔄 Bağlantı ${connectionIndex} işleniyor:`, connection)
        
        // Eğer connection string ise, object'e çevir
        let connectionData = connection
        if (typeof connection === 'string') {
          connectionData = {
            topic: connection,
            title: connection,
            name: connection
          }
        }
        
        const connectionNode = {
          id: nodeId++,
          label: connectionData.topic || connectionData.title || connectionData.name || connection || `Bağlantı ${connectionIndex + 1}`,
          color: this.getSubtopicColor(connectionIndex, 0),
          size: 1.5,
          type: 'connection',
          level: 2,
          connectionIndex,
          importance: connectionData.importance || 0.3
        }
        nodes.push(connectionNode)
        console.log('✅ Bağlantı node eklendi:', connectionNode)

        // En yakın alt konu ile bağlantı (veya ana konu ile)
        const targetNode = subtopics && subtopics.length > 0 ? 
          nodes.find(n => n.type === 'subtopic' && n.subtopicIndex === (connectionIndex % subtopics.length)) : 
          centralTopic
        
        if (targetNode) {
          links.push({
            source: targetNode.id,
            target: connectionNode.id,
            label: 'bağlantı',
            color: '#cccccc'
          })
        }
      })
    }

    const result = { nodes, links }
    console.log('🎯 Mind map graph verisi oluşturuldu:', result)
    return result
  }

  /**
   * Learning path verisini graph verisine dönüştür
   * @param {Object} learningPathData - Learning path verisi
   * @returns {Object} Graph verisi
   */
  convertLearningPathToGraphData(learningPathData) {
    console.log('🛤️ Learning path verisi dönüştürülüyor:', learningPathData)
    
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
    console.log('✅ Başlangıç node eklendi:', startNode)

    // Adımlar
    let steps = null
    if (learningPathData.steps && Array.isArray(learningPathData.steps)) {
      steps = learningPathData.steps
    } else if (typeof learningPathData.steps === 'string') {
      try {
        const parsedSteps = JSON.parse(learningPathData.steps)
        if (Array.isArray(parsedSteps)) {
          steps = parsedSteps
        }
      } catch (e) {
        console.warn('⚠️ Steps JSON parse edilemedi:', e)
      }
    }

    console.log('📊 Bulunan adımlar:', steps)

    if (steps && Array.isArray(steps)) {
      steps.forEach((step, stepIndex) => {
        console.log(`🔄 Adım ${stepIndex} işleniyor:`, step)
        
        const stepNode = {
          id: nodeId++,
          label: step.title || step.name || step.description || `Adım ${stepIndex + 1}`,
          color: this.getStepColor(stepIndex, steps.length),
          size: 2,
          type: 'step',
          level: stepIndex + 1,
          stepIndex,
          description: step.description,
          duration: step.duration,
          difficulty: step.difficulty
        }
        nodes.push(stepNode)
        console.log('✅ Adım node eklendi:', stepNode)

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
      level: steps ? steps.length + 1 : 1
    }
    nodes.push(endNode)
    console.log('✅ Bitiş node eklendi:', endNode)

    // Son adım ile bitiş arası bağlantı
    if (nodes.length > 2) {
      links.push({
        source: nodes[nodes.length - 2].id,
        target: endNode.id,
        label: 'tamamlandı',
        color: '#ff6b6b'
      })
    }

    const result = { nodes, links }
    console.log('🎯 Learning path graph verisi oluşturuldu:', result)
    return result
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
   * Text'i 3D sprite'a dönüştür
   * @param {string} text - Sprite'a dönüştürülecek metin
   * @param {string} color - Sprite rengi (hex)
   * @returns {THREE.Texture} Sprite'ın textürü
   */
  createTextTexture(text, color) {
    const canvas = document.createElement('canvas')
    const padding = 40
    const fontSize = 48 // Font boyutunu çok daha büyüttük
    const ctx = canvas.getContext('2d')
    
    // Çok yüksek çözünürlük için 4x scale
    const scale = 4 // 4x çözünürlük artırımı
    
    // Text boyutunu hesapla
    ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`
    const textMetrics = ctx.measureText(text)
    const textWidth = textMetrics.width
    const textHeight = fontSize
    
    // Canvas boyutunu ayarla (çok yüksek çözünürlük)
    canvas.width = (textWidth + padding * 2) * scale
    canvas.height = (textHeight + padding * 2) * scale
    
    // Context'i scale et
    ctx.scale(scale, scale)
    
    // Anti-aliasing için
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    // Arka plan (daha koyu)
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale)
    
    // İç arka plan (node rengi)
    ctx.fillStyle = color
    ctx.fillRect(5, 5, (canvas.width / scale) - 10, (canvas.height / scale) - 10)
    
    // Border (daha kalın)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 6
    ctx.strokeRect(3, 3, (canvas.width / scale) - 6, (canvas.height / scale) - 6)
    
    // Text (daha net ve kontrastlı)
    ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`
    ctx.fillStyle = '#000000' // Siyah text daha okunabilir
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, (canvas.width / scale) / 2, (canvas.height / scale) / 2)

    const texture = new THREE.Texture(canvas)
    texture.needsUpdate = true
    return texture
  }

  /**
   * Graph'ı temizle
   */
  cleanup() {
    if (this.graph) {
      try {
        this.graph._destructor()
      } catch (error) {
        console.log('Graph destructor hatası:', error)
      }
      this.graph = null
    }

    // Container'ı da temizle - tam temizlik için
    if (this.container) {
      this.container.innerHTML = ''
      this.container = null
    }

    this.currentData = null
    console.log('ForceGraph3DService tamamen temizlendi')
  }

  /**
   * Graph'ı yeniden boyutlandır
   */
  resize() {
    if (this.graph) {
      this.graph.resize()
    }
  }
}

export default new ForceGraph3DService()
