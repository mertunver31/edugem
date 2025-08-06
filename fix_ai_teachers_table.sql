-- AI öğretmenler tablosunu düzelt
-- Önce mevcut tabloyu sil
DROP TABLE IF EXISTS ai_teachers CASCADE;

-- Trigger fonksiyonunu oluştur (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabloyu doğru şekilde yeniden oluştur
CREATE TABLE ai_teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    specialty TEXT,
    personality_type VARCHAR(100),
    teaching_style VARCHAR(100),
    experience_level INTEGER DEFAULT 5 CHECK (experience_level >= 1 AND experience_level <= 10),
    education_level VARCHAR(50),
    character_description TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikalarını yeniden oluştur
ALTER TABLE ai_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI teachers" ON ai_teachers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI teachers" ON ai_teachers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI teachers" ON ai_teachers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI teachers" ON ai_teachers
    FOR DELETE USING (auth.uid() = user_id);

-- İndeksleri oluştur
CREATE INDEX IF NOT EXISTS idx_ai_teachers_user_id ON ai_teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_teachers_subject ON ai_teachers(subject);

-- Trigger'ı oluştur
CREATE TRIGGER update_ai_teachers_updated_at 
    BEFORE UPDATE ON ai_teachers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 