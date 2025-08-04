import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage/LoginPage'
import DashboardPage from './pages/DashboardPage/DashboardPage'
import CreateCoursePage from './pages/CreateCoursePage/CreateCoursePage'
import GeminiEmbeddingTest from './components/GeminiEmbeddingTest/GeminiEmbeddingTest'
import DevelopmentModeIndicator from './components/DevelopmentModeIndicator/DevelopmentModeIndicator'
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
        <DevelopmentModeIndicator />
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create-course" element={<CreateCoursePage />} />
          <Route path="/gemini-embedding-test" element={<GeminiEmbeddingTest />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App 