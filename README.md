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

#### **GÜN 10: Integration & API** 🔄
- 🔄 REST API - Dış sistem entegrasyonu
- 🔄 Export Features - Dışa aktarma
- 🔄 Webhook System - Webhook sistemi
- 🔄 Third-party Integrations - Üçüncü parti entegrasyonlar

#### **GÜN 11: Production Ready** 🔄
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
│   └── supabaseService.js     # Supabase bağlantısı
├── config/                    # Konfigürasyon
│   └── supabase.js           # Supabase client
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

### **End-to-End PDF Processing Pipeline**
```
PDF Upload → Metadata Extraction → Gemini AI Analysis → Outline Generation → Segment Planning → Text Worker → Image Worker → Final Results
```

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
- **Google Gemini AI** - PDF analizi ve content generation
- **Hugging Face API** - Görsel üretimi (Stable Diffusion XL)
- **PDF-lib** - PDF metadata extraction
- **Custom Algorithms** - Segment planning ve validation

## 📈 **Performans**

### **PDF Processing**
- **Upload Limit**: 20MB per PDF
- **Processing Time**: ~30-60 saniye (PDF boyutuna göre)
- **AI Response**: Gemini API ile hızlı analiz
- **Validation**: Real-time segment validation

### **Database**
- **Segments Table**: Optimized indexing
- **Documents Table**: Efficient storage
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

---

<div align="center">

**EduGems** - AI destekli eğitim platformu 🎓

*PDF'leri öğrenme materyallerine dönüştürüyoruz*

</div> 