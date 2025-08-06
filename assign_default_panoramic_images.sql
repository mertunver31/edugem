-- =====================================================
-- ASSIGN DEFAULT PANORAMIC IMAGES TO USER
-- =====================================================
-- Bu dosya kullanıcılara default panoramic resimleri atayan fonksiyonları içerir

-- Kullanıcıya default panoramic resimleri atayan fonksiyon
CREATE OR REPLACE FUNCTION assign_default_panoramic_images_to_user(user_id UUID)
RETURNS JSON AS $$
DECLARE
    file_record RECORD;
    result JSON;
    assigned_count INTEGER := 0;
    public_url TEXT;
BEGIN
    -- Kullanıcının zaten panoramic resmi var mı kontrol et
    IF EXISTS (SELECT 1 FROM panoramic_images WHERE panoramic_images.user_id = assign_default_panoramic_images_to_user.user_id) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Kullanıcının zaten panoramic resimleri var'
        );
    END IF;

    -- Default bucket'tan tüm resimleri al ve kullanıcıya ata
    FOR file_record IN 
        SELECT 
            name as file_name,
            metadata->>'size' as file_size,
            metadata->>'mimetype' as file_type,
            name as title,
            'Default panoramic image' as description
        FROM storage.objects 
        WHERE bucket_id = 'default-panoramic-images'
        AND metadata->>'size' IS NOT NULL
    LOOP
        -- Public URL oluştur
        public_url := 'https://pdnmhbqxvkdfjvufjvff.supabase.co/storage/v1/object/public/default-panoramic-images/' || file_record.file_name;
        
        -- Panoramic_images tablosuna ekle
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
        ) VALUES (
            assign_default_panoramic_images_to_user.user_id,
            file_record.file_name,
            public_url,
            COALESCE(file_record.file_size::BIGINT, 0),
            COALESCE(file_record.file_type, 'image/jpeg'),
            file_record.title,
            file_record.description,
            true,
            NOW(),
            NOW()
        );
        
        assigned_count := assigned_count + 1;
    END LOOP;

    -- Sonucu döndür
    RETURN json_build_object(
        'success', true,
        'message', assigned_count || ' adet default panoramic resim atandı',
        'assigned_count', assigned_count
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Hata: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonksiyonu kullanıcıların çağırabilmesi için RLS politikası
GRANT EXECUTE ON FUNCTION assign_default_panoramic_images_to_user(UUID) TO authenticated;

-- Log mesajı
SELECT 'Default panoramic assignment function created successfully' as status; 