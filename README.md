# 🎓 **EduGems - AI-Powered Educational Platform**

> **Modüler yapıda geliştirilmiş, AI destekli eğitim platformu**
> 
> PDF'leri otomatik analiz eden, segment'lere bölen ve öğrenme materyallerine dönüştüren modern web uygulaması.

<!-- Test commit - GitHub push testi -->

## 🌟 **Özellikler**

### 📚 **PDF İşleme & AI Entegrasyonu**
- **PDF Upload & Analysis**: Google Gemini AI ile otomatik PDF analizi
- **Document Understanding**: Başlık yapısı, sayfa numaraları ve içerik türü tespiti
- **Segment Planning**: PDF'leri öğrenme segmentlerine otomatik bölümleme
- **Smart Validation**: Overlap kontrolü, boşluk tespiti ve segment birleştirme

### 🎭 **Avatar Sistemi**
- **Ready Player Me Integration**: 3D avatar oluşturma
- **Avatar Preview**: Three.js ile 3D avatar önizleme
- **Avatar Storage**: Supabase ile avatar yönetimi

### 🏫 **Panoramik Sınıf Sistemi**
- **360° Panoramic Views**: Three.js ile tam panoramik deneyim
- **Cinema Mode**: Tam ekran panoramik görüntüleme
- **3D Environment**: Dev ekranı ve kullanıcı yolu entegrasyonu
- **Avatar Integration**: 3D karakterlerle etkileşimli deneyim
- **🌌 3D Mind Map & Learning Path Visualization**: Panoramik dünya içinde gezegen sistemi olarak mind map ve learning path görselleştirmesi
- **Evren Teması**: Mind map ve learning path verileri evrenin içindeki gezegen sistemleri olarak görünür
- **Entegre Deneyim**: Ayrı modal pencereler yerine panoramik dünyanın bir parçası

### 🔐 **Güvenlik & Kullanıcı Yönetimi**
- **Supabase Authentication**: Güvenli kullanıcı girişi
- **Row Level Security (RLS)**: Veri güvenliği
- **User-Specific Content**: Kişiselleştirilmiş içerik

## 🚀 **Hızlı Başlangıç**

### **Gereksinimler**
- Node.js 18+
- npm veya yarn
- Supabase hesabı

### **Kurulum**

```bash
# Repository'yi klonlayın
git clone https://github.com/yourusername/edugems.git
cd edugems

# Bağımlılıkları yükleyin
npm install

# Environment değişkenlerini ayarlayın
cp .env.example .env
# .env dosyasını düzenleyin

# Geliştirme sunucusunu başlatın
npm run dev
```

### **Environment Variables**

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key

# Ready Player Me
VITE_READY_PLAYER_ME_SUBDOMAIN=your_subdomain

