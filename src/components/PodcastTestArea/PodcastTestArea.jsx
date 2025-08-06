import React, { useState, useRef, useEffect } from 'react';
import podcastService from '../../services/podcastService';
import { getDocuments } from '../../services/pdfService';
import './PodcastTestArea.css';

const PodcastTestArea = () => {
  const [text, setText] = useState('Merhaba, bu bir test podcast\'idir. EduGems platformunda sesli eğitim içeriği oluşturuyoruz.');
  const [title, setTitle] = useState('Test Podcast Bölümü');
  const [isLoading, setIsLoading] = useState(false);
  const [episode, setEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const audioRef = useRef(null);

  const voiceOptions = [
    { name: 'Zephyr', languageCode: 'tr-TR', label: 'Zephyr (Türkçe)' },
    { name: 'Zephyr', languageCode: 'en-US', label: 'Zephyr (İngilizce)' },
    { name: 'Nova', languageCode: 'tr-TR', label: 'Nova (Türkçe)' },
    { name: 'Nova', languageCode: 'en-US', label: 'Nova (İngilizce)' },
    { name: 'Gemini', languageCode: 'tr-TR', label: 'Gemini (Türkçe)' },
    { name: 'Gemini', languageCode: 'en-US', label: 'Gemini (İngilizce)' }
  ];

  const [selectedVoice, setSelectedVoice] = useState(voiceOptions[0]);

  // Kullanıcının derslerini yükle
  useEffect(() => {
    loadUserDocuments();
  }, []);

  const loadUserDocuments = async () => {
    setIsLoadingDocuments(true);
    try {
      const result = await getDocuments();
      if (result.success) {
        setDocuments(result.documents);
      } else {
        console.error('Dersler yüklenemedi:', result.error);
      }
    } catch (error) {
      console.error('Ders yükleme hatası:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleDocumentSelect = (document) => {
    setSelectedDocument(document);
    // Seçilen dersin başlığını podcast başlığına set et
    setTitle(document.course_title || document.file_path?.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Ders Podcast');
  };

  const handleSynthesize = async () => {
    if (!text.trim()) {
      setError('Lütfen metin girin');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const options = {
        voice: {
          name: selectedVoice.name,
          languageCode: selectedVoice.languageCode
        }
      };

      const newEpisode = await podcastService.createPodcastEpisode(title, text, options);
      setEpisode(newEpisode);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = async () => {
    if (!episode) return;

    try {
      setIsPlaying(true);
      const audio = await podcastService.playAudio(episode.audioBlob);
      audioRef.current = audio;
      
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setError('Ses oynatma hatası');
      };

      await audio.play();
    } catch (err) {
      setIsPlaying(false);
      setError(err.message);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleDownload = () => {
    if (episode) {
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.wav`;
      podcastService.downloadAudio(episode.audioBlob, filename);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="podcast-test-area">
      <div className="podcast-header">
        <h2>🎙️ Podcast TTS Test Alanı</h2>
        <p>Google Gemini 2.5 Flash Preview TTS ile sesli podcast oluşturun</p>
      </div>

      <div className="podcast-controls">
        {/* Kullanıcının Dersleri */}
        <div className="documents-section">
          <h3>📚 Mevcut Dersleriniz</h3>
          {isLoadingDocuments ? (
            <div className="loading-documents">
              <span>🔄 Dersler yükleniyor...</span>
            </div>
          ) : documents.length > 0 ? (
            <div className="documents-grid">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`document-card ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                  onClick={() => handleDocumentSelect(doc)}
                >
                  <div className="document-icon">📄</div>
                  <div className="document-info">
                    <h4>{doc.course_title || doc.file_path?.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'İsimsiz Ders'}</h4>
                    <p>Durum: {doc.status}</p>
                    <p>Sayfa: {doc.page_count || 'Bilinmiyor'}</p>
                    <p>Tarih: {new Date(doc.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-documents">
              <span>📝 Henüz ders yüklemediniz. Önce PDF yükleyin.</span>
            </div>
          )}
        </div>

        <div className="input-group">
          <label htmlFor="title">Bölüm Başlığı:</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Podcast bölüm başlığı"
          />
        </div>

        <div className="input-group">
          <label htmlFor="voice">Ses Seçimi:</label>
          <select
            id="voice"
            value={`${selectedVoice.name}-${selectedVoice.languageCode}`}
            onChange={(e) => {
              const [name, languageCode] = e.target.value.split('-');
              setSelectedVoice({ name, languageCode });
            }}
          >
            {voiceOptions.map((voice, index) => (
              <option key={index} value={`${voice.name}-${voice.languageCode}`}>
                {voice.label}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="text">Metin İçeriği:</label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Sese dönüştürülecek metin..."
            rows={6}
          />
        </div>

        <div className="button-group">
          <button
            onClick={handleSynthesize}
            disabled={isLoading || !text.trim()}
            className="synthesize-btn"
          >
            {isLoading ? '🔄 Sentezleniyor...' : '🎵 Ses Oluştur'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
        </div>
      )}

      {episode && (
        <div className="episode-player">
          <h3>📻 Oluşturulan Bölüm</h3>
          
          <div className="episode-info">
            <div className="info-item">
              <strong>Başlık:</strong> {episode.title}
            </div>
            <div className="info-item">
              <strong>Süre:</strong> {formatDuration(episode.duration)}
            </div>
            <div className="info-item">
              <strong>Oluşturulma:</strong> {new Date(episode.timestamp).toLocaleString('tr-TR')}
            </div>
          </div>

          <div className="audio-controls">
            <button
              onClick={isPlaying ? handleStop : handlePlay}
              className={isPlaying ? 'stop-btn' : 'play-btn'}
            >
              {isPlaying ? '⏹️ Durdur' : '▶️ Oynat'}
            </button>
            
            <button onClick={handleDownload} className="download-btn">
              💾 İndir
            </button>
          </div>

          <div className="episode-content">
            <h4>İçerik:</h4>
            <p>{episode.content}</p>
          </div>
        </div>
      )}

      <div className="podcast-info">
        <h4>ℹ️ Kullanım Bilgileri</h4>
        <ul>
          <li>Metin uzunluğu sınırı: 5000 karakter</li>
          <li>Desteklenen formatlar: WAV (Linear16)</li>
          <li>Örnekleme hızı: 24kHz</li>
          <li>Dil desteği: Türkçe, İngilizce</li>
        </ul>
      </div>
    </div>
  );
};

export default PodcastTestArea; 