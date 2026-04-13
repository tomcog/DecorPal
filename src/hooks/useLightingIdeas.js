import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useLightingIdeas(spaceId) {
  const { user } = useAuth()
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchIdeas = useCallback(async () => {
    if (!supabase || !user || !spaceId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('lighting_ideas')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })
    if (!error) setIdeas(data)
    setLoading(false)
  }, [user, spaceId])

  useEffect(() => {
    fetchIdeas()
  }, [fetchIdeas])

  return { ideas, loading, refetch: fetchIdeas }
}

export function useLightingIdea(id) {
  const [idea, setIdea] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !id) return
    setLoading(true)
    supabase
      .from('lighting_ideas')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error) setIdea(data)
        setLoading(false)
      })
  }, [id])

  return { idea, loading }
}

export async function createLightingIdea(fields) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('lighting_ideas')
    .insert({ ...fields, user_id: user.id })
    .select()
    .single()
  return { data, error }
}

export async function updateLightingIdea(id, fields) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data, error } = await supabase
    .from('lighting_ideas')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteLightingIdea(id, photoUrls) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  if (photoUrls && photoUrls.length > 0) {
    await deleteLightingPhotos(photoUrls)
  }
  const { error } = await supabase
    .from('lighting_ideas')
    .delete()
    .eq('id', id)
  return { error }
}

export async function uploadLightingPhotos(files) {
  if (!supabase) return { urls: [], error: { message: 'Supabase not configured' } }
  const urls = []
  for (const file of files) {
    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from('lighting-photos')
      .upload(path, file)
    if (error) return { urls, error }
    const { data } = supabase.storage
      .from('lighting-photos')
      .getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return { urls, error: null }
}

export async function deleteLightingPhotos(urls) {
  if (!supabase || !urls || urls.length === 0) return
  const paths = urls
    .map((url) => url.split('/lighting-photos/').pop())
    .filter(Boolean)
  if (paths.length > 0) {
    await supabase.storage.from('lighting-photos').remove(paths)
  }
}
