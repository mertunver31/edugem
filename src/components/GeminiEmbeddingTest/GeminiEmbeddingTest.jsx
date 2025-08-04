import React, { useState, useEffect } from 'react';
import geminiEmbeddingService from '../../services/geminiEmbeddingService.js';
import knowledgeBaseService from '../../services/knowledgeBaseService.js';
import './GeminiEmbeddingTest.css';

const GeminiEmbeddingTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [testText, setTestText] = useState('Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience.');
  const [searchQuery, setSearchQuery] = useState('artificial intelligence');
  const [searchResults, setSearchResults] = useState(null);

  // =====================================================
  // HEALTH CHECK
  // =====================================================

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      console.log('🏥 Starting health check...');
      
      const result = await geminiEmbeddingService.healthCheck();
      setHealthStatus(result);
      
      addTestResult('Health Check', result);
      
      if (result.status === 'healthy') {
        console.log('✅ Health check passed');
      } else {
        console.error('❌ Health check failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Health check error:', error);
      addTestResult('Health Check', { status: 'error', error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // EMBEDDING GENERATION TEST
  // =====================================================

  const testEmbeddingGeneration = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Testing embedding generation...');
      
      const result = await geminiEmbeddingService.generateEmbedding(testText);
      addTestResult('Embedding Generation', result);
      
      if (result.success) {
        console.log(`✅ Embedding generated: ${result.dimensions} dimensions`);
      } else {
        console.error('❌ Embedding generation failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Embedding test error:', error);
      addTestResult('Embedding Generation', { success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // CONCEPT STORAGE TEST
  // =====================================================

  const testConceptStorage = async () => {
    setIsLoading(true);
    try {
      console.log('🧠 Testing concept storage...');
      
      const conceptData = {
        name: 'Neural Networks',
        description: 'Computing systems inspired by biological neural networks that can learn patterns and make predictions.',
        subjectArea: 'Computer Science',
        difficultyLevel: 4,
        relatedConcepts: ['Machine Learning', 'Deep Learning', 'Artificial Intelligence']
      };
      
      const result = await knowledgeBaseService.storeConcept(
        conceptData.name,
        conceptData.description,
        conceptData.subjectArea,
        conceptData.difficultyLevel,
        conceptData.relatedConcepts
      );
      
      addTestResult('Concept Storage', result);
      
      if (result.success) {
        console.log(`✅ Concept stored: ${result.conceptName}`);
      } else {
        console.error('❌ Concept storage failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Concept storage error:', error);
      addTestResult('Concept Storage', { success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // SEMANTIC SEARCH TEST
  // =====================================================

  const testSemanticSearch = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Testing semantic search...');
      
      const result = await knowledgeBaseService.findSimilarContent(searchQuery, 0.6, 5);
      setSearchResults(result);
      
      addTestResult('Semantic Search', result);
      
      if (result.success) {
        console.log(`✅ Found ${result.matchCount} similar content items`);
      } else {
        console.error('❌ Semantic search failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Semantic search error:', error);
      addTestResult('Semantic Search', { success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // RELATED CONCEPTS TEST
  // =====================================================

  const testRelatedConcepts = async () => {
    setIsLoading(true);
    try {
      console.log('🧠 Testing related concepts search...');
      
      const result = await knowledgeBaseService.findRelatedConcepts(searchQuery, 0.5, 3);
      
      addTestResult('Related Concepts', result);
      
      if (result.success) {
        console.log(`✅ Found ${result.matchCount} related concepts`);
      } else {
        console.error('❌ Related concepts search failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Related concepts error:', error);
      addTestResult('Related Concepts', { success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // STATISTICS
  // =====================================================

  const getStatistics = async () => {
    setIsLoading(true);
    try {
      console.log('📊 Getting statistics...');
      
      const embeddingStats = geminiEmbeddingService.getStatistics();
      const kbStats = await knowledgeBaseService.getStatistics();
      
      const combinedStats = {
        embedding: embeddingStats,
        knowledgeBase: kbStats,
        timestamp: new Date().toISOString()
      };
      
      setStatistics(combinedStats);
      addTestResult('Statistics', combinedStats);
      
      console.log('✅ Statistics retrieved');
      
    } catch (error) {
      console.error('❌ Statistics error:', error);
      addTestResult('Statistics', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // CACHE CLEANUP
  // =====================================================

  const cleanupCache = async () => {
    setIsLoading(true);
    try {
      console.log('🧹 Cleaning up cache...');
      
      const result = await knowledgeBaseService.cleanupExpiredCache();
      
      addTestResult('Cache Cleanup', result);
      
      if (result.success) {
        console.log(`✅ Cleaned up ${result.cleanedCount} cache entries`);
      } else {
        console.error('❌ Cache cleanup failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Cache cleanup error:', error);
      addTestResult('Cache Cleanup', { success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  const addTestResult = (testName, result) => {
    setTestResults(prev => [
      {
        id: Date.now(),
        name: testName,
        result: result,
        timestamp: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const clearResults = () => {
    setTestResults([]);
    setHealthStatus(null);
    setStatistics(null);
    setSearchResults(null);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="gemini-embedding-test">
      <div className="test-header">
        <h2>🔧 Gemini Embedding Service Test</h2>
        <p>Test the RAG system's embedding generation and semantic search capabilities</p>
      </div>

      {/* Health Status */}
      {healthStatus && (
        <div className={`health-status ${healthStatus.status}`}>
          <h3>🏥 Health Status</h3>
          <pre>{JSON.stringify(healthStatus, null, 2)}</pre>
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="statistics">
          <h3>📊 Statistics</h3>
          <pre>{JSON.stringify(statistics, null, 2)}</pre>
        </div>
      )}

      {/* Test Controls */}
      <div className="test-controls">
        <div className="control-group">
          <h3>🧪 Test Functions</h3>
          <div className="button-grid">
            <button onClick={runHealthCheck} disabled={isLoading}>
              {isLoading ? '⏳' : '🏥'} Health Check
            </button>
            <button onClick={testEmbeddingGeneration} disabled={isLoading}>
              {isLoading ? '⏳' : '🔍'} Generate Embedding
            </button>
            <button onClick={testConceptStorage} disabled={isLoading}>
              {isLoading ? '⏳' : '🧠'} Store Concept
            </button>
            <button onClick={testSemanticSearch} disabled={isLoading}>
              {isLoading ? '⏳' : '🔍'} Semantic Search
            </button>
            <button onClick={testRelatedConcepts} disabled={isLoading}>
              {isLoading ? '⏳' : '🧠'} Related Concepts
            </button>
            <button onClick={getStatistics} disabled={isLoading}>
              {isLoading ? '⏳' : '📊'} Get Statistics
            </button>
            <button onClick={cleanupCache} disabled={isLoading}>
              {isLoading ? '⏳' : '🧹'} Cleanup Cache
            </button>
            <button onClick={clearResults} disabled={isLoading}>
              🗑️ Clear Results
            </button>
          </div>
        </div>

        {/* Test Inputs */}
        <div className="control-group">
          <h3>📝 Test Inputs</h3>
          <div className="input-group">
            <label>Test Text:</label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text for embedding generation..."
              rows={3}
            />
          </div>
          <div className="input-group">
            <label>Search Query:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter search query..."
            />
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults && searchResults.success && (
        <div className="search-results">
          <h3>🔍 Search Results</h3>
          <div className="results-grid">
            {searchResults.results.map((item, index) => (
              <div key={index} className="result-item">
                <h4>Result {index + 1}</h4>
                <p><strong>Similarity:</strong> {(item.similarity * 100).toFixed(2)}%</p>
                <p><strong>Content:</strong> {item.content.substring(0, 150)}...</p>
                {item.metadata && (
                  <p><strong>Metadata:</strong> {JSON.stringify(item.metadata)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="test-results">
        <h3>📋 Test Results</h3>
        {testResults.length === 0 ? (
          <p className="no-results">No test results yet. Run a test to see results here.</p>
        ) : (
          <div className="results-list">
            {testResults.map((test) => (
              <div key={test.id} className={`test-result ${test.result.success === false ? 'error' : 'success'}`}>
                <div className="test-header">
                  <h4>{test.name}</h4>
                  <span className="timestamp">{new Date(test.timestamp).toLocaleTimeString()}</span>
                </div>
                <pre>{JSON.stringify(test.result, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiEmbeddingTest; 