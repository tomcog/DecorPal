import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSpace, deleteSpace } from '../hooks/useSpaces'
import ItemsList from '../components/ItemsList'
import PaletteTab from '../components/PaletteTab'
import LightingTab from '../components/LightingTab'
import RendersTab from '../components/RendersTab'
import '../styles/space-detail.css'

const TABS = ['Images', 'Items', 'Palette', 'Lighting']

export default function SpaceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { space, loading } = useSpace(id)
  const [activeTab, setActiveTab] = useState('Images')
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

  if (!space) {
    return (
      <div className="page">
        <p className="page-placeholder">Space not found.</p>
        <Link to="/" className="space-detail-back">Back to spaces</Link>
      </div>
    )
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await deleteSpace(id, space.cover_photo_url)
    if (error) {
      setDeleting(false)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="page space-detail">
      <div className="space-detail-cover">
        {space.cover_photo_url ? (
          <img
            src={space.cover_photo_url}
            alt={space.name}
            className="space-detail-cover-img"
          />
        ) : (
          <div className="space-detail-cover-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>

      <div className="space-detail-header">
        <div className="space-detail-header-info">
          <h1 className="space-detail-name">{space.name}</h1>
          {space.type && (
            <span className="space-detail-type">{space.type}</span>
          )}
        </div>
        <div className="space-detail-header-actions">
          <Link
            to={`/spaces/${id}/edit`}
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
                  Delete space
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {space.description && (
        <p className="space-detail-description">{space.description}</p>
      )}

      {space.style_tags && space.style_tags.length > 0 && (
        <div className="space-detail-tags">
          {space.style_tags.map((tag) => (
            <span key={tag} className="chip">{tag}</span>
          ))}
        </div>
      )}

      {space.budget != null && (
        <p className="space-detail-budget">
          Budget: ${Number(space.budget).toLocaleString()}
        </p>
      )}

      <div className="space-detail-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`space-detail-tab${activeTab === tab ? ' space-detail-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-detail-tab-content">
        {activeTab === 'Items' && <ItemsList spaceId={id} />}
        {activeTab === 'Palette' && <PaletteTab spaceId={id} />}
        {activeTab === 'Lighting' && <LightingTab spaceId={id} />}
        {activeTab === 'Images' && <RendersTab spaceId={id} />}

      </div>

      {showDeleteConfirm && (
        <div className="space-detail-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="space-detail-confirm" onClick={(e) => e.stopPropagation()}>
            <h3 className="space-detail-confirm-title">Delete space?</h3>
            <p className="space-detail-confirm-text">
              This will permanently delete <strong>{space.name}</strong> and all
              its items, palettes, and images. This cannot be undone.
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
