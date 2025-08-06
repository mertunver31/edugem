-- =====================================================
-- UPDATE DEFAULT PANORAMIC IMAGES WITH REAL DATA
-- =====================================================
-- Bu script mevcut default panoramik görüntüleri gerçek verilerle günceller

-- =====================================================
-- 1. MEVCUT DEFAULT PANORAMIC IMAGES'LARI TEMİZLE
-- =====================================================

-- Önce mevcut default panoramik görüntüleri temizle
DELETE FROM default_panoramic_images;

-- =====================================================
-- 2. GERÇEK DEFAULT PANORAMIC IMAGES'LARI EKLE
-- =====================================================

-- Mevcut panoramik görüntülerden default olanları bul ve default_panoramic_images tablosuna ekle
-- Bu sorgu mevcut bir kullanıcıdaki panoramik görüntüleri default olarak ayarlar

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

-- =====================================================
-- 3. ALTERNATIF: MANUEL DEFAULT PANORAMIC IMAGES EKLEME
-- =====================================================

-- Eğer yukarıdaki sorgu çalışmazsa, manuel olarak default panoramik görüntüleri ekleyin
-- Aşağıdaki örnekleri gerçek dosya bilgileriyle değiştirin

/*
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
) VALUES 
(
    'gercek_dosya_adi_1.jpg',
    '/storage/v1/object/public/panoramic-images/gercek_dosya_adi_1.jpg',
    5242880, -- Gerçek dosya boyutu
    'image/jpeg',
    'Default Sınıf Ortamı 1',
    'Modern sınıf ortamı panoramik görüntüsü'
),
(
    'gercek_dosya_adi_2.jpg',
    '/storage/v1/object/public/panoramic-images/gercek_dosya_adi_2.jpg',
    6291456, -- Gerçek dosya boyutu
    'image/jpeg',
    'Default Sınıf Ortamı 2',
    'Geleneksel sınıf ortamı panoramik görüntüsü'
);
*/

-- =====================================================
-- 4. MEVCUT KULLANICILARA DEFAULT PANORAMIC IMAGES ATA
-- =====================================================

-- Henüz panoramik görüntüsü olmayan kullanıcılara default panoramik görüntüleri ata
INSERT INTO panoramic_images (
    user_id,
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
    u.id as user_id,
    dpi.file_name,
    dpi.file_path,
    dpi.file_size,
    dpi.file_type,
    dpi.title,
    dpi.description,
    dpi.is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users u
CROSS JOIN default_panoramic_images dpi
LEFT JOIN panoramic_images pi ON u.id = pi.user_id
WHERE pi.id IS NULL
AND dpi.is_active = true;

-- =====================================================
-- 5. KONTROL SORGULARI
-- =====================================================

-- Default panoramik görüntüleri kontrol et
SELECT 
    'Default Panoramic Images' as table_name,
    COUNT(*) as count
FROM default_panoramic_images
WHERE is_active = true;

-- Hangi kullanıcıların panoramik görüntüsü var
SELECT 
    'Users with Panoramic Images' as info,
    COUNT(DISTINCT user_id) as user_count,
    COUNT(*) as total_images
FROM panoramic_images;

-- Hangi kullanıcıların panoramik görüntüsü yok
SELECT 
    'Users without Panoramic Images' as info,
    COUNT(*) as user_count
FROM auth.users u
LEFT JOIN panoramic_images pi ON u.id = pi.user_id
WHERE pi.id IS NULL;

-- =====================================================
-- 6. TEST SORGULARI
-- =====================================================

-- Yeni bir test kullanıcısı oluştur ve default panoramik görüntülerin atanıp atanmadığını kontrol et
-- (Bu sorguları test ortamında çalıştırın)

/*
-- Test kullanıcısı oluştur (test ortamında)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'test@example.com',
    crypt('password', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
);

-- Test kullanıcısının panoramik görüntülerini kontrol et
SELECT 
    pi.*,
    u.email
FROM panoramic_images pi
JOIN auth.users u ON pi.user_id = u.id
WHERE u.email = 'test@example.com';
*/ 