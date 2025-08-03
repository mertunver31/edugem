# 📋 PDF Processing & AI Integration Roadmap

## 🎯 Proje Özeti
Bu roadmap, PDF materyallerinin yapay zeka ile işlenmesi ve ders içeriklerine dönüştürülmesi için kapsamlı bir geliştirme planını içerir.

---

## 📅 FAZ 1: Core Infrastructure (7 Gün)

### ✅ **GÜN 1: Temel Altyapı** - **TAMAMLANDI** 🎉

#### **Tamamlanan Görevler:**
- [x] **Storage Bucket Oluşturma**
  - `student-pdfs` bucket'ı oluşturuldu
  - Dosya yükleme testleri başarılı ✅
- [x] **Database Tabloları**
  - `documents` tablosu oluşturuldu ✅
  - `segments` tablosu oluşturuldu ✅
  - Gerekli sütunlar ve veri tipleri tanımlandı ✅
- [x] **Edge Function (pdf_broker)**
  - `supabase/functions/pdf_broker/index.ts` oluşturuldu ✅
  - Webhook payload parsing ✅
  - Dosya validasyonu (PDF tipi, 20MB limit) ✅
  - Database kayıt oluşturma ✅
  - CORS handling ✅
- [x] **Storage Webhook**
  - Supabase Dashboard'da webhook yapılandırıldı ✅
  - `on_object_created` event'i tetikleniyor ✅
  - `student-pdfs` bucket'ına özel filtreleme ✅
- [x] **RLS Policies**
  - `database_rls_policies.sql` oluşturuldu ✅
  - User-based access control ✅
  - Service role permissions ✅
- [x] **Frontend Integration**
  - `pdfService.js` oluşturuldu ✅
  - PDF upload fonksiyonu ✅
  - Error handling ve validation ✅
  - Test alanı (PDFTestArea komponenti) ✅
- [x] **Test Infrastructure**
  - PDF Test alanı anasayfaya eklendi ✅
  - Modüler test komponenti ✅
  - Sonuç görüntüleme ve logging ✅

#### **Test Sonuçları:**
- ✅ PDF yükleme başarılı
- ✅ Storage'a dosya kaydedildi
- ✅ Webhook tetiklendi
- ✅ Edge Function çalıştı
- ✅ Database'e kayıt oluştu

#### **Oluşturulan Dosyalar:**
- `supabase/functions/pdf_broker/index.ts`
- `src/services/pdfService.js`
- `src/components/PDFTestArea/PDFTestArea.jsx`
- `src/components/PDFTestArea/PDFTestArea.css`
- `database_rls_policies.sql`
- `SUPABASE_SETUP.md`

---

### ✅ **GÜN 2: PDF İşleme Geliştirmeleri** - **TAMAMLANDI** 🎉

#### **Tamamlanan Görevler:**
- [x] **PDF.js Entegrasyonu** → PDF-lib ile değiştirildi
  - PDF sayfa sayısı sayma (PDF-lib ile kesin sonuç) ✅
  - Dosya metadata çıkarma (PDF-lib ile) ✅
  - PDF.js kütüphanesi kaldırıldı ✅
- [x] **Gelişmiş Error Handling**
  - Detaylı hata mesajları ✅
  - Error logging sistemi (console logları) ✅
  - Retry mekanizması (şimdilik manuel) ✅
- [x] **Monitoring & Logging**
  - Edge Function logları (devam ediyor) ✅
  - Performance metrics (devam ediyor) ✅
  - Error tracking (devam ediyor) ✅

#### **Teknik Detaylar:**
```javascript
// PDF-lib ile sayfa sayısı sayma ve metadata çıkarma
import { PDFDocument } from 'pdf-lib';

const getPageCount = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  return pdfDoc.getPageCount();
};

const extractMetadata = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const info = pdfDoc.getInfo();
  return {
    title: info.Title,
    author: info.Author,
    // ... diğer metadata alanları
  };
};
```

#### **Kontrol Noktaları:**
- [x] PDF sayfa sayısı doğru hesaplanıyor mu? (PDF-lib ile evet)
- [x] Error handling tüm senaryoları kapsıyor mu? (Geliştirildi)
- [x] Logging sistemi çalışıyor mu? (Console logları mevcut)

