import React from 'react'
import './DashboardNavigation.css'

const DashboardNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="dashboard-navigation">
      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profil
        </button>
        
        <button
          className={`nav-tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📚 Dersler
        </button>
        
        <button
          className={`nav-tab ${activeTab === 'create-course' ? 'active' : ''}`}
          onClick={() => setActiveTab('create-course')}
        >
          ➕ Ders Oluştur
        </button>
        
        <button
          className={`nav-tab ${activeTab === 'avatar' ? 'active' : ''}`}
          onClick={() => setActiveTab('avatar')}
        >
          🎭 Avatar Oluştur
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
      </div>
    </nav>
  )
}

export default DashboardNavigation 