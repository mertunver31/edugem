// =====================================================
// RETRIEVAL SERVICE FOR RAG SYSTEM
// =====================================================

import { supabase } from '../config/supabase.js';
import geminiEmbeddingService from './geminiEmbeddingService.js';
import knowledgeBaseService from './knowledgeBaseService.js';

class RetrievalService {
  constructor() {
    this.maxContextLength = 8000; // Maximum context length for AI
    this.defaultSimilarityThreshold = 0.7;
    this.defaultResultLimit = 5;
    this.cacheExpiryHours = 24;
    
    console.log('🔍 Retrieval Service initialized');
  }

  // =====================================================
  // SEMANTIC SEARCH OPERATIONS
  // =====================================================

  async findRelevantContent(query, options = {}) {
    try {
      console.log(`🔍 Finding relevant content for query: "${query.substring(0, 50)}..."`);
      
      const {
        limit = this.defaultResultLimit,
        threshold = this.defaultSimilarityThreshold,
        contentType = 'segment_content',
        documentId = null
      } = options;

      // Generate embedding for the query
      const embeddingResult = await geminiEmbeddingService.generateEmbedding(query);
      if (!embeddingResult.success) {
        throw new Error(`Failed to generate query embedding: ${embeddingResult.error}`);
      }

      // Search in knowledge base using vector similarity
      const { data: similarContent, error } = await supabase.rpc('find_similar_content', {
        query_embedding: embeddingResult.embedding,
        match_threshold: threshold,
        match_count: limit
      });

      if (error) {
        throw new Error(`Database search error: ${error.message}`);
      }

      // Filter by document if specified
      let filteredContent = similarContent;
      if (documentId) {
        filteredContent = await this.filterByDocument(similarContent, documentId);
      }

      // Filter by content type if specified
      if (contentType !== 'all') {
        filteredContent = filteredContent.filter(item => 
          item.metadata?.content_type === contentType || 
          item.content_type === contentType
        );
      }

      console.log(`✅ Found ${filteredContent.length} relevant content items`);
      
      return {
        success: true,
        content: filteredContent,
        query: query,
        embedding: embeddingResult.embedding,
        searchParams: { limit, threshold, contentType, documentId },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error finding relevant content:', error);
      return {
        success: false,
        error: error.message,
        query: query,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // CONTEXT BUILDING
  // =====================================================

  async buildContext(segmentId, documentId, options = {}) {
    try {
      console.log(`🏗️ Building context for segment ${segmentId}`);
      
      const {
        includeConcepts = true,
        includeRelatedSegments = true,
        maxContextLength = this.maxContextLength,
        similarityThreshold = this.defaultSimilarityThreshold
      } = options;

      // Get segment content
      const segmentContent = await this.getSegmentContent(segmentId);
      if (!segmentContent.success) {
        throw new Error(`Failed to get segment content: ${segmentContent.error}`);
      }

      // Find relevant content
      const relevantContent = await this.findRelevantContent(segmentContent.content, {
        limit: 10,
        threshold: similarityThreshold,
        documentId: documentId
      });

      if (!relevantContent.success) {
        throw new Error(`Failed to find relevant content: ${relevantContent.error}`);
      }

      // Build context components
      const contextComponents = [];

      // 1. Current segment content
      contextComponents.push({
        type: 'current_segment',
        content: segmentContent.content,
        relevance: 1.0
      });

      // 2. Related segments
      if (includeRelatedSegments) {
        const relatedSegments = relevantContent.content
          .filter(item => item.segment_id !== segmentId)
          .slice(0, 3);
        
        relatedSegments.forEach(item => {
          contextComponents.push({
            type: 'related_segment',
            content: item.content,
            relevance: item.similarity,
            segmentId: item.segment_id
          });
        });
      }

      // 3. Related concepts
      if (includeConcepts) {
        const conceptContext = await this.getRelatedConcepts(segmentContent.content);
        if (conceptContext.success) {
          contextComponents.push({
            type: 'related_concepts',
            content: conceptContext.content,
            relevance: 0.8
          });
        }
      }

      // Build final context
      const finalContext = this.optimizeContext(contextComponents, maxContextLength);
      
      // Cache the context
      await this.cacheContext(segmentId, finalContext, documentId);

      console.log(`✅ Context built successfully (${finalContext.length} chars)`);
      
      return {
        success: true,
        context: finalContext,
        components: contextComponents,
        segmentId: segmentId,
        documentId: documentId,
        contextLength: finalContext.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error building context for segment ${segmentId}:`, error);
      return {
        success: false,
        error: error.message,
        segmentId: segmentId,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // CROSS-CHAPTER CONTEXT
  // =====================================================

  async getCrossChapterContext(chapterId, documentId, options = {}) {
    try {
      console.log(`🌐 Building cross-chapter context for chapter ${chapterId}`);
      
      const {
        includePreviousChapters = true,
        includeRelatedChapters = true,
        maxChapters = 3
      } = options;

      // Get chapter segments
      const chapterSegments = await this.getChapterSegments(chapterId, documentId);
      if (!chapterSegments.success) {
        throw new Error(`Failed to get chapter segments: ${chapterSegments.error}`);
      }

      const contextComponents = [];

      // Get content from each segment in the chapter
      for (const segment of chapterSegments.segments) {
        const segmentContext = await this.buildContext(segment.id, documentId, {
          includeConcepts: true,
          includeRelatedSegments: false,
          maxContextLength: 2000
        });

        if (segmentContext.success) {
          contextComponents.push({
            type: 'chapter_segment',
            content: segmentContext.context,
            relevance: 0.9,
            segmentId: segment.id
          });
        }
      }

      // Include previous chapters if requested
      if (includePreviousChapters) {
        const previousChapters = await this.getPreviousChapters(chapterId, documentId, maxChapters);
        for (const chapter of previousChapters) {
          const chapterContext = await this.getChapterSummary(chapter.id);
          if (chapterContext.success) {
            contextComponents.push({
              type: 'previous_chapter',
              content: chapterContext.summary,
              relevance: 0.7,
              chapterId: chapter.id
            });
          }
        }
      }

      // Build final cross-chapter context
      const finalContext = this.optimizeContext(contextComponents, this.maxContextLength * 2);
      
      console.log(`✅ Cross-chapter context built (${finalContext.length} chars)`);
      
      return {
        success: true,
        context: finalContext,
        components: contextComponents,
        chapterId: chapterId,
        documentId: documentId,
        contextLength: finalContext.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error building cross-chapter context for chapter ${chapterId}:`, error);
      return {
        success: false,
        error: error.message,
        chapterId: chapterId,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  async getSegmentContent(segmentId) {
    try {
      const { data, error } = await supabase
        .from('segments')
        .select('content, title')
        .eq('id', segmentId)
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        content: data.content,
        title: data.title,
        segmentId: segmentId
      };

    } catch (error) {
      console.error(`❌ Error getting segment content for ${segmentId}:`, error);
      return {
        success: false,
        error: error.message,
        segmentId: segmentId
      };
    }
  }

  async getRelatedConcepts(query) {
    try {
      const embeddingResult = await geminiEmbeddingService.generateEmbedding(query);
      if (!embeddingResult.success) {
        throw new Error(`Failed to generate embedding: ${embeddingResult.error}`);
      }

      const { data: concepts, error } = await supabase.rpc('find_related_concepts', {
        query_embedding: embeddingResult.embedding,
        match_threshold: 0.6,
        match_count: 3
      });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const conceptText = concepts.map(concept => 
        `${concept.concept_name}: ${concept.concept_description}`
      ).join('\n');

      return {
        success: true,
        content: conceptText,
        concepts: concepts
      };

    } catch (error) {
      console.error('❌ Error getting related concepts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async filterByDocument(content, documentId) {
    try {
      // Get all segments for the document
      const { data: documentSegments, error } = await supabase
        .from('segments')
        .select('id')
        .eq('document_id', documentId);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const documentSegmentIds = new Set(documentSegments.map(s => s.id));
      
      // Filter content to only include segments from this document
      return content.filter(item => documentSegmentIds.has(item.segment_id));

    } catch (error) {
      console.error('❌ Error filtering by document:', error);
      return content; // Return original content if filtering fails
    }
  }

  optimizeContext(components, maxLength) {
    // Sort by relevance
    const sortedComponents = components.sort((a, b) => b.relevance - a.relevance);
    
    let finalContext = '';
    let currentLength = 0;

    for (const component of sortedComponents) {
      const componentText = `[${component.type.toUpperCase()}]\n${component.content}\n\n`;
      
      if (currentLength + componentText.length <= maxLength) {
        finalContext += componentText;
        currentLength += componentText.length;
      } else {
        // Truncate if needed
        const remainingLength = maxLength - currentLength - 50; // Leave space for "..."
        if (remainingLength > 100) {
          finalContext += `[${component.type.toUpperCase()}]\n${component.content.substring(0, remainingLength)}...\n\n`;
        }
        break;
      }
    }

    return finalContext.trim();
  }

  async cacheContext(segmentId, context, documentId) {
    try {
      const contextHash = this.generateContextHash(context);
      
      const { error } = await supabase
        .from('rag_context_cache')
        .upsert({
          segment_id: segmentId,
          context_hash: contextHash,
          context_content: context,
          relevant_segments: [], // Will be populated later
          relevant_concepts: [], // Will be populated later
          cache_expires_at: new Date(Date.now() + this.cacheExpiryHours * 60 * 60 * 1000).toISOString()
        });

      if (error) {
        console.warn('⚠️ Failed to cache context:', error);
      } else {
        console.log(`💾 Context cached for segment ${segmentId}`);
      }

    } catch (error) {
      console.warn('⚠️ Error caching context:', error);
    }
  }

  generateContextHash(content) {
    // Simple hash function for context content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async getChapterSegments(chapterId, documentId) {
    try {
      // Önce course structure'ı al
      const { data: documentData, error: docError } = await supabase
        .from('documents')
        .select('course_structure')
        .eq('id', documentId)
        .single();

      if (docError) {
        throw new Error(`Document error: ${docError.message}`);
      }

      if (!documentData.course_structure) {
        throw new Error('Course structure not found');
      }

      // Chapter'ı course structure'dan bul
      const courseStructure = documentData.course_structure;
      const chapter = courseStructure.chapters?.find(ch => ch.id === chapterId);
      
      if (!chapter) {
        throw new Error(`Chapter ${chapterId} not found in course structure`);
      }

      // Chapter'daki tüm lesson'ların segment ID'lerini topla
      const segmentIds = [];
      chapter.lessons?.forEach(lesson => {
        if (lesson.segmentId) {
          segmentIds.push(lesson.segmentId);
        }
      });

      if (segmentIds.length === 0) {
        return {
          success: true,
          segments: []
        };
      }

      // Segment'leri database'den al
      const { data: segments, error: segError } = await supabase
        .from('segments')
        .select('id, title, content')
        .in('id', segmentIds)
        .eq('document_id', documentId);

      if (segError) {
        throw new Error(`Segments error: ${segError.message}`);
      }

      return {
        success: true,
        segments: segments || []
      };

    } catch (error) {
      console.error(`❌ Error getting chapter segments for ${chapterId}:`, error);
      return {
        success: false,
        error: error.message,
        chapterId: chapterId
      };
    }
  }

  async getPreviousChapters(chapterId, documentId, maxChapters) {
    try {
      // Course structure'ı al
      const { data: documentData, error: docError } = await supabase
        .from('documents')
        .select('course_structure')
        .eq('id', documentId)
        .single();

      if (docError) {
        throw new Error(`Document error: ${docError.message}`);
      }

      if (!documentData.course_structure) {
        return [];
      }

      const courseStructure = documentData.course_structure;
      const chapters = courseStructure.chapters || [];

      // Mevcut chapter'ın index'ini bul
      const currentChapterIndex = chapters.findIndex(ch => ch.id === chapterId);
      
      if (currentChapterIndex === -1) {
        return [];
      }

      // Önceki chapter'ları al
      const previousChapters = chapters
        .slice(0, currentChapterIndex)
        .reverse()
        .slice(0, maxChapters)
        .map(chapter => ({
          id: chapter.id,
          title: chapter.title,
          order: chapter.order
        }));

      return previousChapters;

    } catch (error) {
      console.error('❌ Error getting previous chapters:', error);
      return [];
    }
  }

  async getChapterSummary(chapterId) {
    try {
      // This would typically get a pre-generated summary
      // For now, we'll return a placeholder
      return {
        success: true,
        summary: `Summary of chapter ${chapterId} - This is a placeholder summary that would be generated or stored separately.`
      };

    } catch (error) {
      console.error(`❌ Error getting chapter summary for ${chapterId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =====================================================
  // HEALTH CHECK
  // =====================================================

  async healthCheck() {
    try {
      console.log('🏥 Performing Retrieval Service health check...');
      
      // Test basic functionality
      const testQuery = 'machine learning basics';
      const searchResult = await this.findRelevantContent(testQuery, { limit: 1 });
      
      if (searchResult.success) {
        console.log('✅ Retrieval Service is healthy');
        return {
          status: 'healthy',
          searchTest: 'passed',
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(searchResult.error);
      }
      
    } catch (error) {
      console.error('❌ Retrieval Service health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // STATISTICS
  // =====================================================

  getStatistics() {
    return {
      maxContextLength: this.maxContextLength,
      defaultSimilarityThreshold: this.defaultSimilarityThreshold,
      defaultResultLimit: this.defaultResultLimit,
      cacheExpiryHours: this.cacheExpiryHours,
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
const retrievalService = new RetrievalService();

export default retrievalService; 