# Hugging Face API
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key
```

## 📊 **Proje Durumu**

### ✅ **Tamamlanan Özellikler**

#### **GÜN 1-4: PDF Processing & AI Integration**
- ✅ PDF upload ve metadata extraction
- ✅ Google Gemini AI entegrasyonu
- ✅ Document Understanding (Edge Function)
- ✅ Outline extraction ve JSON formatında kaydetme
- ✅ Error handling ve retry logic

#### **GÜN 5: Segment Planner**
- ✅ Outline tabanlı segment oluşturma
- ✅ Küçük segment birleştirme algoritması
- ✅ Smart validation sistemi
- ✅ Database entegrasyonu
- ✅ Overlap ve boşluk kontrolü

#### **Avatar & Panoramic System**
- ✅ Ready Player Me entegrasyonu
- ✅ 3D avatar preview
- ✅ Panoramik görüntüleme
- ✅ Cinema mode
- ✅ 3D environment
- ✅ **🌌 3D Mind Map & Learning Path Visualization** - Panoramik dünya içinde gezegen sistemi
- ✅ **Evren Teması** - Mind map ve learning path verileri evrenin içindeki gezegen sistemleri
- ✅ **Entegre Deneyim** - Ayrı modal pencereler yerine panoramik dünyanın bir parçası

### 🔄 **Geliştirme Aşamasında**

#### **GÜN 6-8: Worker System**
- ✅ Task Queue sistemi
- ✅ Text Worker (AI content generation)
- ✅ Image Worker (Stable Diffusion XL entegrasyonu)
- ✅ Concurrency Control (Worker koordinasyonu)

#### **GÜN 9: End-to-End PDF Processing Pipeline** ✅
- ✅ Automated PDF Processing - Tek PDF yüklendiğinde otomatik işlem
- ✅ Pipeline Orchestration - Tüm servislerin sırayla çalışması
- ✅ Process Flow: PDF Upload → Segment Planning → Text Worker → Image Worker → Final Results
- ✅ Background Processing - Arka planda kesintisiz işlem
- ✅ Progress Tracking - Her aşamada ilerleme takibi
- ✅ Detailed Results Display - Text ve Image processing sonuçlarını detaylı görüntüleme

#### **GÜN 9.5: Course Structure Generator** ✅
- ✅ AI-Powered Course Creation - Gemini AI ile otomatik kurs yapısı oluşturma
- ✅ Course Structure Service - Kurs yapısı oluşturma servisi
- ✅ Chapter & Lesson Organization - Bölüm ve ders organizasyonu
- ✅ Learning Objectives Generation - Öğrenme hedefleri oluşturma
- ✅ Segment-Course Mapping - Segment-kurs eşleştirmesi
- ✅ Development Mode System - Geliştirici modu sistemi

#### **GÜN 10: Course Visual Integration** ✅
- ✅ Course Visual Generator - Kurs yapısına göre görsel üretimi
- ✅ AI-Powered Image Prompts - Gemini ile akıllı görsel prompt'ları
- ✅ Visual-Learning Mapping - Görsel-öğrenme eşleştirmesi
- ✅ Course Media Library - Kurs medya kütüphanesi
- ✅ Interactive Visual Elements - Etkileşimli görsel elementler
- ✅ Image Worker Integration - Stable Diffusion XL ile görsel üretimi
- ✅ Quality Assessment - Görsel kalite değerlendirmesi
- ✅ Full Integration Test - Tam entegrasyon testi

### **10. Enhanced Content Generation System**
```
Course Structure → Segment Content Integration → Learning Context Enhancement → AI Content Generation → Content Quality Enhancement → Interactive Elements → Gamification → Progress Tracking → Assessment
```

**Gelişmiş İçerik Üretim Süreci:**
1. **Segment Content Integration**: PDF segment içerikleri Enhanced Content Service'e aktarılır
2. **Learning Context Enhancement**: Öğrenme hedefleri, önceki lesson bağlantıları ve seviye bilgisi toplanır
3. **AI Content Generation**: Zenginleştirilmiş context ile Gemini AI eğitim içeriği üretir
4. **Content Quality Enhancement**: AI prompt'ları iyileştirilir ve içerik kalitesi artırılır
5. **Interactive Elements**: Etkileşimli elementler eklenir
6. **Gamification**: Oyunlaştırma özellikleri entegre edilir
7. **Progress Tracking**: Kullanıcı ilerleme takibi
8. **Assessment**: Otomatik değerlendirme oluşturma

**Enhanced Content Service Özellikleri:**
- **AI-Powered Content Generation**: Gemini AI ile detaylı ders içeriği üretimi
- **Segment Content Integration**: PDF segment içeriklerini AI prompt'larına entegre etme
- **Learning Context Enhancement**: Öğrenme hedefleri, önceki lesson bağlantıları ve seviye bilgisi ile context zenginleştirme
- **Multiple Content Types**: Açıklayıcı metin, madde listeleri, tablolar, kod örnekleri, pratik örnekler, özetler
- **Content Quality Assessment**: Otomatik içerik kalitesi değerlendirmesi
- **Content Versioning**: İçerik versiyonlama sistemi
- **Database Integration**: Enhanced content veritabanında saklanır
- **Course Structure Integration**: Mevcut kurs yapısı ile entegre çalışır

**İçerik Türleri:**
```javascript
const contentTypes = {
  lessonContent: 'Ders içeriği - Detaylı açıklamalar ve örnekler',
  interactiveQuiz: 'Etkileşimli quiz - Çoktan seçmeli sorular',
  practicalExercise: 'Pratik alıştırma - Uygulamalı görevler',
  gamifiedChallenge: 'Oyunlaştırılmış görev - Puan sistemi',
  assessment: 'Değerlendirme - Final test ve ölçüm'
};
```

**AI İçerik Üretim Algoritması:**
```javascript
// Her ders için gelişmiş içerik üret
for (const lesson of courseStructure.lessons) {
  // Segment içeriğini al
  const segmentContent = await getSegmentContent(lesson.segmentIds);
  
  // Öğrenme hedeflerini al
  const learningObjectives = await getLearningObjectives(lesson.chapterId);
  
  // Önceki lesson bağlantılarını al
  const previousLessons = await getPreviousLessons(lesson.chapterId, lesson.order);
  
  // Zenginleştirilmiş context ile AI içerik üret
  const lessonContent = await generateLessonContent(lesson, {
    segmentContent: segmentContent,
    learningObjectives: learningObjectives,
    previousLessons: previousLessons,
    studentLevel: courseStructure.targetLevel
  });
  
  // Etkileşimli quiz
  const interactiveQuiz = await generateInteractiveQuiz(lesson, lessonContent);
  
  // Pratik alıştırma
  const practicalExercise = await generatePracticalExercise(lesson, lessonContent);
  
  // Oyunlaştırma görevi
  const gamifiedChallenge = await generateGamifiedChallenge(lesson, lessonContent);
  
  // Değerlendirme
  const assessment = await generateAssessment(lesson, lessonContent);
}
```

**Oyunlaştırma Sistemi:**
```javascript
const gamificationSystem = {
  points: {
    lessonCompletion: 10,
    quizCorrect: 5,
    exerciseCompletion: 15,
    challengeSuccess: 20
  },
  badges: {
    beginner: 'Başlangıç',
    intermediate: 'Orta Seviye',
    advanced: 'İleri Seviye',
    expert: 'Uzman'
  },
  levels: {
    level1: { minPoints: 0, title: 'Yeni Başlayan' },
    level2: { minPoints: 100, title: 'Öğrenci' },
    level3: { minPoints: 300, title: 'Araştırmacı' },
    level4: { minPoints: 600, title: 'Uzman' }
  }
};
```

**İlerleme Takip Sistemi:**
```javascript
const progressTracking = {
  lessonProgress: {
    completed: 0,
    total: 0,
    percentage: 0
  },
  chapterProgress: {
    completed: 0,
    total: 0,
    percentage: 0
  },
  courseProgress: {
    completed: 0,
    total: 0,
    percentage: 0
  },
  achievements: [],
  timeSpent: 0,
  lastActivity: null
};
```

#### **GÜN 11: Enhanced Content Generation** ✅ **TAMAMLANDI**
- ✅ **Enhanced Content Service - Segment Integration** - PDF segment içeriklerini Enhanced Content Service'e entegre etme
- ✅ **AI Content Generation with Full Context** - Segment içerikleri, öğrenme hedefleri ve önceki lesson bağlantıları ile AI içerik üretimi
- ✅ **Content Quality Enhancement** - AI prompt'larını iyileştirme ve içerik kalitesini artırma
- ✅ **Chapter-Based Content Generation** - Chapter bazında tüm segment'leri birleştirip tek seferde AI'ya gönderme
- ✅ **Content Quality Assessment** - Otomatik içerik kalitesi değerlendirmesi ve öneriler
- 🔄 **Interactive Elements** - Etkileşimli elementler (Quiz, alıştırmalar)
- 🔄 **Gamification System** - Oyunlaştırma sistemi (Puan, rozet, seviye)
- 🔄 **Progress Tracking** - İlerleme takibi ve analitikler
- 🔄 **Assessment Generation** - AI ile değerlendirme oluşturma

**🎯 Başarılan Özellikler:**
- ✅ **UUID Sorunu Çözüldü**: Course Structure'da string ID'ler (segment-1) yerine gerçek UUID'ler kullanılıyor
- ✅ **PDF İçeriği Entegrasyonu**: Gerçek PDF metin, görsel ve tablo içerikleri Gemini'ye gönderiliyor
- ✅ **Segment Content Extraction**: PDF.js ile metin, görsel ve tablo çıkarma sistemi
- ✅ **AI Content Generation**: Gemini ile detaylı eğitim içeriği üretimi (açıklayıcı metin, örnekler, özetler)
- ✅ **Chapter-Based Processing**: Her chapter için tüm segment'ler birleştirilip tek seferde işleniyor
- ✅ **Content Quality Assessment**: Otomatik içerik kalitesi değerlendirmesi
- ✅ **Database Integration**: Enhanced content veritabanında saklanıyor
- ✅ **Development Mode**: Enhanced Content Test bileşeni ile test sistemi

**📊 Test Sonuçları:**
- ✅ **İlk 2 Lesson Başarılı**: PDF içeriği + AI yanıtı çalışıyor
- ✅ **Segment Content Length**: 7,591 ve 4,769 karakter başarıyla işlendi
- ✅ **Gemini Response**: 4,600 ve 5,416 karakterlik kaliteli yanıtlar
- ⚠️ **Token Limit Sorunu**: 975K karakterlik büyük segmentlerde token limiti aşılıyor

**🔧 Teknik Detaylar:**
- ✅ **UUID Validation**: Regex ile UUID format kontrolü
- ✅ **Segment ID Mapping**: String ID'leri gerçek UUID'lere dönüştürme
- ✅ **PDF Text Extraction**: PDF.js + Tesseract.js ile OCR
- ✅ **Image & Table Extraction**: Görsel ve tablo çıkarma sistemi
- ✅ **Error Handling**: JSON parse hataları için markdown temizleme
- ✅ **Debug Logging**: Kapsamlı debug sistemi
- ✅ **Chapter-Based AI Processing**: Chapter bazında segment birleştirme ve tek seferde AI işleme

**🚧 Bilinen Sorunlar:**
- ⚠️ **Token Limit**: 975K+ karakterlik segmentler Gemini token limitini aşıyor
- ⚠️ **JSON Parse Error**: Büyük içeriklerde AI JSON formatında yanıt vermiyor
- 🔄 **Optimization Needed**: Segment boyutu optimizasyonu gerekiyor

#### **GÜN 12: Master Pipeline System** ✅ **TAMAMLANDI**
- ✅ **Master Pipeline Service** - Tüm servisleri koordine eden ana pipeline sistemi
- ✅ **Full Pipeline Test Component** - Tek tıkla tam eğitim kursu oluşturma arayüzü
- ✅ **7 Aşamalı Pipeline**: PDF Upload → Document Understanding → Segment Planning → PDF Text Extraction → Course Structure → Course Visual → Enhanced Content
- ✅ **Progress Tracking**: Her aşamada detaylı ilerleme takibi
- ✅ **Pipeline History**: Kullanıcının pipeline geçmişini görüntüleme
- ✅ **Error Handling**: Her aşamada hata yönetimi ve kurtarma
- ✅ **Background Processing**: Arka planda kesintisiz işlem
- ✅ **Database Integration**: Pipeline durumları veritabanında saklanıyor

**🎯 Pipeline Aşamaları:**
1. **PDF Upload & Validation (5%)** - PDF yükleme ve doğrulama
2. **Document Understanding (15%)** - AI ile PDF analizi ve outline çıkarma
3. **Segment Planning (10%)** - PDF'yi öğrenme segmentlerine bölme
4. **PDF Text Extraction (25%)** - Segment'lerden metin, görsel ve tablo çıkarma
5. **Course Structure Generation (15%)** - AI ile kurs yapısı oluşturma
6. **Course Visual Generation (20%)** - AI ile görsel materyal üretimi
7. **Enhanced Content Generation (10%)** - AI ile detaylı eğitim içeriği üretimi

**📊 Pipeline Özellikleri:**
- ✅ **Automated Processing**: Tek PDF yüklendiğinde otomatik tam kurs oluşturma
- ✅ **Real-time Progress**: Canlı ilerleme çubuğu ve aşama bilgileri
- ✅ **Pipeline ID Tracking**: Her pipeline için benzersiz ID ve takip
- ✅ **User-specific History**: Kullanıcıya özel pipeline geçmişi
- ✅ **Comprehensive Results**: Tüm aşamaların sonuçlarını detaylı görüntüleme
- ✅ **Development Mode Integration**: Development mode'da test bileşeni olarak çalışma

**🔧 Teknik Detaylar:**
- ✅ **Service Orchestration**: Tüm servislerin sıralı çalıştırılması
- ✅ **Progress Weighting**: Her aşama için ağırlık sistemi
- ✅ **Database Persistence**: Pipeline durumları PostgreSQL'de saklanıyor
- ✅ **Error Recovery**: Hata durumunda pipeline durdurma ve bilgi verme
- ✅ **UUID Generation**: Her pipeline için benzersiz ID oluşturma
- ✅ **Status Management**: STARTED, IN_PROGRESS, COMPLETED, FAILED durumları

#### **GÜN 13: RAG (Retrieval-Augmented Generation) System** 🔄 **DEVAM EDİYOR**
- ✅ **Vector Database Setup** - Supabase pgvector entegrasyonu ✅ **TAMAMLANDI**
- ✅ **Gemini Embedding Service** - text-embedding-004 ile 768-dimensional embeddings ✅ **TAMAMLANDI**
- ✅ **Retrieval Service** - Semantic search, context building, cross-chapter context ve mevcut yapıya entegrasyon ✅ **TAMAMLANDI**
- ✅ **Knowledge Base Service** - Vector database ile entegrasyon ✅ **TAMAMLANDI**
- 🔄 **Enhanced Content Service Güncelleme** - RAG entegrasyonu
- 🔄 **Context-Aware Content Generation** - Bağlam zenginleştirilmiş AI prompt'ları
- 🔄 **Cross-Chapter Consistency** - Chapter'lar arası tutarlılık
- 🔄 **Personalized Content** - Kullanıcı tercihlerine göre kişiselleştirme
- 🔄 **Advanced Prompt Engineering** - RAG tabanlı gelişmiş prompt'lar

#### **GÜN 14: 3D Mind Map & Learning Path Visualization** ✅ **TAMAMLANDI**
- ✅ **🌌 3D Mind Map & Learning Path Visualization** - Panoramik dünya içinde gezegen sistemi
- ✅ **Evren Teması** - Mind map ve learning path verileri evrenin içindeki gezegen sistemleri
- ✅ **Entegre Deneyim** - Ayrı modal pencereler yerine panoramik dünyanın bir parçası
- ✅ **Three.js Integration** - Custom Three.js implementation ile 3D görselleştirme
- ✅ **Real-time Rendering** - Gerçek zamanlı 3D scene rendering
- ✅ **Interactive Navigation** - Fare ile döndürme ve yakınlaştırma
- ✅ **Dynamic Content** - Mind map ve learning path verilerine göre dinamik gezegen oluşturma
- ✅ **Mind Map Generator Service** - Gemini AI ile mind map üretimi
- ✅ **Learning Path Generator Service** - Gemini AI ile learning path üretimi
- ✅ **3D Force Graph Service** - Custom Three.js ile 3D görselleştirme
- ✅ **Database Integration** - Mind maps ve learning_paths tabloları
- ✅ **Test Component** - MindMapLearningPathTest bileşeni
- ✅ **PanoramicViewer Integration** - Panoramik dünyaya entegrasyon

**🎯 RAG Sistemi Aşamaları:**
1. **Vector Database Kurulumu** ✅ **TAMAMLANDI** - pgvector extension ve tablolar
2. **Gemini Embedding Service** ✅ **TAMAMLANDI** - text-embedding-004 entegrasyonu
3. **Retrieval Service** ✅ **TAMAMLANDI** - Semantic search, context building, cross-chapter context ve mevcut yapıya entegrasyon
3. **Knowledge Base Service** ✅ **TAMAMLANDI** - Vector database entegrasyonu
4. **Enhanced Content Service Güncelleme** 🔄 - RAG entegrasyonu
5. **Enhanced Content Service** 🔄 - RAG tabanlı içerik üretimi
6. **Testing & Optimization** 🔄 - Performans ve kalite testleri

**📊 RAG Avantajları:**
- 🔄 **Bağlam Zenginliği**: Önceki chapter'lar ve benzer konular
- 🔄 **Tutarlılık**: Aynı kavramlar tutarlı şekilde kullanılır
- 🔄 **Kişiselleştirme**: Kullanıcı geçmişi ve tercihleri
- 🔄 **Güncellik**: En güncel bilgiler kullanılır
- 🔄 **Kalite Artışı**: Daha zengin ve tutarlı içerik

**🗄️ Vector Database Özellikleri:**
- ✅ **4 Ana Tablo**: knowledge_base, concept_embeddings, chapter_relationships, rag_context_cache
- ✅ **768-Dimensional Vectors**: text-embedding-004 uyumlu (Supabase compatible)
- ✅ **Semantic Search Indexes**: HNSW index'ler ile yüksek boyutlu hızlı arama
- ✅ **RAG Functions**: find_similar_content, find_related_concepts, get_rag_context
- ✅ **Performance Optimization**: Cache sistemi ve otomatik temizlik
- ✅ **Security**: Row Level Security (RLS) politikaları
- ✅ **Testing**: Kapsamlı test script'leri

#### **GÜN 14: Web Application Interface** 🔄
- 🔄 Course Builder Dashboard - Kurs oluşturma paneli
- 🔄 Student Learning Interface - Öğrenci öğrenme arayüzü
- 🔄 Course Preview System - Kurs önizleme sistemi
- 🔄 Content Editor - İçerik düzenleyici
- 🔄 Course Publishing - Kurs yayınlama

#### **GÜN 13: Integration & API** 🔄
- 🔄 REST API - Dış sistem entegrasyonu
- 🔄 Export Features - Dışa aktarma
- 🔄 Webhook System - Webhook sistemi
- 🔄 Third-party Integrations - Üçüncü parti entegrasyonlar

#### **GÜN 14: Production Ready** 🔄
- 🔄 Security Hardening - Güvenlik güçlendirme
- 🔄 Performance Optimization - Performans optimizasyonu
- 🔄 Documentation - Dokümantasyon
- 🔄 Testing & QA - Test ve kalite kontrol

## 🏗️ **Proje Yapısı**

```
src/
├── components/                 # Yeniden kullanılabilir bileşenler
│   ├── PDFTestArea/           # PDF test alanı
│   ├── DocumentUnderstandingTest/  # AI test alanı
│   ├── SegmentPlannerTest/    # Segment test alanı
│   ├── TextWorkerTest/        # Text Worker test alanı
│   ├── ImageWorkerTest/       # Image Worker test alanı
│   ├── ConcurrencyControlTest/ # Concurrency Control test alanı
│   ├── PDFPipelineTest/       # PDF Pipeline test alanı
│   ├── CourseStructureTest/   # Course Structure test alanı
│   ├── CourseVisualIntegration/ # Course Visual Integration
│   ├── EnhancedContentTest/ # Enhanced Content Generation test ✅
│   ├── PDFExtractionTest/ # PDF Text Extraction test ✅
│   ├── FullPipelineTest/ # Master Pipeline test ✅
│   ├── GeminiEmbeddingTest/ # Gemini Embedding test ✅
│   ├── RetrievalTest/ # Retrieval Service test (Mevcut yapıya entegre) ✅
│   ├── MindMapLearningPathTest/ # Mind Map & Learning Path test ✅
│   ├── DevelopmentModeIndicator/ # Development mode göstergesi
│   ├── AvatarPage/            # Avatar oluşturma
│   └── PanoramicViewer/       # 360° görüntüleyici (3D Mind Map & Learning Path entegreli)
├── pages/                     # Sayfa bileşenleri
│   ├── LoginPage/             # Giriş sayfası
│   ├── DashboardPage/         # Ana dashboard
│   ├── CreateCoursePage/      # Kurs oluşturma
│   └── CoursesPage/           # Kurslar listesi
├── services/                  # API servisleri
│   ├── pdfService.js          # PDF işlemleri
│   ├── segmentService.js      # Segment algoritması
│   ├── documentUnderstandingService.js  # AI servisi
│   ├── textWorkerService.js   # Text Worker servisi
│   ├── imageWorkerService.js  # Image Worker servisi
│   ├── concurrencyManagerService.js # Concurrency Manager
│   ├── queueManagerService.js # Queue Manager
│   ├── workerCoordinatorService.js # Worker Coordinator
│   ├── pdfProcessingPipelineService.js # PDF Pipeline
│   ├── taskQueueService.js    # Task Queue servisi
│   ├── courseStructureService.js # Course Structure servisi
│   ├── courseVisualService.js # Course Visual servisi
│   ├── enhancedContentService.js # Enhanced Content servisi ✅
│   ├── pdfTextExtractionService.js # PDF Text Extraction servisi ✅
│   ├── geminiEmbeddingService.js # Gemini Embedding servisi ✅
│   ├── knowledgeBaseService.js # Knowledge Base servisi ✅
│   ├── retrievalService.js # Retrieval Service (Mevcut yapıya entegre) ✅
│   ├── masterPipelineService.js # Master Pipeline servisi ✅
│   ├── mindMapService.js # Mind Map servisi ✅
│   ├── learningPathService.js # Learning Path servisi ✅
│   ├── mindMapGeneratorService.js # Mind Map Generator servisi ✅
│   ├── learningPathGeneratorService.js # Learning Path Generator servisi ✅
│   ├── forceGraph3DService.js # 3D Force Graph servisi ✅
│   └── supabaseService.js     # Supabase bağlantısı
├── config/                    # Konfigürasyon
│   ├── supabase.js           # Supabase client
│   └── development.js        # Development mode konfigürasyonu
└── styles/                    # Global stiller

