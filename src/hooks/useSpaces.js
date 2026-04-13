import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useSpaces() {
  const { user } = useAuth()
  const [spaces, setSpaces] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSpaces = useCallback(async () => {
    if (!supabase || !user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setSpaces(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchSpaces()
  }, [fetchSpaces])

  return { spaces, loading, refetch: fetchSpaces }
}

export function useSpace(id) {
  const [space, setSpace] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !id) return
    setLoading(true)
    supabase
      .from('spaces')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error) setSpace(data)
        setLoading(false)
      })
  }, [id])

  return { space, loading }
}

export async function createSpace(fields) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('spaces')
    .insert({ ...fields, user_id: user.id })
    .select()
    .single()
  return { data, error }
}

export async function updateSpace(id, fields) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data, error } = await supabase
    .from('spaces')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteSpace(id, coverPhotoUrl) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  if (coverPhotoUrl) {
    await deleteCoverPhoto(coverPhotoUrl)
  }
  const { error } = await supabase
    .from('spaces')
    .delete()
    .eq('id', id)
  return { error }
}

export async function uploadCoverPhoto(file) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const ext = file.name.split('.').pop()
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from('space-covers')
    .upload(path, file)
  if (error) return { url: null, error }
  const { data } = supabase.storage
    .from('space-covers')
    .getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

export async function deleteCoverPhoto(url) {
  if (!supabase || !url) return
  const path = url.split('/space-covers/').pop()
  if (path) {
    await supabase.storage.from('space-covers').remove([path])
  }
}
