import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function usePaints(spaceId) {
  const { user } = useAuth()
  const [paints, setPaints] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPaints = useCallback(async () => {
    if (!supabase || !user || !spaceId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('paints')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })
    if (!error) setPaints(data)
    setLoading(false)
  }, [user, spaceId])

  useEffect(() => {
    fetchPaints()
  }, [fetchPaints])

  return { paints, loading, refetch: fetchPaints }
}

export function usePaint(id) {
  const [paint, setPaint] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !id) return
    setLoading(true)
    supabase
      .from('paints')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error) setPaint(data)
        setLoading(false)
      })
  }, [id])

  return { paint, loading }
}

export async function createPaint(fields) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('paints')
    .insert({ ...fields, user_id: user.id })
    .select()
    .single()
  return { data, error }
}

export async function updatePaint(id, fields) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data, error } = await supabase
    .from('paints')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deletePaint(id) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { error } = await supabase
    .from('paints')
    .delete()
    .eq('id', id)
  return { error }
}
