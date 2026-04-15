import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useRenders } from '../hooks/useRenders'
import { useItems } from '../hooks/useItems'
import { useLightingIdeas } from '../hooks/useLightingIdeas'
import '../styles/feed.css'

export default function FeedTab({ spaceId }) {
  const { renders, loading: rendersLoading } = useRenders(spaceId)
  const { items, loading: itemsLoading } = useItems(spaceId)
  const { ideas, loading: ideasLoading } = useLightingIdeas(spaceId)

  const loading = rendersLoading || itemsLoading || ideasLoading
  const storageKey = `feed-order-${spaceId}`

  const baseFeedItems = useMemo(() => {
    const entries = []

    for (const render of renders) {
      if (!render.image_url) continue
      entries.push({
        id: `render-${render.id}`,
        type: render.prompt_text ? 'ai' : 'image',
        label: render.name || 'Untitled',
        imageUrl: render.image_url,
        date: render.created_at,
        link: `/spaces/${spaceId}/renders/${render.id}`,
      })
    }

    for (const item of items) {
      if (!item.photo_urls) continue
      for (let i = 0; i < item.photo_urls.length; i++) {
        entries.push({
          id: `item-${item.id}-${i}`,
          type: 'item',
          label: item.name || 'Item',
          imageUrl: item.photo_urls[i],
          date: item.created_at,
          link: `/spaces/${spaceId}/items/${item.id}`,
        })
      }
    }

    for (const idea of ideas) {
      if (!idea.photo_urls) continue
      for (let i = 0; i < idea.photo_urls.length; i++) {
        entries.push({
          id: `lighting-${idea.id}-${i}`,
          type: 'lighting',
          label: idea.title || 'Lighting idea',
          imageUrl: idea.photo_urls[i],
          date: idea.created_at,
          link: `/spaces/${spaceId}/lighting/${idea.id}`,
        })
      }
    }

    entries.sort((a, b) => new Date(b.date) - new Date(a.date))
    return entries
  }, [renders, items, ideas, spaceId])

  const [order, setOrder] = useState(() => {
    try {
      const raw = localStorage.getItem(`feed-order-${spaceId}`)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      setOrder(raw ? JSON.parse(raw) : [])
    } catch {
      setOrder([])
    }
  }, [storageKey])

  const feedItems = useMemo(() => {
    const byId = new Map(baseFeedItems.map((e) => [e.id, e]))
    const orderSet = new Set(order)
    const result = []
    for (const entry of baseFeedItems) {
      if (!orderSet.has(entry.id)) result.push(entry)
    }
    for (const id of order) {
      if (byId.has(id)) result.push(byId.get(id))
    }
    return result
  }, [baseFeedItems, order])

  const [dragIndex, setDragIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  function handleDragStart(e, index) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
    setDragIndex(index)
  }

  function handleDragOver(e, index) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) setDragOverIndex(index)
  }

  function handleDragEnd() {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  function handleDrop(e, targetIndex) {
    e.preventDefault()
    const sourceIndex = Number(e.dataTransfer.getData('text/plain'))
    setDragIndex(null)
    setDragOverIndex(null)
    if (Number.isNaN(sourceIndex) || sourceIndex === targetIndex) return
    const updated = [...feedItems]
    const [moved] = updated.splice(sourceIndex, 1)
    updated.splice(targetIndex, 0, moved)
    const nextOrder = updated.map((entry) => entry.id)
    setOrder(nextOrder)
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextOrder))
    } catch {
      // ignore quota errors
    }
  }

  if (loading) {
    return <p className="page-placeholder">Loading feed...</p>
  }

  if (feedItems.length === 0) {
    return (
      <div className="feed-empty">
        <div className="feed-empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <h3 className="feed-empty-title">No photos yet</h3>
        <p className="feed-empty-text">
          Photos from items, lighting ideas, and images will appear here.
        </p>
      </div>
    )
  }

  const TYPE_LABELS = {
    ai: 'AI',
    image: 'Image',
    item: 'Item',
    lighting: 'Lighting',
  }

  return (
    <div className="feed-grid">
      {feedItems.map((entry, index) => {
        const classes = ['feed-card']
        if (dragIndex === index) classes.push('feed-card--dragging')
        if (dragOverIndex === index && dragIndex !== null && dragIndex !== index) {
          classes.push('feed-card--drag-over')
        }
        return (
          <Link
            key={entry.id}
            to={entry.link}
            className={classes.join(' ')}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="feed-card-img-wrap">
              <img src={entry.imageUrl} alt={entry.label} className="feed-card-img" draggable={false} />
              <span className="feed-card-badge">{TYPE_LABELS[entry.type]}</span>
            </div>
            <div className="feed-card-body">
              <span className="feed-card-name">{entry.label}</span>
              <span className="feed-card-date">
                {new Date(entry.date).toLocaleDateString()}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
