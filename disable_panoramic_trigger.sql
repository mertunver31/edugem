-- =====================================================
-- TEMPORARILY DISABLE PANORAMIC TRIGGER
-- =====================================================
-- Bu dosya kayıt sorununu çözmek için trigger'ı geçici olarak devre dışı bırakır

-- Mevcut trigger'ı kaldır
DROP TRIGGER IF EXISTS trigger_assign_panoramic_images ON auth.users;
DROP TRIGGER IF EXISTS trigger_assign_default_panoramic_images ON auth.users;

-- Trigger fonksiyonlarını da kaldır (isteğe bağlı)
-- DROP FUNCTION IF EXISTS assign_panoramic_images_to_new_user();
-- DROP FUNCTION IF EXISTS assign_default_panoramic_images();

-- Log mesajı
SELECT 'Panoramic triggers disabled successfully' as status; 