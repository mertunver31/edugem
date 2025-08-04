-- Pipeline Execution Tracking System
-- PDF'den kurs oluşturma pipeline'ını takip etmek için

-- Pipeline executions tablosu
CREATE TABLE IF NOT EXISTS pipeline_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED')),
  current_stage TEXT DEFAULT 'INITIALIZED',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  error_message TEXT,
  result_data JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Pipeline stages tablosu
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES pipeline_executions(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  error_message TEXT,
  stage_data JSONB DEFAULT '{}'::jsonb,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_executions_user_id ON pipeline_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_executions_status ON pipeline_executions(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_executions_started_at ON pipeline_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_stage_order ON pipeline_stages(stage_order);

-- Pipeline summary view
CREATE OR REPLACE VIEW pipeline_summary AS
SELECT 
  pe.id,
  pe.user_id,
  pe.document_id,
  pe.status,
  pe.current_stage,
  pe.progress_percentage,
  pe.started_at,
  pe.completed_at,
  pe.error_message,
  CASE 
    WHEN pe.completed_at IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (pe.completed_at - pe.started_at))
    ELSE 
      EXTRACT(EPOCH FROM (now() - pe.started_at))
  END as duration_seconds,
  COUNT(ps.id) as total_stages,
  COUNT(CASE WHEN ps.status = 'COMPLETED' THEN 1 END) as completed_stages,
  COUNT(CASE WHEN ps.status = 'FAILED' THEN 1 END) as failed_stages
FROM pipeline_executions pe
LEFT JOIN pipeline_stages ps ON pe.id = ps.pipeline_id
GROUP BY pe.id, pe.user_id, pe.document_id, pe.status, pe.current_stage, 
         pe.progress_percentage, pe.started_at, pe.completed_at, pe.error_message;

-- RLS Policies
ALTER TABLE pipeline_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Pipeline executions RLS policies
CREATE POLICY "Users can view their own pipeline executions" ON pipeline_executions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pipeline executions" ON pipeline_executions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pipeline executions" ON pipeline_executions
  FOR UPDATE USING (auth.uid() = user_id);

-- Pipeline stages RLS policies
CREATE POLICY "Users can view stages of their own pipelines" ON pipeline_stages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pipeline_executions pe 
      WHERE pe.id = pipeline_stages.pipeline_id 
      AND pe.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stages for their own pipelines" ON pipeline_stages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pipeline_executions pe 
      WHERE pe.id = pipeline_stages.pipeline_id 
      AND pe.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stages of their own pipelines" ON pipeline_stages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pipeline_executions pe 
      WHERE pe.id = pipeline_stages.pipeline_id 
      AND pe.user_id = auth.uid()
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION update_pipeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_pipeline_executions_updated_at
  BEFORE UPDATE ON pipeline_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_pipeline_updated_at();

-- Pipeline statistics function
CREATE OR REPLACE FUNCTION get_pipeline_statistics(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_pipelines', COUNT(*),
    'completed_pipelines', COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END),
    'failed_pipelines', COUNT(CASE WHEN status = 'FAILED' THEN 1 END),
    'in_progress_pipelines', COUNT(CASE WHEN status IN ('STARTED', 'IN_PROGRESS') THEN 1 END),
    'average_duration_seconds', AVG(
      CASE 
        WHEN completed_at IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (completed_at - started_at))
        ELSE NULL
      END
    ),
    'success_rate', 
      CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2)
        ELSE 0
      END
  ) INTO result
  FROM pipeline_executions
  WHERE pipeline_executions.user_id = get_pipeline_statistics.user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 