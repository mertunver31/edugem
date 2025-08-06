import React, { useState, useEffect } from 'react'
import { isDevelopmentMode, toggleDevMode } from '../../config/development'
import './DashboardNavigation.css'

const DashboardNavigation = ({ activeTab, setActiveTab, devMode, setDevMode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const handleToggleDevMode = () => {
    toggleDevMode()
    setDevMode(!devMode)
  }
  
  return (
    <nav className={`dashboard-navigation ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="nav-header">
        <button
          className="collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Navigasyonu Aç' : 'Navigasyonu Kapat'}
        >
          {isCollapsed ? '▶️' : '◀️'}
        </button>
      </div>
      
      <div className="nav-tabs">
        {/* Production Navigation - Her zaman görünür */}
        <button
          className={`nav-tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          🏠 Ana Sayfa
        </button>
        
        <button
          className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profilim
        </button>
        
        <button
          className={`nav-tab ${activeTab === 'avatar' ? 'active' : ''}`}
          onClick={() => setActiveTab('avatar')}
        >
          🎭 Avatarlarım
        </button>
        
        <button
          className={`nav-tab ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessons')}
        >
          🏆 Öğretmenlerim
        </button>
        
        <button
          className={`nav-tab ${activeTab === 'course-create' ? 'active' : ''}`}
          onClick={() => setActiveTab('course-create')}
        >
          📚 Derslerim / Ders Oluştur
        </button>
        
        <button
          className={`nav-tab ${activeTab === 'online-lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('online-lessons')}
        >
          💻 Online Dersler
        </button>
        
        {/* Development Mode Toggle Button */}
        <button
          className={`nav-tab dev-mode-toggle ${devMode ? 'dev-active' : ''}`}
          onClick={handleToggleDevMode}
          title={devMode ? 'Development Mode Açık' : 'Development Mode Kapatık'}
        >
          {devMode ? '🔧 Dev Mode' : '⚙️ Dev Mode'}
        </button>
        
        {/* Development Navigation - Sadece development mode'da görünür */}
        {devMode && (
          <>
            <div className="dev-separator">🔬 Development Tools</div>
            
            <button
              className={`nav-tab ${activeTab === 'full-pipeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('full-pipeline')}
            >
              🚀 Full Pipeline
            </button>
            
            <button
              className={`nav-tab ${activeTab === 'pdf-test' ? 'active' : ''}`}
              onClick={() => setActiveTab('pdf-test')}
            >
              🔬 PDF Test
            </button>
            
            <button
              className={`nav-tab ${activeTab === 'gemini-test' ? 'active' : ''}`}
              onClick={() => setActiveTab('gemini-test')}
            >
              🤖 Gemini Test
            </button>
            
            <button
              className={`nav-tab ${activeTab === 'document-understanding' ? 'active' : ''}`}
              onClick={() => setActiveTab('document-understanding')}
            >
              🔍 Document Understanding
            </button>
            
            <button
              className={`nav-tab ${activeTab === 'segment-planner' ? 'active' : ''}`}
              onClick={() => setActiveTab('segment-planner')}
            >
              📋 Segment Planner
            </button>
            
            <button
              className={`nav-tab ${activeTab === 'task-queue' ? 'active' : ''}`}
              onClick={() => setActiveTab('task-queue')}
            >
              ⚙️ Task Queue
            </button>
            
            <button
              className={`nav-tab ${activeTab === 'text-worker' ? 'active' : ''}`}
              onClick={() => setActiveTab('text-worker')}
            >
              📝 Text Worker
            </button>
            
            <button
              className={`nav-tab ${activeTab === 'image-worker' ? 'active' : ''}`}
              onClick={() => setActiveTab('image-worker')}
            >
              🎨 Image Worker
            </button>
            
            <button
              className={`nav-tab ${activeTab === 'concurrency-control' ? 'active' : ''}`}
              onClick={() => setActiveTab('concurrency-control')}
            >
              🔄 Concurrency Control
            </button>
            
            <button
              className={`nav-tab ${activeTab === 'pdf-pipeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('pdf-pipeline')}
            >
              🚀 PDF Pipeline
            </button>
            
            <button
              className={`nav-tab ${activeTab === 'course-structure' ? 'active' : ''}`}
              onClick={() => setActiveTab('course-structure')}
            >
              📚 Course Structure
            </button>
            
            <button
              className={`nav-tab ${activeTab === 'course-visual-integration' ? 'active' : ''}`}
              onClick={() => setActiveTab('course-visual-integration')}
            >
              🎨 Course Visual Integration
            </button>
            
            <button
              className={`nav-tab ${activeTab === 'enhanced-content' ? 'active' : ''}`}
              onClick={() => setActiveTab('enhanced-content')}
            >
              🤖 Enhanced Content
            </button>
            
            <button
              className={`nav-tab ${activeTab === 'pdf-extraction' ? 'active' : ''}`}
              onClick={() => setActiveTab('pdf-extraction')}
            >
              🔍 PDF Extraction
            </button>
            
                           <button
                 className={`nav-tab ${activeTab === 'gemini-embedding-test' ? 'active' : ''}`}
                 onClick={() => setActiveTab('gemini-embedding-test')}
               >
                 🔧 Gemini Embedding Test
               </button>
               
               <button
                 className={`nav-tab ${activeTab === 'retrieval-test' ? 'active' : ''}`}
                 onClick={() => setActiveTab('retrieval-test')}
               >
                 🔍 Retrieval Test
               </button>
               
               <button
                 className={`nav-tab ${activeTab === 'mind-map-learning-path-test' ? 'active' : ''}`}
                 onClick={() => setActiveTab('mind-map-learning-path-test')}
               >
                 🧠 Mind Map & Learning Path Test
               </button>
               
               <button
                 className={`nav-tab ${activeTab === 'podcast-test' ? 'active' : ''}`}
                 onClick={() => setActiveTab('podcast-test')}
               >
                 🎙️ Podcast TTS Test
               </button>
          </>
        )}
      </div>
    </nav>
  )
}

export default DashboardNavigation 