---

### ✅ **GÜN 3: Document Understanding Hazırlığı** - **TAMAMLANDI** 🎉

#### **Tamamlanan Görevler:**
- [x] **Google Gemini API Setup**
  - API key yapılandırması ✅
  - Gemini client kurulumu ✅
  - Rate limiting ayarları ✅
- [x] **PDF Chunking Algoritması**
  - 20 sayfalık pencere sistemi ✅
  - Overlap stratejisi ✅
  - Token hesaplama ✅
- [x] **Test PDF'leri Hazırlama**
  - Farklı boyutlarda test dosyaları ✅
  - Çeşitli içerik türleri ✅

#### **Teknik Detaylar:**
```javascript
// Chunking algoritması
const createPDFChunks = (totalPages, chunkSize = 20) => {
  const chunks = [];
  for (let i = 0; i < totalPages; i += chunkSize) {
    const startPage = i + 1;
    const endPage = Math.min(i + chunkSize, totalPages);
    
    chunks.push({
      id: `chunk_${chunks.length + 1}`,
      start: startPage,
      end: endPage,
      size: endPage - startPage + 1,
      overlap: i > 0 ? 2 : 0 // İlk chunk hariç 2 sayfa overlap
    });
  }
  return chunks;
};

// Token hesaplama
const estimateTokens = (text) => {
  return Math.ceil(text.length / 4); // 4 karakter ≈ 1 token
};
```

#### **Oluşturulan Dosyalar:**
- `src/services/geminiService.js`
- `src/components/GeminiTestArea/GeminiTestArea.jsx`
- `src/components/GeminiTestArea/GeminiTestArea.css`

#### **Test Sonuçları:**
- ✅ Gemini API bağlantısı başarılı
- ✅ PDF chunking algoritması çalışıyor
- ✅ Token hesaplama doğru
- ✅ Text generation çalışıyor
- ✅ Rate limiting kontrolü aktif

#### **PDF Persistence Fix (Son Güncelleme):**
- ✅ Edge Function'da `file_name` sütunu hatası düzeltildi
- ✅ Frontend'den direkt database kayıt oluşturma eklendi
- ✅ Storage metadata ile page count aktarımı
- ✅ Duplicate record kontrolü
- ✅ PDF'ler artık sayfa yenilemesinden sonra da görünüyor

---

### ✅ **GÜN 4: Gemini Document Understanding** - **TAMAMLANDI** 🎉

#### **Tamamlanan Görevler:**
- [x] **Gemini API Format Düzeltmesi** ✅
  - PDF dosyası yükleme formatı düzeltildi
  - `fileData` yapısı doğru formatta (Gemini files.upload)
  - `mimeType` ve `fileUri` alanları eklendi
  - Model güncellendi: `gemini-1.5-flash` (hızlı ve verimli)
  - Rate limits güncellendi: 15 RPM, 250k TPM, 1000 RPD
  - Gemini files.upload API entegrasyonu tamamlandı
  - Verimli Base64 dönüştürme (chunk yöntemi)
  - Environment variable hatası düzeltildi (`process.env` → `import.meta.env`)
  - `.env` dosyası oluşturuldu
  - **CORS Sorunu Çözüldü:** Edge Function ile backend processing
  - **Yeni Edge Function:** `gemini_document_understanding` oluşturuldu
  - **Frontend Basitleştirildi:** Sadece Edge Function çağrısı
