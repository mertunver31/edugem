# 🔧 Supabase Kurulum Rehberi

Bu rehber, PDF Broker Agent sisteminin Supabase'de kurulumunu adım adım açıklar.

---

## 📋 Ön Gereksinimler

- Supabase CLI kurulu
- Supabase projesi oluşturulmuş
- `student-pdfs` bucket'ı oluşturulmuş
- `documents` ve `segments` tabloları oluşturulmuş

---

## 🚀 Edge Function Kurulumu

### 1. Supabase CLI ile Giriş
```bash
# Supabase CLI'ye giriş yap
supabase login

# Projeyi bağla
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Edge Function Oluşturma
```bash
# pdf_broker fonksiyonunu oluştur
supabase functions new pdf_broker
```

### 3. Fonksiyonu Deploy Etme
```bash
# Fonksiyonu deploy et
supabase functions deploy pdf_broker
```

### 4. Environment Variables Ayarlama
```bash
# Supabase URL ve Service Role Key'i ayarla
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🔗 Storage Webhook Kurulumu

### 1. Supabase Dashboard'da Webhook Oluşturma

1. **Supabase Dashboard**'a git
2. **Database** → **Hooks** sekmesine git
3. **Create a new hook** butonuna tıkla
4. Aşağıdaki ayarları yap:

#### Webhook Ayarları:
- **Name**: `pdf_broker_webhook`
- **Table**: `storage.objects`
- **Events**: `INSERT` seç
- **HTTP Method**: `POST`
- **URL**: `https://your-project-ref.supabase.co/functions/v1/pdf_broker`
- **Headers**: 
  ```
  Authorization: Bearer your_service_role_key
  Content-Type: application/json
  ```

#### Filter Ayarları:
- **Column**: `bucket_id`
- **Operator**: `eq`
- **Value**: `student-pdfs`

### 2. Webhook Test Etme

1. **Test** sekmesine git
2. **Send test request** butonuna tıkla
3. Aşağıdaki test verisini kullan:

```json
{
  "type": "INSERT",
  "table": "storage.objects",
  "record": {
    "id": "test-file-id",
    "bucket_id": "student-pdfs",
    "name": "test-user/test.pdf",
    "size": 1024000,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "old_record": null
}
```

---

## 🔐 RLS Politikalarını Uygulama

### 1. SQL Editor'da RLS Politikalarını Çalıştırma

1. **Supabase Dashboard**'a git
2. **SQL Editor**'a git
3. `database_rls_policies.sql` dosyasındaki SQL kodlarını çalıştır

### 2. Politikaları Doğrulama

```sql
-- RLS'nin aktif olduğunu kontrol et
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('documents', 'segments');

-- Politikaları listele
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('documents', 'segments');
```

---

## 🧪 Test Senaryoları

### 1. PDF Yükleme Testi

```javascript
// Frontend'de test et
import { uploadPDF } from './services/pdfService'

const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

try {
  const result = await uploadPDF(testFile)
  console.log('Upload result:', result)
} catch (error) {
  console.error('Upload error:', error)
}
```

### 2. Webhook Tetikleme Testi

```bash
# Edge Function'ı manuel test et
curl -X POST https://your-project-ref.supabase.co/functions/v1/pdf_broker \
  -H "Authorization: Bearer your_service_role_key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "record": {
      "bucket_id": "student-pdfs",
      "name": "test-user/test.pdf",
      "size": 1024000
    }
  }'
```

### 3. Veritabanı Kayıt Kontrolü

```sql
-- Documents tablosunu kontrol et
SELECT * FROM documents ORDER BY created_at DESC LIMIT 5;

-- Segments tablosunu kontrol et
SELECT * FROM segments ORDER BY created_at DESC LIMIT 5;
```

---

## 🔍 Hata Ayıklama

### 1. Edge Function Logları

```bash
# Fonksiyon loglarını görüntüle
supabase functions logs pdf_broker --follow
```

### 2. Webhook Logları

1. **Supabase Dashboard** → **Database** → **Hooks**
2. Webhook'u seç
3. **Logs** sekmesine git

### 3. Yaygın Hatalar

#### Hata: "Function not found"
- Fonksiyonun deploy edildiğinden emin ol
- URL'in doğru olduğunu kontrol et

#### Hata: "Unauthorized"
- Service Role Key'in doğru olduğunu kontrol et
- Authorization header'ının doğru formatlandığını kontrol et

#### Hata: "RLS policy violation"
- RLS politikalarının doğru uygulandığını kontrol et
- Service role'un tüm tablolara erişimi olduğunu kontrol et

---

## 📊 Monitoring

### 1. Supabase Dashboard Metrikleri

- **Database**: Query performance, connection count
- **Storage**: Bucket usage, file count
- **Edge Functions**: Invocation count, error rate

### 2. Custom Monitoring

```sql
-- Webhook tetikleme sayısını kontrol et
SELECT 
  DATE(created_at) as date,
  COUNT(*) as document_count,
  AVG(file_size) as avg_file_size
FROM documents 
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🔄 Sonraki Adımlar

1. ✅ **FAZ 1 Tamamlandı**: Temel altyapı hazır
2. 🔄 **FAZ 2'ye Geç**: Gemini AI entegrasyonu
3. 📝 **Test Sonuçlarını Raporla**: Başarı kriterlerini kontrol et

---

*Bu rehber, projenin ihtiyaçlarına göre güncellenebilir.* 