supabase/
├── functions/                 # Edge Functions
│   ├── pdf_broker/           # PDF webhook handler
│   └── gemini_document_understanding/  # AI processing
├── migrations/               # Database migrations
│   └── 20241201000000_vector_database_rag.sql ✅ **YENİ**
└── config.toml              # Supabase konfigürasyonu

**Database Files:**
├── database_vector_rag.sql ✅ **YENİ** - Vector database setup
├── test_vector_database.sql ✅ **YENİ** - Vector database test script
```

## 🤖 **AI Entegrasyonu**

### **Google Gemini AI**
- **Model**: `gemini-1.5-flash` (hızlı ve verimli)
- **API**: Document Understanding için özel Edge Function
- **Features**: PDF analizi, outline extraction, content classification

### **Hugging Face API**
- **Model**: `stabilityai/stable-diffusion-xl-base-1.0` (Stable Diffusion XL)
- **API**: Görsel üretimi için text-to-image
- **Features**: Segment tabanlı görsel oluşturma (Main, Concept, Example)

## 🔧 **Sistem Mimarisi ve Algoritmalar**

### **1. Document Understanding Pipeline**
```
PDF Upload → Metadata Extraction → Gemini AI Analysis → Outline Generation
```

**Detaylı İşleyiş:**
1. **PDF Upload & Storage**: PDF dosyası Supabase Storage'a yüklenir
2. **Metadata Extraction**: PDF-lib ile sayfa sayısı, boyut, metadata çıkarılır
3. **Gemini AI Processing**: Supabase Edge Function ile PDF Gemini Files API'ye gönderilir
4. **Content Analysis**: Gemini AI PDF içeriğini analiz eder ve yapıyı çıkarır
5. **Outline Generation**: Başlıklar, alt başlıklar, bölümler otomatik organize edilir

**Kullanılan Teknolojiler:**
- **Supabase Edge Functions**: Serverless PDF processing
- **Gemini Files API**: PDF içerik analizi
- **PDF-lib**: Metadata extraction
- **JSON Response**: Structured outline format

### **2. Segment Planning Algorithm**
```
Document Analysis → Smart Merging → Validation → Database Storage
```

**Algoritma Detayları:**
- **Minimum Segment Size**: 3 sayfa
- **Maximum Segment Size**: 20 sayfa
- **Smart Merging**: Küçük segmentleri otomatik birleştirme
- **Overlap Detection**: Sayfa çakışmalarını tespit etme
- **Gap Detection**: Boş sayfa aralıklarını bulma
- **Validation**: Segment bütünlüğü kontrolü

**Segment Oluşturma Kuralları:**
```javascript
// Segment boyutu hesaplama
const segmentSize = Math.min(Math.max(totalPages / 5, 3), 20);

