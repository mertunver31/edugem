import React, { useState, useEffect } from 'react'
import './OnlineLessonsPage.css'

const OnlineLessonsPage = () => {
  const [onlineLessons, setOnlineLessons] = useState([])
  const [recordedLessons, setRecordedLessons] = useState([])

  // Supabase'den online dersleri çekmek için (memory'de belirtilen online_lessons tablosu)
  useEffect(() => {
    // TODO: Supabase'deki online_lessons tablosundan veri çek
    console.log('Online dersler yükleniyor...')
  }, [])

  return (
    <div className="online-lessons-page">
      <div className="online-lessons-section">
        <div className="section-header">
          <h1>Online Dersler</h1>
        </div>

        {/* Online Derslerde bulunan kategoriler */}
        <div className="lessons-categories">
          <div className="category-card">
            <div className="category-header">
              <h2>💻 Online Ders Katıl</h2>
              <button className="create-btn">+ Ders Ara</button>
            </div>
            <div className="lesson-placeholder">
              <p>Heniz bir online ders sayfa ile yayın bulamadıysanız?</p>
            </div>
          </div>

          <div className="category-card">
            <div className="category-header">
              <h2>🎥 Kayıtlı Dersler</h2>
            </div>
            <div className="recorded-lessons">
              <div className="lesson-item">
                <div className="lesson-info">
                  <div className="lesson-subject">Matematik</div>
                  <div className="lesson-title">Temel Matematik Dersi</div>
                  <div className="lesson-details">
                    <span className="lesson-duration">⏱️ 45 dk</span>
                    <span className="lesson-date">📅 15.01.2024</span>
                  </div>
                </div>
                <div className="lesson-actions">
                  <button className="action-btn play-btn">
                    ▶️ İzle
                  </button>
                </div>
              </div>

              <div className="lesson-item">
                <div className="lesson-info">
                  <div className="lesson-subject">Fizik</div>
                  <div className="lesson-title">Mekanik Konuları</div>
                  <div className="lesson-details">
                    <span className="lesson-duration">⏱️ 60 dk</span>
                    <span className="lesson-date">📅 12.01.2024</span>
                  </div>
                </div>
                <div className="lesson-actions">
                  <button className="action-btn play-btn">
                    ▶️ İzle
                  </button>
                </div>
              </div>

              <div className="lesson-item">
                <div className="lesson-info">
                  <div className="lesson-subject">Kimya</div>
                  <div className="lesson-title">Organik Kimya</div>
                  <div className="lesson-details">
                    <span className="lesson-duration">⏱️ 50 dk</span>
                    <span className="lesson-date">📅 10.01.2024</span>
                  </div>
                </div>
                <div className="lesson-actions">
                  <button className="action-btn play-btn">
                    ▶️ İzle
                  </button>
                </div>
              </div>

              <div className="lesson-item">
                <div className="lesson-info">
                  <div className="lesson-subject">Biyoloji</div>
                  <div className="lesson-title">Hücre Yapısı</div>
                  <div className="lesson-details">
                    <span className="lesson-duration">⏱️ 40 dk</span>
                    <span className="lesson-date">📅 08.01.2024</span>
                  </div>
                </div>
                <div className="lesson-actions">
                  <button className="action-btn play-btn">
                    ▶️ İzle
                  </button>
                </div>
              </div>

              <div className="lesson-item">
                <div className="lesson-info">
                  <div className="lesson-subject">fizutuvjugpüst</div>
                  <div className="lesson-title">Ders Kaydı</div>
                  <div className="lesson-details">
                    <span className="lesson-duration">⏱️ Ders Sürü</span>
                    <span className="lesson-date">📅 Başlangıç</span>
                  </div>
                </div>
                <div className="lesson-actions">
                  <button className="action-btn play-btn">
                    ▶️ Derse Katıl Ol
                  </button>
                </div>
              </div>

              <div className="lesson-item">
                <div className="lesson-info">
                  <div className="lesson-subject">mehmethanbulurpul</div>
                  <div className="lesson-title">Ders Kaydı</div>
                  <div className="lesson-details">
                    <span className="lesson-duration">⏱️ Ders Sürü</span>
                    <span className="lesson-date">📅üniversite2rın</span>
                  </div>
                </div>
                <div className="lesson-actions">
                  <button className="action-btn play-btn">
                    ▶️ Derse Katıl Ol
                  </button>
                </div>
              </div>

              <div className="lesson-item">
                <div className="lesson-info">
                  <div className="lesson-subject">konsorsemessn</div>
                  <div className="lesson-title">Ders Kaydı</div>
                  <div className="lesson-details">
                    <span className="lesson-duration">⏱️ Ders Sürü</span>
                    <span className="lesson-date">📅ümrealtünötüpgit</span>
                  </div>
                </div>
                <div className="lesson-actions">
                  <button className="action-btn play-btn">
                    ▶️ Derse Katıl Ol
                  </button>
                </div>
              </div>

              <div className="lesson-item">
                <div className="lesson-info">
                  <div className="lesson-subject">fixatext</div>
                  <div className="lesson-title">Ders Kaydı</div>
                  <div className="lesson-details">
                    <span className="lesson-duration">⏱️ Ders Sürü</span>
                    <span className="lesson-date">📅 Başlangıç</span>
                  </div>
                </div>
                <div className="lesson-actions">
                  <button className="action-btn play-btn">
                    ▶️ Derse Katıl Ol
                  </button>
                </div>
              </div>

              <div className="lesson-item">
                <div className="lesson-info">
                  <div className="lesson-subject">dersmodulerise</div>
                  <div className="lesson-title">Ders Kaydı</div>
                  <div className="lesson-details">
                    <span className="lesson-duration">⏱️ Ders Sürü</span>
                    <span className="lesson-date">📅 Başlangıç</span>
                  </div>
                </div>
                <div className="lesson-actions">
                  <button className="action-btn play-btn">
                    ▶️ Derse Katıl Ol
                  </button>
                </div>
              </div>

              <div className="lesson-item">
                <div className="lesson-info">
                  <div className="lesson-subject">puf pın</div>
                  <div className="lesson-title">dereçöreride</div>
                  <div className="lesson-details">
                    <span className="lesson-duration">⏱️ Ders Sürü</span>
                    <span className="lesson-date">📅 Başlangıç</span>
                  </div>
                </div>
                <div className="lesson-actions">
                  <button className="action-btn play-btn">
                    ▶️ Derse Katıl Ol
                  </button>
                </div>
              </div>

              <div className="lesson-item">
                <div className="lesson-info">
                  <div className="lesson-subject">bereşıy</div>
                  <div className="lesson-title">Ders Kaydı</div>
                  <div className="lesson-details">
                    <span className="lesson-duration">⏱️ Ders Sürü</span>
                    <span className="lesson-date">📅 Başlangıç</span>
                  </div>
                </div>
                <div className="lesson-actions">
                  <button className="action-btn play-btn">
                    ▶️ Derse Katıl Ol
                  </button>
                </div>
              </div>

              <div className="lesson-item">
                <div className="lesson-info">
                  <div className="lesson-subject">matematik</div>
                  <div className="lesson-title">eğitim</div>
                  <div className="lesson-details">
                    <span className="lesson-duration">⏱️ Ders Sürü</span>
                    <span className="lesson-date">📅 Başlangıç</span>
                  </div>
                </div>
                <div className="lesson-actions">
                  <button className="action-btn play-btn">
                    ▶️ Derse Katıl Ol
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="category-card">
            <div className="category-header">
              <h2>🔄 Geçmiş Online Dersler</h2>
            </div>
            <div className="lesson-placeholder">
              <p>Heniz işçici online ders geçiniz bulunamadı?</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnlineLessonsPage