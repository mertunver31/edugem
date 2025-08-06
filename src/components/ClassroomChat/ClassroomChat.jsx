import React, { useState, useEffect, useRef } from 'react'
import { 
  getClassroomMessages, 
  sendUserMessage, 
  generateAIResponse,
  subscribeToClassroomMessages 
} from '../../services/classroomChatService'
import './ClassroomChat.css'

const ClassroomChat = ({ classroomId, lessonContext = {} }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const subscriptionRef = useRef(null)

  useEffect(() => {
    loadMessages()
    setupRealtimeSubscription()
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [classroomId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      const result = await getClassroomMessages(classroomId)
      if (result.success) {
        setMessages(result.messages)
      }
    } catch (error) {
      console.error('Mesajlar yüklenirken hata:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    subscriptionRef.current = subscribeToClassroomMessages(classroomId, (payload) => {
      if (payload.eventType === 'INSERT') {
        setMessages(prev => [...prev, payload.new])
      }
    })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isTyping) return

    const userMessage = newMessage.trim()
    setNewMessage('')
    setIsTyping(true)

    try {
      // AI öğretmen varsa yanıt oluştur
      if (lessonContext.aiTeacher) {
        const aiResult = await generateAIResponse(classroomId, userMessage, lessonContext)
        
        if (!aiResult.success) {
          console.error('AI yanıtı oluşturulamadı:', aiResult.error)
        }
      } else {
        // Kullanıcı mesajını gönder (AI öğretmen yoksa)
        const userResult = await sendUserMessage(classroomId, userMessage, lessonContext)
        
        if (userResult.success) {
          // AI yanıtını oluştur
          const aiResult = await generateAIResponse(classroomId, userMessage, lessonContext)
          
          if (!aiResult.success) {
            console.error('AI yanıtı oluşturulamadı:', aiResult.error)
          }
        }
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getMessageClass = (message) => {
    if (message.sender_type === 'user') {
      return 'message user-message'
    } else if (message.sender_type === 'ai_teacher') {
      return 'message ai-message'
    } else {
      return 'message system-message'
    }
  }

  const getSenderName = (message) => {
    if (message.sender_type === 'user') {
      return message.users?.name || 'Sen'
    } else if (message.sender_type === 'ai_teacher') {
      return message.ai_teachers?.name || 'AI Öğretmen'
    } else {
      return 'Sistem'
    }
  }

  const getSenderAvatar = (message) => {
    if (message.sender_type === 'user') {
      return message.users?.avatar_url || '👤'
    } else if (message.sender_type === 'ai_teacher') {
      return message.ai_teachers?.avatar_url || '🤖'
    } else {
      return '⚙️'
    }
  }

  return (
    <div className="classroom-chat">
      <div className="chat-header">
        <div className="header-content">
          <h3>💬 Sınıf Sohbeti</h3>
          {lessonContext.aiTeacher && (
            <div className="ai-teacher-info">
              <div className="teacher-avatar">
                {lessonContext.aiTeacher.avatar_url ? (
                  <img src={lessonContext.aiTeacher.avatar_url} alt={lessonContext.aiTeacher.name} />
                ) : (
                  <span className="teacher-icon">👨‍🏫</span>
                )}
              </div>
              <div className="teacher-details">
                <span className="teacher-name">{lessonContext.aiTeacher.name}</span>
                <span className="teacher-subject">{lessonContext.aiTeacher.subject}</span>
              </div>
            </div>
          )}
        </div>
        <div className="chat-status">
          {isTyping && <span className="typing-indicator">AI yazıyor...</span>}
        </div>
      </div>

      <div className="chat-messages">
        {isLoading ? (
          <div className="loading-messages">
            <div className="loading-spinner"></div>
            <p>Mesajlar yükleniyor...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-messages">
            <div className="empty-icon">💬</div>
            <h4>Sohbet başlatın</h4>
            <p>AI öğretmeninizle konuşmaya başlayın</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={getMessageClass(message)}>
              <div className="message-avatar">
                {typeof getSenderAvatar(message) === 'string' && getSenderAvatar(message).startsWith('http') ? (
                  <img src={getSenderAvatar(message)} alt={getSenderName(message)} />
                ) : (
                  <span className="avatar-emoji">{getSenderAvatar(message)}</span>
                )}
              </div>
              
              <div className="message-content">
                <div className="message-header">
                  <span className="sender-name">{getSenderName(message)}</span>
                  <span className="message-time">{formatTime(message.created_at)}</span>
                </div>
                
                <div className="message-text">
                  {message.message}
                </div>
                
                {message.message_type === 'answer' && (
                  <div className="message-type-badge">
                    <span className="badge">AI Yanıtı</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="message ai-message typing">
            <div className="message-avatar">
              <span className="avatar-emoji">🤖</span>
            </div>
            <div className="message-content">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="input-container">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mesajınızı yazın..."
            disabled={isTyping}
            rows="1"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isTyping}
            className="send-button"
          >
            📤
          </button>
        </div>
        <div className="input-hint">
          Enter tuşu ile gönder, Shift+Enter ile yeni satır
        </div>
      </div>
    </div>
  )
}

export default ClassroomChat 