// Akıllı birleştirme algoritması
if (currentSegment.pages < 3) {
  mergeWithNextSegment();
}

// Çakışma kontrolü
if (segmentOverlaps(segment1, segment2)) {
  adjustSegmentBoundaries();
}
```

### **3. Worker System Architecture**
```
Task Queue → Concurrency Manager → Worker Coordinator → Text/Image Workers
```

**Sistem Bileşenleri:**

#### **A. Task Queue System**
- **Priority Levels**: HIGH (3), MEDIUM (2), LOW (1)
- **Retry Logic**: Başarısız task'lar için otomatik yeniden deneme
- **Event Emission**: Task durumu değişikliklerinde event'ler
- **Database Persistence**: Task durumları PostgreSQL'de saklanır

#### **B. Concurrency Manager**
- **Worker Registration**: Aktif worker'ları kayıt eder
- **Rate Limiting**: API limitlerini kontrol eder
- **Status Tracking**: Worker durumlarını takip eder
- **Resource Management**: Sistem kaynaklarını yönetir

#### **C. Worker Coordinator**
- **Dependency Management**: Worker'lar arası bağımlılıkları yönetir
- **Sequential Execution**: Sıralı çalıştırma
- **Timeout Handling**: Zaman aşımı kontrolü
- **Error Recovery**: Hata durumunda kurtarma

### **4. Text Worker System**
```
Segment Input → AI Content Generation → Metadata Extraction → Database Storage
```

**İşlem Adımları:**
1. **Segment Analysis**: Segment içeriği analiz edilir
2. **AI Prompt Generation**: Gemini AI için akıllı prompt oluşturulur
3. **Content Generation**: AI ile eğitim içeriği üretilir
4. **Metadata Extraction**: Anahtar kelimeler, özet, zorluk seviyesi çıkarılır
5. **Database Storage**: Sonuçlar worker_results tablosuna kaydedilir

**AI Prompt Örneği:**
```javascript
const prompt = `
  Bu segment için eğitim içeriği oluştur:
  - Başlık: ${segment.title}
  - İçerik: ${segment.content}
  - Hedef: Öğrenci dostu, anlaşılır eğitim materyali
  - Format: Markdown
  - Özellikler: Örnekler, açıklamalar, pratik uygulamalar
`;
```

### **5. Image Worker System**
```
Segment Input → Prompt Generation → Stable Diffusion XL → Image Processing → Storage
```

**Görsel Üretim Süreci:**
1. **Content Analysis**: Segment içeriği analiz edilir
2. **Prompt Engineering**: Stable Diffusion için optimize edilmiş prompt'lar
3. **Image Generation**: Hugging Face API ile görsel üretimi
4. **Quality Optimization**: Görsel kalitesi iyileştirme
5. **Storage & Metadata**: Supabase Storage'a kaydetme

**Görsel Türleri:**
- **Main Topic Image**: Ana konu görseli (768x768px)
- **Concept Diagram**: Kavram diyagramı (1024x1024px)
- **Example Image**: Örnek görsel (768x768px)

**Prompt Optimizasyonu:**
```javascript
const imagePrompts = {
  mainTopic: `Educational illustration of ${topic}, clean design, no text, professional`,
  conceptDiagram: `Concept diagram for ${concept}, visual learning, infographic style`,
  example: `Practical example of ${concept}, real-world application, clear visualization`
};
```

### **6. End-to-End PDF Processing Pipeline**
```
PDF Upload → Metadata Extraction → Gemini AI Analysis → Outline Generation → Segment Planning → Text Worker → Image Worker → Course Structure → Course Visual Integration → Final Results
```

**Pipeline Orchestration:**
- **Sequential Processing**: Her adım sırayla çalışır
- **Progress Tracking**: Her aşamada ilerleme takibi
- **Error Handling**: Hata durumunda pipeline durdurma
- **Background Processing**: Arka planda kesintisiz işlem
- **Status Updates**: Database'de durum güncellemeleri

**Pipeline Durumları:**
```javascript
const PIPELINE_STATUS = {
  IDLE: 'IDLE',
  UPLOADING: 'UPLOADING',
  SEGMENTING: 'SEGMENTING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};
```

### **7. Course Structure Generation**
```
Document Analysis → AI Course Planning → Chapter Organization → Lesson Mapping → Database Storage
```

**Kurs Yapısı Oluşturma Süreci:**
1. **Document Analysis**: PDF outline ve segment'ler analiz edilir
2. **AI Course Planning**: Gemini AI ile kurs yapısı planlanır
3. **Chapter Organization**: Bölümler mantıklı şekilde organize edilir
4. **Lesson Mapping**: Dersler segment'lere eşleştirilir
5. **Learning Objectives**: Her bölüm için öğrenme hedefleri oluşturulur

**AI Prompt Yapısı:**
```javascript
const coursePrompt = `
  Bu PDF için kapsamlı bir eğitim kursu yapısı oluştur:
  
  PDF Bilgileri:
  - Başlık: ${outline.title}
  - Yazar: ${outline.author}
  - Toplam Sayfa: ${outline.total_pages}
  
  PDF Yapısı: ${JSON.stringify(outline.headings)}
  Segment'ler: ${segments.map(seg => `Segment ${seg.seg_no}: ${seg.title}`)}
  
  Kurallar:
  1. Segment'leri mantıklı bölümlere grupla
  2. Her bölüm 3-7 ders içersin
  3. Öğrenme hedefleri net ve ölçülebilir olsun
  4. Zorluk seviyesi içeriğe uygun olsun
`;
```

**Kurs Yapısı Formatı:**
```json
{
  "title": "Kurs Başlığı",
  "description": "Kurs açıklaması",
  "learningObjectives": ["Hedef 1", "Hedef 2"],
  "estimatedDuration": "8-10 saat",
  "difficultyLevel": "Orta",
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Bölüm Başlığı",
      "description": "Bölüm açıklaması",
      "order": 1,
      "estimatedDuration": "2-3 saat",
      "lessons": [
        {
          "id": "lesson-1-1",
          "title": "Ders Başlığı",
          "description": "Ders açıklaması",
          "order": 1,
          "estimatedDuration": "30-45 dakika",
          "segmentId": "segment-uuid",
          "contentType": "text",
          "learningPoints": ["Nokta 1", "Nokta 2"]
        }
      ]
    }
  ]
}
```

### **8. Course Visual Integration System**
```
Course Structure → AI Visual Prompts → Image Generation → Visual-Learning Mapping → Course Media Library
```

**Görsel Entegrasyon Süreci:**
1. **Course Analysis**: Kurs yapısı analiz edilir
2. **AI Prompt Generation**: Gemini AI ile akıllı görsel prompt'lar üretilir
3. **Image Generation**: Stable Diffusion XL ile görseller oluşturulur
4. **Visual Mapping**: Görseller derslerle eşleştirilir
5. **Media Library**: Kurs medya kütüphanesi oluşturulur

**Görsel Prompt Türleri:**
```javascript
const visualPromptTypes = {
  mainTopic: 'Ana konu görseli - Eğitici, temiz tasarım',
  conceptDiagram: 'Kavram diyagramı - Infografik tarzı',
  example: 'Örnek görsel - Pratik uygulama'
};
```

**Görsel Üretim Algoritması:**
```javascript
// Her bölüm için görsel prompt'lar üret
for (const chapter of courseStructure.chapters) {
  // Ana bölüm görseli
  const mainChapterPrompt = createMainChapterPrompt(chapter);
  
  // Her ders için görsel prompt'lar
  for (const lesson of chapter.lessons) {
    const lessonPrompts = generateLessonVisualPrompts(lesson, chapter);
    // Main topic, concept diagram, example görselleri
  }
}

