-- Avatar URL sütunu ekle
ALTER TABLE avatars ADD COLUMN avatar_url TEXT;

-- Mevcut kayıtlarda rpm_avatar_url'i avatar_url'e kopyala (eğer varsa)
UPDATE avatars SET avatar_url = rpm_avatar_url WHERE rpm_avatar_url IS NOT NULL; 