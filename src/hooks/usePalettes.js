import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function usePalettes(spaceId) {
  const { user } = useAuth()
  const [palettes, setPalettes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPalettes = useCallback(async () => {
    if (!supabase || !user || !spaceId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('palettes')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })
    if (!error) setPalettes(data)
    setLoading(false)
  }, [user, spaceId])

  useEffect(() => {
    fetchPalettes()
  }, [fetchPalettes])

  return { palettes, loading, refetch: fetchPalettes }
}

export function usePalette(id) {
  const [palette, setPalette] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !id) return
    setLoading(true)
    supabase
      .from('palettes')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error) setPalette(data)
        setLoading(false)
      })
  }, [id])

  return { palette, loading }
}

export async function createPalette(fields) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('palettes')
    .insert({ ...fields, user_id: user.id })
    .select()
    .single()
  return { data, error }
}

export async function updatePalette(id, fields) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data, error } = await supabase
    .from('palettes')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deletePalette(id) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { error } = await supabase
    .from('palettes')
    .delete()
    .eq('id', id)
  return { error }
}
