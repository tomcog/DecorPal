import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { prompt_text, attachments, photo_data_urls } = await req.json()

    // Build the context from attachments
    let attachmentContext = ''
    if (attachments && attachments.length > 0) {
      attachmentContext = '\n\nThe user has attached the following assets from their design project:\n'
      for (const a of attachments) {
        attachmentContext += `- [${a.type}] ${a.name}: ${a.details}\n`
      }
    }

    // Build the messages with text and optionally images
    const userContent: Array<{ type: string; text?: string; source?: unknown }> = []

    // Add any uploaded photos as images
    if (photo_data_urls && photo_data_urls.length > 0) {
      for (const dataUrl of photo_data_urls) {
        const [header, base64] = dataUrl.split(',')
        const mediaType = header.match(/data:(.*?);/)?.[1] || 'image/jpeg'
        userContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64,
          },
        })
      }
    }

    userContent.push({
      type: 'text',
      text: `You are an expert interior designer and visualization artist. The user wants a conceptual visualization of a redesigned space.

User's description: ${prompt_text || '(no text provided — use the attached assets and photos for context)'}${attachmentContext}

Based on all provided context, generate a single photorealistic interior design visualization image. The image should be a beautiful, detailed, photorealistic rendering of the space as described. Focus on lighting, materials, textures, spatial arrangement, and atmosphere. Make it look like a professional interior design rendering.`,
    })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: userContent,
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${err}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()

    // Look for image content in the response
    const imageBlock = result.content?.find((b: { type: string }) => b.type === 'image')
    if (imageBlock) {
      const dataUrl = `data:${imageBlock.source.media_type};base64,${imageBlock.source.data}`
      return new Response(
        JSON.stringify({ image_url: dataUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If no image, extract text description and generate with a second call requesting image output
    const textContent = result.content
      ?.filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('\n') || ''

    // Second pass: use the description to request image generation
    const imageResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `Generate a photorealistic interior design visualization image based on this description:\n\n${textContent}\n\nCreate the image now.`,
          },
        ],
      }),
    })

    if (!imageResponse.ok) {
      const err = await imageResponse.text()
      return new Response(
        JSON.stringify({ error: `Image generation error: ${err}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const imageResult = await imageResponse.json()
    const generatedImage = imageResult.content?.find((b: { type: string }) => b.type === 'image')

    if (generatedImage) {
      const dataUrl = `data:${generatedImage.source.media_type};base64,${generatedImage.source.data}`
      return new Response(
        JSON.stringify({ image_url: dataUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'No image was generated. The model returned text only. Try a more specific prompt.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
