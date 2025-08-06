-- =====================================================
-- CLEANUP WRONG PANORAMIC PATHS
-- =====================================================
-- Bu dosya yanlış file_path değerlerini temizler

-- Yanlış file_path'leri olan kayıtları sil
DELETE FROM panoramic_images 
WHERE file_path LIKE 'default-panoramic-images/%';

-- Log mesajı
SELECT 'Wrong panoramic paths cleaned up successfully' as status; 