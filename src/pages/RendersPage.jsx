import { Link } from 'react-router-dom'
import { useAllRenders } from '../hooks/useRenders'
import '../styles/renders.css'

export default function RendersPage() {
  const { renders, spaces, loading } = useAllRenders()

  if (loading) {
    return (
      <div className="page">
        <h1>Renders</h1>
        <p className="page-placeholder">Loading renders...</p>
      </div>
    )
  }

  if (renders.length === 0) {
    return (
      <div className="page">
        <h1>Renders</h1>
        <div className="renders-empty">
          <div className="renders-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <h2 className="renders-empty-title">No renders yet</h2>
          <p className="renders-empty-text">
            Generate your first visualization in the AI Studio.
          </p>
          <Link to="/ai-studio" className="renders-empty-btn">
            Open AI Studio
          </Link>
        </div>
      </div>
    )
  }

  const spaceMap = new Map(spaces.map((s) => [s.id, s.name]))

  const grouped = spaces
    .map((space) => ({
      id: space.id,
      name: space.name,
      renders: renders.filter((r) => r.space_id === space.id),
    }))
    .filter((g) => g.renders.length > 0)

  return (
    <div className="page">
      <h1>Renders</h1>

      {grouped.map((group) => (
        <div key={group.id} className="renders-group">
          <h2 className="renders-group-label">{group.name}</h2>
          <div className="renders-grid renders-grid--global">
            {group.renders.map((render) => (
              <Link
                key={render.id}
                to={`/spaces/${render.space_id}/renders/${render.id}`}
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
                  <span className="render-card-space">
                    {spaceMap.get(render.space_id) || 'Unknown space'}
                  </span>
                  <span className="render-card-date">
                    {new Date(render.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
