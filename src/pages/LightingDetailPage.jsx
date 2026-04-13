import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLightingIdea, deleteLightingIdea } from '../hooks/useLightingIdeas'
import '../styles/lighting-detail.css'

export default function LightingDetailPage() {
  const { id: spaceId, lightingId } = useParams()
  const navigate = useNavigate()
  const { idea, loading } = useLightingIdea(lightingId)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  if (loading) {
    return (
      <div className="page">
        <p className="page-placeholder">Loading...</p>
      </div>
    )
  }

  if (!idea) {
    return (
      <div className="page">
        <p className="page-placeholder">Lighting idea not found.</p>
        <Link to={`/spaces/${spaceId}`} className="lighting-detail-back">
          Back to space
        </Link>
      </div>
    )
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await deleteLightingIdea(lightingId, idea.photo_urls)
    if (error) {
      setDeleting(false)
      return
    }
    navigate(`/spaces/${spaceId}`, { replace: true })
  }

  const hasPhotos = idea.photo_urls && idea.photo_urls.length > 0

  return (
    <div className="page lighting-detail">
      {hasPhotos && (
        <div className="item-detail-photos">
          <div className="item-detail-photos-strip">
            {idea.photo_urls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${idea.title} photo ${i + 1}`}
                className="item-detail-photo"
              />
            ))}
          </div>
        </div>
      )}

      <div className="item-detail-header">
        <div className="item-detail-header-info">
          <h1 className="item-detail-name">{idea.title}</h1>
        </div>
        <div className="item-detail-header-actions">
          <Link
            to={`/spaces/${spaceId}/lighting/${lightingId}/edit`}
            className="space-detail-edit-btn"
          >
            Edit
          </Link>
          <div className="space-detail-menu-wrap">
            <button
              className="space-detail-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="More options"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
            {menuOpen && (
              <div className="space-detail-menu">
                <button
                  className="space-detail-menu-item space-detail-menu-item--danger"
                  onClick={() => {
                    setMenuOpen(false)
                    setShowDeleteConfirm(true)
                  }}
                >
                  Delete lighting idea
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {idea.notes && (
        <div className="item-detail-section">
          <h3 className="item-detail-section-title">Notes</h3>
          <p className="item-detail-text item-detail-text--pre">{idea.notes}</p>
        </div>
      )}

      {idea.product_url && (
        <div className="item-detail-section">
          <h3 className="item-detail-section-title">Product Link</h3>
          <a
            href={idea.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="item-detail-link"
          >
            {new URL(idea.product_url).hostname}
          </a>
        </div>
      )}

      <div className="lighting-detail-nav">
        <Link to={`/spaces/${spaceId}`} className="lighting-detail-back">
          Back to space
        </Link>
      </div>

      {showDeleteConfirm && (
        <div className="space-detail-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="space-detail-confirm" onClick={(e) => e.stopPropagation()}>
            <h3 className="space-detail-confirm-title">Delete lighting idea?</h3>
            <p className="space-detail-confirm-text">
              This will permanently delete <strong>{idea.title}</strong> and all
              its photos. This cannot be undone.
            </p>
            <div className="space-detail-confirm-actions">
              <button
                className="space-form-btn space-form-btn--cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="space-detail-confirm-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
