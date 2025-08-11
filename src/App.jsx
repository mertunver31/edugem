import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage/LoginPage'
import DashboardPage from './pages/DashboardPage/DashboardPage'
import CreateCoursePage from './pages/CreateCoursePage/CreateCoursePage'
import GeminiEmbeddingTest from './components/GeminiEmbeddingTest/GeminiEmbeddingTest'
import MindMapLearningPathTest from './components/MindMapLearningPathTest/MindMapLearningPathTest'
import PodcastTestArea from './components/PodcastTestArea/PodcastTestArea'
import { testConnection } from './services/supabaseService'
import './App.css'

function App() {
  useEffect(() => {
    // Uygulama başladığında Supabase bağlantısını test et
    testConnection()
  }, [])

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create-course" element={<CreateCoursePage />} />
          <Route path="/gemini-embedding-test" element={<GeminiEmbeddingTest />} />
          <Route path="/mind-map-learning-path-test" element={<MindMapLearningPathTest />} />
          <Route path="/podcast-test" element={<PodcastTestArea />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App 