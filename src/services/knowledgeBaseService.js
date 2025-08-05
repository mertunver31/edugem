// =====================================================
// KNOWLEDGE BASE SERVICE
// =====================================================

import { supabase } from '../config/supabase.js';
import geminiEmbeddingService from './geminiEmbeddingService.js';

class KnowledgeBaseService {
  constructor() {
    console.log('🔧 Knowledge Base Service initialized');
  }

  // =====================================================
  // SEGMENT CONTENT STORAGE
  // =====================================================

  async storeSegmentContent(segmentId, content, metadata = {}) {
    try {
      console.log(`💾 Storing segment content for segment ${segmentId}`);
      
      // Embedding oluştur
      const embeddingResult = await geminiEmbeddingService.generateSegmentEmbedding(content, segmentId);
      
      if (!embeddingResult.success) {
        throw new Error(`Failed to generate embedding: ${embeddingResult.error}`);
      }
      
      // Knowledge base'e kaydet
      const { data, error } = await supabase
        .from('knowledge_base')
        .insert({
          segment_id: segmentId,
          content: content,
          embeddings: embeddingResult.embedding,
          metadata: {
            ...metadata,
            ...embeddingResult.metadata,
            storedAt: new Date().toISOString()
          },
          content_type: 'segment_content',
          relevance_score: 1.0
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log(`✅ Segment content stored successfully (ID: ${data.id})`);
      
      return {
        success: true,
        knowledgeBaseId: data.id,
        segmentId: segmentId,
        embeddingDimensions: embeddingResult.dimensions,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Error storing segment content for ${segmentId}:`, error);
      return {
        success: false,
        error: error.message,
        segmentId: segmentId,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // BATCH SEGMENT STORAGE
  // =====================================================

  async storeBatchSegments(segments) {
    console.log(`🔄 Storing batch segments (${segments.length} items)`);
    
    const results = [];
    const batchSize = 3; // Database batch size
    const batches = this.chunkArray(segments, batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} items)`);
      
      const batchPromises = batch.map(async (segment) => {
        return await this.storeSegmentContent(
          segment.segmentId,
          segment.content,
          segment.metadata
        );
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Batch'ler arası kısa bekleme
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`✅ Batch storage completed: ${successCount} success, ${failureCount} failures`);
    
    return {
      success: true,
      totalProcessed: results.length,
      successCount,
      failureCount,
      results
    };
  }

  // =====================================================
  // SEGMENT STORAGE (Enhanced Content Service için)
  // =====================================================

  async storeSegment(documentId, segmentId, content, metadata = {}) {
    try {
      console.log(`💾 Storing segment: ${segmentId}`);
      
      // Embedding oluştur
      const embeddingResult = await geminiEmbeddingService.generateSegmentEmbedding(content, segmentId);
      
      if (!embeddingResult.success) {
        throw new Error(`Failed to generate embedding: ${embeddingResult.error}`);
      }
      
      // Knowledge base'e kaydet - mevcut veritabanı yapısına uygun
      const { data, error } = await supabase
        .from('knowledge_base')
        .insert({
          segment_id: segmentId, // VARCHAR(255) - lesson ID'leri için
          document_id: documentId, // UUID - documents tablosuna referans
          content: content,
          embeddings: embeddingResult.embedding,
          metadata: {
            ...metadata,
            ...embeddingResult.metadata,
            storedAt: new Date().toISOString()
          },
          content_type: metadata.content_type || 'lesson_content',
          relevance_score: 1.0
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log(`✅ Segment stored successfully (ID: ${data.id})`);
      
      return {
        success: true,
        knowledgeBaseId: data.id,
        segmentId: segmentId,
        embeddingDimensions: embeddingResult.dimensions,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Error storing segment ${segmentId}:`, error);
      return {
        success: false,
        error: error.message,
        segmentId: segmentId,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // CONCEPT STORAGE (Enhanced Content Service için)
  // =====================================================

  async storeConcept(conceptName, conceptDescription, metadata = {}) {
    try {
      console.log(`🧠 Storing concept: ${conceptName}`);
      
      // Concept description'ı 100 karakter ile sınırla
      const truncatedDescription = conceptDescription.length > 100 
        ? conceptDescription.substring(0, 97) + '...' 
        : conceptDescription;
      
      // Concept embedding oluştur
      const embeddingResult = await geminiEmbeddingService.generateConceptEmbedding(conceptName, truncatedDescription);
      
      if (!embeddingResult.success) {
        throw new Error(`Failed to generate concept embedding: ${embeddingResult.error}`);
      }
      
      // Concept embeddings tablosuna kaydet - mevcut veritabanı yapısına uygun
      const { data, error } = await supabase
        .from('concept_embeddings')
        .upsert({
          concept_name: conceptName,
          concept_description: truncatedDescription,
          embeddings: embeddingResult.embedding,
          related_concepts: metadata.related_concepts || [],
          difficulty_level: metadata.difficulty_level || 1,
          subject_area: metadata.subject_area || 'general',
          metadata: {
            ...metadata,
            ...embeddingResult.metadata,
            storedAt: new Date().toISOString()
          }
        }, {
          onConflict: 'concept_name',
          ignoreDuplicates: false
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log(`✅ Concept stored successfully (ID: ${data.id})`);
      
      return {
        success: true,
        conceptId: data.id,
        conceptName: conceptName,
        embeddingDimensions: embeddingResult.dimensions,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Error storing concept ${conceptName}:`, error);
      return {
        success: false,
        error: error.message,
        conceptName: conceptName,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // CONCEPT RELATIONSHIP STORAGE
  // =====================================================

  async storeConceptRelationship(concept1, concept2, relationshipScore, metadata = {}) {
    try {
      console.log(`🔗 Storing concept relationship: ${concept1} <-> ${concept2}`);
      
      // Concept relationships tablosuna kaydet - mevcut veritabanı yapısına uygun
      const { data, error } = await supabase
        .from('concept_relationships')
        .upsert({
          concept1: concept1,
          concept2: concept2,
          relationship_type: metadata.relationship_type || 'semantic_similarity',
          relationship_score: relationshipScore,
          metadata: {
            ...metadata,
            storedAt: new Date().toISOString()
          }
        }, {
          onConflict: 'concept1,concept2',
          ignoreDuplicates: false
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log(`✅ Concept relationship stored successfully (ID: ${data.id})`);
      
      return {
        success: true,
        relationshipId: data.id,
        concept1: concept1,
        concept2: concept2,
        score: relationshipScore,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Error storing concept relationship:`, error);
      return {
        success: false,
        error: error.message,
        concept1: concept1,
        concept2: concept2,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // CONCEPT STORAGE (Original)
  // =====================================================

  async storeConceptOriginal(conceptName, conceptDescription, subjectArea, difficultyLevel = 1, relatedConcepts = []) {
    try {
      console.log(`🧠 Storing concept: ${conceptName}`);
      
      // Concept embedding oluştur
      const embeddingResult = await geminiEmbeddingService.generateConceptEmbedding(conceptName, conceptDescription);
      
      if (!embeddingResult.success) {
        throw new Error(`Failed to generate concept embedding: ${embeddingResult.error}`);
      }
      
      // Concept embeddings tablosuna kaydet
      const { data, error } = await supabase
        .from('concept_embeddings')
        .insert({
          concept_name: conceptName,
          concept_description: conceptDescription,
          embeddings: embeddingResult.embedding,
          related_concepts: relatedConcepts,
          difficulty_level: difficultyLevel,
          subject_area: subjectArea,
          metadata: {
            ...embeddingResult.metadata,
            storedAt: new Date().toISOString()
          }
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log(`✅ Concept stored successfully (ID: ${data.id})`);
      
      return {
        success: true,
        conceptId: data.id,
        conceptName: conceptName,
        embeddingDimensions: embeddingResult.dimensions,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Error storing concept ${conceptName}:`, error);
      return {
        success: false,
        error: error.message,
        conceptName: conceptName,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // SEMANTIC SEARCH
  // =====================================================

  async findSimilarContent(queryText, matchThreshold = 0.7, matchCount = 5) {
    try {
      console.log(`🔍 Finding similar content for query: "${queryText.substring(0, 50)}..."`);
      
      // Query embedding oluştur
      const embeddingResult = await geminiEmbeddingService.generateEmbedding(queryText);
      
      if (!embeddingResult.success) {
        throw new Error(`Failed to generate query embedding: ${embeddingResult.error}`);
      }
      
      // Database'de semantic search yap
      const { data, error } = await supabase.rpc('find_similar_content', {
        query_embedding: embeddingResult.embedding,
        match_threshold: matchThreshold,
        match_count: matchCount
      });
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log(`✅ Found ${data.length} similar content items`);
      
      return {
        success: true,
        results: data,
        queryEmbedding: embeddingResult.embedding,
        matchCount: data.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error finding similar content:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // RELATED CONCEPTS SEARCH
  // =====================================================

  async findRelatedConcepts(queryText, matchThreshold = 0.6, matchCount = 3) {
    try {
      console.log(`🧠 Finding related concepts for query: "${queryText.substring(0, 50)}..."`);
      
      // Query embedding oluştur
      const embeddingResult = await geminiEmbeddingService.generateEmbedding(queryText);
      
      if (!embeddingResult.success) {
        throw new Error(`Failed to generate query embedding: ${embeddingResult.error}`);
      }
      
      // Database'de concept search yap
      const { data, error } = await supabase.rpc('find_related_concepts', {
        query_embedding: embeddingResult.embedding,
        match_threshold: matchThreshold,
        match_count: matchCount
      });
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log(`✅ Found ${data.length} related concepts`);
      
      return {
        success: true,
        results: data,
        queryEmbedding: embeddingResult.embedding,
        matchCount: data.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error finding related concepts:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // RAG CONTEXT RETRIEVAL
  // =====================================================

  async getRAGContext(segmentId, contextLimit = 5) {
    try {
      console.log(`📚 Getting RAG context for segment ${segmentId}`);
      
      // Database'den RAG context al
      const { data, error } = await supabase.rpc('get_rag_context', {
        target_segment_id: segmentId,
        context_limit: contextLimit
      });
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (data && data.length > 0) {
        const context = data[0];
        console.log(`✅ RAG context retrieved successfully`);
        
        return {
          success: true,
          relevantSegments: context.relevant_segments || [],
          relevantConcepts: context.relevant_concepts || [],
          contextContent: context.context_content || '',
          segmentId: segmentId,
          timestamp: new Date().toISOString()
        };
      } else {
        // Cache'de yoksa, yeni context oluştur
        return await this.generateRAGContext(segmentId, contextLimit);
      }
      
    } catch (error) {
      console.error(`❌ Error getting RAG context for segment ${segmentId}:`, error);
      return {
        success: false,
        error: error.message,
        segmentId: segmentId,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // RAG CONTEXT GENERATION
  // =====================================================

  async generateRAGContext(segmentId, contextLimit = 5) {
    try {
      console.log(`🔄 Generating new RAG context for segment ${segmentId}`);
      
      // Segment içeriğini al
      const { data: segmentData, error: segmentError } = await supabase
        .from('knowledge_base')
        .select('content, embeddings')
        .eq('segment_id', segmentId)
        .single();
      
      if (segmentError || !segmentData) {
        throw new Error(`Segment not found: ${segmentId}`);
      }
      
      // Benzer içerikleri bul
      const similarContent = await this.findSimilarContent(segmentData.content, 0.6, contextLimit);
      
      // İlgili kavramları bul
      const relatedConcepts = await this.findRelatedConcepts(segmentData.content, 0.5, 3);
      
      // Context content oluştur
      const contextContent = this.buildContextContent(similarContent.results, relatedConcepts.results);
      
      // Cache'e kaydet
      const contextHash = this.generateContextHash(segmentData.content);
      
      const { error: cacheError } = await supabase
        .from('rag_context_cache')
        .insert({
          segment_id: segmentId,
          context_hash: contextHash,
          relevant_segments: similarContent.results,
          relevant_concepts: relatedConcepts.results,
          context_content: contextContent
        });
      
      if (cacheError) {
        console.warn(`⚠️ Failed to cache RAG context: ${cacheError.message}`);
      }
      
      console.log(`✅ RAG context generated and cached successfully`);
      
      return {
        success: true,
        relevantSegments: similarContent.results,
        relevantConcepts: relatedConcepts.results,
        contextContent: contextContent,
        segmentId: segmentId,
        isCached: false,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Error generating RAG context for segment ${segmentId}:`, error);
      return {
        success: false,
        error: error.message,
        segmentId: segmentId,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  buildContextContent(similarSegments, relatedConcepts) {
    let context = '';
    
    // Similar segments
    if (similarSegments && similarSegments.length > 0) {
      context += 'RELATED SEGMENTS:\n';
      similarSegments.forEach((segment, index) => {
        context += `${index + 1}. ${segment.content.substring(0, 200)}...\n`;
      });
      context += '\n';
    }
    
    // Related concepts
    if (relatedConcepts && relatedConcepts.length > 0) {
      context += 'RELATED CONCEPTS:\n';
      relatedConcepts.forEach((concept, index) => {
        context += `${index + 1}. ${concept.concept_name}: ${concept.concept_description}\n`;
      });
    }
    
    return context;
  }

  generateContextHash(content) {
    // Basit hash fonksiyonu
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // =====================================================
  // STATISTICS
  // =====================================================

  async getStatistics() {
    try {
      const { data: kbCount } = await supabase
        .from('knowledge_base')
        .select('id', { count: 'exact' });
      
      const { data: conceptCount } = await supabase
        .from('concept_embeddings')
        .select('id', { count: 'exact' });
      
      const { data: cacheCount } = await supabase
        .from('rag_context_cache')
        .select('id', { count: 'exact' });
      
      return {
        knowledgeBaseEntries: kbCount || 0,
        conceptEmbeddings: conceptCount || 0,
        cachedContexts: cacheCount || 0,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error getting statistics:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // CLEANUP
  // =====================================================

  async cleanupExpiredCache() {
    try {
      console.log('🧹 Cleaning up expired cache entries...');
      
      const { data, error } = await supabase.rpc('clean_expired_rag_cache');
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log(`✅ Cleaned up ${data} expired cache entries`);
      
      return {
        success: true,
        cleanedCount: data,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error cleaning up cache:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton instance
const knowledgeBaseService = new KnowledgeBaseService();

export default knowledgeBaseService; 