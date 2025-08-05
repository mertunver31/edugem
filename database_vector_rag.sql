-- =====================================================
-- VECTOR DATABASE SETUP FOR RAG SYSTEM
-- =====================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- KNOWLEDGE BASE TABLE
-- =====================================================

-- Main knowledge base table for storing segment content with embeddings
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id VARCHAR(255), -- Changed from UUID to VARCHAR for lesson IDs
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embeddings vector(768), -- text-embedding-004 (768 dimensions, Supabase compatible)
    metadata JSONB DEFAULT '{}',
    content_type VARCHAR(50) DEFAULT 'segment_content', -- segment_content, concept, summary, etc.
    relevance_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CONCEPT EMBEDDINGS TABLE
-- =====================================================

-- Table for storing concept-level embeddings for better semantic search
CREATE TABLE IF NOT EXISTS concept_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_name VARCHAR(255) NOT NULL,
    concept_description TEXT,
    embeddings vector(768),
    related_concepts TEXT[], -- Array of related concept names
    difficulty_level INTEGER DEFAULT 1, -- 1-5 scale
    subject_area VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CONCEPT RELATIONSHIPS TABLE
-- =====================================================

-- Table for storing relationships between concepts
CREATE TABLE IF NOT EXISTS concept_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept1 VARCHAR(255) NOT NULL,
    concept2 VARCHAR(255) NOT NULL,
    relationship_type VARCHAR(50) DEFAULT 'semantic_similarity',
    relationship_score FLOAT DEFAULT 0.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(concept1, concept2)
);

-- =====================================================
-- SEGMENT RELATIONSHIPS TABLE
-- =====================================================

-- Table for storing relationships between segments
CREATE TABLE IF NOT EXISTS segment_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,
    target_segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'prerequisite', -- prerequisite, related, follows, etc.
    similarity_score FLOAT DEFAULT 0.0,
    shared_concepts TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_segment_id, target_segment_id)
);

-- =====================================================
-- RAG CONTEXT CACHE TABLE
-- =====================================================

-- Table for caching RAG context to improve performance
CREATE TABLE IF NOT EXISTS rag_context_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,
    context_hash VARCHAR(64) NOT NULL, -- Hash of the context content
    relevant_segments JSONB, -- Array of relevant segment IDs and scores
    relevant_concepts JSONB, -- Array of relevant concept IDs and scores
    context_content TEXT, -- The actual context content
    cache_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cache_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    UNIQUE(segment_id, context_hash)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Semantic search index for knowledge_base (using HNSW for high dimensions)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embeddings 
