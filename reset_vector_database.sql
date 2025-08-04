-- =====================================================
-- RESET VECTOR DATABASE FOR DIMENSION FIX
-- =====================================================

-- Drop existing tables and functions
DROP TABLE IF EXISTS rag_context_cache CASCADE;
DROP TABLE IF EXISTS segment_relationships CASCADE;
DROP TABLE IF EXISTS concept_embeddings CASCADE;
DROP TABLE IF EXISTS knowledge_base CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS find_similar_content(vector, float, int) CASCADE;
DROP FUNCTION IF EXISTS find_related_concepts(vector, float, int) CASCADE;
DROP FUNCTION IF EXISTS get_rag_context(uuid, int) CASCADE;
DROP FUNCTION IF EXISTS clean_expired_rag_cache() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop indexes
DROP INDEX IF EXISTS idx_knowledge_base_embeddings;
DROP INDEX IF EXISTS idx_concept_embeddings;
DROP INDEX IF EXISTS idx_knowledge_base_segment_id;
DROP INDEX IF EXISTS idx_knowledge_base_content_type;
DROP INDEX IF EXISTS idx_knowledge_base_relevance_score;
DROP INDEX IF EXISTS idx_concept_embeddings_concept_name;
DROP INDEX IF EXISTS idx_concept_embeddings_subject_area;
DROP INDEX IF EXISTS idx_segment_relationships_source;
DROP INDEX IF EXISTS idx_segment_relationships_target;
DROP INDEX IF EXISTS idx_rag_context_cache_segment_id;
DROP INDEX IF EXISTS idx_rag_context_cache_expires;

-- Now run the updated database_vector_rag.sql to recreate everything with 3072 dimensions
-- This will ensure all tables and functions use the correct vector dimensions 