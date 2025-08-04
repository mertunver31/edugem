import React, { useState, useEffect } from 'react';
import retrievalService from '../../services/retrievalService.js';
import { supabase } from '../../config/supabase.js';
import './RetrievalTest.css';

const RetrievalTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [statistics, setStatistics] = useState(null);
  
  // Manual test inputs
  const [searchQuery, setSearchQuery] = useState('machine learning algorithms');
  const [segmentId, setSegmentId] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [chapterId, setChapterId] = useState('');
  
  // Test results
  const [searchResults, setSearchResults] = useState(null);
  const [contextResults, setContextResults] = useState(null);
  const [crossChapterResults, setCrossChapterResults] = useState(null);
  
  // Helper states
  const [availableChapters, setAvailableChapters] = useState([]);
  const [showChapterHelper, setShowChapterHelper] = useState(false);

  // =====================================================
  // HEALTH CHECK & STATISTICS
  // =====================================================

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      const result = await retrievalService.healthCheck();
      setHealthStatus(result);
      addTestResult('Health Check', result);
    } catch (error) {
      addTestResult('Health Check', { success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatistics = async () => {
    try {
      const stats = retrievalService.getStatistics();
      setStatistics(stats);
      addTestResult('Statistics', stats);
    } catch (error) {
      addTestResult('Statistics', { success: false, error: error.message });
    }
  };

  // =====================================================
  // CHAPTER HELPER FUNCTIONS
  // =====================================================

  const loadAvailableChapters = async () => {
    if (!documentId.trim()) {
      alert('Please enter a document ID first');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('course_structure')
        .eq('id', documentId)
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data.course_structure) {
        throw new Error('No course structure found for this document');
      }

      const courseStructure = data.course_structure;
      const chapters = courseStructure.chapters || [];

      setAvailableChapters(chapters);
      setShowChapterHelper(true);
      addTestResult('Load Chapters', {
        success: true,
        chaptersFound: chapters.length,
        documentId: documentId
      });

    } catch (error) {
      addTestResult('Load Chapters', { success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const selectChapter = (chapter) => {
    setChapterId(chapter.id);
    setShowChapterHelper(false);
  };

  // =====================================================
  // SEMANTIC SEARCH TESTS
  // =====================================================

  const testSemanticSearch = async () => {
    setIsLoading(true);
    try {
      const result = await retrievalService.findRelevantContent(searchQuery, {
        limit: 5,
        threshold: 0.6
      });
      
      setSearchResults(result);
      addTestResult('Semantic Search', {
        success: result.success,
        query: searchQuery,
        resultsCount: result.success ? result.content.length : 0,
        error: result.error
      });
    } catch (error) {
      addTestResult('Semantic Search', { success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testManualSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    setIsLoading(true);
    try {
      const result = await retrievalService.findRelevantContent(searchQuery, {
        limit: 10,
        threshold: 0.5,
        contentType: 'all'
      });
      
      setSearchResults(result);
      addTestResult('Manual Search', {
        success: result.success,
        query: searchQuery,
        resultsCount: result.success ? result.content.length : 0,
        error: result.error
      });
    } catch (error) {
      addTestResult('Manual Search', { success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // CONTEXT BUILDING TESTS
  // =====================================================

  const testContextBuilding = async () => {
    if (!segmentId.trim()) {
      alert('Please enter a segment ID');
      return;
    }

    if (!documentId.trim()) {
      alert('Please enter a document ID');
      return;
    }

    setIsLoading(true);
    try {
      const result = await retrievalService.buildContext(segmentId, documentId, {
        includeConcepts: true,
        includeRelatedSegments: true,
        maxContextLength: 6000
      });
      
      setContextResults(result);
      addTestResult('Context Building', {
        success: result.success,
        segmentId: segmentId,
        documentId: documentId,
        contextLength: result.success ? result.contextLength : 0,
        error: result.error
      });
    } catch (error) {
      addTestResult('Context Building', { success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testCrossChapterContext = async () => {
    if (!chapterId.trim() || !documentId.trim()) {
      alert('Please enter both chapter ID and document ID');
      return;
    }

    setIsLoading(true);
    try {
      const result = await retrievalService.getCrossChapterContext(chapterId, documentId, {
        includePreviousChapters: true,
        includeRelatedChapters: true,
        maxChapters: 2
      });
      
      setCrossChapterResults(result);
      addTestResult('Cross-Chapter Context', {
        success: result.success,
        chapterId: chapterId,
        documentId: documentId,
        contextLength: result.success ? result.contextLength : 0,
        error: result.error
      });
    } catch (error) {
      addTestResult('Cross-Chapter Context', { success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // AUTOMATED TESTS
  // =====================================================

  const runAllTests = async () => {
    setIsLoading(true);
    const tests = [
      { name: 'Health Check', fn: runHealthCheck },
      { name: 'Semantic Search', fn: testSemanticSearch },
      { name: 'Statistics', fn: getStatistics }
    ];

    for (const test of tests) {
      try {
        await test.fn();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
      } catch (error) {
        addTestResult(test.name, { success: false, error: error.message });
      }
    }
    setIsLoading(false);
  };

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  const addTestResult = (testName, result) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      name: testName,
      result: result,
      timestamp: new Date().toISOString()
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
    setSearchResults(null);
    setContextResults(null);
    setCrossChapterResults(null);
  };

  const formatResult = (result) => {
    if (result.success === false) {
      return `❌ ${result.error || 'Failed'}`;
    }
    if (result.status === 'healthy') {
      return '✅ Healthy';
    }
    if (result.resultsCount !== undefined) {
      return `✅ Found ${result.resultsCount} results`;
    }
    if (result.contextLength !== undefined) {
      return `✅ Context built (${result.contextLength} chars)`;
    }
    return '✅ Success';
  };

  return (
    <div className="retrieval-test">
      <div className="retrieval-test-header">
        <h2>🔍 Retrieval Service Test</h2>
        <p>Test RAG system's retrieval and context building capabilities</p>
      </div>

      {/* Health Status & Statistics */}
      <div className="retrieval-test-section">
        <h3>🏥 Service Status</h3>
        <div className="status-controls">
          <button 
            onClick={runHealthCheck} 
            disabled={isLoading}
            className="test-button"
          >
            Health Check
          </button>
          <button 
            onClick={getStatistics} 
            disabled={isLoading}
            className="test-button"
          >
            Get Statistics
          </button>
          <button 
            onClick={runAllTests} 
            disabled={isLoading}
            className="test-button primary"
          >
            Run All Tests
          </button>
        </div>

        {healthStatus && (
          <div className={`status-display ${healthStatus.status}`}>
            <h4>Health Status:</h4>
            <pre>{JSON.stringify(healthStatus, null, 2)}</pre>
          </div>
        )}

        {statistics && (
          <div className="status-display">
            <h4>Statistics:</h4>
            <pre>{JSON.stringify(statistics, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Semantic Search Tests */}
      <div className="retrieval-test-section">
        <h3>🔍 Semantic Search Tests</h3>
        
        <div className="test-inputs">
          <div className="input-group">
            <label>Search Query:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter search query..."
              className="test-input"
            />
          </div>
          
          <div className="test-controls">
            <button 
              onClick={testSemanticSearch} 
              disabled={isLoading}
              className="test-button"
            >
              Test Semantic Search
            </button>
            <button 
              onClick={testManualSearch} 
              disabled={isLoading}
              className="test-button"
            >
              Manual Search
            </button>
          </div>
        </div>

        {searchResults && (
          <div className="results-display">
            <h4>Search Results:</h4>
            <div className="result-summary">
              <p><strong>Query:</strong> {searchResults.query}</p>
              <p><strong>Status:</strong> {searchResults.success ? '✅ Success' : '❌ Failed'}</p>
              <p><strong>Results:</strong> {searchResults.success ? searchResults.content.length : 0} items</p>
            </div>
            
            {searchResults.success && searchResults.content.length > 0 && (
              <div className="content-preview">
                <h5>Content Preview:</h5>
                {searchResults.content.slice(0, 3).map((item, index) => (
                  <div key={index} className="content-item">
                    <p><strong>Similarity:</strong> {(item.similarity * 100).toFixed(1)}%</p>
                    <p><strong>Content:</strong> {item.content.substring(0, 200)}...</p>
                  </div>
                ))}
              </div>
            )}
            
            {searchResults.error && (
              <div className="error-display">
                <p><strong>Error:</strong> {searchResults.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context Building Tests */}
      <div className="retrieval-test-section">
        <h3>🏗️ Context Building Tests</h3>
        
        <div className="test-inputs">
          <div className="input-group">
            <label>Segment ID:</label>
            <input
              type="text"
              value={segmentId}
              onChange={(e) => setSegmentId(e.target.value)}
              placeholder="Enter segment ID..."
              className="test-input"
            />
          </div>
          
          <div className="input-group">
            <label>Document ID:</label>
            <input
              type="text"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="Enter document ID..."
              className="test-input"
            />
          </div>
          
          <div className="test-controls">
            <button 
              onClick={testContextBuilding} 
              disabled={isLoading}
              className="test-button"
            >
              Build Context
            </button>
          </div>
        </div>

        {contextResults && (
          <div className="results-display">
            <h4>Context Results:</h4>
            <div className="result-summary">
              <p><strong>Segment ID:</strong> {contextResults.segmentId}</p>
              <p><strong>Status:</strong> {contextResults.success ? '✅ Success' : '❌ Failed'}</p>
              <p><strong>Context Length:</strong> {contextResults.success ? contextResults.contextLength : 0} chars</p>
            </div>
            
            {contextResults.success && contextResults.context && (
              <div className="context-preview">
                <h5>Context Preview:</h5>
                <div className="context-content">
                  <pre>{contextResults.context.substring(0, 500)}...</pre>
                </div>
              </div>
            )}
            
            {contextResults.error && (
              <div className="error-display">
                <p><strong>Error:</strong> {contextResults.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cross-Chapter Context Tests */}
      <div className="retrieval-test-section">
        <h3>🌐 Cross-Chapter Context Tests</h3>
        
                 <div className="test-inputs">
           <div className="input-group">
             <label>Document ID:</label>
             <input
               type="text"
               value={documentId}
               onChange={(e) => setDocumentId(e.target.value)}
               placeholder="Enter document ID..."
               className="test-input"
             />
           </div>
           
           <div className="input-group">
             <label>Chapter ID:</label>
             <div className="chapter-input-group">
               <input
                 type="text"
                 value={chapterId}
                 onChange={(e) => setChapterId(e.target.value)}
                 placeholder="Enter chapter ID or use helper..."
                 className="test-input"
               />
               <button 
                 onClick={loadAvailableChapters} 
                 disabled={isLoading || !documentId.trim()}
                 className="helper-button"
                 title="Load available chapters for this document"
               >
                 🔍 Find Chapters
               </button>
             </div>
           </div>
           
           <div className="test-controls">
             <button 
               onClick={testCrossChapterContext} 
               disabled={isLoading}
               className="test-button"
             >
               Build Cross-Chapter Context
             </button>
           </div>
         </div>

         {/* Chapter Helper Modal */}
         {showChapterHelper && (
           <div className="chapter-helper-modal">
             <div className="chapter-helper-content">
               <h4>📚 Available Chapters for Document: {documentId}</h4>
               <button 
                 onClick={() => setShowChapterHelper(false)}
                 className="close-button"
               >
                 ✕
               </button>
               
               {availableChapters.length > 0 ? (
                 <div className="chapters-list">
                   {availableChapters.map((chapter, index) => (
                     <div key={chapter.id} className="chapter-item">
                       <div className="chapter-info">
                         <strong>Chapter {index + 1}:</strong> {chapter.title}
                         <br />
                         <small>ID: {chapter.id}</small>
                         <br />
                         <small>Lessons: {chapter.lessons?.length || 0}</small>
                       </div>
                       <button 
                         onClick={() => selectChapter(chapter)}
                         className="select-chapter-button"
                       >
                         Select
                       </button>
                     </div>
                   ))}
                 </div>
               ) : (
                 <p>No chapters found in course structure.</p>
               )}
             </div>
           </div>
         )}

        {crossChapterResults && (
          <div className="results-display">
            <h4>Cross-Chapter Results:</h4>
            <div className="result-summary">
              <p><strong>Chapter ID:</strong> {crossChapterResults.chapterId}</p>
              <p><strong>Document ID:</strong> {crossChapterResults.documentId}</p>
              <p><strong>Status:</strong> {crossChapterResults.success ? '✅ Success' : '❌ Failed'}</p>
              <p><strong>Context Length:</strong> {crossChapterResults.success ? crossChapterResults.contextLength : 0} chars</p>
            </div>
            
            {crossChapterResults.success && crossChapterResults.context && (
              <div className="context-preview">
                <h5>Cross-Chapter Context Preview:</h5>
                <div className="context-content">
                  <pre>{crossChapterResults.context.substring(0, 500)}...</pre>
                </div>
              </div>
            )}
            
            {crossChapterResults.error && (
              <div className="error-display">
                <p><strong>Error:</strong> {crossChapterResults.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test Results */}
      <div className="retrieval-test-section">
        <div className="results-header">
          <h3>📊 Test Results</h3>
          <button onClick={clearResults} className="clear-button">
            Clear Results
          </button>
        </div>
        
        {testResults.length > 0 ? (
          <div className="test-results">
            {testResults.map((test) => (
              <div key={test.id} className="test-result-item">
                <div className="test-result-header">
                  <span className="test-name">{test.name}</span>
                  <span className="test-timestamp">{new Date(test.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="test-result-status">
                  {formatResult(test.result)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-results">No test results yet. Run some tests to see results here.</p>
        )}
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Running tests...</p>
        </div>
      )}
    </div>
  );
};

export default RetrievalTest; 