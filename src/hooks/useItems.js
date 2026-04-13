import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useItems(spaceId) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    if (!supabase || !user || !spaceId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('furnishing_items')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })
    if (!error) setItems(data)
    setLoading(false)
  }, [user, spaceId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return { items, loading, refetch: fetchItems }
}

export function useItem(id) {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !id) return
    setLoading(true)
    supabase
      .from('furnishing_items')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error) setItem(data)
        setLoading(false)
      })
  }, [id])

  return { item, loading }
}

export async function createItem(fields) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('furnishing_items')
    .insert({ ...fields, user_id: user.id })
    .select()
    .single()
  return { data, error }
}

export async function updateItem(id, fields) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data, error } = await supabase
    .from('furnishing_items')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteItem(id, photoUrls) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  if (photoUrls && photoUrls.length > 0) {
    await deleteItemPhotos(photoUrls)
  }
  const { error } = await supabase
    .from('furnishing_items')
    .delete()
    .eq('id', id)
  return { error }
}

export async function uploadItemPhotos(files) {
  if (!supabase) return { urls: [], error: { message: 'Supabase not configured' } }
  const urls = []
  for (const file of files) {
    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from('item-photos')
      .upload(path, file)
    if (error) return { urls, error }
    const { data } = supabase.storage
      .from('item-photos')
      .getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return { urls, error: null }
}

export async function deleteItemPhotos(urls) {
  if (!supabase || !urls || urls.length === 0) return
  const paths = urls
    .map((url) => url.split('/item-photos/').pop())
    .filter(Boolean)
  if (paths.length > 0) {
    await supabase.storage.from('item-photos').remove(paths)
  }
}
