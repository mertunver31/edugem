-- Document Understanding için Database Schema Güncellemeleri
-- Bu dosya documents tablosuna outline ve status alanları ekler

-- Documents tablosuna yeni sütunlar ekle (sadece eksik olanları)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS outline JSONB,
ADD COLUMN IF NOT EXISTS outline_extracted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Status değerleri için enum benzeri kontrol
-- uploaded -> outline_extracted -> segments_created -> processing -> completed
-- outline_failed -> processing_failed

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_outline_extracted ON documents(outline_extracted_at);

-- RLS Policies güncelle
-- Outline alanına erişim için policy
CREATE POLICY "Users can view their own document outlines" ON documents
FOR SELECT USING (auth.uid() = user_id);

-- Outline güncelleme için policy
CREATE POLICY "Users can update their own document outlines" ON documents
FOR UPDATE USING (auth.uid() = user_id);

-- Status güncelleme için policy
CREATE POLICY "Users can update their own document status" ON documents
FOR UPDATE USING (auth.uid() = user_id);

-- Service role için outline güncelleme izni
CREATE POLICY "Service role can update document outlines" ON documents
FOR UPDATE USING (auth.role() = 'service_role');

-- Mevcut kayıtları güncelle
UPDATE documents 
SET status = 'uploaded' 
WHERE status = 'UPLOADED';

-- View oluştur (opsiyonel)
CREATE OR REPLACE VIEW document_summary AS
SELECT 
  id,
  user_id,
  file_path,
  page_count,
  status,
  outline_extracted_at,
  created_at,
  CASE 
    WHEN outline IS NOT NULL THEN 'Outline Available'
    ELSE 'No Outline'
  END as outline_status
FROM documents
ORDER BY created_at DESC; 