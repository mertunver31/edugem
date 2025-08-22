// supabase/functions/podcast_generator/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// Supabase client (service role ile)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Gemini AI client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Metni TTS için temiz ve doğal konuşmaya uygun hale getir
function sanitizeText(input: string): string {
  if (!input) return '';
  let text = input;

  // Kod blokları ve satır içi backtick'ler
  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/`([^`]*)`/g, '$1');

  // Başlık/alıntı/listeler
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/^>\s+/gm, '');
  text = text.replace(/^[\-*+•●◦○▪▫■□▶►➤➔➜➣➥]\s+/gm, '');
  text = text.replace(/^\d+[\.)]\s+/gm, '');

  // Markdown stilleri
  text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1'); // Linkler
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1'); // Görseller

  // Tablo ve çizgi kalıntıları
  text = text.replace(/^\|.*\|$/gm, ' ');
  text = text.replace(/[-=_]{3,}/g, ' ');

  // Emoji, oklar, şekiller, kutu çizimleri (Unicode blokları)
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2500}-\u{25FF}\u{FE0F}]/gu, '');

  // Fazla noktalama ve boşluk normalizasyonu
  text = text.replace(/\s*\.\.\.\s*/g, '. ');
  text = text.replace(/[\t ]+/g, ' ');
  text = text.replace(/\s{2,}/g, ' ');
  text = text.replace(/\s*([,.!?;:])\s*/g, '$1 ');

  // Cümle sonu nokta ekleme (temel)
  text = text.trim();
  if (text && !/[.!?]$/.test(text)) text += '.';
  return text;
}

serve(async (req) => {
  try {
    const { documentId, scope } = await req.json();

    if (!documentId) {
      return new Response(JSON.stringify({ error: "Document ID gereklidir." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Önbelleği (cache) kontrol et (yalnızca tam içerik için)
    if (!scope || scope?.type === 'full') {
    let { data: existingPodcast, error: cacheError } = await supabaseAdmin
      .from("lesson_podcasts")
      .select("*")
      .eq("document_id", documentId)
      .eq("status", "completed")
      .maybeSingle();

    if (cacheError) {
        console.error("Cache kontrol hatası:", cacheError);
    }
      
    if (existingPodcast) {
      // Mevcut özet metnini temizleyerek döndür
      const cleaned = { ...existingPodcast, summary_text: sanitizeText(existingPodcast.summary_text || '') };
      console.log("Önbellekten bulundu, mevcut podcast döndürülüyor (temizlenmiş metin).");
      return new Response(JSON.stringify(cleaned), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      }
    }

    // 2. Belge içeriğini al
    const { data: document, error: docError } = await supabaseAdmin
      .from("documents")
      .select("content")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      throw new Error("Belge bulunamadı veya alınamadı.");
    }

    // 3. Kullanılacak içerik kapsamını belirle
    let baseText = '';

    // Öncelik: Enhanced Content → Yoksa document.content
    let enhancedContent: any = null;
    try {
      const { data: enhancedRows } = await supabaseAdmin
        .from('enhanced_content')
        .select('content_data, created_at')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (enhancedRows && enhancedRows.length > 0) {
        enhancedContent = enhancedRows[0]?.content_data || null;
      }
    } catch (_) {
      // sessiz geç
    }

    const pickFullFromEnhanced = () => {
      if (!enhancedContent?.enhanced_content?.chapters) return null;
      const parts: string[] = [];
      for (const ch of enhancedContent.enhanced_content.chapters) {
        if (ch?.title) parts.push(`${ch.title}`);
        const lessons = ch?.content?.lessons || [];
        for (const lesson of lessons) {
          if (lesson?.title) parts.push(`${lesson.title}`);
          const lc = lesson?.content || {};
          if (lc.explanatory_text) parts.push(lc.explanatory_text);
          if (Array.isArray(lc.key_points) && lc.key_points.length > 0) parts.push(lc.key_points.join('. '));
          if (lc.summary) parts.push(lc.summary);
        }
      }
      return parts.join(' ');
    };

    const pickChapterFromEnhanced = (chapterIndex: number) => {
      const chapters = enhancedContent?.enhanced_content?.chapters;
      if (!Array.isArray(chapters) || !chapters[chapterIndex]) return null;
      const ch = chapters[chapterIndex];
      const parts: string[] = [];
      if (ch?.title) parts.push(ch.title);
      const lessons = ch?.content?.lessons || [];
      for (const lesson of lessons) {
        if (lesson?.title) parts.push(lesson.title);
        const lc = lesson?.content || {};
        if (lc.explanatory_text) parts.push(lc.explanatory_text);
        if (Array.isArray(lc.key_points) && lc.key_points.length > 0) parts.push(lc.key_points.join('. '));
        if (lc.summary) parts.push(lc.summary);
      }
      return parts.join(' ');
    };

    const pickLessonFromEnhanced = (chapterIndex: number, lessonIndex: number) => {
      const lessons = enhancedContent?.enhanced_content?.chapters?.[chapterIndex]?.content?.lessons;
      if (!Array.isArray(lessons) || !lessons[lessonIndex]) return null;
      const lesson = lessons[lessonIndex];
      const parts: string[] = [];
      if (lesson?.title) parts.push(lesson.title);
      const lc = lesson?.content || {};
      if (lc.explanatory_text) parts.push(lc.explanatory_text);
      if (Array.isArray(lc.key_points) && lc.key_points.length > 0) parts.push(lc.key_points.join('. '));
      if (lc.summary) parts.push(lc.summary);
      return parts.join(' ');
    };

    const scopeType = scope?.type || 'full';
    if (enhancedContent) {
      if (scopeType === 'chapter' && Number.isInteger(scope?.chapterIndex)) {
        baseText = pickChapterFromEnhanced(scope.chapterIndex) || '';
      } else if (scopeType === 'lesson' && Number.isInteger(scope?.chapterIndex) && Number.isInteger(scope?.lessonIndex)) {
        baseText = pickLessonFromEnhanced(scope.chapterIndex, scope.lessonIndex) || '';
      } else {
        baseText = pickFullFromEnhanced() || '';
      }
    }

    if (!baseText) {
      // Enhanced content yoksa, orijinal document.content'ten kırp
      baseText = (document.content || '').substring(0, 12000);
    }

    // 4. Podcast özeti oluştur (Gemini)
    console.log("Podcast özeti oluşturuluyor...");
    const prompt = `Aşağıdaki metni doğal, akıcı ve sohbet eder gibi bir podcast anlatımına dönüştür.
