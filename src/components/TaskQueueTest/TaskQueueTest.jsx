import React, { useState, useEffect } from 'react'
import taskQueueService from '../../services/taskQueueService'
import { getDocuments } from '../../services/pdfService'
import './TaskQueueTest.css'

const TaskQueueTest = () => {
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('create')

  useEffect(() => {
    loadDocuments()
    loadUserTasks()
    loadStats()
  }, [])

  const loadDocuments = async () => {
    try {
      const result = await getDocuments()
      if (result.success) {
        setDocuments(result.documents)
      } else {
        setError('Document\'lar yüklenemedi: ' + result.error)
      }
    } catch (error) {
      setError('Document yükleme hatası: ' + error.message)
    }
  }

  const loadUserTasks = async () => {
    try {
      const result = await taskQueueService.getUserTasks()
      if (result.success) {
        setTasks(result.tasks)
      } else {
        setError('Task\'lar yüklenemedi: ' + result.error)
      }
    } catch (error) {
      setError('Task yükleme hatası: ' + error.message)
    }
  }

  const loadStats = async () => {
    try {
      const result = await taskQueueService.getUserTaskStats()
      if (result.success) {
        setStats(result.stats)
      }
    } catch (error) {
      console.error('Stats yükleme hatası:', error)
    }
  }

  const handleCreateTasks = async (taskType) => {
    if (!selectedDocument) {
      setError('Lütfen bir document seçin')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`${taskType} task'ları oluşturuluyor...`)
      const result = await taskQueueService.createTasksForDocument(selectedDocument.id, taskType)
      
      if (result.success) {
        console.log('Task\'lar başarıyla oluşturuldu:', result)
        await loadUserTasks()
        await loadStats()
        setError(null)
      } else {
        setError('Task oluşturma başarısız: ' + result.error)
      }
    } catch (error) {
      setError('Task oluşturma hatası: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentSelect = (document) => {
    setSelectedDocument(document)
    setError(null)
  }

  const handleDeleteTask = async (taskId) => {
    try {
      const result = await taskQueueService.deleteTask(taskId)
      if (result.success) {
        await loadUserTasks()
        await loadStats()
      } else {
        setError('Task silme başarısız: ' + result.error)
      }
    } catch (error) {
      setError('Task silme hatası: ' + error.message)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'orange'
      case 'PROCESSING': return 'blue'
      case 'COMPLETED': return 'green'
      case 'FAILED': return 'red'
      default: return 'gray'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Bekliyor'
      case 'PROCESSING': return 'İşleniyor'
      case 'COMPLETED': return 'Tamamlandı'
      case 'FAILED': return 'Başarısız'
      default: return status
    }
  }

  return (
    <div className="task-queue-test">
      <h2>⚙️ Task Queue Test</h2>
      <p>GÜN 6 - AŞAMA 1: Task Queue Sistemi test alanı</p>

      {/* Stats */}
      {stats && (
        <div className="stats-section">
          <h3>📊 Task İstatistikleri</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{stats.total_tasks}</span>
              <span className="stat-label">Toplam Task</span>
            </div>
            <div className="stat-card pending">
              <span className="stat-number">{stats.pending_tasks}</span>
              <span className="stat-label">Bekleyen</span>
            </div>
            <div className="stat-card processing">
              <span className="stat-number">{stats.processing_tasks}</span>
              <span className="stat-label">İşleniyor</span>
            </div>
            <div className="stat-card completed">
              <span className="stat-number">{stats.completed_tasks}</span>
              <span className="stat-label">Tamamlanan</span>
            </div>
            <div className="stat-card failed">
              <span className="stat-number">{stats.failed_tasks}</span>
              <span className="stat-label">Başarısız</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          🚀 Task Oluştur
        </button>
        <button 
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          📋 Task Listesi
        </button>
      </div>

      {/* Create Tasks Tab */}
      {activeTab === 'create' && (
        <div className="create-tasks-section">
          <h3>📄 Document Seçimi</h3>
          {documents.length === 0 ? (
            <div className="no-documents">
              <p>⚠️ Document bulunamadı</p>
              <p>Önce PDF yükleyin ve segment oluşturun</p>
            </div>
          ) : (
            <div className="document-list">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`document-item ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                  onClick={() => handleDocumentSelect(doc)}
                >
                  <div className="document-info">
                    <h4>{doc.file_path.split('/').pop()}</h4>
                    <p>📄 {doc.page_count} sayfa</p>
                    <p>📅 {formatDate(doc.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedDocument && (
            <div className="task-creation">
              <h3>🔧 Task Oluşturma</h3>
              <div className="task-buttons">
                <button
                  onClick={() => handleCreateTasks('TEXT_WORKER')}
                  disabled={loading}
                  className="create-task-btn text-worker"
                >
                  {loading ? '⏳ Oluşturuluyor...' : '📝 Text Worker Task\'ları'}
                </button>
                <button
                  onClick={() => handleCreateTasks('IMAGE_WORKER')}
                  disabled={loading}
                  className="create-task-btn image-worker"
                >
                  {loading ? '⏳ Oluşturuluyor...' : '🖼️ Image Worker Task\'ları'}
                </button>
              </div>
              <p className="task-info">
                <strong>Text Worker:</strong> Her segment için özet, soru-cevap, açıklama üretir<br/>
                <strong>Image Worker:</strong> Her segment için görsel içerik oluşturur
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tasks List Tab */}
      {activeTab === 'tasks' && (
        <div className="tasks-section">
          <h3>📋 Task Listesi</h3>
          <div className="tasks-controls">
            <button onClick={loadUserTasks} className="refresh-btn">
              🔄 Yenile
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="no-tasks">
              <p>📭 Henüz task bulunmuyor</p>
              <p>Task oluşturmak için "Task Oluştur" sekmesine gidin</p>
            </div>
          ) : (
            <div className="tasks-list">
              {tasks.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <div className="task-type">
                      {task.task_type === 'TEXT_WORKER' ? '📝' : '🖼️'} {task.task_type}
                    </div>
                    <div className={`task-status status-${task.status.toLowerCase()}`}>
                      {getStatusText(task.status)}
                    </div>
                  </div>
                  
                  <div className="task-details">
                    <p><strong>Document:</strong> {task.documents?.file_path?.split('/').pop() || 'Bilinmiyor'}</p>
                    <p><strong>Segment:</strong> {task.segments?.title || 'Bilinmiyor'} (Sayfa {task.segments?.p_start}-{task.segments?.p_end})</p>
                    <p><strong>Öncelik:</strong> {task.priority}</p>
                    <p><strong>Oluşturulma:</strong> {formatDate(task.created_at)}</p>
                    {task.started_at && (
                      <p><strong>Başlama:</strong> {formatDate(task.started_at)}</p>
                    )}
                    {task.completed_at && (
                      <p><strong>Tamamlanma:</strong> {formatDate(task.completed_at)}</p>
                    )}
                    {task.error_message && (
                      <p className="error-message"><strong>Hata:</strong> {task.error_message}</p>
                    )}
                  </div>

                  <div className="task-actions">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="delete-task-btn"
                      title="Task'ı sil"
                    >
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          <h3>❌ Hata</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}

export default TaskQueueTest 