import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// CORS başlıkları, fonksiyonun farklı bir kaynaktan çağrılmasına izin verir.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Ana sunucu fonksiyonu
serve(async (req)=>{
  // OPTIONS isteği, CORS ön kontrolü içindir.
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Ortam değişkenlerini kontrol et. Bunlar Supabase projenizde ayarlanmalıdır.
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    // Gerekli ortam değişkenlerinin eksik olup olmadığını kontrol et.
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({
        error: 'Sunucu yapılandırma hatası: Supabase değişkenleri eksik.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    if (!geminiApiKey) {
      console.error('Missing Gemini API key');
      return new Response(JSON.stringify({
        error: 'Gemini API anahtarı yapılandırılmamış.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    // Supabase istemcisini başlat.
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    // İstek gövdesinden documentId ve userId'yi al.
    const { documentId, userId } = await req.json();
    // Gerekli parametrelerin gelip gelmediğini kontrol et.
    if (!documentId || !userId) {
      return new Response(JSON.stringify({
        error: 'documentId ve userId gereklidir.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    console.log('Belge Anlama süreci başlatılıyor...', {
      documentId,
      userId
    });
    // 1. Supabase veritabanından belge bilgilerini al.
    const { data: document, error: docError } = await supabaseClient.from('documents').select('*').eq('id', documentId).eq('user_id', userId).single();
    if (docError || !document) {
      console.error('Belge bulunamadı veya erişim izni yok:', docError?.message || 'Belge yok');
      return new Response(JSON.stringify({
        error: 'Belge bulunamadı veya erişim izni yok.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 404
      });
    }
    console.log('Belge bulundu:', document);
    // 2. Supabase Storage'dan PDF dosyasını indir.
    const { data: pdfData, error: pdfError } = await supabaseClient.storage.from('student-pdfs') // Depolama kovası adınızın doğru olduğundan emin olun
    .download(document.file_path);
    if (pdfError || !pdfData) {
      console.error('PDF dosyası indirilemedi:', pdfError?.message || 'PDF verisi yok');
      return new Response(JSON.stringify({
        error: 'PDF dosyası indirilemedi.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 404
      });
    }
    const pdfArrayBuffer = await pdfData.arrayBuffer();
    console.log('PDF indirildi, boyut:', pdfArrayBuffer.byteLength, 'bytes');
    // 3. İndirilen PDF'i Gemini Files API'ye yükle.
    // Bu adım, Gemini modelinin PDF'e erişebilmesi için gereklidir.
    console.log('PDF Gemini Files API\'ye yükleniyor...');
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media&key=${geminiApiKey}`;
    const pdfBuffer = new Uint8Array(pdfArrayBuffer); // ArrayBuffer'ı Uint8Array'e çevir
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf',
        'X-Goog-Upload-Protocol': 'raw',
        'X-Goog-Upload-Header-Content-Length': pdfBuffer.length.toString()
      },
      body: pdfBuffer
    });
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Gemini Files API yükleme hatası:', uploadResponse.status, errorText);
      return new Response(JSON.stringify({
        error: `Gemini Files API yükleme hatası: ${uploadResponse.status} - ${errorText}`
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    // Yüklenen dosyanın URI'sini al.
    const { file } = await uploadResponse.json();
    const geminiFileUri = file.uri;
    console.log('PDF Gemini Files API\'ye yüklendi, URI:', geminiFileUri);
    // 4. Gemini'nin generateContent API'sine isteği gönder.
    // Bu kısım, PDF'i analiz etmesi için Gemini modeline talimat verir.
    const prompt = `
    Bu PDF dosyasının yapısını analiz et ve aşağıdaki JSON formatında döndür:
    
    {
      "title": "PDF başlığı (string)",
      "author": "Yazar bilgisi (string)",
      "total_pages": sayfa_sayısı (number),
      "headings": [
        {
          "text": "Başlık metni (string)",
          "page": sayfa_numarası (number),
          "level": başlık_seviyesi (number, 1-6)
        }
      ],
      "sections": [
        {
          "title": "Bölüm başlığı (string)",
          "start_page": başlangıç_sayfası (number),
          "end_page": bitiş_sayfası (number),
          "content_type": "text|image|table|mixed"
        }
      ]
    }
    
    Önemli kurallar:
    1. Sadece JSON döndür, başka açıklama ekleme.
    2. Tüm string değerler çift tırnak içinde olsun.
    3. Sayısal değerler tırnak olmadan olsun.
    4. Başlık seviyeleri 1-6 arasında olsun.
    5. content_type sadece "text", "image", "table", "mixed" değerlerinden biri olsun.
    `;
    console.log('Gemini generateContent API\'ye gönderiliyor...');
    // Model olarak 'gemini-1.5-pro' kullanıyoruz, çünkü bu model dosya girişini destekler.
    const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    // Payload yapısı, dosya referansını 'fileData' olarak içerir.
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt
            },
            {
              fileData: {
                fileUri: geminiFileUri,
                mimeType: 'application/pdf'
              }
            }
          ]
        }
      ]
    };
    console.log('HTTP payload hazır, gönderiliyor...');
    const genResponse = await fetch(genUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!genResponse.ok) {
      const errorText = await genResponse.text();
      console.error('Gemini generateContent hatası:', genResponse.status, errorText);
      throw new Error(`GenerateContent failed: ${genResponse.status} - ${errorText}`);
    }
    const genResult = await genResponse.json();
    // Gemini'den gelen yanıtın yapısını kontrol edin ve metni alın.
    const text = genResult?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('Gemini yanıtında metin içeriği bulunamadı:', genResult);
      throw new Error('Gemini yanıtında beklenen metin içeriği bulunamadı.');
    }
    console.log('Gemini yanıtı alındı:', text);
         // 5. Gemini'den gelen JSON yanıtını ayrıştır.
     let outline;
     try {
       // Markdown formatını temizle (```json ... ```)
       let cleanText = text.trim();
       
       // Eğer markdown code block içindeyse, JSON kısmını çıkar
       if (cleanText.startsWith('```json')) {
         cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
       } else if (cleanText.startsWith('```')) {
         cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
       }
       
       console.log('Temizlenmiş metin:', cleanText);
       
       outline = JSON.parse(cleanText);
       console.log('JSON ayrıştırma başarılı:', outline);
     } catch (parseError) {
       console.error('JSON ayrıştırma hatası:', parseError);
       console.error('Ham metin:', text);
       return new Response(JSON.stringify({
         error: 'Gemini yanıtı JSON formatında değil: ' + parseError.message,
         rawText: text
       }), {
         headers: {
           ...corsHeaders,
           'Content-Type': 'application/json'
         },
         status: 500
       });
     }
    // 6. Çıkarılan ana hat bilgilerini Supabase veritabanına kaydet.
    const { error: updateError } = await supabaseClient.from('documents').update({
      outline: outline,
      outline_extracted_at: new Date().toISOString(),
      status: 'outline_extracted' // Belgenin başarıyla işlendiğini belirt
    }).eq('id', documentId);
    if (updateError) {
      console.error('Veritabanı güncelleme hatası:', updateError);
      return new Response(JSON.stringify({
        error: 'Ana hat veritabanına kaydedilemedi.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    console.log('Belge Anlama süreci başarıyla tamamlandı.');
    // Başarılı yanıt döndür.
    return new Response(JSON.stringify({
      success: true,
      outline: outline,
      document: document,
      rawResponse: text // Ham Gemini yanıtını da döndürebilirsiniz
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    // Tüm beklenmedik hataları yakala ve logla.
    console.error('Belge Anlama genel hata detayları:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    return new Response(JSON.stringify({
      error: 'Dahili sunucu hatası oluştu.',
      details: {
        message: error.message,
        name: error.name
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
