import React, { useState } from 'react'
import { 
  testGeminiConnection, 
  createPDFChunks, 
  estimateTokens,
  generateTextContent,
  checkRateLimits 
} from '../../services/geminiService'
import './GeminiTestArea.css'

const GeminiTestArea = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState([])
  const [testStatus, setTestStatus] = useState('')

  // Test fonksiyonları
  const handleConnectionTest = async () => {
    setIsLoading(true)
    setTestStatus('🔌 Gemini API bağlantısı test ediliyor...')
    
    try {
      const startTime = Date.now()
      const result = await testGeminiConnection()
      const endTime = Date.now()
      const duration = endTime - startTime
      
      const testResult = {
        id: Date.now(),
        testName: 'API Bağlantı Testi',
        status: result ? 'Başarılı' : 'Başarısız',
        duration: duration + ' ms',
        details: result ? 'Gemini API bağlantısı kuruldu' : 'Bağlantı kurulamadı',
        timestamp: new Date().toLocaleString('tr-TR')
      }
      
      setTestResults(prev => [testResult, ...prev])
      setTestStatus(result ? '✅ API bağlantısı başarılı!' : '❌ API bağlantısı başarısız')
      
    } catch (error) {
      console.error('Bağlantı test hatası:', error)
      setTestStatus('❌ Test hatası: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChunkingTest = async () => {
    setIsLoading(true)
    setTestStatus('📄 PDF Chunking algoritması test ediliyor...')
    
    try {
      const startTime = Date.now()
      
      // Farklı sayfa sayıları ile test
      const testCases = [24, 50, 100, 200, 500]
      const results = []
      
      testCases.forEach(pages => {
        const chunks = createPDFChunks(pages, 20)
        results.push({
          pages: pages,
          chunks: chunks.length,
          chunkDetails: chunks
        })
      })
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      const testResult = {
        id: Date.now(),
        testName: 'PDF Chunking Testi',
        status: 'Başarılı',
        duration: duration + ' ms',
        details: `${testCases.length} farklı sayfa sayısı test edildi`,
        results: results,
        timestamp: new Date().toLocaleString('tr-TR')
      }
      
      setTestResults(prev => [testResult, ...prev])
      setTestStatus('✅ Chunking algoritması başarılı!')
      
    } catch (error) {
      console.error('Chunking test hatası:', error)
      setTestStatus('❌ Test hatası: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTokenTest = async () => {
    setIsLoading(true)
    setTestStatus('🔢 Token hesaplama test ediliyor...')
    
    try {
      const startTime = Date.now()
      
      // Farklı metin uzunlukları ile test
      const testTexts = [
        'Kısa metin',
        'Bu biraz daha uzun bir metin örneği.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Çok uzun bir metin örneği. '.repeat(100)
      ]
      
      const results = testTexts.map(text => ({
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        length: text.length,
        estimatedTokens: estimateTokens(text)
      }))
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      const testResult = {
        id: Date.now(),
        testName: 'Token Hesaplama Testi',
        status: 'Başarılı',
        duration: duration + ' ms',
        details: `${testTexts.length} farklı metin uzunluğu test edildi`,
        results: results,
        timestamp: new Date().toLocaleString('tr-TR')
      }
      
      setTestResults(prev => [testResult, ...prev])
      setTestStatus('✅ Token hesaplama başarılı!')
      
    } catch (error) {
      console.error('Token test hatası:', error)
      setTestStatus('❌ Test hatası: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTextGenerationTest = async () => {
    setIsLoading(true)
    setTestStatus('📝 Text generation test ediliyor...')
    
    try {
      const startTime = Date.now()
      
      const prompt = 'Matematik dersinde türev konusunu 3 cümle ile açıkla.'
      const result = await generateTextContent(prompt)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      const testResult = {
        id: Date.now(),
        testName: 'Text Generation Testi',
        status: result.success ? 'Başarılı' : 'Başarısız',
        duration: duration + ' ms',
        details: result.success ? 
          `İçerik üretildi (${result.tokens} token)` : 
          result.error,
        content: result.success ? result.content : null,
        timestamp: new Date().toLocaleString('tr-TR')
      }
      
      setTestResults(prev => [testResult, ...prev])
      setTestStatus(result.success ? '✅ Text generation başarılı!' : '❌ Text generation başarısız')
      
    } catch (error) {
      console.error('Text generation test hatası:', error)
      setTestStatus('❌ Test hatası: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRateLimitTest = async () => {
    setIsLoading(true)
    setTestStatus('⏱️ Rate limiting kontrol ediliyor...')
    
    try {
      const startTime = Date.now()
      const rateInfo = checkRateLimits()
      const endTime = Date.now()
      const duration = endTime - startTime
      
      const testResult = {
        id: Date.now(),
        testName: 'Rate Limiting Testi',
        status: 'Başarılı',
        duration: duration + ' ms',
        details: `Kalan istek: ${rateInfo.remainingRequests}, Reset: ${rateInfo.resetTime.toLocaleTimeString()}`,
        rateInfo: rateInfo,
        timestamp: new Date().toLocaleString('tr-TR')
      }
      
      setTestResults(prev => [testResult, ...prev])
      setTestStatus('✅ Rate limiting kontrolü başarılı!')
      
    } catch (error) {
      console.error('Rate limit test hatası:', error)
      setTestStatus('❌ Test hatası: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
    setTestStatus('')
  }

  // Test sonuçlarını render et
  const renderTestResult = (result) => {
    return (
      <div key={result.id} className={`test-result ${result.status === 'Başarılı' ? 'success' : 'error'}`}>
        <div className="result-header">
          <span className="result-title">{result.testName}</span>
          <span className={`result-status ${result.status === 'Başarılı' ? 'success' : 'error'}`}>
            {result.status === 'Başarılı' ? '✅' : '❌'} {result.status}
          </span>
        </div>
        
        <div className="result-details">
          <div><strong>Süre:</strong> {result.duration}</div>
          <div><strong>Detay:</strong> {result.details}</div>
          <div><strong>Tarih:</strong> {result.timestamp}</div>
        </div>
        
        {result.content && (
          <div className="result-content">
            <strong>Üretilen İçerik:</strong>
            <div className="content-text">{result.content}</div>
          </div>
        )}
        
        {result.results && (
          <div className="result-data">
            <details>
              <summary>📊 Detaylı Sonuçlar</summary>
              <pre>{JSON.stringify(result.results, null, 2)}</pre>
            </details>
          </div>
        )}
        
        {result.rateInfo && (
          <div className="result-data">
            <details>
              <summary>⏱️ Rate Limit Bilgileri</summary>
              <pre>{JSON.stringify(result.rateInfo, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="gemini-test-area">
      <div className="test-header">
        <h3>🤖 Gemini AI Test Alanı</h3>
        <p>Gemini API entegrasyonu ve fonksiyonlarını test etmek için</p>
      </div>

      <div className="test-controls">
        <div className="test-buttons">
          <button
            onClick={handleConnectionTest}
            disabled={isLoading}
            className="test-button connection"
          >
            🔌 API Bağlantısı
          </button>
          
          <button
            onClick={handleChunkingTest}
            disabled={isLoading}
            className="test-button chunking"
          >
            📄 PDF Chunking
          </button>
          
          <button
            onClick={handleTokenTest}
            disabled={isLoading}
            className="test-button token"
          >
            🔢 Token Hesaplama
          </button>
          
          <button
            onClick={handleTextGenerationTest}
            disabled={isLoading}
            className="test-button generation"
          >
            📝 Text Generation
          </button>
          
          <button
            onClick={handleRateLimitTest}
            disabled={isLoading}
            className="test-button rate"
          >
            ⏱️ Rate Limiting
          </button>
        </div>

        {testResults.length > 0 && (
          <button onClick={clearResults} className="clear-button">
            🗑️ Sonuçları Temizle
          </button>
        )}

        {testStatus && (
          <div className={`test-status ${testStatus.includes('❌') ? 'error' : 'success'}`}>
            {testStatus}
          </div>
        )}
      </div>

      {testResults.length > 0 && (
        <div className="test-results">
          <h4>📊 Test Sonuçları</h4>
          <div className="results-list">
            {testResults.map(renderTestResult)}
          </div>
        </div>
      )}
    </div>
  )
}

export default GeminiTestArea 