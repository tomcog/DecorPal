import { Link } from 'react-router-dom'
import { useRenders } from '../hooks/useRenders'
import '../styles/renders.css'

export default function RendersTab({ spaceId }) {
  const { renders, loading } = useRenders(spaceId)

  if (loading) {
    return <p className="page-placeholder">Loading renders...</p>
  }

  if (renders.length === 0) {
    return (
      <div className="renders-empty">
        <div className="renders-empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <h3 className="renders-empty-title">No renders yet</h3>
        <p className="renders-empty-text">
          Head to the AI Studio to generate your first visualization for this space.
        </p>
        <Link to="/ai-studio" className="renders-empty-btn">
          Open AI Studio
        </Link>
      </div>
    )
  }

  return (
    <div className="renders-grid">
      {renders.map((render) => (
        <Link
          key={render.id}
          to={`/spaces/${spaceId}/renders/${render.id}`}
          className="render-card"
        >
          <div className="render-card-img-wrap">
            {render.image_url ? (
              <img
                src={render.image_url}
                alt={render.name}
                className="render-card-img"
              />
            ) : (
              <div className="render-card-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
          </div>
          <div className="render-card-body">
            <span className="render-card-name">{render.name || 'Untitled'}</span>
            <span className="render-card-date">
              {new Date(render.created_at).toLocaleDateString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