ON knowledge_base USING hnsw (embeddings vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Index for concept embeddings (using HNSW for high dimensions)
CREATE INDEX IF NOT EXISTS idx_concept_embeddings 
ON concept_embeddings USING hnsw (embeddings vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_knowledge_base_segment_id 
ON knowledge_base(segment_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_document_id 
ON knowledge_base(document_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_type 
ON knowledge_base(content_type);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_relevance_score 
ON knowledge_base(relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_concept_embeddings_concept_name 
ON concept_embeddings(concept_name);

CREATE INDEX IF NOT EXISTS idx_concept_embeddings_subject_area 
ON concept_embeddings(subject_area);

CREATE INDEX IF NOT EXISTS idx_segment_relationships_source 
ON segment_relationships(source_segment_id);

CREATE INDEX IF NOT EXISTS idx_segment_relationships_target 
ON segment_relationships(target_segment_id);

CREATE INDEX IF NOT EXISTS idx_rag_context_cache_segment_id 
ON rag_context_cache(segment_id);

CREATE INDEX IF NOT EXISTS idx_rag_context_cache_expires 
ON rag_context_cache(cache_expires_at);

-- =====================================================
-- FUNCTIONS FOR RAG OPERATIONS
-- =====================================================

-- Function to find similar content in knowledge base
CREATE OR REPLACE FUNCTION find_similar_content(
    query_embedding vector(768),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    segment_id VARCHAR(255),
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kb.id,
        kb.segment_id,
        kb.content,
        kb.metadata,
        1 - (kb.embeddings <=> query_embedding) AS similarity
    FROM knowledge_base kb
    WHERE kb.embeddings IS NOT NULL
    AND 1 - (kb.embeddings <=> query_embedding) > match_threshold
    ORDER BY kb.embeddings <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to find related concepts
CREATE OR REPLACE FUNCTION find_related_concepts(
    query_embedding vector(768),
    match_threshold FLOAT DEFAULT 0.6,
    match_count INT DEFAULT 3
)
RETURNS TABLE (
    id UUID,
    concept_name VARCHAR(255),
    concept_description TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.id,
        ce.concept_name,
        ce.concept_description,
        1 - (ce.embeddings <=> query_embedding) AS similarity
    FROM concept_embeddings ce
    WHERE ce.embeddings IS NOT NULL
    AND 1 - (ce.embeddings <=> query_embedding) > match_threshold
    ORDER BY ce.embeddings <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to get RAG context for a segment
CREATE OR REPLACE FUNCTION get_rag_context(
    target_segment_id UUID,
    context_limit INT DEFAULT 5
)
RETURNS TABLE (
    relevant_segments JSONB,
    relevant_concepts JSONB,
    context_content TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    cache_record RECORD;
BEGIN
    -- Check if we have cached context
    SELECT * INTO cache_record 
    FROM rag_context_cache 
    WHERE segment_id = target_segment_id 
    AND cache_expires_at > NOW()
    LIMIT 1;
    
    IF FOUND THEN
        -- Return cached context
        relevant_segments := cache_record.relevant_segments;
        relevant_concepts := cache_record.relevant_concepts;
        context_content := cache_record.context_content;
        RETURN NEXT;
    ELSE
        -- Return empty context (will be populated by application)
        relevant_segments := '[]'::jsonb;
        relevant_concepts := '[]'::jsonb;
        context_content := '';
        RETURN NEXT;
    END IF;
END;
$$;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_rag_cache()
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM rag_context_cache 
    WHERE cache_expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to knowledge_base
CREATE TRIGGER update_knowledge_base_updated_at 
    BEFORE UPDATE ON knowledge_base 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_context_cache ENABLE ROW LEVEL SECURITY;

-- Knowledge base policies
CREATE POLICY "Users can view knowledge base entries" ON knowledge_base
    FOR SELECT USING (true);

CREATE POLICY "Users can insert knowledge base entries" ON knowledge_base
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own knowledge base entries" ON knowledge_base
    FOR UPDATE USING (true);

-- Concept embeddings policies
CREATE POLICY "Users can view concept embeddings" ON concept_embeddings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert concept embeddings" ON concept_embeddings
    FOR INSERT WITH CHECK (true);

-- Segment relationships policies
CREATE POLICY "Users can view segment relationships" ON segment_relationships
    FOR SELECT USING (true);

CREATE POLICY "Users can insert segment relationships" ON segment_relationships
    FOR INSERT WITH CHECK (true);

-- RAG context cache policies
CREATE POLICY "Users can view RAG context cache" ON rag_context_cache
    FOR SELECT USING (true);

CREATE POLICY "Users can insert RAG context cache" ON rag_context_cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update RAG context cache" ON rag_context_cache
    FOR UPDATE USING (true);

-- =====================================================
-- UNIQUE CONSTRAINTS FOR CONFLICT HANDLING
-- =====================================================

-- Add unique constraints for conflict handling
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'concept_embeddings_concept_name_unique'
    ) THEN
        ALTER TABLE concept_embeddings ADD CONSTRAINT concept_embeddings_concept_name_unique UNIQUE (concept_name);
    END IF;
END $$;

-- concept_relationships already has unique constraint on (concept1, concept2)

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample concept embeddings (for testing)
INSERT INTO concept_embeddings (concept_name, concept_description, subject_area, difficulty_level) VALUES
('Machine Learning', 'A subset of artificial intelligence that enables systems to learn and improve from experience', 'Computer Science', 3),
('Neural Networks', 'Computing systems inspired by biological neural networks', 'Computer Science', 4),
('Data Structures', 'Organized collection of data and operations that can be performed on it', 'Computer Science', 2),
('Algorithms', 'Step-by-step procedures for solving problems', 'Computer Science', 3),
('Database Design', 'Process of designing database structure and relationships', 'Computer Science', 2);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE knowledge_base IS 'Stores segment content with vector embeddings for RAG system';
COMMENT ON TABLE concept_embeddings IS 'Stores concept-level embeddings for semantic search';
COMMENT ON TABLE segment_relationships IS 'Stores relationships between segments for context building';
COMMENT ON TABLE rag_context_cache IS 'Caches RAG context to improve performance';

COMMENT ON COLUMN knowledge_base.embeddings IS '768-dimensional vector from text-embedding-004';
COMMENT ON COLUMN knowledge_base.metadata IS 'JSON object containing additional information about the content';
COMMENT ON COLUMN knowledge_base.relevance_score IS 'Score indicating how relevant this content is (0.0 to 1.0)';

COMMENT ON FUNCTION find_similar_content IS 'Finds similar content in knowledge base using vector similarity';
COMMENT ON FUNCTION find_related_concepts IS 'Finds related concepts using vector similarity';
COMMENT ON FUNCTION get_rag_context IS 'Retrieves RAG context for a specific segment';
COMMENT ON FUNCTION clean_expired_rag_cache IS 'Cleans expired cache entries from RAG context cache'; 