// Image Worker ile görsel üretimi
const imageResult = await imageWorker.callStableDiffusionAPI(prompt, imageType);
```

**Kalite Değerlendirme Sistemi:**
```javascript
const evaluation = {
  overallScore: 0,
  promptQuality: 0,
  imageQuality: 0,
  integrationQuality: 0,
  issues: [],
  recommendations: []
};

// Prompt kalitesi değerlendir
evaluation.promptQuality = calculatePromptQuality(prompts);

// Görsel kalitesi değerlendir
evaluation.imageQuality = calculateImageQuality(images);

// Entegrasyon kalitesi
evaluation.integrationQuality = (evaluation.promptQuality + evaluation.imageQuality) / 2;
```

### **11. Master Pipeline System**
```
PDF Upload → Document Understanding → Segment Planning → PDF Text Extraction → Course Structure → Course Visual → Enhanced Content → Final Results
```

**Master Pipeline Özellikleri:**
- **Service Orchestration**: Tüm servislerin sıralı çalıştırılması
- **Progress Tracking**: Her aşamada detaylı ilerleme takibi
- **Error Handling**: Her aşamada hata yönetimi ve kurtarma
- **Background Processing**: Arka planda kesintisiz işlem
- **Database Integration**: Pipeline durumları veritabanında saklanıyor
- **User History**: Kullanıcının pipeline geçmişini görüntüleme

**Pipeline Aşamaları ve Ağırlıkları:**
```javascript
const pipelineStages = [
  { name: 'PDF Upload & Validation', weight: 5 },
  { name: 'Document Understanding', weight: 15 },
  { name: 'Segment Planning', weight: 10 },
  { name: 'PDF Text Extraction', weight: 25 },
  { name: 'Course Structure Generation', weight: 15 },
  { name: 'Course Visual Generation', weight: 20 },
  { name: 'Enhanced Content Generation', weight: 10 }
];
```

**Pipeline Execution Flow:**
```javascript
// Pipeline başlatma
const pipelineResult = await masterPipelineService.runFullPipeline(pdfFile, userId);

// Her aşama için progress güncelleme
await this.updatePipelineProgress(pipelineId, stageName, percentage);

// Pipeline tamamlama
await this.completePipeline(pipelineId, 'COMPLETED', pipelineData);

