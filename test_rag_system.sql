-- =====================================================
-- RAG SYSTEM TEST SCRIPT
-- =====================================================

-- 1. Unique constraint'leri ekle (eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'concept_embeddings_concept_name_unique'
    ) THEN
        ALTER TABLE concept_embeddings ADD CONSTRAINT concept_embeddings_concept_name_unique UNIQUE (concept_name);
    END IF;
END $$;

-- 2. RLS politikalarını ekle (eğer yoksa)
ALTER TABLE concept_relationships ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'concept_relationships' AND policyname = 'Users can view concept relationships'
    ) THEN
        CREATE POLICY "Users can view concept relationships" ON concept_relationships
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'concept_relationships' AND policyname = 'Users can insert concept relationships'
    ) THEN
        CREATE POLICY "Users can insert concept relationships" ON concept_relationships
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 3. Mevcut documents'ları kontrol et
SELECT 'Available Documents:' as info;
SELECT id, file_path, status, created_at FROM documents LIMIT 5;

-- 4. Test verisi ekle (eğer yoksa)
INSERT INTO concept_embeddings (concept_name, concept_description, subject_area, difficulty_level) 
VALUES 
('Proaktivite', 'Kişinin gelecekteki durumları önceden görerek gerekli önlemleri alma yeteneği', 'Kişisel Gelişim', 2),
('Liderlik', 'Bir grubu yönlendirme ve motive etme sanatı', 'Yönetim', 3),
('Problem Çözme', 'Karmaşık durumları analiz ederek çözüm üretme süreci', 'Analitik Düşünme', 3),
('Karar Alma', 'Alternatifler arasından en uygun olanı seçme süreci', 'Yönetim', 2),
('Kişisel Tutum', 'Bireyin olaylara ve durumlara karşı gösterdiği davranış kalıpları', 'Psikoloji', 1)
ON CONFLICT (concept_name) DO NOTHING;

-- 5. Test knowledge base verisi ekle (gerçek document ID kullan)
DO $$
DECLARE
    real_document_id UUID;
BEGIN
    -- İlk document ID'sini al
    SELECT id INTO real_document_id FROM documents LIMIT 1;
    
    -- Eğer document varsa test verisi ekle
    IF real_document_id IS NOT NULL THEN
        INSERT INTO knowledge_base (segment_id, document_id, content, content_type, relevance_score, metadata) 
        VALUES 
        ('test-lesson-1', real_document_id, 'Proaktivite, kişinin gelecekteki durumları önceden görerek gerekli önlemleri alma yeteneğidir. Bu kavram, reaktivitenin tam tersidir.', 'lesson_content', 1.0, '{"chapter_title": "Test Chapter", "lesson_title": "Test Lesson"}');
        
        RAISE NOTICE 'Test knowledge base verisi eklendi. Document ID: %', real_document_id;
    ELSE
        RAISE NOTICE 'Hiç document bulunamadı. Test knowledge base verisi eklenmedi.';
    END IF;
END $$;

-- 6. Test concept relationships ekle
INSERT INTO concept_relationships (concept1, concept2, relationship_type, relationship_score, metadata)
VALUES 
('Proaktivite', 'Liderlik', 'semantic_similarity', 0.8, '{"document_id": "test-doc"}'),
('Problem Çözme', 'Karar Alma', 'semantic_similarity', 0.9, '{"document_id": "test-doc"}')
ON CONFLICT (concept1, concept2) DO NOTHING;

-- 7. Test fonksiyonları
SELECT 'Testing find_similar_content function...' as test_info;

-- 8. Mevcut verileri kontrol et
SELECT 'Knowledge Base Records:' as info;
SELECT COUNT(*) as total_records FROM knowledge_base;

SELECT 'Concept Embeddings:' as info;
SELECT concept_name, concept_description FROM concept_embeddings LIMIT 5;

SELECT 'Concept Relationships:' as info;
SELECT concept1, concept2, relationship_score FROM concept_relationships LIMIT 5;

-- 9. Vector extension kontrolü
SELECT 'Vector Extension Status:' as info;
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 10. Index kontrolü
SELECT 'Vector Indexes:' as info;
SELECT indexname, tablename FROM pg_indexes WHERE indexname LIKE '%embeddings%' OR indexname LIKE '%vector%'; 