- [x] **Outline Çıkarma** ✅
  - Başlık yapısı analizi ✅
  - Sayfa numaraları ✅
  - JSON formatında kaydetme ✅
  - **Markdown Format Sorunu Çözüldü:** ```json temizleme eklendi
- [x] **Error Handling** ✅
  - API limit aşımı (429 quota hatası) ✅
  - Retry logic eklendi (15 saniye bekleme) ✅
  - Network errors ✅
  - JSON parse hataları ✅

#### **Test Sonuçları:**
- ✅ Document Understanding testi başarılı
- ✅ PDF'ler başarıyla analiz ediliyor
- ✅ JSON outline çıkarılıyor
- ✅ Database'e kaydediliyor
- ✅ Markdown format sorunu çözüldü
- ✅ Quota hatası retry logic ile çözüldü

#### **Oluşturulan Dosyalar:**
- `supabase/functions/gemini_document_understanding/index.ts`
- `src/services/documentUnderstandingService.js`
- `src/components/DocumentUnderstandingTest/DocumentUnderstandingTest.jsx`

#### **Teknik Detaylar:**
```javascript
// Gemini Document Understanding
const extractDocumentOutline = async (fileUrl) => {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-preview' 
  });
  
  const fileData = {
    mimeType: 'application/pdf',
    uri: fileUrl
  };
  
  const result = await model.generateContent([
    prompt,
    fileData
  ]);
  
  return result.response.text();
};
```

---

### 📋 **GÜN 5: Segment Planner** - **TAMAMLANDI** ✅

#### **Tamamlanan Görevler:**
- [x] **Segment Oluşturma Algoritması** ✅
  - Outline tabanlı bölümleme ✅
  - Sayfa aralıkları hesaplama ✅
  - Segment metadata ✅
  - Büyük section'ları alt segmentlere bölme ✅
  - Sayfa bazlı segmentler (fallback) ✅
  - Validation sistemi ✅
- [x] **Database Entegrasyonu** ✅
  - Segment kayıtları oluşturma ✅
  - İlişkisel bağlantılar ✅
  - Status tracking ✅
  - Duplicate prevention ✅
  - Segment getirme fonksiyonu ✅
  - Status güncelleme fonksiyonu ✅
- [x] **Validation** ✅
  - Segment bütünlüğü kontrolü ✅
  - Overlap kontrolü ✅
  - Duplicate prevention ✅
  - Sayfa aralığı kontrolü ✅
  - Segment numarası kontrolü ✅

#### **Oluşturulan Dosyalar:**
- `src/services/segmentService.js` ✅
- `src/components/SegmentPlannerTest/SegmentPlannerTest.jsx` ✅
- `src/components/SegmentPlannerTest/SegmentPlannerTest.css` ✅

#### **Segment Algoritması Özellikleri:**
```javascript
// Segment oluşturma algoritması
class SegmentService {
  maxSegmentSize = 20; // Maksimum sayfa sayısı
  minSegmentSize = 5;  // Minimum sayfa sayısı
  
  // Outline tabanlı bölümleme
  createSegmentsFromOutline(document, outline)
  
  // Büyük section'ları böl
  splitLargeSection(section, startSegNo)
  
  // Validation sistemi
  validateSegments(segments, totalPages)
  
  // Database kaydetme
  saveSegmentsToDatabase(documentId, segments)
  
  // Segment getirme
  getDocumentSegments(documentId)
  
