import { useMemo } from 'react'
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

  const feedItems = useMemo(() => {
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
      {feedItems.map((entry) => (
        <Link key={entry.id} to={entry.link} className="feed-card">
          <div className="feed-card-img-wrap">
            <img src={entry.imageUrl} alt={entry.label} className="feed-card-img" />
            <span className="feed-card-badge">{TYPE_LABELS[entry.type]}</span>
          </div>
          <div className="feed-card-body">
            <span className="feed-card-name">{entry.label}</span>
            <span className="feed-card-date">
              {new Date(entry.date).toLocaleDateString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
