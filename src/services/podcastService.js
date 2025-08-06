import { supabase } from '../config/supabase';

class PodcastService {
  constructor() {
    // Supabase client zaten config'de tanımlı
  }

  /**
   * Metni sese dönüştürür
   * @param {string} text - Dönüştürülecek metin
   * @param {Object} options - Ses seçenekleri
   * @returns {Promise<ArrayBuffer>} Ses verisi
   */
  async synthesizeText(text, options = {}) {
    try {
      const defaultOptions = {
        voice: {
          name: 'Zephyr',
          languageCode: 'tr-TR'
        }
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Supabase Edge Function'ı çağır
      const { data, error } = await supabase.functions.invoke('tts', {
        body: {
          text: text,
          voiceName: finalOptions.voice.name,
          languageCode: finalOptions.voice.languageCode
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!data?.audio) {
        throw new Error('Ses verisi döndürülmedi');
      }

      // Base64'ten ArrayBuffer'a çevir
      const binaryString = atob(data.audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error('TTS synthesis error:', error);
      throw new Error(`Ses sentezi hatası: ${error.message}`);
    }
  }

  /**
   * Ses verisini WAV formatına dönüştürür
   * @param {ArrayBuffer} audioBuffer - Ham ses verisi
   * @param {number} sampleRate - Örnekleme hızı (varsayılan: 24000)
   * @returns {Blob} WAV formatında ses dosyası
   */
  convertToWAV(audioBuffer, sampleRate = 24000) {
    const buffer = new ArrayBuffer(44 + audioBuffer.byteLength);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + audioBuffer.byteLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, audioBuffer.byteLength, true);

    // Ses verisini kopyala
    const audioView = new Uint8Array(buffer, 44);
    const sourceView = new Uint8Array(audioBuffer);
    audioView.set(sourceView);

    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Ses dosyasını oynatır
   * @param {ArrayBuffer|Blob} audioData - Ses verisi
   * @returns {Promise<HTMLAudioElement>} Audio elementi
   */
  async playAudio(audioData) {
    try {
      let blob;
      if (audioData instanceof ArrayBuffer) {
        blob = this.convertToWAV(audioData);
      } else {
        blob = audioData;
      }

      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      return new Promise((resolve, reject) => {
        audio.onloadeddata = () => resolve(audio);
        audio.onerror = reject;
        audio.load();
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      throw new Error(`Ses oynatma hatası: ${error.message}`);
    }
  }

  /**
   * Podcast bölümü oluşturur
   * @param {string} title - Bölüm başlığı
   * @param {string} content - Bölüm içeriği
   * @param {Object} options - Ses seçenekleri
   * @returns {Promise<Object>} Podcast bölümü
   */
  async createPodcastEpisode(title, content, options = {}) {
    try {
      const fullText = `${title}. ${content}`;
      const audioBuffer = await this.synthesizeText(fullText, options);
      const audioBlob = this.convertToWAV(audioBuffer);
      
      return {
        title,
        content,
        audioBuffer,
        audioBlob,
        duration: this.estimateDuration(audioBuffer),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Podcast episode creation error:', error);
      throw error;
    }
  }

  /**
   * Ses süresini tahmin eder
   * @param {ArrayBuffer} audioBuffer - Ses verisi
   * @returns {number} Tahmini süre (saniye)
   */
  estimateDuration(audioBuffer) {
    // Linear16 formatında her sample 2 byte
    const sampleRate = 24000; // Gemini TTS sample rate
    const bytesPerSample = 2;
    const totalSamples = audioBuffer.byteLength / bytesPerSample;
    return totalSamples / sampleRate;
  }

  /**
   * Ses dosyasını indirir
   * @param {Blob} audioBlob - Ses dosyası
   * @param {string} filename - Dosya adı
   */
  downloadAudio(audioBlob, filename = 'podcast.wav') {
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default new PodcastService(); 