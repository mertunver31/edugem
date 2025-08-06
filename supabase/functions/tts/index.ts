import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS
    });
  }
  let body;
  try {
    body = await req.json();
  } catch  {
    return new Response(JSON.stringify({
      error: "Invalid JSON"
    }), {
      status: 400,
      headers: {
        ...CORS,
        "Content-Type": "application/json"
      }
    });
  }
  const { text, voiceName = "Zephyr", languageCode = "tr-TR" } = body;
  if (!text) {
    return new Response(JSON.stringify({
      error: "Text is required"
    }), {
      status: 400,
      headers: {
        ...CORS,
        "Content-Type": "application/json"
      }
    });
  }
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: "GEMINI_API_KEY not configured"
    }), {
      status: 500,
      headers: {
        ...CORS,
        "Content-Type": "application/json"
      }
    });
  }
  // 🔑 Use :generateContent, not :generateTextToSpeech
  const url = `https://generativelanguage.googleapis.com/v1beta/models/` + `gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
  const payload = {
    model: "gemini-2.5-flash-preview-tts",
    contents: [
      {
        parts: [
          {
            text
          }
        ]
      }
    ],
    generationConfig: {
      responseModalities: [
        "AUDIO"
      ],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName
          }
        }
      }
    }
  };
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const errText = await resp.text();
    console.error("❌ Gemini API error:", resp.status, errText);
    return new Response(JSON.stringify({
      error: `Gemini API error ${resp.status}`
    }), {
      status: resp.status,
      headers: {
        ...CORS,
        "Content-Type": "application/json"
      }
    });
  }
  const data = await resp.json();
  // this path in the JS sample: candidates[0].content.parts[0].inlineData.data
  const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!b64) {
    console.error("❌ No audio in response:", data);
    return new Response(JSON.stringify({
      error: "No audio data received"
    }), {
      status: 500,
      headers: {
        ...CORS,
        "Content-Type": "application/json"
      }
    });
  }
  // Return the base64‐encoded PCM
  return new Response(JSON.stringify({
    audio: b64,
    format: "audio/L16;codec=pcm;rate=24000",
    sampleRate: 24000
  }), {
    headers: {
      ...CORS,
      "Content-Type": "application/json"
    }
  });
});
