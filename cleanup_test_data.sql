-- Test verilerini temizleme scripti
-- Bu script tüm tablolardaki test verilerini temizler

-- 1. Mind Maps tablosunu temizle
DELETE FROM mind_maps;
ALTER SEQUENCE mind_maps_id_seq RESTART WITH 1;

-- 2. Learning Paths tablosunu temizle
DELETE FROM learning_paths;
ALTER SEQUENCE learning_paths_id_seq RESTART WITH 1;

-- 3. Documents tablosunu temizle
DELETE FROM documents;
ALTER SEQUENCE documents_id_seq RESTART WITH 1;

-- 4. Course Structures tablosunu temizle
DELETE FROM course_structures;
ALTER SEQUENCE course_structures_id_seq RESTART WITH 1;

-- 5. Course Visuals tablosunu temizle
DELETE FROM course_visuals;
ALTER SEQUENCE course_visuals_id_seq RESTART WITH 1;

-- 6. Enhanced Contents tablosunu temizle
DELETE FROM enhanced_contents;
ALTER SEQUENCE enhanced_contents_id_seq RESTART WITH 1;

-- 7. Document Segments tablosunu temizle
DELETE FROM document_segments;
ALTER SEQUENCE document_segments_id_seq RESTART WITH 1;

-- 8. Vector embeddings tablosunu temizle (RAG sistemi)
DELETE FROM document_embeddings;
ALTER SEQUENCE document_embeddings_id_seq RESTART WITH 1;

-- 9. Task Queue tablosunu temizle
DELETE FROM task_queue;
ALTER SEQUENCE task_queue_id_seq RESTART WITH 1;

-- 10. Worker Results tablosunu temizle
DELETE FROM worker_results;
ALTER SEQUENCE worker_results_id_seq RESTART WITH 1;

-- 11. Panoramic Images tablosunu temizle
DELETE FROM panoramic_images;
ALTER SEQUENCE panoramic_images_id_seq RESTART WITH 1;

-- 12. User Profiles tablosunu temizle (test kullanıcıları)
DELETE FROM user_profiles WHERE email LIKE '%test%' OR email LIKE '%example%';

-- 13. Supabase Storage'dan dosyaları temizle
-- Bu kısım manuel olarak yapılmalı veya Supabase Dashboard'dan

-- 14. İstatistikleri göster
SELECT 
  'mind_maps' as table_name, COUNT(*) as remaining_count FROM mind_maps
UNION ALL
SELECT 'learning_paths', COUNT(*) FROM learning_paths
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'course_structures', COUNT(*) FROM course_structures
UNION ALL
SELECT 'course_visuals', COUNT(*) FROM course_visuals
UNION ALL
SELECT 'enhanced_contents', COUNT(*) FROM enhanced_contents
UNION ALL
SELECT 'document_segments', COUNT(*) FROM document_segments
UNION ALL
SELECT 'document_embeddings', COUNT(*) FROM document_embeddings
UNION ALL
SELECT 'task_queue', COUNT(*) FROM task_queue
UNION ALL
SELECT 'worker_results', COUNT(*) FROM worker_results
UNION ALL
SELECT 'panoramic_images', COUNT(*) FROM panoramic_images
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles;

-- Temizlik tamamlandı mesajı
SELECT '✅ Tüm test verileri temizlendi!' as status; 