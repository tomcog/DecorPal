import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useRenders(spaceId) {
  const { user } = useAuth()
  const [renders, setRenders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRenders = useCallback(async () => {
    if (!supabase || !user || !spaceId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('renders')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })
    if (!error) setRenders(data)
    setLoading(false)
  }, [user, spaceId])

  useEffect(() => {
    fetchRenders()
  }, [fetchRenders])

  return { renders, loading, refetch: fetchRenders }
}

export function useAllRenders() {
  const { user } = useAuth()
  const [renders, setRenders] = useState([])
  const [spaces, setSpaces] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!supabase || !user) return
    setLoading(true)
    const [rendersRes, spacesRes] = await Promise.all([
      supabase.from('renders').select('*').order('created_at', { ascending: false }),
      supabase.from('spaces').select('id, name').order('name'),
    ])
    if (!rendersRes.error) setRenders(rendersRes.data)
    if (!spacesRes.error) setSpaces(spacesRes.data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { renders, spaces, loading }
}

export function useRender(id) {
  const [render, setRender] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !id) return
    setLoading(true)
    supabase
      .from('renders')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error) setRender(data)
        setLoading(false)
      })
  }, [id])

  return { render, loading, setRender }
}

export async function updateRender(id, fields) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data, error } = await supabase
    .from('renders')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteRender(id, imageUrl) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  if (imageUrl) {
    const path = imageUrl.split('/renders/').pop()
    if (path) {
      await supabase.storage.from('renders').remove([path])
    }
  }
  const { error } = await supabase
    .from('renders')
    .delete()
    .eq('id', id)
  return { error }
}
