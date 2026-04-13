import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useRender, updateRender, deleteRender } from '../hooks/useRenders'
import { updateSpace } from '../hooks/useSpaces'
import '../styles/render-detail.css'

export default function RenderDetailPage() {
  const { id: spaceId, renderId } = useParams()
  const navigate = useNavigate()
  const { render, loading, setRender } = useRender(renderId)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [coverSet, setCoverSet] = useState(false)

  if (loading) {
    return (
      <div className="page">
        <p className="page-placeholder">Loading...</p>
      </div>
    )
  }

  if (!render) {
    return (
      <div className="page">
        <p className="page-placeholder">Render not found.</p>
        <Link to={`/spaces/${spaceId}`} className="render-detail-back">
          Back to space
        </Link>
      </div>
    )
  }

  function handleStartEdit() {
    setNameValue(render.name || '')
    setEditingName(true)
  }

  async function handleSaveName() {
    if (!nameValue.trim()) return
    const { data } = await updateRender(renderId, { name: nameValue.trim() })
    if (data) setRender(data)
    setEditingName(false)
  }

  function handleCancelEdit() {
    setEditingName(false)
  }

  function handleNameKeyDown(e) {
    if (e.key === 'Enter') handleSaveName()
    if (e.key === 'Escape') handleCancelEdit()
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await deleteRender(renderId, render.image_url)
    if (error) {
      setDeleting(false)
      return
    }
    navigate(`/spaces/${spaceId}`, { replace: true })
  }

  const metadata = render.prompt_metadata || {}
  const attachedAssets = metadata.attachments || []
  const hadPhotos = metadata.had_photos

  return (
    <div className="page render-detail">
      {render.image_url && (
        <div className="render-detail-image-wrap">
          <img
            src={render.image_url}
            alt={render.name}
            className="render-detail-image"
          />
        </div>
      )}

      <div className="item-detail-header">
        <div className="item-detail-header-info">
          {editingName ? (
            <div className="render-detail-name-edit">
              <input
                className="space-form-input render-detail-name-input"
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={handleNameKeyDown}
                autoFocus
              />
              <div className="render-detail-name-edit-actions">
                <button
                  className="render-detail-name-save"
                  onClick={handleSaveName}
                >
                  Save
                </button>
                <button
                  className="render-detail-name-cancel"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <h1
              className="item-detail-name render-detail-name-clickable"
              onClick={handleStartEdit}
              title="Click to edit name"
            >
              {render.name || 'Untitled'}
            </h1>
          )}
          <span className="item-detail-category">
            {new Date(render.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="item-detail-header-actions">
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
                  className="space-detail-menu-item"
                  onClick={async () => {
                    setMenuOpen(false)
                    if (render.image_url) {
                      await updateSpace(spaceId, { cover_photo_url: render.image_url })
                      setCoverSet(true)
                      setTimeout(() => setCoverSet(false), 2500)
                    }
                  }}
                >
                  Set as space cover
                </button>
                <button
                  className="space-detail-menu-item"
                  onClick={() => {
                    setMenuOpen(false)
                    handleStartEdit()
                  }}
                >
                  Rename
                </button>
                <button
                  className="space-detail-menu-item space-detail-menu-item--danger"
                  onClick={() => {
                    setMenuOpen(false)
                    setShowDeleteConfirm(true)
                  }}
                >
                  Delete render
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {render.prompt_text && (
        <div className="item-detail-section">
          <h3 className="item-detail-section-title">Prompt</h3>
          <p className="item-detail-text item-detail-text--pre">{render.prompt_text}</p>
        </div>
      )}

      {(attachedAssets.length > 0 || hadPhotos) && (
        <div className="item-detail-section">
          <h3 className="item-detail-section-title">Inputs</h3>
          <div className="render-detail-meta">
            {attachedAssets.map((a, i) => (
              <span key={i} className="render-detail-meta-chip">
                <span className="render-detail-meta-type">{a.type}</span>
                {a.name}
              </span>
            ))}
            {hadPhotos && (
              <span className="render-detail-meta-chip">
                <span className="render-detail-meta-type">photos</span>
                Uploaded photos
              </span>
            )}
          </div>
        </div>
      )}

      {coverSet && (
        <p className="render-detail-cover-toast">Cover photo updated.</p>
      )}

      <div className="render-detail-nav">
        <Link to={`/spaces/${spaceId}`} className="render-detail-back">
          Back to space
        </Link>
      </div>

      {showDeleteConfirm && (
        <div className="space-detail-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="space-detail-confirm" onClick={(e) => e.stopPropagation()}>
            <h3 className="space-detail-confirm-title">Delete render?</h3>
            <p className="space-detail-confirm-text">
              This will permanently delete <strong>{render.name || 'this render'}</strong> and
              its image. This cannot be undone.
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
