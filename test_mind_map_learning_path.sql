-- Mind Map ve Learning Path Test Sorguları

-- 1. Mevcut mind_maps tablosunu kontrol et
SELECT 
    'mind_maps' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT document_id) as unique_documents
FROM mind_maps;

-- 2. Mevcut learning_paths tablosunu kontrol et
SELECT 
    'learning_paths' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT document_id) as unique_documents
FROM learning_paths;

-- 3. En son oluşturulan mind map'leri göster
SELECT 
    id,
    document_id,
    title,
    central_topic,
    type,
    created_at,
    updated_at
FROM mind_maps 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. En son oluşturulan learning path'leri göster
SELECT 
    id,
    document_id,
    title,
    description,
    difficulty_level,
    estimated_duration,
    created_at,
    updated_at
FROM learning_paths 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Belirli bir document için mind map ve learning path kontrol et
-- (Bu sorguyu çalıştırmadan önce gerçek bir document_id ile değiştirin)
SELECT 
    'mind_map' as type,
    id,
    document_id,
    title,
    created_at
FROM mind_maps 
WHERE document_id = 'bcf9811c-4475-4831-a311-f08b4d26113a'  -- Örnek document_id
UNION ALL
SELECT 
    'learning_path' as type,
    id,
    document_id,
    title,
    created_at
FROM learning_paths 
WHERE document_id = 'bcf9811c-4475-4831-a311-f08b4d26113a'; -- Örnek document_id

-- 6. Documents tablosundaki son 5 document'i göster
SELECT 
    id,
    file_path,
    status,
    created_at,
    enhanced_content IS NOT NULL as has_enhanced_content
FROM documents 
ORDER BY created_at DESC 
LIMIT 5; 