// Kullanıcı pipeline geçmişi
const userPipelines = await masterPipelineService.getUserPipelines(userId);
```

**Database Schema:**
```sql
-- Pipeline executions tablosu
CREATE TABLE pipeline_executions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
  current_stage TEXT,
  progress_percentage INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  result_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **12. RAG (Retrieval-Augmented Generation) System**
```
Knowledge Base → Vector Embeddings → Semantic Search → Context Retrieval → Augmented Prompt → AI Generation
```

**RAG Sistemi Özellikleri:**
- **Vector Database**: Supabase pgvector ile semantic search
- **Embedding Service**: OpenAI embeddings ile metin vektörizasyonu
- **Knowledge Base**: Chapter içeriklerini vector olarak saklama
- **Retrieval Service**: İlgili bağlamları akıllıca çekme, cross-chapter context ve mevcut yapıya entegrasyon
- **Context-Aware Generation**: Bağlam zenginleştirilmiş AI prompt'ları
- **Cross-Chapter Consistency**: Chapter'lar arası tutarlılık

**RAG İşlem Akışı:**
```javascript
// 1. Knowledge Base'e içerik ekleme
const knowledgeEntry = {
  chapterId: chapter.id,
  content: chapterContent,
  embeddings: await generateEmbeddings(chapterContent),
  metadata: {
    title: chapter.title,
    keyConcepts: extractedConcepts,
    difficulty: chapter.difficulty
  }
};

// 2. İlgili bağlamları çekme
const relevantContext = await retrievalService.findRelevantContext({
  currentChapter: chapter,
  previousChapters: await getPreviousChapters(chapter.order),
  similarConcepts: await findSimilarConcepts(chapter.keywords),
  userPreferences: await getUserPreferences(userId)
});

// 3. Augmented prompt oluşturma
const ragPrompt = `
KURS BAĞLAMI:
${courseStructure.title}

ÖNCEKİ CHAPTER'LAR:
${relevantContext.previousChapters.map(ch => `- ${ch.title}: ${ch.keyConcepts}`).join('\n')}

BENZER KAVRAMLAR:
${relevantContext.similarConcepts.map(concept => `- ${concept.title}: ${concept.explanation}`).join('\n')}

MEVCUT CHAPTER:
${chapter.title}
${segmentContent}

TALİMAT: Yukarıdaki bağlamı kullanarak tutarlı içerik üret
`;

// 4. AI ile içerik üretimi
const result = await this.model.generateContent(ragPrompt);
```

**Database Schema:**
```sql
-- Vector database tablosu
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id),
  content TEXT NOT NULL,
  embeddings vector(1536), -- OpenAI embeddings
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Semantic search index
CREATE INDEX ON knowledge_base USING ivfflat (embeddings vector_cosine_ops);

-- Benzerlik arama fonksiyonu
SELECT * FROM knowledge_base 
WHERE embeddings IS NOT NULL
ORDER BY embeddings <=> $1 
LIMIT 5;
```

**Embedding Service:**
```javascript
class EmbeddingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateEmbeddings(text) {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text
    });
    return response.data[0].embedding;
  }

  async findSimilarContent(query, limit = 5) {
    const queryEmbedding = await this.generateEmbeddings(query);
    
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .order(`embeddings <=> '[${queryEmbedding.join(',')}]'::vector`)
      .limit(limit);

    return data || [];
  }
}
```

**Retrieval Service (Mevcut Yapıya Entegre):**
```javascript
class RetrievalService {
  constructor(embeddingService) {
    this.embeddingService = embeddingService;
  }

  async findRelevantContext(currentChapter, courseStructure) {
    // 1. Önceki chapter'ları çek
    const previousChapters = await this.getPreviousChapters(currentChapter.order);
    
    // 2. Benzer kavramları bul
    const similarConcepts = await this.findSimilarConcepts(currentChapter.keywords);
    
    // 3. Kullanıcı tercihlerini al
    const userPreferences = await this.getUserPreferences();
    
    return {
      previousChapters,
      similarConcepts,
      userPreferences
    };
  }

  async findSimilarConcepts(keywords) {
    const query = keywords.join(' ');
    return await this.embeddingService.findSimilarContent(query);
  }
}
```

### **13. Development Mode System**
```
Environment Check → Local Storage → UI State Management → Component Rendering
```

**Development Mode Özellikleri:**
- **Environment Variables**: `VITE_DEV_MODE=true`
- **Local Storage**: `devMode` key ile durum saklama
- **Toggle Functionality**: Açma/kapama butonu
- **Conditional Rendering**: Test component'leri sadece dev mode'da görünür
- **State Management**: React state ile anlık güncelleme

**Kullanım:**
```javascript
// Development mode kontrolü
const isDevMode = () => {
  return process.env.NODE_ENV === 'development' ||
         process.env.VITE_DEV_MODE === 'true' ||
         localStorage.getItem('devMode') === 'true';
};

// Toggle fonksiyonu
const toggleDevMode = () => {
  if (isDevMode()) {
    localStorage.removeItem('devMode');
  } else {
    localStorage.setItem('devMode', 'true');
  }
  window.location.reload();
};
```

### **14. 3D Mind Map & Learning Path Visualization System**
```
Course Data → Mind Map Generation → Learning Path Generation → 3D Scene Integration → Panoramic Experience
```

**3D Mind Map & Learning Path Özellikleri:**
- **🌌 Evren Teması**: Mind map ve learning path verileri evrenin içindeki gezegen sistemleri olarak görünür
- **Entegre Deneyim**: Ayrı modal pencereler yerine panoramik dünyanın bir parçası
- **Three.js Integration**: Custom Three.js implementation ile 3D görselleştirme
- **Real-time Rendering**: Gerçek zamanlı 3D scene rendering
- **Interactive Navigation**: Fare ile döndürme ve yakınlaştırma
- **Dynamic Content**: Mind map ve learning path verilerine göre dinamik gezegen oluşturma

**Mind Map Gezegen Sistemi:**
```javascript
// Merkez gezegen (ana konu)
const centralPlanet = new THREE.Mesh(
  new THREE.SphereGeometry(8, 32, 32),
  new THREE.MeshLambertMaterial({ 
    color: 0xff6b6b,
    emissive: 0x330000,
    emissiveIntensity: 0.2
  })
);
centralPlanet.position.set(-150, 50, -100);

// Ana dal gezegenleri
branches.forEach((branch, index) => {
  const angle = (index / branches.length) * Math.PI * 2;
  const radius = 40;
  const x = -150 + Math.cos(angle) * radius;
  const y = 50 + Math.sin(angle) * radius * 0.5;
  const z = -100 + Math.sin(angle) * radius * 0.3;
  
  // Ana dal gezegeni oluştur
  const branchPlanet = createBranchPlanet(branch, index, x, y, z);
  
  // Merkez ile bağlantı
  const connection = createConnection(-150, 50, -100, x, y, z);
  
  // Alt konu gezegenleri
  branch.subtopics.forEach((subtopic, subIndex) => {
    const subtopicPlanet = createSubtopicPlanet(subtopic, index, subIndex);
  });
});
```

**Learning Path Gezegen Sistemi:**
```javascript
// Başlangıç gezegeni
const startPlanet = new THREE.Mesh(
  new THREE.SphereGeometry(6, 32, 32),
  new THREE.MeshLambertMaterial({ 
    color: 0x4ecdc4,
    emissive: 0x004d4d,
    emissiveIntensity: 0.2
  })
);
startPlanet.position.set(150, 50, -100);

// Adım gezegenleri
learningPathData.steps.forEach((step, index) => {
  const angle = (index / learningPathData.steps.length) * Math.PI * 2;
  const radius = 35;
  const x = 150 + Math.cos(angle) * radius;
  const y = 50 + Math.sin(angle) * radius * 0.5;
  const z = -100 + Math.sin(angle) * radius * 0.3;
  
  // Adım gezegeni oluştur
  const stepPlanet = createStepPlanet(step, index, x, y, z);
  
  // Önceki adım ile bağlantı
  const connection = createStepConnection(prevStep, currentStep);
});
```

