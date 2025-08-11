// supabase/functions/gemini_proxy/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.12.0'

// CORS başlıkları, Supabase istemcisinden gelen isteklere izin verir
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

// Gemini API anahtarını ortam değişkenlerinden (Secrets) al
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY sırrı bulunamadı.")
}

// Gemini client'ı oluştur
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

// Kullanılacak modeller
const MODELS = {
  TEXT_GENERATION: 'gemini-1.5-flash-latest',
  // İhtiyaç duyulursa diğer modeller de buraya eklenebilir
}

serve(async (req) => {
  // CORS preflight isteğini işle
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const { endpoint, ...body } = await req.json()

    console.log(`GEMINI_PROXY: Gelen istek: ${endpoint}`, body)

    let resultData

    switch (endpoint) {
      case 'generateTextContent': {
        const { prompt, context } = body
        const model = genAI.getGenerativeModel({ model: MODELS.TEXT_GENERATION })
        const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
        const result = await model.generateContent(fullPrompt)
        const response = await result.response
        const text = response.text()
        resultData = { success: true, content: text }
        break
      }
      
      // Diğer endpoint'ler (generateContent, extractDocumentOutline vb.)
      // şu an için basit bir metin üretimiyle aynı mantığı kullanıyor.
      // Gerekirse gelecekte özelleştirilebilirler.
      case 'generateContent':
      case 'extractDocumentOutline':
      case 'testGeminiConnection': {
        const { prompt, options } = body
        const model = genAI.getGenerativeModel({ 
          model: options?.model || MODELS.TEXT_GENERATION 
        })
        const result = await model.generateContent(prompt || "Test prompt")
        const response = await result.response
        const text = response.text()
        resultData = { success: true, data: text }
        break
      }

      default:
        throw new Error(`Bilinmeyen endpoint: ${endpoint}`)
    }

    return new Response(JSON.stringify(resultData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('GEMINI_PROXY Hatası:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})