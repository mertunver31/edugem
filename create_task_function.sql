-- Task oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_task(p_priority INTEGER, p_segment_id UUID, p_worker_type TEXT)
RETURNS UUID AS $$
DECLARE
    v_task_id UUID;
    v_document_id UUID;
    v_user_id UUID;
BEGIN
    -- Segment ve document bilgilerini al
    SELECT s.document_id, d.user_id INTO v_document_id, v_user_id
    FROM segments s
    JOIN documents d ON s.document_id = d.id
    WHERE s.id = p_segment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Segment bulunamadı: %', p_segment_id;
    END IF;
    
    -- Task oluştur
    INSERT INTO task_queue (
        document_id,
        segment_id,
        user_id,
        task_type,
        priority,
        status,
        created_at
    ) VALUES (
        v_document_id,
        p_segment_id,
        v_user_id,
        p_worker_type,
        p_priority,
        'PENDING',
        NOW()
    ) RETURNING id INTO v_task_id;
    
    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql; 