Kurallar:
- Düz konuşma metni olsun; başlık, markdown, liste ve numaralandırma kullanma.
- Sembol, emoji, ok, kutu/şekil isimleri (ör. kare, daire) üretme veya okuma.
- Paragraflar kısa tutulsun; geçiş cümleleri kullan.
- Türkçe, samimi ve öğretici bir ton kullan. Gerektiğinde örnek ver.
- Maksimum 90-120 saniyelik uzunlukta bir akış hedefle.

Metin:
${baseText}`;
    const result = await model.generateContent(prompt);
    const summaryTextRaw = await result.response.text();
    const summaryText = sanitizeText(summaryTextRaw);

    // 5. Sesi oluştur (TTS)
    console.log("TTS fonksiyonu çağrılıyor...");
    const ttsResponse = await supabaseAdmin.functions.invoke("tts", {
        body: JSON.stringify({ text: summaryText }),
    });

    if (ttsResponse.error) throw ttsResponse.error;
    const { audioUrl, duration } = await ttsResponse.data;

    if (!audioUrl) {
      throw new Error("TTS fonksiyonundan ses URL'i alınamadı.");
    }
      
    // 6. Kayıt politikası: sadece tam içerik için veritabanına kaydet
    if (!scope || scopeType === 'full') {
    const { data: newPodcast, error: insertError } = await supabaseAdmin
      .from("lesson_podcasts")
      .insert({
        document_id: documentId,
        user_id: (await supabaseAdmin.auth.getUser()).data.user.id,
        summary_text: summaryText,
        audio_url: audioUrl,
        duration_seconds: duration,
        status: "completed",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log("Yeni podcast başarıyla oluşturuldu ve kaydedildi.");
    return new Response(JSON.stringify(newPodcast), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Bölüm/ders kapsamı için cache'e yazma, direkt sonucu döndür
    return new Response(JSON.stringify({
      document_id: documentId,
      summary_text: summaryText,
      audio_url: audioUrl,
      duration_seconds: duration,
      status: 'completed',
      scope: scope,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Podcast oluşturma hatası:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});