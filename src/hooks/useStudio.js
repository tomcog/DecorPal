import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useAllSpacesWithAssets() {
  const { user } = useAuth()
  const [spaces, setSpaces] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!supabase || !user) return
    setLoading(true)

    const [spacesRes, itemsRes, palettesRes, lightingRes, rendersRes] = await Promise.all([
      supabase.from('spaces').select('*').order('created_at', { ascending: false }),
      supabase.from('furnishing_items').select('*').order('created_at', { ascending: false }),
      supabase.from('palettes').select('*').order('created_at', { ascending: false }),
      supabase.from('lighting_ideas').select('*').order('created_at', { ascending: false }),
      supabase.from('renders').select('*').order('created_at', { ascending: false }),
    ])

    const spacesData = spacesRes.data || []
    const items = itemsRes.data || []
    const palettes = palettesRes.data || []
    const lighting = lightingRes.data || []
    const renders = rendersRes.data || []

    const enriched = spacesData.map((space) => ({
      ...space,
      items: items.filter((i) => i.space_id === space.id),
      palettes: palettes.filter((p) => p.space_id === space.id),
      lighting: lighting.filter((l) => l.space_id === space.id),
      renders: renders.filter((r) => r.space_id === space.id),
    }))

    setSpaces(enriched)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { spaces, loading }
}

export async function generateVisualization({ promptText, attachments, photoDataUrls }) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  if (!apiKey) return { imageUrl: null, error: { message: 'Google API key not configured' } }

  // Assemble prompt text from all inputs
  const lines = []
  if (promptText.trim()) lines.push(promptText.trim())

  for (const a of attachments) {
    if (a.type === 'palette') {
      lines.push(`Color palette: ${a.details}`)
    } else if (a.type === 'item') {
      lines.push(`Include: ${a.name}, ${a.details}`)
    } else if (a.type === 'lighting') {
      lines.push(`Lighting: ${a.name}, ${a.details}`)
    } else if (a.type === 'render') {
      lines.push(`Reference render: ${a.name}`)
    }
  }

  const assembledPrompt = lines.join('\n')

  // Build request parts
  const parts = [{ text: assembledPrompt }]

  for (const dataUrl of photoDataUrls) {
    const [header, base64] = dataUrl.split(',')
    const mimeType = header.match(/data:(.*?);/)?.[1] || 'image/jpeg'
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: base64,
      },
    })
  }

  try {
    const response = await window.fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      }
    )

    if (!response.ok) {
      const errBody = await response.text()
      console.error('Gemini API error:', response.status, errBody)
      return { imageUrl: null, error: { message: 'Image generation failed. Please try again.' } }
    }

    const result = await response.json()
    const candidateParts = result.candidates?.[0]?.content?.parts || []
    const imagePart = candidateParts.find((p) => p.inlineData)

    if (!imagePart) {
      return { imageUrl: null, error: { message: 'No image was generated. Try a more descriptive prompt.' } }
    }

    const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
    return { imageUrl, error: null }
  } catch {
    return { imageUrl: null, error: { message: 'Something went wrong. Please try again.' } }
  }
}

export async function saveRender({ spaceId, name, imageUrl, promptText, promptMetadata }) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('renders')
    .insert({
      space_id: spaceId,
      name,
      image_url: imageUrl,
      prompt_text: promptText,
      prompt_metadata: promptMetadata,
      user_id: user.id,
    })
    .select()
    .single()

  return { data, error }
}

export async function uploadRenderImage(dataUrl) {
  if (!supabase) return { url: null, error: { message: 'Supabase not configured' } }

  const res = await window.fetch(dataUrl)
  const blob = await res.blob()
  const ext = blob.type.split('/')[1] || 'png'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('renders')
    .upload(path, blob)
  if (error) return { url: null, error }

  const { data } = supabase.storage
    .from('renders')
    .getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

export function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}
