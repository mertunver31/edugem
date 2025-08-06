import React, { useState } from 'react'
import './TestsPage.css'

// Import all test components
import PDFTestArea from '../../components/PDFTestArea/PDFTestArea'
import GeminiTestArea from '../../components/GeminiTestArea/GeminiTestArea'
import DocumentUnderstandingTest from '../../components/DocumentUnderstandingTest/DocumentUnderstandingTest'
import SegmentPlannerTest from '../../components/SegmentPlannerTest/SegmentPlannerTest'
import TaskQueueTest from '../../components/TaskQueueTest/TaskQueueTest'
import TextWorkerTest from '../../components/TextWorkerTest/TextWorkerTest'
import ImageWorkerTest from '../../components/ImageWorkerTest/ImageWorkerTest'
import ConcurrencyControlTest from '../../components/ConcurrencyControlTest/ConcurrencyControlTest'
import PDFPipelineTest from '../../components/PDFPipelineTest/PDFPipelineTest'
import CourseStructureTest from '../../components/CourseStructureTest/CourseStructureTest'
import CourseVisualIntegration from '../../components/CourseVisualIntegration/CourseVisualIntegration'
import EnhancedContentTest from '../../components/EnhancedContentTest/EnhancedContentTest'
import PDFExtractionTest from '../../components/PDFExtractionTest/PDFExtractionTest'
import FullPipelineTest from '../../components/FullPipelineTest/FullPipelineTest'
import GeminiEmbeddingTest from '../../components/GeminiEmbeddingTest/GeminiEmbeddingTest'
import RetrievalTest from '../../components/RetrievalTest/RetrievalTest'
import MindMapLearningPathTest from '../../components/MindMapLearningPathTest/MindMapLearningPathTest'
import PodcastTestArea from '../../components/PodcastTestArea/PodcastTestArea'

