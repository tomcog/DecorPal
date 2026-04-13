import { Link } from 'react-router-dom'
import { useSpaces } from '../hooks/useSpaces'
import '../styles/spaces.css'

export default function SpacesPage() {
  const { spaces, loading } = useSpaces()

  if (loading) {
    return (
      <div className="page">
        <p className="page-placeholder">Loading spaces...</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="spaces-header">
        <h1>Spaces</h1>
      </div>

      {spaces.length === 0 ? (
        <div className="spaces-empty">
          <div className="spaces-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <h2 className="spaces-empty-title">No spaces yet</h2>
          <p className="spaces-empty-text">
            Create your first space to start planning your decor.
          </p>
          <Link to="/spaces/new" className="spaces-empty-btn">
            Create a space
          </Link>
        </div>
      ) : (
        <div className="spaces-grid">
          {spaces.map((space) => (
            <Link
              key={space.id}
              to={`/spaces/${space.id}`}
              className="space-card"
            >
              <div className="space-card-cover">
                {space.cover_photo_url ? (
                  <img
                    src={space.cover_photo_url}
                    alt={space.name}
                    className="space-card-img"
                  />
                ) : (
                  <div className="space-card-placeholder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="space-card-body">
                <h3 className="space-card-name">{space.name}</h3>
                {space.type && (
                  <span className="space-card-type">{space.type}</span>
                )}
                {space.style_tags && space.style_tags.length > 0 && (
                  <div className="space-card-tags">
                    {space.style_tags.map((tag) => (
                      <span key={tag} className="chip">{tag}</span>
                    ))}
                  </div>
                )}
                {space.budget != null && (
                  <span className="space-card-budget">
                    ${Number(space.budget).toLocaleString()}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link to="/spaces/new" className="fab" aria-label="Create a new space">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>
    </div>
  )
}