  // Status güncelleme
  updateSegmentStatus(segmentId, statusType, status)
}
```

#### **Database Entegrasyonu Özellikleri:**
- ✅ **Duplicate Prevention**: Mevcut segment'ler silinir, yenileri eklenir
- ✅ **Status Tracking**: `text_status` ve `img_status` alanları
- ✅ **İlişkisel Bağlantılar**: `document_id` ile document'e bağlantı
- ✅ **Metadata Storage**: `raw_json` alanında ek bilgiler
- ✅ **Sıralama**: `seg_no` ile segment sıralaması

#### **Validation Özellikleri:**
- ✅ **Sayfa Aralığı**: Geçerli sayfa numaraları kontrolü
- ✅ **Overlap Kontrolü**: Ardışık segmentler arası çakışma kontrolü (≥ sembolü ile)
- ✅ **Segment Boyutu**: Minimum/maksimum boyut kontrolü (minSegmentSize: 3)
- ✅ **Kapsama Kontrolü**: Tüm sayfaların kapsanması
- ✅ **Boşluk Kontrolü**: Bölümler arası eksik sayfa tespiti
- ✅ **Segment Numarası**: Sıralı numaralandırma kontrolü
- ✅ **Küçük Segment Birleştirme**: minSegmentSize'den küçük segmentler otomatik birleştirilir

#### **Teknik Detaylar:**
```sql
-- Segment oluşturma
INSERT INTO segments (
  document_id, seg_no, title, p_start, p_end, 
  text_status, img_status, created_at
) VALUES (
  $1, $2, $3, $4, $5, 'PENDING', 'PENDING', NOW()
);
```

---

### ⚙️ **GÜN 6: Worker System**

#### **Görevler:**
- ✅ **AŞAMA 1 TAMAMLANDI: Task Queue Sistemi**
  - ✅ Database schema (task_queue, worker_results tabloları)
  - ✅ Concurrency control (SELECT ... FOR UPDATE)
  - ✅ Status management (PENDING, PROCESSING, COMPLETED, FAILED)
  - ✅ Helper functions (lock_task, complete_task, fail_task)
  - ✅ TaskQueueService (modüler yapı)
  - ✅ TaskQueueTest component (UI test alanı)
  - ✅ Dashboard entegrasyonu
- 🔄 **AŞAMA 2: Text Worker**
  - Segment text processing
  - Gemini text generation
  - Markdown formatting
- 🔄 **AŞAMA 3: Image Worker**
  - Image generation
  - Chart creation
  - Visual content


#### **Teknik Detaylar:**
```javascript
// Worker queue
const getPendingSegments = async () => {
  const { data } = await supabase
    .from('segments')
    .select('*')
    .eq('text_status', 'PENDING')
    .limit(15)
    .order('created_at', { ascending: true });
  
  return data;
};
```

---

### 🧪 **GÜN 7: Test & Optimizasyon**

#### **Görevler:**
- [ ] **1000 Sayfa Testi**
  - Büyük PDF işleme
  - Performance metrics
  - Memory usage
- [ ] **Rate Limiting**
  - API quota management
  - Retry strategies
  - Backoff algorithms
- [ ] **Error Recovery**
  - Failed segment retry
  - Partial success handling
  - Data consistency

---

## 📅 FAZ 2: Gemini AI Integration (5 Gün)

### **GÜN 8-12: AI Model Entegrasyonu**
- [ ] **gemini-2.5-flash-lite** entegrasyonu
- [ ] **gemini-2.0-flash-preview** entegrasyonu
- [ ] **Token optimization**
- [ ] **Response processing**
- [ ] **Content generation**

---

## 📅 FAZ 3: Worker System (3 Gün)

### **GÜN 13-15: Asenkron İşleme**
- [ ] **Cron job setup**
- [ ] **Worker deployment**
- [ ] **Queue management**
- [ ] **Status tracking**

---

## 📅 FAZ 4: Test & Optimization (2 Gün)

### **GÜN 16-17: Final Testing**
- [ ] **End-to-end testing**
- [ ] **Performance optimization**
- [ ] **Error handling**
- [ ] **Documentation**

---

## 🔧 Teknik Gereksinimler

### **Paketler:**
```json
{
  "pdf-lib": "^1.17.1",
  "@google/generative-ai": "^0.2.1",
  "cron": "^2.4.4"
}
```

### **API Keys:**
- Google Gemini API Key ✅
- Supabase Service Role Key ✅

### **Database Indexes:**
```sql
CREATE INDEX idx_segments_status ON segments(text_status, img_status);
CREATE INDEX idx_segments_document ON segments(document_id);
CREATE INDEX idx_documents_user ON documents(user_id);
```

---

## 🎯 Başarı Metrikleri

### **Performans:**
- PDF işleme süresi: < 30 saniye (20 sayfa)
- API response time: < 5 saniye
- Error rate: < %5

### **Kalite:**
- Outline accuracy: > %90
- Segment quality: > %85
- Content relevance: > %80

---

## 📊 Günlük Raporlama

### **Rapor Formatı:**
```
📅 GÜN X RAPORU
✅ Tamamlanan: [görev listesi]
❌ Sorunlar: [varsa]
📈 Metrikler: [performans verileri]
🎯 Sonraki: [planlanan görevler]
```

---

## 🚨 Risk Yönetimi

### **Teknik Riskler:**
- API rate limits
- Token overflow
- Memory leaks
- Network timeouts

### **Çözümler:**
- Exponential backoff
- Chunking strategies
- Error recovery
- Monitoring alerts

---

*Bu roadmap, projenin PDF işleme ve AI entegrasyonu için kapsamlı bir geliştirme planını içerir. Her faz, önceki fazın tamamlanmasına bağlıdır.* 