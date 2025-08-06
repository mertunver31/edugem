# Default Panoramik Görüntüler Kurulum Rehberi

Bu rehber, yeni kullanıcılar kayıt olduğunda otomatik olarak default panoramik görüntülerin atanması için gerekli adımları açıklar.

## 📋 Genel Bakış

Şu anda sistemde sadece bir kullanıcıda panoramik ortam dosyaları bulunmaktadır. Bu sistem, yeni kullanıcılar kayıt olduğunda bu default panoramik görüntülerin otomatik olarak onlara da atanmasını sağlar.

## 🚀 Kurulum Adımları

### 1. Migration Dosyasını Çalıştırın

Supabase Dashboard'da SQL Editor'ü açın ve aşağıdaki migration dosyasını çalıştırın:

```sql
-- supabase/migrations/20241202000000_default_panoramic_images.sql dosyasının içeriğini çalıştırın
```

### 2. Mevcut Default Panoramik Görüntüleri Ayarlayın

Mevcut panoramik görüntüleri default olarak ayarlamak için:

```sql
-- Mevcut panoramik görüntülerden default olanları bul ve default_panoramic_images tablosuna ekle
INSERT INTO default_panoramic_images (
    file_name,
    file_path,
    file_size,
    file_type,
    title,
    description,
    is_active,
    created_at,
    updated_at
)
SELECT 
    file_name,
    file_path,
    file_size,
    file_type,
    title,
    description,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM panoramic_images 
WHERE user_id = (
    -- İlk panoramik görüntüsü olan kullanıcıyı bul
    SELECT user_id 
    FROM panoramic_images 
    ORDER BY created_at 
    LIMIT 1
)
LIMIT 2; -- Sadece ilk 2 panoramik görüntüyü default olarak ayarla
```

### 3. Mevcut Kullanıcılara Default Panoramik Görüntüleri Atayın

Henüz panoramik görüntüsü olmayan kullanıcılara default panoramik görüntüleri atmak için:

```sql
-- Helper fonksiyonu çalıştır
SELECT assign_default_panoramic_images_to_existing_users();
```

## 🔧 Sistem Bileşenleri

### 1. `default_panoramic_images` Tablosu
- Default panoramik görüntüleri saklar
- Her görüntü için dosya bilgileri, başlık ve açıklama içerir
- `is_active` alanı ile görüntüleri aktif/pasif yapabilirsiniz

### 2. `assign_default_panoramic_images()` Fonksiyonu
- Yeni kullanıcı kayıt olduğunda çalışır
- Default panoramik görüntüleri yeni kullanıcıya kopyalar

### 3. Trigger Sistemi
- `auth.users` tablosuna yeni kayıt eklendiğinde otomatik çalışır
- Default panoramik görüntüleri yeni kullanıcıya atar

### 4. Helper Fonksiyonları
- `assign_default_panoramic_images_to_existing_users()`: Mevcut kullanıcılara default görüntüleri atar

## 📊 Kontrol Sorguları

### Default Panoramik Görüntüleri Kontrol Et
```sql
SELECT 
    'Default Panoramic Images' as table_name,
    COUNT(*) as count
FROM default_panoramic_images
WHERE is_active = true;
```

### Hangi Kullanıcıların Panoramik Görüntüsü Var
```sql
SELECT 
    'Users with Panoramic Images' as info,
    COUNT(DISTINCT user_id) as user_count,
    COUNT(*) as total_images
FROM panoramic_images;
```

### Hangi Kullanıcıların Panoramik Görüntüsü Yok
```sql
SELECT 
    'Users without Panoramic Images' as info,
    COUNT(*) as user_count
FROM auth.users u
LEFT JOIN panoramic_images pi ON u.id = pi.user_id
WHERE pi.id IS NULL;
```

## 🛠️ Yönetim İşlemleri

### Yeni Default Panoramik Görüntü Ekleme
```sql
INSERT INTO default_panoramic_images (
    file_name,
    file_path,
    file_size,
    file_type,
    title,
    description
) VALUES (
    'yeni_goruntu.jpg',
    '/storage/v1/object/public/panoramic-images/yeni_goruntu.jpg',
    5242880,
    'image/jpeg',
    'Yeni Default Görüntü',
    'Yeni default panoramik görüntü açıklaması'
);
```

### Default Panoramik Görüntüyü Güncelleme
```sql
UPDATE default_panoramic_images 
SET 
    title = 'Yeni Başlık',
    description = 'Yeni açıklama'
WHERE file_name = 'goruntu_adi.jpg';
```

### Default Panoramik Görüntüyü Devre Dışı Bırakma
```sql
UPDATE default_panoramic_images 
SET is_active = false 
WHERE file_name = 'goruntu_adi.jpg';
```

## 🔒 Güvenlik

- Default panoramik görüntüler tablosu RLS (Row Level Security) ile korunur
- Herkes default panoramik görüntüleri görebilir
- Sadece admin kullanıcılar default panoramik görüntüleri yönetebilir

## ⚠️ Önemli Notlar

1. **Dosya Yolları**: Default panoramik görüntülerin dosya yollarının doğru olduğundan emin olun
2. **Dosya Boyutları**: Gerçek dosya boyutlarını kullanın
3. **Dosya Türleri**: Doğru MIME türlerini belirtin
4. **Test**: Yeni bir test kullanıcısı oluşturarak sistemin çalıştığını doğrulayın

## 🧪 Test

Sistemin çalışıp çalışmadığını test etmek için:

1. Yeni bir test kullanıcısı oluşturun
2. Bu kullanıcının otomatik olarak default panoramik görüntülere sahip olup olmadığını kontrol edin
3. Gerekirse `assign_default_panoramic_images_to_existing_users()` fonksiyonunu çalıştırın

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Supabase loglarını kontrol edin
2. Trigger'ların doğru çalıştığından emin olun
3. RLS politikalarının doğru ayarlandığını kontrol edin 