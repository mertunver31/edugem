-- =====================================================
-- MIND MAPS TEST DATA
-- =====================================================

-- Test mind map verisi ekle
INSERT INTO mind_maps (document_id, type, title, central_topic, content, metadata) 
VALUES (
    (SELECT id FROM documents LIMIT 1), -- İlk document'ı kullan
    'course_mindmap',
    'Kişisel Gelişim Kursu Mind Map',
    'Kişisel Gelişim',
    '{
        "type": "course_mindmap",
        "title": "Kişisel Gelişim Kursu",
        "central_topic": "Kişisel Gelişim",
        "branches": [
            {
                "topic": "Proaktivite",
                "subtopics": ["Reaktivite", "Öncelik Belirleme", "Hedef Koyma"],
                "importance": 0.9,
                "connections": ["Liderlik", "Zaman Yönetimi"]
            },
            {
                "topic": "Liderlik",
                "subtopics": ["Takım Yönetimi", "İletişim", "Motivasyon"],
                "importance": 0.8,
                "connections": ["Proaktivite", "Problem Çözme"]
            },
            {
                "topic": "Problem Çözme",
                "subtopics": ["Analiz", "Yaratıcılık", "Karar Alma"],
                "importance": 0.7,
                "connections": ["Liderlik", "Kişisel Tutum"]
            },
            {
                "topic": "Zaman Yönetimi",
                "subtopics": ["Planlama", "Önceliklendirme", "Delegasyon"],
                "importance": 0.6,
                "connections": ["Proaktivite"]
            },
            {
                "topic": "Kişisel Tutum",
                "subtopics": ["Pozitif Düşünce", "Esneklik", "Öğrenme"],
                "importance": 0.5,
                "connections": ["Problem Çözme"]
            }
        ],
        "metadata": {
            "total_branches": 5,
            "total_subtopics": 15,
            "generated_at": "2024-01-01T00:00:00Z",
            "model_used": "gemini-1.5-flash"
        }
    }'::jsonb,
    '{
        "generation_time": 12.5,
        "model_version": "gemini-1.5-flash",
        "source": "enhanced_content"
    }'::jsonb
);

-- Test learning path verisi ekle
INSERT INTO learning_paths (document_id, title, description, steps, estimated_duration, difficulty_level, prerequisites, metadata)
VALUES (
    (SELECT id FROM documents LIMIT 1), -- İlk document'ı kullan
    'Kişisel Gelişim Öğrenme Yolu',
    'Kişisel gelişim konularında sistematik ilerleme planı',
    '[
        {
            "step": 1,
            "title": "Temel Kavramlar",
            "chapters": ["Giriş", "Kişisel Tutum"],
            "duration": "2-3 saat",
            "prerequisites": [],
            "objectives": ["Kişisel gelişim kavramını anlama", "Temel tutumları öğrenme"],
            "activities": ["Okuma", "Refleksiyon", "Küçük alıştırmalar"]
        },
        {
            "step": 2,
            "title": "Proaktivite Geliştirme",
            "chapters": ["Proaktivite", "Reaktivite"],
            "duration": "3-4 saat",
            "prerequisites": ["Temel Kavramlar"],
            "objectives": ["Proaktif davranış kalıplarını öğrenme", "Reaktif davranışları tanıma"],
            "activities": ["Vaka çalışması", "Günlük tutma", "Rol yapma"]
        },
        {
            "step": 3,
            "title": "Liderlik Becerileri",
            "chapters": ["Liderlik", "İletişim"],
            "duration": "4-5 saat",
            "prerequisites": ["Proaktivite Geliştirme"],
            "objectives": ["Liderlik stillerini anlama", "Etkili iletişim teknikleri"],
            "activities": ["Grup çalışması", "Sunum hazırlama", "Geri bildirim alma"]
        },
        {
            "step": 4,
            "title": "Problem Çözme ve Karar Alma",
            "chapters": ["Problem Çözme", "Karar Alma"],
            "duration": "3-4 saat",
            "prerequisites": ["Liderlik Becerileri"],
            "objectives": ["Sistematik problem çözme", "Karar alma süreçleri"],
            "activities": ["Problem analizi", "Çözüm üretme", "Karar matrisi"]
        },
        {
            "step": 5,
            "title": "Zaman Yönetimi",
            "chapters": ["Zaman Yönetimi", "Önceliklendirme"],
            "duration": "2-3 saat",
            "prerequisites": ["Problem Çözme ve Karar Alma"],
            "objectives": ["Zaman yönetimi teknikleri", "Öncelik belirleme"],
            "activities": ["Zaman takibi", "Planlama", "Değerlendirme"]
        }
    ]'::jsonb,
    '14-19 saat',
    'intermediate',
    '["Temel okuma yazma", "Öğrenmeye açık olma"]'::jsonb,
    '{
        "total_steps": 5,
        "total_duration_hours": 16.5,
        "generated_at": "2024-01-01T00:00:00Z",
        "model_used": "gemini-1.5-flash"
    }'::jsonb
);

-- =====================================================
-- TEST QUERIES
-- =====================================================

-- Mind maps sayısını kontrol et
SELECT 'Mind Maps Count:' as info;
SELECT COUNT(*) as total_mind_maps FROM mind_maps;

-- Learning paths sayısını kontrol et
SELECT 'Learning Paths Count:' as info;
SELECT COUNT(*) as total_learning_paths FROM learning_paths;

-- Mind map detaylarını göster
SELECT 'Mind Map Details:' as info;
SELECT 
    title,
    central_topic,
    type,
    created_at
FROM mind_maps 
LIMIT 5;

-- Learning path detaylarını göster
SELECT 'Learning Path Details:' as info;
SELECT 
    title,
    estimated_duration,
    difficulty_level,
    created_at
FROM learning_paths 
LIMIT 5;

-- JSON content örnekleri
SELECT 'Mind Map Content Sample:' as info;
SELECT 
    title,
    content->'branches' as branches
FROM mind_maps 
LIMIT 1;

SELECT 'Learning Path Steps Sample:' as info;
SELECT 
    title,
    steps->0 as first_step
FROM learning_paths 
LIMIT 1; 