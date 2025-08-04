-- =====================================================
-- VECTOR DATABASE TEST SCRIPT
-- =====================================================

-- Test 1: Check if pgvector extension is enabled
SELECT name, default_version, installed_version 
FROM pg_available_extensions 
WHERE name = 'vector';

-- Test 2: Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('knowledge_base', 'concept_embeddings', 'segment_relationships', 'rag_context_cache');

-- Test 3: Check if indexes exist (including HNSW indexes)
SELECT indexname, tablename, indexdef
FROM pg_indexes 
WHERE tablename IN ('knowledge_base', 'concept_embeddings', 'segment_relationships', 'rag_context_cache')
AND indexname LIKE 'idx_%';

-- Test 4: Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('find_similar_content', 'find_related_concepts', 'get_rag_context', 'clean_expired_rag_cache');

-- Test 5: Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('knowledge_base', 'concept_embeddings', 'segment_relationships', 'rag_context_cache');

-- Test 6: Sample data check
SELECT COUNT(*) as concept_count FROM concept_embeddings;
SELECT concept_name, subject_area, difficulty_level FROM concept_embeddings LIMIT 5;

-- Test 7: Test vector operations (with dummy data)
-- Create a dummy embedding vector (768 dimensions of 0.1)
WITH dummy_embedding AS (
  SELECT array_fill(0.1::float, ARRAY[768])::vector AS embedding
)
SELECT 
  'Dummy embedding created successfully' as test_result,
  'Vector dimension: 768' as vector_info
FROM dummy_embedding;

-- Test 8: Test similarity function (with dummy data)
-- This will return empty results since we don't have real embeddings yet
SELECT 
  'Testing find_similar_content function' as test_name,
  COUNT(*) as result_count
FROM find_similar_content(
  array_fill(0.1::float, ARRAY[768])::vector,
  0.5,
  5
);

-- Test 9: Test concept search function (with dummy data)
SELECT 
  'Testing find_related_concepts function' as test_name,
  COUNT(*) as result_count
FROM find_related_concepts(
  array_fill(0.1::float, ARRAY[768])::vector,
  0.5,
  3
);

-- Test 10: Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'knowledge_base'
ORDER BY ordinal_position;

-- Test 11: Check vector column specifically
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_name = 'knowledge_base' 
AND column_name = 'embeddings';

-- Test 12: Performance check - count rows in each table
SELECT 
  'knowledge_base' as table_name,
  COUNT(*) as row_count
FROM knowledge_base
UNION ALL
SELECT 
  'concept_embeddings' as table_name,
  COUNT(*) as row_count
FROM concept_embeddings
UNION ALL
SELECT 
  'segment_relationships' as table_name,
  COUNT(*) as row_count
FROM segment_relationships
UNION ALL
SELECT 
  'rag_context_cache' as table_name,
  COUNT(*) as row_count
FROM rag_context_cache;

-- Test 13: Check if triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'knowledge_base';

-- Test 14: Test cache cleanup function
SELECT clean_expired_rag_cache() as cleaned_cache_count;

-- Test 15: Test vector distance calculation
SELECT 
  'Testing vector distance calculation' as test_name,
  (array_fill(0.1::float, ARRAY[768])::vector <=> array_fill(0.2::float, ARRAY[768])::vector) as distance_result;

-- Test 16: Final summary
SELECT 
  'VECTOR DATABASE SETUP COMPLETE' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('knowledge_base', 'concept_embeddings', 'segment_relationships', 'rag_context_cache')) as tables_created,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('knowledge_base', 'concept_embeddings', 'segment_relationships', 'rag_context_cache') AND indexname LIKE 'idx_%') as indexes_created,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('find_similar_content', 'find_related_concepts', 'get_rag_context', 'clean_expired_rag_cache')) as functions_created; 