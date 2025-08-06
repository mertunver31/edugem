-- =====================================================
-- DEFAULT PANORAMIC IMAGES FOR NEW USERS
-- =====================================================
-- Bu migration yeni kullanıcılar kayıt olduğunda 
-- default panoramik görüntülerin otomatik olarak atanmasını sağlar

-- =====================================================
-- 1. DEFAULT PANORAMIC IMAGES TABLE
-- =====================================================

-- Default panoramik görüntüleri saklamak için tablo
CREATE TABLE IF NOT EXISTS default_panoramic_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TRIGGER FUNCTION FOR NEW USERS
-- =====================================================

-- Yeni kullanıcı kayıt olduğunda default panoramik görüntüleri kopyalayan fonksiyon
CREATE OR REPLACE FUNCTION assign_default_panoramic_images()
RETURNS TRIGGER AS $$
BEGIN
    -- Yeni kullanıcı için default panoramik görüntüleri kopyala
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
        NEW.id as user_id,
        file_name,
        file_path,
        file_size,
        file_type,
        title,
        description,
        is_active,
        NOW() as created_at,
        NOW() as updated_at
    FROM default_panoramic_images
    WHERE is_active = true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. TRIGGER FOR NEW USER REGISTRATION
-- =====================================================

-- Yeni kullanıcı kayıt olduğunda trigger'ı çalıştır
-- Not: Bu trigger auth.users tablosuna bağlı olmalı
-- Eğer auth.users tablosuna erişim yoksa, user_profiles tablosuna bağlayabiliriz

-- Önce mevcut trigger'ı kaldır (eğer varsa)
DROP TRIGGER IF EXISTS trigger_assign_default_panoramic_images ON auth.users;

-- Yeni trigger'ı oluştur
CREATE TRIGGER trigger_assign_default_panoramic_images
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION assign_default_panoramic_images();

-- =====================================================
-- 4. ALTERNATIVE TRIGGER FOR USER_PROFILES TABLE
-- =====================================================
-- Eğer auth.users tablosuna erişim yoksa, user_profiles tablosunu kullan

-- Önce mevcut trigger'ı kaldır (eğer varsa)
DROP TRIGGER IF EXISTS trigger_assign_default_panoramic_images_profiles ON user_profiles;

-- user_profiles tablosu için trigger
CREATE TRIGGER trigger_assign_default_panoramic_images_profiles
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION assign_default_panoramic_images();

-- =====================================================
-- 5. SAMPLE DEFAULT PANORAMIC IMAGES
-- =====================================================

-- Default panoramik görüntüleri ekle (örnek veriler)
-- Bu verileri gerçek dosya bilgileriyle değiştirin
INSERT INTO default_panoramic_images (
    file_name,
    file_path,
    file_size,
    file_type,
    title,
    description
) VALUES 
(
    'default_classroom_1.jpg',
    '/storage/v1/object/public/panoramic-images/default/default_classroom_1.jpg',
    5242880, -- 5MB
    'image/jpeg',
    'Default Classroom 1',
    'Modern sınıf ortamı panoramik görüntüsü'
),
(
    'default_classroom_2.jpg',
    '/storage/v1/object/public/panoramic-images/default/default_classroom_2.jpg',
    6291456, -- 6MB
    'image/jpeg',
    'Default Classroom 2',
    'Geleneksel sınıf ortamı panoramik görüntüsü'
)
ON CONFLICT (file_name) DO NOTHING;

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Default panoramik görüntüler için indeksler
CREATE INDEX IF NOT EXISTS idx_default_panoramic_images_active 
ON default_panoramic_images(is_active);

CREATE INDEX IF NOT EXISTS idx_default_panoramic_images_file_name 
ON default_panoramic_images(file_name);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Default panoramik görüntüler tablosu için RLS
ALTER TABLE default_panoramic_images ENABLE ROW LEVEL SECURITY;

-- Herkes default panoramik görüntüleri görebilir
CREATE POLICY "Anyone can view default panoramic images" ON default_panoramic_images
    FOR SELECT USING (true);

-- Sadece admin kullanıcılar default panoramik görüntüleri yönetebilir
CREATE POLICY "Admin can manage default panoramic images" ON default_panoramic_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Mevcut kullanıcılara default panoramik görüntüleri atamak için fonksiyon
CREATE OR REPLACE FUNCTION assign_default_panoramic_images_to_existing_users()
RETURNS INTEGER AS $$
DECLARE
    user_record RECORD;
    assigned_count INTEGER := 0;
BEGIN
    -- Henüz panoramik görüntüsü olmayan kullanıcıları bul
    FOR user_record IN 
        SELECT DISTINCT u.id 
        FROM auth.users u
        LEFT JOIN panoramic_images pi ON u.id = pi.user_id
        WHERE pi.id IS NULL
    LOOP
        -- Bu kullanıcıya default panoramik görüntüleri ata
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
            user_record.id as user_id,
            file_name,
            file_path,
            file_size,
            file_type,
            title,
            description,
            is_active,
            NOW() as created_at,
            NOW() as updated_at
        FROM default_panoramic_images
        WHERE is_active = true;
        
        assigned_count := assigned_count + 1;
    END LOOP;
    
    RETURN assigned_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. COMMENTS
-- =====================================================

COMMENT ON TABLE default_panoramic_images IS 'Default panoramik görüntüleri saklar';
COMMENT ON FUNCTION assign_default_panoramic_images() IS 'Yeni kullanıcı kayıt olduğunda default panoramik görüntüleri atar';
COMMENT ON FUNCTION assign_default_panoramic_images_to_existing_users() IS 'Mevcut kullanıcılara default panoramik görüntüleri atar';

-- =====================================================
-- 10. USAGE INSTRUCTIONS
-- =====================================================

/*
KULLANIM TALİMATLARI:

1. Bu migration'ı çalıştırdıktan sonra, yeni kayıt olan tüm kullanıcılar 
   otomatik olarak default panoramik görüntülere sahip olacak.

2. Mevcut kullanıcılara default panoramik görüntüleri atmak için:
   SELECT assign_default_panoramic_images_to_existing_users();

3. Default panoramik görüntüleri güncellemek için:
   UPDATE default_panoramic_images SET ... WHERE file_name = '...';

4. Yeni default panoramik görüntü eklemek için:
   INSERT INTO default_panoramic_images (file_name, file_path, ...) VALUES (...);

5. Default panoramik görüntüleri devre dışı bırakmak için:
   UPDATE default_panoramic_images SET is_active = false WHERE file_name = '...';
*/ 