const TestsPage = () => {
  const [selectedTest, setSelectedTest] = useState(null)
  const [runningTest, setRunningTest] = useState(null)
  const [showDetails, setShowDetails] = useState(null)

  const tests = [
    {
      id: 'pdf-test',
      name: 'PDF Test',
      description: 'PDF dosyalarını işleme ve analiz testleri',
      icon: '📄',
      category: 'Document Processing'
    },
    {
      id: 'gemini-test',
      name: 'Gemini Test',
      description: 'Google Gemini AI entegrasyon testleri',
      icon: '🤖',
      category: 'AI Integration'
    },
    {
      id: 'document-understanding',
      name: 'Document Understanding',
      description: 'Belge anlama ve işleme testleri',
      icon: '🔍',
      category: 'AI Processing'
    },
    {
      id: 'segment-planner',
      name: 'Segment Planner',
      description: 'İçerik segmentasyonu ve planlama testleri',
      icon: '📋',
      category: 'Content Planning'
    },
    {
      id: 'task-queue',
      name: 'Task Queue',
      description: 'Görev kuyruğu yönetimi testleri',
      icon: '⚙️',
      category: 'System Management'
    },
    {
      id: 'text-worker',
      name: 'Text Worker',
      description: 'Metin işleme ve analiz testleri',
      icon: '📝',
      category: 'Text Processing'
    },
    {
      id: 'image-worker',
      name: 'Image Worker',
      description: 'Görsel işleme ve analiz testleri',
      icon: '🎨',
      category: 'Image Processing'
    },
    {
      id: 'concurrency-control',
      name: 'Concurrency Control',
      description: 'Eşzamanlı işlem kontrolü testleri',
      icon: '🔄',
      category: 'System Control'
    },
    {
      id: 'pdf-pipeline',
      name: 'PDF Pipeline',
      description: 'PDF işleme pipeline testleri',
      icon: '🚀',
      category: 'Document Processing'
    },
    {
      id: 'course-structure',
      name: 'Course Structure',
      description: 'Kurs yapısı oluşturma testleri',
      icon: '📚',
      category: 'Course Management'
    },
    {
      id: 'course-visual-integration',
      name: 'Course Visual Integration',
      description: 'Kurs görsel entegrasyon testleri',
      icon: '🎨',
      category: 'Visual Integration'
    },
    {
      id: 'enhanced-content',
      name: 'Enhanced Content',
      description: 'Gelişmiş içerik oluşturma testleri',
      icon: '🤖',
      category: 'Content Creation'
    },
    {
      id: 'pdf-extraction',
      name: 'PDF Extraction',
      description: 'PDF içerik çıkarma testleri',
      icon: '🔍',
      category: 'Document Processing'
    },
    {
      id: 'full-pipeline',
      name: 'Full Pipeline',
      description: 'Tam sistem pipeline testleri',
      icon: '🚀',
      category: 'System Integration'
    },
    {
      id: 'gemini-embedding-test',
      name: 'Gemini Embedding Test',
      description: 'Gemini embedding ve vektör testleri',
      icon: '🔧',
      category: 'AI Integration'
    },
    {
      id: 'retrieval-test',
      name: 'Retrieval Test',
      description: 'Bilgi geri getirme testleri',
      icon: '🔍',
      category: 'Information Retrieval'
    },
    {
      id: 'mind-map-learning-path-test',
      name: 'Mind Map & Learning Path Test',
      description: 'Zihin haritası ve öğrenme yolu testleri',
      icon: '🧠',
      category: 'Learning Analytics'
    },
    {
      id: 'podcast-test',
      name: 'Podcast TTS Test',
      description: 'Podcast ve metin-konuşma testleri',
      icon: '🎙️',
      category: 'Audio Processing'
    }
  ]

  const categories = [...new Set(tests.map(test => test.category))]

  // Detailed test information
  const testDetails = {
    'pdf-test': {
      title: 'PDF Test',
      description: 'PDF dosyalarını işleme ve analiz testleri',
      longDescription: 'Bu test, PDF dosyalarının yüklenmesi, işlenmesi ve analiz edilmesi süreçlerini kontrol eder. PDF içeriğinin metin olarak çıkarılması, sayfa sayısı tespiti, dosya boyutu kontrolü ve format doğrulaması gibi temel işlemleri test eder.',
      features: [
        'PDF dosyası yükleme ve doğrulama',
        'Metin içeriği çıkarma',
        'Sayfa sayısı ve boyut analizi',
        'Format uyumluluğu kontrolü',
        'Hata yönetimi ve raporlama'
      ],
      requirements: [
        'PDF dosyası (maksimum 10MB)',
        'Desteklenen formatlar: PDF 1.4+',
        'İnternet bağlantısı'
      ],
      estimatedTime: '2-5 dakika'
    },
    'gemini-test': {
      title: 'Gemini Test',
      description: 'Google Gemini AI entegrasyon testleri',
      longDescription: 'Google Gemini AI modelinin entegrasyonunu ve çalışma durumunu test eder. Metin üretimi, soru-cevap, içerik analizi ve AI destekli özelliklerin doğru çalışıp çalışmadığını kontrol eder.',
      features: [
        'AI model bağlantı testi',
        'Metin üretimi ve analizi',
        'Soru-cevap işlevselliği',
        'İçerik özetleme',
        'Çok dilli destek'
      ],
      requirements: [
        'Geçerli API anahtarı',
        'İnternet bağlantısı',
        'Gemini API erişimi'
      ],
      estimatedTime: '1-3 dakika'
    },
    'document-understanding': {
      title: 'Document Understanding',
      description: 'Belge anlama ve işleme testleri',
      longDescription: 'Belgelerin otomatik olarak anlaşılması ve işlenmesi için geliştirilmiş AI algoritmalarını test eder. Belge türü tespiti, içerik kategorizasyonu ve yapılandırılmış veri çıkarma işlemlerini kontrol eder.',
      features: [
        'Belge türü otomatik tespiti',
        'İçerik kategorizasyonu',
        'Yapılandırılmış veri çıkarma',
        'Anahtar kelime tespiti',
        'Belge özetleme'
      ],
      requirements: [
        'Belge dosyası (PDF, DOC, TXT)',
        'AI model erişimi',
        'İnternet bağlantısı'
      ],
      estimatedTime: '3-7 dakika'
    },
    'segment-planner': {
      title: 'Segment Planner',
      description: 'İçerik segmentasyonu ve planlama testleri',
      longDescription: 'Uzun içeriklerin otomatik olarak segmentlere ayrılması ve öğrenme planı oluşturulması işlemlerini test eder. İçerik analizi, konu tespiti ve öğrenme hedeflerine göre planlama yapar.',
      features: [
        'İçerik otomatik segmentasyonu',
        'Konu bazlı gruplandırma',
        'Öğrenme hedefi belirleme',
        'Zorluk seviyesi analizi',
        'Öğrenme yolu oluşturma'
      ],
      requirements: [
        'İçerik dosyası',
        'Öğrenme hedefleri',
        'Hedef kitle bilgisi'
      ],
      estimatedTime: '5-10 dakika'
    },
    'task-queue': {
      title: 'Task Queue',
      description: 'Görev kuyruğu yönetimi testleri',
      longDescription: 'Sistemdeki görev kuyruğu yönetimini ve işlem sıralamasını test eder. Görevlerin doğru sırayla işlenmesi, öncelik yönetimi ve hata durumlarında kurtarma işlemlerini kontrol eder.',
      features: [
        'Görev sıralama ve öncelik',
        'Eşzamanlı işlem yönetimi',
        'Hata kurtarma mekanizması',
        'İşlem durumu takibi',
        'Performans optimizasyonu'
      ],
      requirements: [
        'Sistem kaynakları',
        'Veritabanı bağlantısı',
        'Redis/Queue sistemi'
      ],
      estimatedTime: '2-4 dakika'
    },
    'text-worker': {
      title: 'Text Worker',
      description: 'Metin işleme ve analiz testleri',
      longDescription: 'Metin işleme algoritmalarının çalışmasını ve metin analizi özelliklerini test eder. Metin temizleme, tokenization, sentiment analizi ve dil tespiti işlemlerini kontrol eder.',
      features: [
        'Metin temizleme ve normalizasyon',
        'Tokenization ve parsing',
        'Sentiment analizi',
        'Dil tespiti',
        'Anahtar kelime çıkarma'
      ],
      requirements: [
        'Metin içeriği',
        'NLP kütüphaneleri',
        'İşlemci kaynakları'
      ],
      estimatedTime: '1-3 dakika'
    },
    'image-worker': {
      title: 'Image Worker',
      description: 'Görsel işleme ve analiz testleri',
      longDescription: 'Görsel işleme algoritmalarının ve görüntü analizi özelliklerini test eder. Görüntü optimizasyonu, nesne tespiti, OCR ve görsel içerik analizi işlemlerini kontrol eder.',
      features: [
        'Görüntü optimizasyonu',
        'Nesne ve yüz tespiti',
        'OCR (Optik Karakter Tanıma)',
        'Görsel içerik analizi',
        'Format dönüştürme'
      ],
      requirements: [
        'Görüntü dosyası',
        'CV kütüphaneleri',
        'GPU desteği (opsiyonel)'
      ],
      estimatedTime: '3-8 dakika'
    },
    'concurrency-control': {
      title: 'Concurrency Control',
      description: 'Eşzamanlı işlem kontrolü testleri',
      longDescription: 'Sistemdeki eşzamanlı işlemlerin kontrolünü ve çakışma önleme mekanizmalarını test eder. Race condition kontrolü, deadlock önleme ve kaynak paylaşımı işlemlerini kontrol eder.',
      features: [
        'Race condition tespiti',
        'Deadlock önleme',
        'Kaynak paylaşımı kontrolü',
        'İşlem senkronizasyonu',
        'Performans izleme'
      ],
      requirements: [
        'Çoklu işlem ortamı',
        'Sistem kaynakları',
        'Monitoring araçları'
      ],
      estimatedTime: '2-5 dakika'
    },
    'pdf-pipeline': {
      title: 'PDF Pipeline',
      description: 'PDF işleme pipeline testleri',
      longDescription: 'PDF dosyalarının end-to-end işleme sürecini test eder. Yükleme, analiz, içerik çıkarma, işleme ve sonuç üretme aşamalarının tamamını kontrol eder.',
      features: [
        'End-to-end PDF işleme',
        'Çok aşamalı pipeline',
        'Hata yönetimi',
        'İlerleme takibi',
        'Sonuç doğrulama'
      ],
      requirements: [
        'PDF dosyası',
        'Pipeline sistemi',
        'İşlem kaynakları'
      ],
      estimatedTime: '5-15 dakika'
    },
    'course-structure': {
      title: 'Course Structure',
      description: 'Kurs yapısı oluşturma testleri',
      longDescription: 'Otomatik kurs yapısı oluşturma algoritmalarını test eder. İçerik analizi, modül oluşturma, öğrenme hedefleri belirleme ve kurs planı oluşturma işlemlerini kontrol eder.',
      features: [
        'Otomatik kurs yapısı oluşturma',
        'Modül ve ünite planlama',
        'Öğrenme hedefleri belirleme',
        'İçerik organizasyonu',
        'Zorluk seviyesi ayarlama'
      ],
      requirements: [
        'Kurs içeriği',
        'Hedef kitle bilgisi',
        'Öğrenme hedefleri'
      ],
      estimatedTime: '10-20 dakika'
    },
    'course-visual-integration': {
      title: 'Course Visual Integration',
      description: 'Kurs görsel entegrasyon testleri',
      longDescription: 'Kurs içeriklerinin görsel öğelerle entegrasyonunu test eder. Görsel materyal ekleme, düzenleme, optimizasyon ve görsel-içerik uyumluluğunu kontrol eder.',
      features: [
        'Görsel materyal entegrasyonu',
        'Görsel optimizasyonu',
        'İçerik-görsel uyumluluğu',
        'Responsive tasarım',
        'Görsel kalite kontrolü'
      ],
      requirements: [
        'Kurs içeriği',
        'Görsel materyaller',
        'Tasarım araçları'
      ],
      estimatedTime: '5-12 dakika'
    },
    'enhanced-content': {
      title: 'Enhanced Content',
      description: 'Gelişmiş içerik oluşturma testleri',
      longDescription: 'AI destekli gelişmiş içerik oluşturma özelliklerini test eder. İçerik zenginleştirme, interaktif öğeler ekleme, multimedya entegrasyonu ve kişiselleştirme işlemlerini kontrol eder.',
      features: [
        'AI destekli içerik zenginleştirme',
        'İnteraktif öğeler',
        'Multimedya entegrasyonu',
        'Kişiselleştirme',
        'İçerik adaptasyonu'
      ],
      requirements: [
        'Temel içerik',
        'AI model erişimi',
        'Multimedya kaynakları'
      ],
      estimatedTime: '8-15 dakika'
    },
    'pdf-extraction': {
      title: 'PDF Extraction',
      description: 'PDF içerik çıkarma testleri',
      longDescription: 'PDF dosyalarından yapılandırılmış veri çıkarma işlemlerini test eder. Tablo çıkarma, form verisi analizi, yapılandırılmış içerik tespiti ve veri dönüştürme işlemlerini kontrol eder.',
      features: [
        'Yapılandırılmış veri çıkarma',
        'Tablo ve form analizi',
        'Veri dönüştürme',
        'Format koruma',
        'Veri doğrulama'
      ],
      requirements: [
        'PDF dosyası',
        'Çıkarma şablonları',
        'Veri doğrulama kuralları'
      ],
      estimatedTime: '3-8 dakika'
    },
    'full-pipeline': {
      title: 'Full Pipeline',
      description: 'Tam sistem pipeline testleri',
      longDescription: 'Sistemin tüm bileşenlerinin entegre çalışmasını test eder. PDF yükleme, içerik analizi, AI işleme, kurs oluşturma ve sonuç üretme süreçlerinin tamamını kontrol eder.',
      features: [
        'End-to-end sistem testi',
        'Tüm bileşen entegrasyonu',
        'Performans optimizasyonu',
        'Hata yönetimi',
        'Sonuç doğrulama'
      ],
      requirements: [
        'Tüm sistem bileşenleri',
        'Test verileri',
        'Monitoring sistemi'
      ],
      estimatedTime: '15-30 dakika'
    },
    'gemini-embedding-test': {
      title: 'Gemini Embedding Test',
      description: 'Gemini embedding ve vektör testleri',
      longDescription: 'Gemini AI modelinin embedding özelliklerini ve vektör tabanlı işlemleri test eder. Metin vektörleştirme, benzerlik hesaplama, semantic arama ve vektör veritabanı işlemlerini kontrol eder.',
      features: [
        'Metin vektörleştirme',
        'Benzerlik hesaplama',
        'Semantic arama',
        'Vektör veritabanı işlemleri',
        'Embedding optimizasyonu'
      ],
      requirements: [
        'Gemini API erişimi',
        'Vektör veritabanı',
        'Test metinleri'
      ],
      estimatedTime: '2-6 dakika'
    },
    'retrieval-test': {
      title: 'Retrieval Test',
      description: 'Bilgi geri getirme testleri',
      longDescription: 'Bilgi geri getirme sisteminin çalışmasını test eder. Semantic arama, ilgili içerik bulma, ranking algoritmaları ve arama sonuçlarının kalitesini kontrol eder.',
      features: [
        'Semantic arama',
        'İlgili içerik bulma',
        'Ranking algoritmaları',
        'Arama sonuç kalitesi',
        'Performans optimizasyonu'
      ],
      requirements: [
        'Arama indeksi',
        'Test sorguları',
        'Relevance verileri'
      ],
      estimatedTime: '3-7 dakika'
    },
    'mind-map-learning-path-test': {
      title: 'Mind Map & Learning Path Test',
      description: 'Zihin haritası ve öğrenme yolu testleri',
      longDescription: 'Zihin haritası oluşturma ve öğrenme yolu planlama algoritmalarını test eder. Kavram ilişkilendirme, görsel harita oluşturma, öğrenme sırası belirleme ve adaptif yol planlama işlemlerini kontrol eder.',
      features: [
        'Kavram ilişkilendirme',
        'Görsel zihin haritası',
        'Öğrenme sırası belirleme',
        'Adaptif yol planlama',
        'İlerleme takibi'
      ],
      requirements: [
        'Kurs içeriği',
        'Öğrenci profili',
        'Öğrenme hedefleri'
      ],
      estimatedTime: '8-15 dakika'
    },
    'podcast-test': {
      title: 'Podcast TTS Test',
      description: 'Podcast ve metin-konuşma testleri',
      longDescription: 'Metin-konuşma (TTS) dönüşümü ve podcast oluşturma özelliklerini test eder. Ses kalitesi, doğal konuşma, çok dilli destek ve ses dosyası optimizasyonu işlemlerini kontrol eder.',
      features: [
        'Metin-konuşma dönüşümü',
        'Doğal konuşma sentezi',
        'Çok dilli destek',
        'Ses kalitesi optimizasyonu',
        'Podcast formatı oluşturma'
      ],
      requirements: [
        'Metin içeriği',
        'TTS servisi',
        'Ses işleme araçları'
      ],
      estimatedTime: '5-12 dakika'
    }
  }

  // Test component mapping
  const testComponents = {
    'pdf-test': PDFTestArea,
    'gemini-test': GeminiTestArea,
    'document-understanding': DocumentUnderstandingTest,
    'segment-planner': SegmentPlannerTest,
    'task-queue': TaskQueueTest,
    'text-worker': TextWorkerTest,
    'image-worker': ImageWorkerTest,
    'concurrency-control': ConcurrencyControlTest,
    'pdf-pipeline': PDFPipelineTest,
    'course-structure': CourseStructureTest,
    'course-visual-integration': CourseVisualIntegration,
    'enhanced-content': EnhancedContentTest,
    'pdf-extraction': PDFExtractionTest,
    'full-pipeline': FullPipelineTest,
    'gemini-embedding-test': GeminiEmbeddingTest,
    'retrieval-test': RetrievalTest,
    'mind-map-learning-path-test': MindMapLearningPathTest,
    'podcast-test': PodcastTestArea
  }

  const handleTestClick = (test) => {
    setSelectedTest(test)
  }

  const handleRunTest = (testId) => {
    setRunningTest(testId)
  }

  const handleCloseTest = () => {
    setRunningTest(null)
  }

  const handleShowDetails = (testId) => {
    setShowDetails(testId)
  }

  const handleCloseDetails = () => {
    setShowDetails(null)
  }

  // If a test is running, show the test component
  if (runningTest) {
    const TestComponent = testComponents[runningTest]
    const currentTest = tests.find(test => test.id === runningTest)
    
    return (
      <div className="test-runner-page">
        <div className="test-runner-header">
          <button className="back-btn" onClick={handleCloseTest}>
            ← Geri Dön
          </button>
          <h1>{currentTest?.icon} {currentTest?.name}</h1>
          <p>{currentTest?.description}</p>
        </div>
        <div className="test-runner-content">
          <TestComponent />
        </div>
      </div>
    )
  }

  // Show the test selection interface
  return (
    <div className="tests-page">
      <div className="tests-header">
        <h1>🧪 Sistem Testleri</h1>
        <p>Tüm sistem testlerini görüntüleyin ve çalıştırın</p>
      </div>

      <div className="tests-container">
        <div className="tests-sidebar">
          <h3>Kategoriler</h3>
          <div className="category-filters">
            <button 
              className={`category-btn ${!selectedTest ? 'active' : ''}`}
              onClick={() => setSelectedTest(null)}
            >
              Tümü ({tests.length})
            </button>
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${selectedTest?.category === category ? 'active' : ''}`}
                onClick={() => setSelectedTest(tests.find(t => t.category === category))}
              >
                {category} ({tests.filter(t => t.category === category).length})
              </button>
            ))}
          </div>
        </div>

        <div className="tests-grid">
          {tests
            .filter(test => !selectedTest || test.category === selectedTest.category)
            .map(test => (
              <div key={test.id} className="test-card">
                <div className="test-card-header">
                  <span className="test-icon">{test.icon}</span>
                  <span className="test-category">{test.category}</span>
                </div>
                <div className="test-card-content">
                  <h3 className="test-name">{test.name}</h3>
                  <p className="test-description">{test.description}</p>
                </div>
                <div className="test-card-actions">
                  <button 
                    className="run-test-btn"
                    onClick={() => handleRunTest(test.id)}
                  >
                    ▶️ Çalıştır
                  </button>
                  <button 
                    className="view-details-btn"
                    onClick={() => handleShowDetails(test.id)}
                  >
                    📋 Detaylar
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Test Details Modal */}
      {showDetails && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{testDetails[showDetails]?.title}</h2>
              <button className="modal-close-btn" onClick={handleCloseDetails}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>📝 Açıklama</h3>
                <p>{testDetails[showDetails]?.longDescription}</p>
              </div>
              
              <div className="detail-section">
                <h3>✨ Özellikler</h3>
                <ul>
                  {testDetails[showDetails]?.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
              
              <div className="detail-section">
                <h3>📋 Gereksinimler</h3>
                <ul>
                  {testDetails[showDetails]?.requirements.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </div>
              
              <div className="detail-section">
                <h3>⏱️ Tahmini Süre</h3>
                <p className="estimated-time">{testDetails[showDetails]?.estimatedTime}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="run-test-from-modal-btn"
                onClick={() => {
                  handleCloseDetails()
                  handleRunTest(showDetails)
                }}
              >
                ▶️ Testi Çalıştır
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestsPage 