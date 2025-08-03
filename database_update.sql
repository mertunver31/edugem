-- Avatar URL sütunu ekle
ALTER TABLE avatars ADD COLUMN avatar_url TEXT;

-- Mevcut kayıtlarda rpm_avatar_url'i avatar_url'e kopyala (eğer varsa)
UPDATE avatars SET avatar_url = rpm_avatar_url WHERE rpm_avatar_url IS NOT NULL;

-- Course Visual Integration için yeni sütunlar
ALTER TABLE documents ADD COLUMN visual_prompts JSONB;
ALTER TABLE documents ADD COLUMN visual_prompts_generated_at TIMESTAMP WITH TIME ZONE;

-- Course Images için yeni sütunlar
ALTER TABLE documents ADD COLUMN course_images JSONB;
ALTER TABLE documents ADD COLUMN course_images_generated_at TIMESTAMP WITH TIME ZONE; 