-- =====================================================
-- DEFAULT PANORAMIC IMAGES FOR NEW USERS
-- Migration: 20241202000000_default_panoramic_images.sql
-- =====================================================

-- =====================================================
-- 1. DEFAULT PANORAMIC IMAGES TABLE
-- =====================================================

-- Default panoramik görüntüleri saklamak için tablo
CREATE TABLE IF NOT EXISTS default_panoramic_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL UNIQUE,
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
-- Önce mevcut trigger'ı kaldır (eğer varsa)
DROP TRIGGER IF EXISTS trigger_assign_default_panoramic_images ON auth.users;

-- Yeni trigger'ı oluştur
CREATE TRIGGER trigger_assign_default_panoramic_images
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION assign_default_panoramic_images();

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

-- Default panoramik görüntüler için indeksler
CREATE INDEX IF NOT EXISTS idx_default_panoramic_images_active 
ON default_panoramic_images(is_active);

CREATE INDEX IF NOT EXISTS idx_default_panoramic_images_file_name 
ON default_panoramic_images(file_name);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
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
-- 6. HELPER FUNCTIONS
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
-- 7. TRIGGER FOR UPDATED_AT COLUMN
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to default_panoramic_images
CREATE TRIGGER update_default_panoramic_images_updated_at 
    BEFORE UPDATE ON default_panoramic_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. COMMENTS
-- =====================================================

COMMENT ON TABLE default_panoramic_images IS 'Default panoramik görüntüleri saklar';
COMMENT ON FUNCTION assign_default_panoramic_images() IS 'Yeni kullanıcı kayıt olduğunda default panoramik görüntüleri atar';
COMMENT ON FUNCTION assign_default_panoramic_images_to_existing_users() IS 'Mevcut kullanıcılara default panoramik görüntüleri atar'; 