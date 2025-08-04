-- PDF Text Extraction için Database Schema Güncellemeleri
-- Bu dosya segments tablosuna content ve extracted_content alanları ekler

-- Segments tablosuna yeni sütunlar ekle
ALTER TABLE segments 
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS extracted_content JSONB;

-- Sütunların açıklamalarını ekle
COMMENT ON COLUMN segments.content IS 'PDF''den çıkarılan ham metin içeriği';
COMMENT ON COLUMN segments.extracted_content IS 'PDF''den çıkarılan tüm içerik (metin, görsel, tablo) JSON formatında';

-- Mevcut kayıtlar için varsayılan değerler
UPDATE segments 
SET content = NULL, 
    extracted_content = NULL 
WHERE content IS NULL;

-- Problemli index'i kaldır (boyut limiti sorunu için)
DROP INDEX IF EXISTS idx_segments_content;

-- Sadece JSONB için index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_segments_extracted_content ON segments USING GIN(extracted_content);

-- RLS politikalarını güncelle (eğer RLS aktifse)
-- Content alanlarına erişim için policy
CREATE POLICY "Users can view their own segment content" ON segments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = segments.document_id 
    AND documents.user_id = auth.uid()
  )
);

-- Content güncelleme için policy
CREATE POLICY "Users can update their own segment content" ON segments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = segments.document_id 
    AND documents.user_id = auth.uid()
  )
);

-- Service role için content güncelleme izni
CREATE POLICY "Service role can update segment content" ON segments
FOR UPDATE USING (auth.role() = 'service_role');

-- View oluştur (opsiyonel) - created_at sütunu olmadan
CREATE OR REPLACE VIEW segment_content_summary AS
SELECT 
  s.id,
  s.document_id,
  s.seg_no,
  s.title,
  s.p_start,
  s.p_end,
  s.text_status,
  s.img_status,
  CASE 
    WHEN s.content IS NOT NULL THEN 'Content Available'
    ELSE 'No Content'
  END as content_status,
  CASE 
    WHEN s.extracted_content IS NOT NULL THEN 'Extracted Content Available'
    ELSE 'No Extracted Content'
  END as extracted_content_status,
  LENGTH(s.content) as content_length
FROM segments s
ORDER BY s.document_id, s.seg_no; 