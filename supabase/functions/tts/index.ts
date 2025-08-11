// edugem/supabase/functions/tts/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text, voiceName, speakingRate, pitch, audioEncoding } = await req.json();
    if (!text) throw new Error("Text is required.");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set.");
    
    // Varsayılanlar (TR için daha doğal ses, akıcılık ayarları)
    const selectedVoiceName = voiceName || 'tr-TR-Wavenet-A';
    // Biraz daha hızlı ve doğal bir akış için varsayılanları artır
    const selectedSpeakingRate = typeof speakingRate === 'number' ? speakingRate : 1.15; // 0.25 - 4.0
    const selectedPitch = typeof pitch === 'number' ? pitch : 0.5; // -20.0 - 20.0
    const selectedAudioEncoding = audioEncoding || 'MP3';

    const ttsResponse = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GEMINI_API_KEY
        },
        body: JSON.stringify({
            input: { text },
            voice: { languageCode: 'tr-TR', name: selectedVoiceName },
            audioConfig: { 
              audioEncoding: selectedAudioEncoding,
              speakingRate: selectedSpeakingRate,
              pitch: selectedPitch,
              sampleRateHertz: 24000 // daha doğal kalite
            }
        })
    });

    if (!ttsResponse.ok) {
        const errorBody = await ttsResponse.text();
        console.error("Google TTS API Error:", errorBody);
        throw new Error(`Google TTS API request failed with status ${ttsResponse.status}`);
    }

    const { audioContent } = await ttsResponse.json();
    if (!audioContent) throw new Error("No audio content received from Google.");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const audioData = decode(audioContent);
    const fileExt = selectedAudioEncoding === 'LINEAR16' ? 'wav' : 'mp3';
    const filePath = `podcasts/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("podcasts")
      .upload(filePath, audioData, {
        contentType: selectedAudioEncoding === 'LINEAR16' ? 'audio/wav' : 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage Upload Error:", uploadError);
      throw new Error("Failed to upload audio to Supabase Storage.");
    }
    
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("podcasts")
      .getPublicUrl(filePath);

    if (!publicUrl) throw new Error("Failed to get public URL for the audio file.");

    return new Response(
        JSON.stringify({ audioUrl: publicUrl, duration: 0, voiceName: selectedVoiceName, speakingRate: selectedSpeakingRate, pitch: selectedPitch }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("TTS Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});