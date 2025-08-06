-- AI Öğretmenler için veritabanı tabloları
-- Bu dosya AI öğretmen sistemi için gerekli tüm tabloları içerir

-- AI Öğretmenler tablosu
CREATE TABLE IF NOT EXISTS ai_teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- AI Öğretmen konuşma geçmişi
CREATE TABLE IF NOT EXISTS ai_teacher_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ai_teacher_id UUID REFERENCES ai_teachers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    context TEXT, -- Ders içeriği bağlamı
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Panoramik sınıflar tablosu
CREATE TABLE IF NOT EXISTS panoramic_classrooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    background_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sınıf katılımcıları (AI öğretmenler ve kullanıcı)
CREATE TABLE IF NOT EXISTS classroom_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    classroom_id UUID REFERENCES panoramic_classrooms(id) ON DELETE CASCADE,
    ai_teacher_id UUID REFERENCES ai_teachers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
    position_z FLOAT DEFAULT 0,
    is_online BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sınıf içi sohbet mesajları
CREATE TABLE IF NOT EXISTS classroom_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    classroom_id UUID REFERENCES panoramic_classrooms(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'ai_teacher', 'system')),
    sender_id UUID, -- user_id veya ai_teacher_id
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'question', 'answer', 'system')),
    context_data JSONB, -- Ders içeriği ve bağlam bilgileri
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ders içerikleri (AI öğretmenlerin bileceği konular)
CREATE TABLE IF NOT EXISTS lesson_contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ai_teacher_id UUID REFERENCES ai_teachers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    subject VARCHAR(100),
    difficulty_level VARCHAR(20) DEFAULT 'intermediate',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) Politikaları
ALTER TABLE ai_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_teacher_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE panoramic_classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_contents ENABLE ROW LEVEL SECURITY;

-- AI Öğretmenler için RLS politikaları
CREATE POLICY "Users can view their own AI teachers" ON ai_teachers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI teachers" ON ai_teachers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI teachers" ON ai_teachers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI teachers" ON ai_teachers
    FOR DELETE USING (auth.uid() = user_id);

-- Konuşma geçmişi için RLS politikaları
CREATE POLICY "Users can view their own conversations" ON ai_teacher_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON ai_teacher_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Panoramik sınıflar için RLS politikaları
CREATE POLICY "Users can view their own classrooms" ON panoramic_classrooms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own classrooms" ON panoramic_classrooms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classrooms" ON panoramic_classrooms
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classrooms" ON panoramic_classrooms
    FOR DELETE USING (auth.uid() = user_id);

-- Sınıf katılımcıları için RLS politikaları
CREATE POLICY "Users can view classroom participants" ON classroom_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM panoramic_classrooms 
            WHERE id = classroom_participants.classroom_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage classroom participants" ON classroom_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM panoramic_classrooms 
            WHERE id = classroom_participants.classroom_id 
            AND user_id = auth.uid()
        )
    );

-- Sınıf mesajları için RLS politikaları
CREATE POLICY "Users can view classroom messages" ON classroom_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM panoramic_classrooms 
            WHERE id = classroom_messages.classroom_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert classroom messages" ON classroom_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM panoramic_classrooms 
            WHERE id = classroom_messages.classroom_id 
            AND user_id = auth.uid()
        )
    );

-- Ders içerikleri için RLS politikaları
CREATE POLICY "Users can view lesson contents" ON lesson_contents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_teachers 
            WHERE id = lesson_contents.ai_teacher_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage lesson contents" ON lesson_contents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ai_teachers 
            WHERE id = lesson_contents.ai_teacher_id 
            AND user_id = auth.uid()
        )
    );

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_ai_teachers_user_id ON ai_teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_teachers_subject ON ai_teachers(subject);
CREATE INDEX IF NOT EXISTS idx_conversations_teacher_id ON ai_teacher_conversations(ai_teacher_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON ai_teacher_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_user_id ON panoramic_classrooms(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_classroom_id ON classroom_participants(classroom_id);
CREATE INDEX IF NOT EXISTS idx_messages_classroom_id ON classroom_messages(classroom_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON classroom_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_lesson_contents_teacher_id ON lesson_contents(ai_teacher_id);

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'ları oluştur
CREATE TRIGGER update_ai_teachers_updated_at 
    BEFORE UPDATE ON ai_teachers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_panoramic_classrooms_updated_at 
    BEFORE UPDATE ON panoramic_classrooms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_contents_updated_at 
    BEFORE UPDATE ON lesson_contents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 