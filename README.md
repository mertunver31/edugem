# 🎓 **EduGems - AI-Powered Educational Platform**

> **Modüler yapıda geliştirilmiş, AI destekli eğitim platformu**
> 
> PDF'leri otomatik analiz eden, segment'lere bölen ve öğrenme materyallerine dönüştüren modern web uygulaması.

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
Course Structure → AI Content Generation → Interactive Elements → Gamification → Progress Tracking → Assessment
```

**Gelişmiş İçerik Üretim Süreci:**
1. **Content Analysis**: Kurs yapısı ve segment'ler analiz edilir
2. **AI Content Generation**: Gemini AI ile eğitim içeriği üretilir
3. **Interactive Elements**: Etkileşimli elementler eklenir
4. **Gamification**: Oyunlaştırma özellikleri entegre edilir
5. **Progress Tracking**: Kullanıcı ilerleme takibi
6. **Assessment**: Otomatik değerlendirme oluşturma

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
  // Ana ders içeriği
  const lessonContent = await generateLessonContent(lesson);
  
  // Etkileşimli quiz
  const interactiveQuiz = await generateInteractiveQuiz(lesson);
  
  // Pratik alıştırma
  const practicalExercise = await generatePracticalExercise(lesson);
  
  // Oyunlaştırma görevi
  const gamifiedChallenge = await generateGamifiedChallenge(lesson);
  
  // Değerlendirme
  const assessment = await generateAssessment(lesson);
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

#### **GÜN 11: Web Application Interface** 🔄
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
│   ├── DevelopmentModeIndicator/ # Development mode göstergesi
│   ├── AvatarPage/            # Avatar oluşturma
│   └── PanoramicViewer/       # 360° görüntüleyici
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
│   └── supabaseService.js     # Supabase bağlantısı
├── config/                    # Konfigürasyon
│   ├── supabase.js           # Supabase client
│   └── development.js        # Development mode konfigürasyonu
└── styles/                    # Global stiller

supabase/
├── functions/                 # Edge Functions
│   ├── pdf_broker/           # PDF webhook handler
│   └── gemini_document_understanding/  # AI processing
└── migrations/               # Database migrations
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

### **11. Development Mode System**
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