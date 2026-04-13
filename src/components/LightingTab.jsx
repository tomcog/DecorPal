import { Link } from 'react-router-dom'
import { useLightingIdeas } from '../hooks/useLightingIdeas'
import '../styles/palette-tab.css'

export default function LightingTab({ spaceId }) {
  const { ideas, loading } = useLightingIdeas(spaceId)

  if (loading) {
    return <p className="page-placeholder">Loading...</p>
  }

  return (
    <div className="palette-tab">
      <div className="palette-tab-section-header">
        <h3 className="palette-tab-section-title">Lighting Ideas</h3>
        <Link
          to={`/spaces/${spaceId}/lighting/new`}
          className="palette-tab-add-btn"
        >
          Add idea
        </Link>
      </div>

      {ideas.length === 0 ? (
        <div className="palette-tab-empty">
          <div className="palette-tab-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
            </svg>
          </div>
          <p className="palette-tab-empty-text">
            No lighting ideas yet. Add one to start planning.
          </p>
        </div>
      ) : (
        <div className="palette-tab-grid">
          {ideas.map((idea) => {
            const productCount = idea.products?.length || (idea.product_url ? 1 : 0)
            return (
              <Link
                key={idea.id}
                to={`/spaces/${spaceId}/lighting/${idea.id}`}
                className="lighting-card"
              >
                <div className="lighting-card-photo">
                  {idea.photo_urls && idea.photo_urls.length > 0 ? (
                    <img
                      src={idea.photo_urls[0]}
                      alt={idea.title}
                      className="lighting-card-img"
                    />
                  ) : (
                    <div className="lighting-card-placeholder">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18h6" />
                        <path d="M10 22h4" />
                        <path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="lighting-card-body">
                  <span className="lighting-card-title">{idea.title}</span>
                  {idea.notes && (
                    <p className="lighting-card-notes">{idea.notes}</p>
                  )}
                  {productCount > 0 && (
                    <span className="lighting-card-link-indicator">
                      {productCount} {productCount === 1 ? 'product' : 'products'}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
