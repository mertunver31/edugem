-- Course Structure için gerekli kolonları ekle
-- documents tablosuna course_structure ve course_structure_generated_at kolonları ekle

-- course_structure kolonu (JSONB tipinde)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS course_structure JSONB;

-- course_structure_generated_at kolonu (timestamp tipinde)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS course_structure_generated_at TIMESTAMP WITH TIME ZONE;

-- Kolonların açıklamalarını ekle
COMMENT ON COLUMN documents.course_structure IS 'AI tarafından oluşturulan kurs yapısı (JSON formatında)';
COMMENT ON COLUMN documents.course_structure_generated_at IS 'Kurs yapısının oluşturulma tarihi';

-- Mevcut kayıtlar için varsayılan değerler
UPDATE documents 
SET course_structure = NULL, 
    course_structure_generated_at = NULL 
WHERE course_structure IS NULL;

-- İndeks ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_documents_course_structure_generated_at 
ON documents(course_structure_generated_at);

-- RLS politikalarını güncelle (eğer RLS aktifse)
-- Bu kolonlar için okuma ve yazma izinleri 