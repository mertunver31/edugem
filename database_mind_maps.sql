-- =====================================================
-- MIND MAPS DATABASE SCHEMA
-- =====================================================

-- Mind Maps tablosu
CREATE TABLE IF NOT EXISTS mind_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'course_mindmap', -- course_mindmap, chapter_mindmap
    title VARCHAR(255) NOT NULL,
    central_topic VARCHAR(255) NOT NULL,
    content JSONB NOT NULL, -- Mind map JSON yapısı
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mind_maps_document_id ON mind_maps(document_id);
CREATE INDEX IF NOT EXISTS idx_mind_maps_type ON mind_maps(type);
CREATE INDEX IF NOT EXISTS idx_mind_maps_created_at ON mind_maps(created_at DESC);

-- Learning Paths tablosu
CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    steps JSONB NOT NULL, -- Learning path steps JSON yapısı
    estimated_duration VARCHAR(100), -- "8-10 saat"
    difficulty_level VARCHAR(50) DEFAULT 'intermediate', -- beginner, intermediate, advanced
    prerequisites JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_paths_document_id ON learning_paths(document_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_difficulty ON learning_paths(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_learning_paths_created_at ON learning_paths(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Mind Maps RLS
ALTER TABLE mind_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mind maps" ON mind_maps
    FOR SELECT USING (
        document_id IN (
            SELECT id FROM documents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own mind maps" ON mind_maps
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT id FROM documents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own mind maps" ON mind_maps
    FOR UPDATE USING (
        document_id IN (
            SELECT id FROM documents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own mind maps" ON mind_maps
    FOR DELETE USING (
        document_id IN (
            SELECT id FROM documents WHERE user_id = auth.uid()
        )
    );

-- Learning Paths RLS
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own learning paths" ON learning_paths
    FOR SELECT USING (
        document_id IN (
            SELECT id FROM documents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own learning paths" ON learning_paths
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT id FROM documents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own learning paths" ON learning_paths
    FOR UPDATE USING (
        document_id IN (
            SELECT id FROM documents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own learning paths" ON learning_paths
    FOR DELETE USING (
        document_id IN (
            SELECT id FROM documents WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to update updated_at timestamp for mind_maps
CREATE TRIGGER update_mind_maps_updated_at 
    BEFORE UPDATE ON mind_maps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp for learning_paths
CREATE TRIGGER update_learning_paths_updated_at 
    BEFORE UPDATE ON learning_paths 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE mind_maps IS 'Stores AI-generated mind maps for courses and chapters';
COMMENT ON TABLE learning_paths IS 'Stores AI-generated learning paths for courses';

COMMENT ON COLUMN mind_maps.content IS 'JSON structure containing mind map nodes and connections';
COMMENT ON COLUMN mind_maps.type IS 'Type of mind map: course_mindmap, chapter_mindmap';
COMMENT ON COLUMN mind_maps.central_topic IS 'Main topic/root node of the mind map';

COMMENT ON COLUMN learning_paths.steps IS 'JSON array containing learning path steps';
COMMENT ON COLUMN learning_paths.estimated_duration IS 'Estimated time to complete the learning path';
COMMENT ON COLUMN learning_paths.difficulty_level IS 'Difficulty level: beginner, intermediate, advanced';
COMMENT ON COLUMN learning_paths.prerequisites IS 'JSON array of prerequisite concepts or skills'; 