**3D Label System:**
```javascript
const create3DLabel = (text, color) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;

  context.fillStyle = '#ffffff';
  context.font = 'bold 14px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ 
    map: texture,
    color: color
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(8, 2, 1);
  
  return sprite;
};
```

**Mind Map Generator Service:**
```javascript
class MindMapGeneratorService {
  async generateMindMap(options) {
    const { documentId, segmentIds, enhancedContent, courseStructure } = options;
    
    // Segment içeriklerini birleştir
    const combinedContent = await this.combineSegmentContent(segmentIds);
    
    // Enhanced content'i ekle
    const enrichedContent = this.enrichWithEnhancedContent(combinedContent, enhancedContent);
    
    // Course structure bilgilerini ekle
    const contextWithStructure = this.addCourseStructureContext(enrichedContent, courseStructure);
    
    // Gemini AI ile mind map oluştur
    const mindMapResponse = await this.model.generateContent(this.createMindMapPrompt(contextWithStructure));
    
    // Response'u parse et
    const parsedMindMap = this.parseMindMapResponse(mindMapResponse);
    
    // Database'e kaydet
    const saveResult = await mindMapService.createMindMap({
      documentId: options.documentId,
      type: options.type || 'course_mindmap',
      title: parsedMindMap.data.title,
      centralTopic: parsedMindMap.data.central_topic,
      content: parsedMindMap.data.branches,
      modelUsed: this.model,
      metadata: {
        generationTime: Date.now() - startTime,
        modelUsed: this.model,
        source: 'gemini_api',
        options: options
      }
    });
    
    return saveResult;
  }
}
```

**Learning Path Generator Service:**
```javascript
class LearningPathGeneratorService {
  async generateLearningPath(options) {
    const { documentId, segmentIds, enhancedContent, courseStructure } = options;
    
    // Segment içeriklerini birleştir
    const combinedContent = await this.combineSegmentContent(segmentIds);
    
    // Enhanced content'i ekle
    const enrichedContent = this.enrichWithEnhancedContent(combinedContent, enhancedContent);
    
    // Course structure bilgilerini ekle
    const contextWithStructure = this.addCourseStructureContext(enrichedContent, courseStructure);
    
    // Gemini AI ile learning path oluştur
    const learningPathResponse = await this.model.generateContent(this.createLearningPathPrompt(contextWithStructure));
    
    // Response'u parse et
    const parsedLearningPath = this.parseLearningPathResponse(learningPathResponse);
    
    // Database'e kaydet
    const saveResult = await learningPathService.createLearningPath({
      documentId: options.documentId,
      type: options.type || 'course_learning_path',
      title: parsedLearningPath.data.title,
      description: parsedLearningPath.data.description,
      steps: parsedLearningPath.data.steps,
      modelUsed: this.model,
      metadata: {
        generationTime: Date.now() - startTime,
        modelUsed: this.model,
        source: 'gemini_api',
        options: options
      }
    });
    
    return saveResult;
  }
}
```

**PanoramicViewer Integration:**
```javascript
// Mind Map ve Learning Path 3D objelerini oluştur
if (mindMapData) {
  createMindMap3DObjects(scene);
}
if (learningPathData) {
  createLearningPath3DObjects(scene);
}

// Bilgi paneli
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
```

**Database Schema:**
```sql
-- Mind Maps tablosu
CREATE TABLE mind_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  central_topic TEXT NOT NULL,
  content JSONB NOT NULL,
  model_used TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning Paths tablosu
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  model_used TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Test Component:**
```javascript
// MindMapLearningPathTest.jsx
const MindMapLearningPathTest = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [mindMapData, setMindMapData] = useState(null);
  const [learningPathData, setLearningPathData] = useState(null);
  
  const generateMindMap = async () => {
    const result = await mindMapGeneratorService.generateMindMap({
      documentId: selectedDocument.id,
      segmentIds: selectedDocument.segments.map(s => s.id),
      enhancedContent: selectedDocument.enhanced_content,
      courseStructure: selectedDocument.course_structure
    });
    setMindMapData(result.data);
  };
  
  const generateLearningPath = async () => {
    const result = await learningPathGeneratorService.generateLearningPath({
      documentId: selectedDocument.id,
      segmentIds: selectedDocument.segments.map(s => s.id),
      enhancedContent: selectedDocument.enhanced_content,
      courseStructure: selectedDocument.course_structure
    });
    setLearningPathData(result.data);
  };
};
```

### **Concurrency Control System**
- **Concurrency Manager**: Worker kayıt, durum takibi, rate limiting
- **Queue Manager**: Task prioritization, retry logic, event emission
- **Worker Coordinator**: Segment işleme koordinasyonu, dependency management

### **Segment Planning Algorithm**
- **Smart Merging**: Küçük segmentleri otomatik birleştirme
- **Validation**: Overlap kontrolü ve boşluk tespiti
- **Flexible Sizing**: 3-20 sayfa arası segment boyutları

## 🛠️ **Teknolojiler**

### **Frontend**
- **React 18** - Modern UI framework
- **Vite** - Hızlı build tool
- **React Router** - Sayfa yönlendirme
- **Three.js** - 3D graphics ve panoramik görüntüleme
- **Ready Player Me** - Avatar sistemi

### **Backend & Database**
- **Supabase** - Backend as a Service
- **PostgreSQL** - Ana veritabanı
- **Edge Functions** - Serverless backend
- **Row Level Security** - Veri güvenliği

### **AI & Processing**
- **Google Gemini AI** - PDF analizi, content generation ve kurs yapısı oluşturma
- **Hugging Face API** - Görsel üretimi (Stable Diffusion XL)
- **PDF-lib** - PDF metadata extraction
- **Custom Algorithms** - Segment planning ve validation
- **Development Mode** - Geliştirici araçları için ayrı mod sistemi

## 📈 **Performans**

### **PDF Processing**
- **Upload Limit**: 20MB per PDF
- **Processing Time**: ~30-60 saniye (PDF boyutuna göre)
- **AI Response**: Gemini API ile hızlı analiz
- **Validation**: Real-time segment validation

### **Course Generation**
- **Course Structure Time**: ~10-20 saniye (PDF karmaşıklığına göre)
- **AI-Powered Organization**: Otomatik bölüm ve ders organizasyonu
- **Learning Objectives**: Her bölüm için öğrenme hedefleri
- **Development Mode**: Geliştirici araçları için ayrı mod

### **Visual Generation**
- **Image Generation Time**: ~5-15 saniye per görsel (Stable Diffusion XL)
- **Quality Assessment**: Otomatik görsel kalite değerlendirmesi
- **Success Rate**: %85+ başarı oranı
- **Batch Processing**: Toplu görsel üretimi

### **Database**
- **Segments Table**: Optimized indexing
- **Documents Table**: Efficient storage with course_structure support
- **Course Structure**: JSONB formatında kurs yapısı saklama
- **Visual Prompts**: JSONB formatında görsel prompt'lar
- **Course Images**: JSONB formatında üretilen görseller
- **RLS Policies**: Secure data access

## 🔧 **Geliştirme**

### **Komutlar**

```bash
# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Preview build
npm run preview

# Linting
npm run lint

# Type checking
npm run type-check
```

### **Supabase CLI**

```bash
# Edge Function deployment
npx supabase functions deploy gemini_document_understanding

# Database migrations
npx supabase db push

# Local development
npx supabase start
```

## 📝 **API Dokümantasyonu**

### **PDF Service**
```javascript
// PDF upload
const result = await pdfService.uploadPDF(file)

