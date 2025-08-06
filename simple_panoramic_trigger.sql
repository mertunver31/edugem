-- =====================================================
-- PANORAMIC IMAGES TRIGGER FOR NEW USERS
-- =====================================================
-- Bu trigger yeni kullanıcı kayıt olduğunda default panoramik görüntülerini
-- otomatik olarak yeni kullanıcıya atar

-- =====================================================
-- 1. TRIGGER FUNCTION
-- =====================================================

-- Yeni kullanıcı kayıt olduğunda default panoramik görüntüleri kopyalayan fonksiyon
CREATE OR REPLACE FUNCTION assign_panoramic_images_to_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Default panoramik görüntüleri yeni kullanıcıya kopyala
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
EXCEPTION
    WHEN OTHERS THEN
        -- Hata durumunda log yaz ve işlemi devam ettir
        RAISE LOG 'Error assigning panoramic images to user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. TRIGGER
-- =====================================================

-- Önce mevcut trigger'ı kaldır (eğer varsa)
DROP TRIGGER IF EXISTS trigger_assign_panoramic_images ON auth.users;

-- Yeni trigger'ı oluştur
CREATE TRIGGER trigger_assign_panoramic_images
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION assign_panoramic_images_to_new_user();

-- =====================================================
-- 3. MEVCUT KULLANICILARA DA ATA (İSTEĞE BAĞLI)
-- =====================================================

-- Henüz panoramik görüntüsü olmayan mevcut kullanıcılara da atamak için:
/*
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
WHERE dpi.is_active = true
AND pi.id IS NULL;
*/ 