// =====================================================
// GEMINI EMBEDDING SERVICE
// =====================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiEmbeddingService {
  constructor() {
    // Yeni API key ile Gemini client oluştur
    this.genAI = new GoogleGenerativeAI('AIzaSyBEmpNEoDdPWAUnQxgDguPHygn8MuNlU-M');
    
    // Embedding modeli
    this.embeddingModel = 'text-embedding-004'; // 768 dimensions (Supabase compatible)
    
    // Rate limiting
    this.requestsPerMinute = 60;
    this.requestsPerDay = 1000;
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.dailyRequestCount = 0;
    this.lastDailyReset = new Date().toDateString();
    
    console.log('🔧 Gemini Embedding Service initialized');
  }

  // =====================================================
  // RATE LIMITING
  // =====================================================

  async checkRateLimit() {
    const now = Date.now();
    const today = new Date().toDateString();
    
    // Daily reset
    if (today !== this.lastDailyReset) {
      this.dailyRequestCount = 0;
      this.lastDailyReset = today;
    }
    
    // Check daily limit
    if (this.dailyRequestCount >= this.requestsPerDay) {
      throw new Error('Daily rate limit exceeded for Gemini Embedding API');
    }
    
    // Check per-minute limit
    if (now - this.lastRequestTime < 60000) { // 1 minute
      if (this.requestCount >= this.requestsPerMinute) {
        const waitTime = 60000 - (now - this.lastRequestTime);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
      }
    } else {
      this.requestCount = 0;
    }
    
    this.lastRequestTime = now;
    this.requestCount++;
    this.dailyRequestCount++;
  }

  // =====================================================
  // EMBEDDING GENERATION
  // =====================================================

  async generateEmbedding(text) {
    try {
      await this.checkRateLimit();
      
      console.log(`🔍 Generating embedding for text (${text.length} chars)`);
      
      // Text'i temizle ve optimize et
      const cleanedText = this.preprocessText(text);
      
      // Gemini Embedding API'yi çağır
      const embeddingModel = this.genAI.getGenerativeModel({ model: this.embeddingModel });
      
      const result = await embeddingModel.embedContent(cleanedText);
      const embedding = await result.embedding;
      
      // 768-dimensional vector kontrolü
      if (embedding.values.length !== 768) {
        throw new Error(`Expected 768 dimensions, got ${embedding.values.length}`);
      }
      
      console.log(`✅ Embedding generated successfully (${embedding.values.length} dimensions)`);
      
      return {
        success: true,
        embedding: embedding.values,
        dimensions: embedding.values.length,
        textLength: cleanedText.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error generating embedding:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // BATCH EMBEDDING GENERATION
  // =====================================================

  async generateBatchEmbeddings(texts, batchSize = 5) {
    console.log(`🔄 Generating batch embeddings for ${texts.length} texts`);
    
    const results = [];
    const batches = this.chunkArray(texts, batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} items)`);
      
      const batchPromises = batch.map(async (text, index) => {
        const result = await this.generateEmbedding(text);
        return {
          ...result,
          batchIndex: i,
          itemIndex: index,
          originalText: text
        };
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Batch'ler arası kısa bekleme
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ Batch embedding generation completed (${results.length} results)`);
    return results;
  }

  // =====================================================
  // SEGMENT EMBEDDING GENERATION
  // =====================================================

  async generateSegmentEmbedding(segmentContent, segmentId) {
    try {
      console.log(`📖 Generating embedding for segment ${segmentId}`);
      
      // Segment içeriğini optimize et
      const optimizedContent = this.optimizeSegmentContent(segmentContent);
      
      const result = await this.generateEmbedding(optimizedContent);
      
      if (result.success) {
        return {
          ...result,
          segmentId,
          contentType: 'segment_content',
          metadata: {
            segmentId,
            originalLength: segmentContent.length,
            optimizedLength: optimizedContent.length,
            generationMethod: 'gemini_embedding'
          }
        };
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error(`❌ Error generating segment embedding for ${segmentId}:`, error);
      return {
        success: false,
        error: error.message,
        segmentId,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // CONCEPT EMBEDDING GENERATION
  // =====================================================

  async generateConceptEmbedding(conceptName, conceptDescription) {
    try {
      console.log(`🧠 Generating embedding for concept: ${conceptName}`);
      
      // Concept için özel prompt oluştur
      const conceptText = `Concept: ${conceptName}\nDescription: ${conceptDescription}`;
      
      const result = await this.generateEmbedding(conceptText);
      
      if (result.success) {
        return {
          ...result,
          conceptName,
          contentType: 'concept_embedding',
          metadata: {
            conceptName,
            conceptDescription,
            generationMethod: 'gemini_embedding'
          }
        };
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error(`❌ Error generating concept embedding for ${conceptName}:`, error);
      return {
        success: false,
        error: error.message,
        conceptName,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =====================================================
  // TEXT PREPROCESSING
  // =====================================================

  preprocessText(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input for embedding generation');
    }
    
    // Text'i temizle
    let cleaned = text
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/[^\w\s.,!?-]/g, '') // Remove special characters except basic punctuation
      .substring(0, 3000); // Limit length for API
    
    // Minimum length kontrolü
    if (cleaned.length < 10) {
      throw new Error('Text too short for meaningful embedding');
    }
    
    return cleaned;
  }

  optimizeSegmentContent(content) {
    // Segment içeriğini embedding için optimize et
    let optimized = content;
    
    // JSON içeriği varsa text'e çevir
    if (typeof content === 'object') {
      optimized = JSON.stringify(content);
    }
    
    // HTML tags'leri temizle
    optimized = optimized.replace(/<[^>]*>/g, '');
    
    // Çok uzun metinleri kısalt (3000 karakter limit)
    if (optimized.length > 3000) {
      optimized = optimized.substring(0, 3000) + '...';
    }
    
    return optimized;
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

  // =====================================================
  // HEALTH CHECK
  // =====================================================

  async healthCheck() {
    try {
      console.log('🏥 Performing Gemini Embedding Service health check...');
      
      const testText = 'This is a test text for health check.';
      const result = await this.generateEmbedding(testText);
      
      if (result.success) {
        console.log('✅ Gemini Embedding Service is healthy');
        return {
          status: 'healthy',
          apiKey: 'configured',
          model: this.embeddingModel,
          dimensions: result.dimensions,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ Gemini Embedding Service health check failed:', error);
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
      requestsPerMinute: this.requestsPerMinute,
      requestsPerDay: this.requestsPerDay,
      currentRequestCount: this.requestCount,
      dailyRequestCount: this.dailyRequestCount,
      lastRequestTime: this.lastRequestTime,
      model: this.embeddingModel,
      dimensions: 768
    };
  }
}

// Singleton instance
const geminiEmbeddingService = new GeminiEmbeddingService();

export default geminiEmbeddingService; 