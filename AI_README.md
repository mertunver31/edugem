# 🤖 Yapay Zeka Entegrasyonu - Proje Dokümantasyonu

Bu dokümantasyon, projemizde kullanılan yapay zeka tekniklerini ve entegrasyonlarını detaylı olarak açıklar.

---

## 📚 PDF İşleme ve AI Entegrasyonu

### 🎯 Genel Bakış
PDF Broker Agent sistemi, kullanıcıların yüklediği PDF dosyalarını Google Gemini AI kullanarak işleyen, bölümleyen ve eğitim içeriğine dönüştüren kapsamlı bir sistemdir.

### 🏗️ Sistem Mimarisi

```
PDF Upload → Supabase Storage → Webhook → Edge Function → Gemini AI → Database
```

### 📋 Teknik Bileşenler

#### 1. **Upload Tetikleyicisi**
- **Teknoloji**: Supabase Storage Webhook
- **Fonksiyon**: `on_object_created` → `pdf_broker`
- **İşlem**: 
  - PDF dosyası yüklendiğinde otomatik tetikleme
  - `documents.status = 'UPLOADED'` güncelleme
  - Dosya boyutu ve sayfa sayısı denetimi

#### 2. **PDF İşleme Stratejisi**
- **Teknoloji**: `pdfjs-dist`, `PyPDF2`, `pdf-lib`
- **Limitler**:
  - Maksimum dosya boyutu: 20 MB
  - Sayfa penceresi: 20 sayfa
  - Token sınırı: ~10,000 token
- **İşlemler**:
  - Sayfa sayısı tespiti
  - Büyük dosyaların parçalanması
  - Optimal chunk boyutları

#### 3. **Google Gemini AI Entegrasyonu**
- **Model**: Document Understanding API
- **Endpoint**: `POST /v1beta/files:upload`
- **Özellikler**:
  - Native PDF işleme
  - Başlık ve yapı çıkarma
  - Content structure analizi
- **Çıktı Formatı**:
```json
{
  "content_structure": {
    "headings": [
      {"text": "Nöron", "page": 55},
      {"text": "Sinaps", "page": 72}
    ]
  }
}
```

#### 4. **Segment Planner Algoritması**
- **Mantık**: Her başlık için segment oluşturma
- **Kural**: Maksimum 20 sayfa/segment
- **Algoritma**:
```sql
FOR each heading in outline:
    start = heading.page
    end = next_heading.page - 1 (or last)
    IF end - start > 20:
        split into equal ≈20-page blocks
    create segment record
```

#### 5. **Veritabanı Yapısı**

##### Documents Tablosu
```sql
{
  "id": "uuid",
  "user_id": "uuid", 
  "file_path": "student-pdfs/file.pdf",
  "page_count": 100,
  "status": "UPLOADED",
  "raw_outline": {"headings": [{"text": "Nöron", "page": 55}]}
}
```

##### Segments Tablosu
```sql
{
  "seg_no": 3,
  "title": "Nöron Yapısı",
  "p_start": 55,
  "p_end": 72,
  "text_status": "PENDING",
  "img_status": "PENDING"
}
```

#### 6. **Task Kuyruğu Sistemi**
- **Status Tracking**: `PENDING` → `PROCESSING` → `COMPLETED`
- **Worker Cron**: N≤15 segment/döngü
- **Rate Limiting**: RPM/RPD aşımını önleme
- **Error Handling**: `retry_count` ve exponential backoff

#### 7. **Gemini Model Stratejisi**
| İş | Model | Dosya İletimi | Not |
|---|---|---|---|
| Başlık/outline | Document Understanding | files.upload → URL referansı | Tek sefer |
| Metin özeti | gemini-2.5-flash-lite | prompt + kısa metin (≤10k token) | Ücretsiz |
| Görsel/Tablo | gemini-2.0-flash-preview | response_modalities=["TEXT","IMAGE"] | Ücretsiz preview |

#### 8. **Token Optimizasyonu**
- **Hesaplama**: ≈ 4 karakter ≈ 1 token
- **20 sayfa**: ≈ 10,000 karakter ≈ 2,500 token
- **Güvenli Sınır**: Hem text hem görsel çağrısı için optimal

#### 9. **Depolama Stratejisi**
- **Metin**: `segments.text_md` (Markdown formatı)
- **Görsel**: `generated-media/seg_{id}.png`
- **CDN URL**: `segments.img_url` (Public/secure URL)
- **JSON**: `raw_outline` ve `raw_json` (Denetim & yeniden işleme)

#### 10. **Hata Yönetimi**
- **Tasks Tablosu**: Error tracking ve logging
- **Retry Logic**: Exponential backoff algoritması
- **Max Retries**: 3 deneme limiti
- **Admin Alert**: FAILED durumları için uyarı sistemi

### 🔄 İş Akışı

1. **PDF Upload**: Kullanıcı dosyayı yükler
2. **Webhook Tetikleme**: Storage event → Edge Function
3. **Dosya Analizi**: Boyut ve sayfa sayısı kontrolü
4. **Gemini Upload**: 20 sayfalık pencerelerle yükleme
5. **Outline Çıkarma**: Başlık ve yapı analizi
6. **Segment Oluşturma**: Planner algoritması
7. **Task Kuyruğu**: İşlem sırası oluşturma
8. **Worker İşleme**: Asenkron içerik üretimi
9. **Sonuç Depolama**: Database ve storage'a kaydetme

### 📊 Performans Metrikleri

- **1000 sayfa PDF**: ≈ 50 segment (20 sayfa blok)
- **İşlem Süresi**: Segment başına ~30-60 saniye
- **Token Kullanımı**: Segment başına ~2,500 token
- **Başarı Oranı**: %95+ (retry mekanizması ile)

### 🛡️ Güvenlik

- **RLS Politikaları**: Kullanıcı bazlı erişim kontrolü
- **API Rate Limiting**: Gemini API sınırları
- **Dosya Doğrulama**: PDF format kontrolü
- **Error Logging**: Güvenli hata kayıtları

### 🔧 Geliştirme Aşamaları

| Gün | Yapılacak |
|---|---|
| 1 | Bucket oluştur, Storage webhook→Edge Function kur |
| 2 | documents, segments tabloları + RLS politikaları |
| 3 | PDF Broker Agent kodu; <20 MB test PDF'leri |
| 4 | Document-Understanding entegrasyonu, outline alma |
| 5 | Segment Planner algoritması ↔ DB yazma |
| 6 | Worker cron (Text & Visual) için SELECT … FOR UPDATE kuyruğu |
| 7 | 1000 sayfa senaryosu simülasyonu, kota & hız testleri |

### 📝 Notlar

- **Maliyet Kontrolü**: Token limitleri ile bütçe yönetimi
- **Ölçeklenebilirlik**: Büyük PDF'ler için optimize edilmiş
- **Modüler Yapı**: Her bileşen bağımsız çalışır
- **Asenkron İşleme**: Non-blocking architecture

---

## 🚀 Gelecek AI Entegrasyonları

Bu bölüm, projenin ilerleyen aşamalarında eklenecek diğer AI özelliklerini belgeleyecektir.

### Planlanan Özellikler:
- [ ] Ses Sentezi (Text-to-Speech)
- [ ] Görsel Tanıma (Computer Vision)
- [ ] Doğal Dil İşleme (NLP)
- [ ] Öğrenci Performans Analizi
- [ ] Kişiselleştirilmiş Öğrenme Yolları

---

*Bu dokümantasyon sürekli güncellenmektedir. Son güncelleme: [Tarih]* 