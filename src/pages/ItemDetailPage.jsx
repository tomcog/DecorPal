import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useItem, deleteItem } from '../hooks/useItems'
import '../styles/item-detail.css'

export default function ItemDetailPage() {
  const { id: spaceId, itemId } = useParams()
  const navigate = useNavigate()
  const { item, loading } = useItem(itemId)
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

  if (!item) {
    return (
      <div className="page">
        <p className="page-placeholder">Item not found.</p>
        <Link to={`/spaces/${spaceId}`} className="item-detail-back">
          Back to space
        </Link>
      </div>
    )
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await deleteItem(itemId, item.photo_urls)
    if (error) {
      setDeleting(false)
      return
    }
    navigate(`/spaces/${spaceId}`, { replace: true })
  }

  const hasPhotos = item.photo_urls && item.photo_urls.length > 0

  return (
    <div className="page item-detail">
      {hasPhotos && (
        <div className="item-detail-photos">
          <div className="item-detail-photos-strip">
            {item.photo_urls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${item.name} photo ${i + 1}`}
                className="item-detail-photo"
              />
            ))}
          </div>
        </div>
      )}

      <div className="item-detail-header">
        <div className="item-detail-header-info">
          <h1 className="item-detail-name">{item.name}</h1>
          {item.category && (
            <span className="item-detail-category">{item.category}</span>
          )}
        </div>
        <div className="item-detail-header-actions">
          <Link
            to={`/spaces/${spaceId}/items/${itemId}/edit`}
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
                  Delete item
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {item.acquired && (
        <span className="item-detail-badge">Acquired</span>
      )}

      {item.status && !item.acquired && (
        <span className="item-detail-status">{item.status}</span>
      )}

      {item.description && (
        <div className="item-detail-section">
          <h3 className="item-detail-section-title">Description</h3>
          <p className="item-detail-text">{item.description}</p>
        </div>
      )}

      {item.notes && (
        <div className="item-detail-section">
          <h3 className="item-detail-section-title">Notes</h3>
          <p className="item-detail-text item-detail-text--pre">{item.notes}</p>
        </div>
      )}

      <div className="item-detail-section">
        <h3 className="item-detail-section-title">Details</h3>
        <dl className="item-detail-dl">
          {item.vendor && (
            <>
              <dt>Vendor</dt>
              <dd>{item.vendor}</dd>
            </>
          )}
          {item.product_url && (
            <>
              <dt>Product link</dt>
              <dd>
                <a
                  href={item.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="item-detail-link"
                >
                  {new URL(item.product_url).hostname}
                </a>
              </dd>
            </>
          )}
          {item.price != null && (
            <>
              <dt>Price</dt>
              <dd className="item-detail-price">
                ${Number(item.price).toLocaleString()}
              </dd>
            </>
          )}
        </dl>
      </div>

      {item.acquired && (
        <div className="item-detail-section item-detail-section--acquired">
          <h3 className="item-detail-section-title">Purchase Details</h3>
          <dl className="item-detail-dl">
            {item.final_vendor && (
              <>
                <dt>Purchased from</dt>
                <dd>{item.final_vendor}</dd>
              </>
            )}
            {item.final_price != null && (
              <>
                <dt>Final price</dt>
                <dd className="item-detail-price">
                  ${Number(item.final_price).toLocaleString()}
                </dd>
              </>
            )}
            {item.final_purchase_date && (
              <>
                <dt>Purchase date</dt>
                <dd>{new Date(item.final_purchase_date).toLocaleDateString()}</dd>
              </>
            )}
            {item.final_purchase_notes && (
              <>
                <dt>Notes</dt>
                <dd>{item.final_purchase_notes}</dd>
              </>
            )}
          </dl>
        </div>
      )}

      <div className="item-detail-nav">
        <Link to={`/spaces/${spaceId}`} className="item-detail-back">
          Back to space
        </Link>
      </div>

      {showDeleteConfirm && (
        <div className="space-detail-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="space-detail-confirm" onClick={(e) => e.stopPropagation()}>
            <h3 className="space-detail-confirm-title">Delete item?</h3>
            <p className="space-detail-confirm-text">
              This will permanently delete <strong>{item.name}</strong> and all
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
