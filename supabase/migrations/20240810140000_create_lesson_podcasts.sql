-- supabase/migrations/20240810140000_create_lesson_podcasts.sql

CREATE TABLE IF NOT EXISTS public.lesson_podcasts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    document_id uuid NOT NULL,
    user_id uuid NOT NULL,
    
    status text DEFAULT 'pending'::text NOT NULL, -- pending, processing, completed, failed
    summary_text text,
    audio_url text,
    duration_seconds integer,
    error_message text,
    
    CONSTRAINT lesson_podcasts_document_id_fkey FOREIGN KEY (document_id)
        REFERENCES public.documents (id) ON DELETE CASCADE,
    CONSTRAINT lesson_podcasts_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Belge ID'sine göre hızlı arama için index
CREATE INDEX IF NOT EXISTS idx_lesson_podcasts_on_document_id ON public.lesson_podcasts(document_id);

-- RLS (Row-Level Security) Politikaları
ALTER TABLE public.lesson_podcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage their own lesson podcasts"
    ON public.lesson_podcasts
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- updated_at sütununu otomatik güncelleyen trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_lesson_podcasts_updated
    BEFORE UPDATE ON public.lesson_podcasts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
