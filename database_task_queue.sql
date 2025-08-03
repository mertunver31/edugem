-- Task Queue Sistemi Database Schema
-- GÜN 6 - AŞAMA 1: Task Queue Sistemi

-- Task Queue ana tablosu
CREATE TABLE IF NOT EXISTS task_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Task bilgileri
    task_type TEXT NOT NULL CHECK (task_type IN ('TEXT_WORKER', 'IMAGE_WORKER')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING')),
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
    
    -- İşlem bilgileri
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Hata bilgileri
    error_message TEXT,
    error_details JSONB,
    
    -- İşlem sonuçları
    result_data JSONB,
    
    -- Concurrency control için
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Worker Records tablosu (Concurrency Manager için)
CREATE TABLE IF NOT EXISTS worker_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id TEXT NOT NULL UNIQUE,
    worker_type TEXT NOT NULL CHECK (worker_type IN ('TEXT_WORKER', 'IMAGE_WORKER')),
    segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Worker durumu
    status TEXT NOT NULL DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING')),
    
    -- Zaman bilgileri
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Hata ve retry bilgileri
    error_count INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    
    -- Sonuç bilgileri
    result_data JSONB,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- İndeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_task_queue_status ON task_queue(status);
CREATE INDEX IF NOT EXISTS idx_task_queue_document_id ON task_queue(document_id);
CREATE INDEX IF NOT EXISTS idx_task_queue_segment_id ON task_queue(segment_id);
CREATE INDEX IF NOT EXISTS idx_task_queue_user_id ON task_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_task_queue_created_at ON task_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_task_queue_priority_status ON task_queue(priority DESC, status, created_at);

-- Worker Records indeksleri
CREATE INDEX IF NOT EXISTS idx_worker_records_worker_id ON worker_records(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_records_worker_type ON worker_records(worker_type);
CREATE INDEX IF NOT EXISTS idx_worker_records_segment_id ON worker_records(segment_id);
CREATE INDEX IF NOT EXISTS idx_worker_records_user_id ON worker_records(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_records_status ON worker_records(status);

-- Composite index for efficient querying
CREATE INDEX IF NOT EXISTS idx_task_queue_status_priority ON task_queue(status, priority DESC, created_at);

-- Worker Results tablosu (Text ve Image worker sonuçları için)
CREATE TABLE IF NOT EXISTS worker_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES task_queue(id) ON DELETE CASCADE,
    segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Worker türü
    worker_type TEXT NOT NULL CHECK (worker_type IN ('TEXT_WORKER', 'IMAGE_WORKER')),
    
    -- Text Worker sonuçları
    summary TEXT,
    questions JSONB, -- [{question: "...", answer: "..."}]
    explanations JSONB, -- [{concept: "...", explanation: "..."}]
    key_points JSONB, -- ["point1", "point2", ...]
    
    -- Image Worker sonuçları
    image_url TEXT,
    image_prompt TEXT,
    image_metadata JSONB,
    
    -- Genel bilgiler
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Worker Results indeksleri
CREATE INDEX IF NOT EXISTS idx_worker_results_task_id ON worker_results(task_id);
CREATE INDEX IF NOT EXISTS idx_worker_results_segment_id ON worker_results(segment_id);
CREATE INDEX IF NOT EXISTS idx_worker_results_user_id ON worker_results(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_results_worker_type ON worker_results(worker_type);

-- Updated At trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for worker_results
CREATE TRIGGER update_worker_results_updated_at 
    BEFORE UPDATE ON worker_results 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE task_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_results ENABLE ROW LEVEL SECURITY;

-- Task Queue RLS Policies
CREATE POLICY "Users can view their own tasks" ON task_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON task_queue
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON task_queue
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON task_queue
    FOR DELETE USING (auth.uid() = user_id);

-- Worker Records RLS Policies
CREATE POLICY "Users can view their own worker records" ON worker_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own worker records" ON worker_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own worker records" ON worker_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own worker records" ON worker_records
    FOR DELETE USING (auth.uid() = user_id);

-- Worker Results RLS Policies
CREATE POLICY "Users can view their own worker results" ON worker_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own worker results" ON worker_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own worker results" ON worker_results
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own worker results" ON worker_results
    FOR DELETE USING (auth.uid() = user_id);

-- Helper Functions

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

-- Task'ı kilitleme fonksiyonu (concurrency control)
CREATE OR REPLACE FUNCTION lock_task(task_uuid UUID, worker_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    task_record RECORD;
BEGIN
    -- SELECT ... FOR UPDATE ile task'ı kilitle
    SELECT * INTO task_record 
    FROM task_queue 
    WHERE id = task_uuid 
    AND status = 'PENDING'
    AND (locked_at IS NULL OR locked_at < NOW() - INTERVAL '30 minutes')
    FOR UPDATE SKIP LOCKED;
    
    IF task_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Task'ı kilitle
    UPDATE task_queue 
    SET status = 'PROCESSING',
        locked_at = NOW(),
        locked_by = worker_id,
        started_at = NOW()
    WHERE id = task_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Task'ı tamamlama fonksiyonu
CREATE OR REPLACE FUNCTION complete_task(task_uuid UUID, result_data JSONB DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE task_queue 
    SET status = 'COMPLETED',
        completed_at = NOW(),
        result_data = result_data,
        locked_at = NULL,
        locked_by = NULL
    WHERE id = task_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Task'ı başarısız olarak işaretleme fonksiyonu
CREATE OR REPLACE FUNCTION fail_task(task_uuid UUID, error_msg TEXT, error_details JSONB DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    current_retry_count INTEGER;
    max_retries INTEGER;
BEGIN
    -- Mevcut retry sayısını al
    SELECT retry_count, max_retries INTO current_retry_count, max_retries
    FROM task_queue WHERE id = task_uuid;
    
    IF current_retry_count >= max_retries THEN
        -- Maksimum retry sayısına ulaşıldı
        UPDATE task_queue 
        SET status = 'FAILED',
            error_message = error_msg,
            error_details = error_details,
            locked_at = NULL,
            locked_by = NULL
        WHERE id = task_uuid;
    ELSE
        -- Retry yapılabilir
        UPDATE task_queue 
        SET status = 'RETRYING',
            retry_count = retry_count + 1,
            error_message = error_msg,
            error_details = error_details,
            locked_at = NULL,
            locked_by = NULL
        WHERE id = task_uuid;
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Bekleyen task'ları getirme fonksiyonu
CREATE OR REPLACE FUNCTION get_pending_tasks(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    segment_id UUID,
    user_id UUID,
    task_type TEXT,
    priority INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT tq.id, tq.document_id, tq.segment_id, tq.user_id, 
           tq.task_type, tq.priority, tq.created_at
    FROM task_queue tq
    WHERE tq.status = 'PENDING'
    ORDER BY tq.priority DESC, tq.created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Kullanıcının task istatistiklerini getirme fonksiyonu
CREATE OR REPLACE FUNCTION get_user_task_stats(user_uuid UUID)
RETURNS TABLE (
    total_tasks BIGINT,
    pending_tasks BIGINT,
    processing_tasks BIGINT,
    completed_tasks BIGINT,
    failed_tasks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_tasks,
        COUNT(*) FILTER (WHERE status = 'PROCESSING') as processing_tasks,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_tasks,
        COUNT(*) FILTER (WHERE status = 'FAILED') as failed_tasks
    FROM task_queue 
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql; 