import React, { useState, useEffect, useRef } from 'react'
import { chatWithAITeacher, getConversationHistory } from '../../services/aiTeacherService'
import './AITeacherChat.css'

const AITeacherChat = ({ teacher, isOpen, onClose }) => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  useEffect(() => {
    if (isOpen && teacher) {
      loadConversationHistory()
    }
  }, [isOpen, teacher])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Sayfa kaymasını engelle (arka plan sabit kalsın)
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    const prevPaddingRight = document.body.style.paddingRight
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`
    }
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPaddingRight
    }
  }, [isOpen])

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
    }
  }

  const loadConversationHistory = async () => {
    try {
      setIsLoading(true)
      const result = await getConversationHistory(teacher.id)
      if (result.success) {
        // Her konuşma kaydı: önce kullanıcı mesajı, ardından AI cevabı
        const formattedMessages = []
        result.conversations.forEach(conv => {
          if (conv.message) {
            formattedMessages.push({
              id: `${conv.id}-user`,
              type: 'user',
              content: conv.message,
              timestamp: new Date(conv.created_at)
            })
          }
          if (conv.response) {
            formattedMessages.push({
              id: `${conv.id}-ai`,
              type: 'ai',
              content: conv.response,
              timestamp: new Date(conv.created_at),
              context: conv.context
            })
          }
        })
        setMessages(formattedMessages)
      } else {
        console.error('Konuşma geçmişi yüklenirken hata:', result.error)
      }
    } catch (error) {
      console.error('Konuşma geçmişi yüklenirken hata:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    
    // Kullanıcı mesajını ekle
    const userMessageObj = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessageObj])
    
    // AI yazıyor göstergesi
    setIsTyping(true)
    
    try {
      const result = await chatWithAITeacher(teacher.id, userMessage)
      
      if (result.success && result.conversation) {
        const aiMessageObj = {
          id: result.conversation.id,
          type: 'ai',
          content: result.conversation.response,
          timestamp: new Date(result.conversation.created_at),
          context: result.conversation.context
        }
        setMessages(prev => [...prev, aiMessageObj])
      } else {
        // Hata mesajı göster
        const errorMessageObj = {
          id: Date.now(),
          type: 'error',
          content: result.error || 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessageObj])
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error)
      const errorMessageObj = {
        id: Date.now(),
        type: 'error',
        content: 'Bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessageObj])
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
    return timestamp.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!isOpen || !teacher) return null

  return (
    <div className="ai-teacher-chat-modal">
      <div className="chat-content">
        <div className="chat-header">
          <div className="teacher-info">
            <div className="teacher-avatar">
              {teacher.avatar_url ? (
                <img src={teacher.avatar_url} alt={teacher.name} />
              ) : (
                <span className="teacher-icon">👨‍🏫</span>
              )}
            </div>
            <div className="teacher-details">
              <h3>{teacher.name}</h3>
              <p>{teacher.subject} - {teacher.specialty}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="chat-messages" ref={messagesContainerRef}>
          {isLoading ? (
            <div className="loading-message">
              <div className="loading-spinner">⏳</div>
              <p>Konuşma geçmişi yükleniyor...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="welcome-message">
              <div className="welcome-icon">💬</div>
              <h4>Hoş geldiniz!</h4>
              <p>{teacher.name} ile konuşmaya başlayın. AI öğretmeniniz kişiliğine ve uzmanlık alanına göre size yardımcı olacak.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.type}`}
              >
                <div className="message-content">
                  <div className="message-text">{message.content}</div>
                  <div className="message-time">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="message ai typing">
              <div className="message-content">
                <div className="typing-indicator">
                  <span>AI yazıyor</span>
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <div className="input-container">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`${teacher.name} ile konuşun...`}
              rows="1"
              disabled={isTyping}
            />
            <button 
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
            >
              📤
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AITeacherChat 