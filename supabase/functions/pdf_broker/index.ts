import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type, record, old_record } = await req.json()
    
    console.log('Webhook triggered:', { type, record })

    if (type !== 'INSERT') {
      return new Response(JSON.stringify({ message: 'Ignored non-INSERT event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const { bucket_id, name: file_path, id: file_id, size: file_size } = record

    if (bucket_id !== 'student-pdfs') {
      return new Response(JSON.stringify({ message: 'Ignored file from different bucket' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (!file_path.toLowerCase().endsWith('.pdf')) {
      console.log('Ignored non-PDF file:', file_path)
      return new Response(JSON.stringify({ message: 'Ignored non-PDF file' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const maxSize = 20 * 1024 * 1024 // 20MB in bytes
    if (file_size > maxSize) {
      console.log('File too large:', file_path, 'Size:', file_size)
      return new Response(JSON.stringify({ message: 'File too large' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const pathParts = file_path.split('/')
    if (pathParts.length < 2) {
      console.log('Invalid file path format:', file_path)
      return new Response(JSON.stringify({ message: 'Invalid file path format' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const user_id = pathParts[0]

    // Sayfa sayısı frontend'den gelecek, şimdilik null
    // TODO: PDF.js ile sayfa sayısı hesaplama (Edge Function'da)
    const page_count = null

    // Önce bu dosya için zaten kayıt var mı kontrol et
    const { data: existingDocument, error: checkError } = await supabaseClient
      .from('documents')
      .select('id')
      .eq('file_path', file_path)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing document:', checkError)
      return new Response(JSON.stringify({ error: 'Failed to check existing document' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    if (existingDocument) {
      console.log('Document record already exists:', existingDocument.id)
      return new Response(JSON.stringify({ 
        message: 'Document record already exists',
        document_id: existingDocument.id,
        file_path: file_path
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Storage metadata'dan page count'u al
    let page_count_from_metadata = null
    if (record.metadata && record.metadata.pageCount) {
      page_count_from_metadata = parseInt(record.metadata.pageCount, 10)
      if (isNaN(page_count_from_metadata)) {
        page_count_from_metadata = null
      }
    }

    console.log('Creating document record:', {
      user_id,
      file_path,
      file_size,
      page_count: page_count_from_metadata
    })

    const { data: documentData, error: documentError } = await supabaseClient
      .from('documents')
      .insert({
        user_id: user_id,
        file_path: file_path,
        page_count: page_count_from_metadata || 0,
        status: 'UPLOADED',
        raw_outline: null
      })
      .select()
      .single()

    if (documentError) {
      console.error('Error creating document record:', documentError)
      return new Response(JSON.stringify({ error: 'Failed to create document record' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log('Document record created successfully:', {
      document_id: documentData.id,
      file_path: file_path,
      page_count: page_count_from_metadata
    })

    // TODO: Gemini Document Understanding entegrasyonu
    // TODO: Segment Planner algoritması

    return new Response(JSON.stringify({ 
      message: 'PDF processing initiated',
      document_id: documentData.id,
      file_path: file_path,
      page_count: page_count
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in pdf_broker function:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 