// Document listesi
const documents = await pdfService.getDocuments()

// Document understanding
const outline = await documentUnderstandingService.extractDocumentOutline(documentId)
```

### **Course Structure Service**
```javascript
// Kurs yapısı oluşturma
const courseStructure = await courseStructureService.generateCourseStructure(documentId)

// Kurs yapısını getirme
const existingStructure = await courseStructureService.getCourseStructure(documentId)

// Test fonksiyonu
const testResult = await courseStructureService.testCourseStructureGeneration(documentId)
```

### **Course Visual Service**
```javascript
// Görsel prompt'ları üretme
const visualPrompts = await courseVisualService.generateVisualPrompts(documentId)

// Kurs görselleri üretme
const courseImages = await courseVisualService.generateCourseImages(documentId)

// Tam entegrasyon testi
const fullTest = await courseVisualService.testFullVisualIntegration(documentId)

// Görsel prompt'ları getirme
const prompts = await courseVisualService.getVisualPrompts(documentId)

// Kurs görsellerini getirme
const images = await courseVisualService.getCourseImages(documentId)
```

### **Enhanced Content Service**
```javascript
// Gelişmiş içerik üretimi
const enhancedContent = await enhancedContentService.generateEnhancedContent(documentId)

// Segment içeriği alma
const segmentContent = await enhancedContentService.getSegmentContent(segmentIds)

// Lesson içeriği üretimi
const lessonContent = await enhancedContentService.generateLessonContent(lesson, context)

// İçerik kalitesi değerlendirmesi
const qualityScore = await enhancedContentService.assessContentQuality(content)
```

### **Master Pipeline Service**
```javascript
// Tam pipeline çalıştırma
const pipelineResult = await masterPipelineService.runFullPipeline(pdfFile, userId)

// Pipeline durumu alma
const pipelineStatus = await masterPipelineService.getPipelineStatus(pipelineId)

// Kullanıcı pipeline geçmişi
const userPipelines = await masterPipelineService.getUserPipelines(userId)

// Pipeline sonuçları
const result = {
  success: true,
  pipelineId: 'uuid',
  documentId: 'uuid',
  data: {
    segments: [...],
    courseStructure: {...},
    courseImages: [...],
    enhancedContent: {...}
  }
}
```

### **RAG Services**
```javascript
// Embedding Service
const embeddingService = new EmbeddingService();

// Metin için embedding oluşturma
const embeddings = await embeddingService.generateEmbeddings(text);

// Benzer içerik bulma
const similarContent = await embeddingService.findSimilarContent(query, limit);

// Retrieval Service (Mevcut Yapıya Entegre)
const retrievalService = new RetrievalService(embeddingService);

// İlgili bağlamları çekme
const relevantContext = await retrievalService.findRelevantContext(currentChapter, courseStructure);

// Knowledge Base Service
const knowledgeBaseService = new KnowledgeBaseService();

// İçerik ekleme
await knowledgeBaseService.addContent({
  chapterId: 'uuid',
  content: 'text',
  embeddings: [...],
  metadata: {...}
});

// Semantic search
const results = await knowledgeBaseService.searchSimilar(query, limit);
```

### **Mind Map & Learning Path Services**
```javascript
// Mind Map Service
const mindMapService = new MindMapService();

// Mind map oluşturma
const mindMap = await mindMapService.createMindMap({
  documentId: 'uuid',
  type: 'course_mindmap',
  title: 'Mind Map Başlığı',
  centralTopic: 'Merkez Konu',
  content: [{ topic: 'Ana Dal', subtopics: ['Alt Konu 1', 'Alt Konu 2'] }],
  modelUsed: 'gemini-1.5-flash',
  metadata: { generationTime: 5000 }
});

// Mind map'leri getirme
const mindMaps = await mindMapService.getAllMindMaps(documentId);

// Learning Path Service
const learningPathService = new LearningPathService();

// Learning path oluşturma
const learningPath = await learningPathService.createLearningPath({
  documentId: 'uuid',
  type: 'course_learning_path',
  title: 'Learning Path Başlığı',
  description: 'Açıklama',
  steps: [{ title: 'Adım 1', description: 'Açıklama' }],
  modelUsed: 'gemini-1.5-flash',
  metadata: { generationTime: 3000 }
});

// Learning path'leri getirme
const learningPaths = await learningPathService.getAllLearningPaths(documentId);

// Mind Map Generator Service
const mindMapGeneratorService = new MindMapGeneratorService();

// Mind map üretimi
const mindMapResult = await mindMapGeneratorService.generateMindMap({
  documentId: 'uuid',
  segmentIds: ['segment-1', 'segment-2'],
  enhancedContent: enhancedContentData,
  courseStructure: courseStructureData
});

// Learning Path Generator Service
const learningPathGeneratorService = new LearningPathGeneratorService();

// Learning path üretimi
const learningPathResult = await learningPathGeneratorService.generateLearningPath({
  documentId: 'uuid',
  segmentIds: ['segment-1', 'segment-2'],
  enhancedContent: enhancedContentData,
  courseStructure: courseStructureData
});

// 3D Force Graph Service
const forceGraph3DService = new ForceGraph3DService();

// 3D mind map oluşturma
forceGraph3DService.createMindMap3D(mindMapData, containerElement);

// 3D learning path oluşturma
forceGraph3DService.createLearningPath3D(learningPathData, containerElement);

// 3D scene temizleme
forceGraph3DService.cleanup();
```

### **PDF Text Extraction Service**
```javascript
// PDF segment içeriği çıkarma
const extractedContent = await pdfTextExtractionService.extractSegmentContent(documentId, segmentIds)

// Çıkarılan içeriği kaydetme
await pdfTextExtractionService.saveExtractedContent(segmentId, extractedContent)

// Görsel ve tablo çıkarma
const images = await pdfTextExtractionService.extractImagesFromPage(page)
const tables = await pdfTextExtractionService.detectTablesFromText(text)
```

### **Segment Service**
```javascript
// Segment oluşturma
const segments = await segmentService.createSegmentsForDocument(documentId)

// Segment listesi
const segmentList = await segmentService.getDocumentSegments(documentId)

// Status güncelleme
await segmentService.updateSegmentStatus(segmentId, 'text_status', 'COMPLETED')
```

## 🤝 **Katkıda Bulunma**

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 **Lisans**

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 **İletişim**

- **Proje Linki**: [https://github.com/mertunver31/edugem](https://github.com/mertunver31/edugem)
- **Issues**: [GitHub Issues](https://github.com/mertunver31/edugem/issues)

## 📋 **Dokümantasyon Notları**

### **Sistem Açıklamaları Politikası**
Bu projede eklenen her yeni sistem, algoritma veya pipeline için **mutlaka detaylı açıklama** yapılmalıdır. Bu açıklamalar şunları içermelidir:

1. **Sistem Mimarisi**: Nasıl çalıştığı ve bileşenleri
2. **Algoritma Detayları**: Kullanılan algoritmalar ve kurallar
3. **Kod Örnekleri**: Önemli kod parçaları ve kullanım örnekleri
4. **Teknoloji Stack**: Hangi teknolojilerin kullanıldığı
5. **Performans Metrikleri**: Sistem performansı ve sınırları

### **Yeni Sistem Ekleme Kuralları**
- ✅ Sistem mimarisini açıkla
- ✅ Algoritma detaylarını belirt
- ✅ Kod örnekleri ekle
- ✅ Kullanılan teknolojileri listele
- ✅ Performans metriklerini belirt
- ❌ Sadece "yapıldı" demek yeterli değil

---

<div align="center">

**EduGems** - AI destekli eğitim platformu 🎓

*PDF'leri öğrenme materyallerine dönüştürüyoruz*

</div> 