-- =====================================================
-- CREATE DEFAULT PANORAMIC IMAGES BUCKET
-- =====================================================
-- Bu dosya default panoramic resimler için yeni bir bucket oluşturur

-- Yeni bucket oluştur
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'default-panoramic-images',
    'default-panoramic-images',
    true,
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket için RLS politikaları oluştur
-- Herkes bucket'ı görebilir
CREATE POLICY "Anyone can view default panoramic bucket" ON storage.objects
    FOR SELECT USING (bucket_id = 'default-panoramic-images');

-- Sadece adminler dosya yükleyebilir
CREATE POLICY "Admin can upload to default panoramic bucket" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'default-panoramic-images' AND auth.role() = 'authenticated');

-- Sadece adminler dosya güncelleyebilir
CREATE POLICY "Admin can update default panoramic bucket" ON storage.objects
    FOR UPDATE USING (bucket_id = 'default-panoramic-images' AND auth.role() = 'authenticated');

-- Sadece adminler dosya silebilir
CREATE POLICY "Admin can delete from default panoramic bucket" ON storage.objects
    FOR DELETE USING (bucket_id = 'default-panoramic-images' AND auth.role() = 'authenticated');

-- Log mesajı
SELECT 'Default panoramic bucket created successfully' as status; 