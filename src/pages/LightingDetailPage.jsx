import { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  useLightingIdea,
  deleteLightingIdea,
  updateLightingIdea,
  uploadLightingPhotos,
} from '../hooks/useLightingIdeas'
import '../styles/lighting-detail.css'

export default function LightingDetailPage() {
  const { id: spaceId, lightingId } = useParams()
  const navigate = useNavigate()
  const { idea, loading, setIdea } = useLightingIdea(lightingId)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Inline add-product state
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newProductUrl, setNewProductUrl] = useState('')
  const [newProductFile, setNewProductFile] = useState(null)
  const [newProductPreview, setNewProductPreview] = useState(null)
  const [addingSaving, setAddingSaving] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const dragCounter = useRef(0)
  const fileInputRef = useRef(null)

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

  function tryHostname(url) {
    try { return new URL(url).hostname } catch { return url }
  }

  function handleProductFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) return
    if (newProductPreview) URL.revokeObjectURL(newProductPreview)
    setNewProductFile(file)
    setNewProductPreview(URL.createObjectURL(file))
  }

  function handleProductFileInput(e) {
    handleProductFileSelect(e.target.files?.[0])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleAddDragEnter(e) {
    e.preventDefault()
    dragCounter.current++
    if (e.dataTransfer.types.includes('Files')) setDragOver(true)
  }

  function handleAddDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function handleAddDragLeave(e) {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setDragOver(false)
    }
  }

  function handleAddDrop(e) {
    e.preventDefault()
    dragCounter.current = 0
    setDragOver(false)
    handleProductFileSelect(e.dataTransfer.files?.[0])
  }

  function resetAddForm() {
    setShowAddProduct(false)
    setNewProductName('')
    setNewProductUrl('')
    if (newProductPreview) URL.revokeObjectURL(newProductPreview)
    setNewProductFile(null)
    setNewProductPreview(null)
  }

  async function handleSaveProduct() {
    if (!newProductUrl.trim()) return
    setAddingSaving(true)

    let photoUrl = null
    if (newProductFile) {
      const { urls, error: uploadError } = await uploadLightingPhotos([newProductFile])
      if (uploadError) {
        setAddingSaving(false)
        return
      }
      photoUrl = urls[0]
    }

    const existingProducts = idea.products || []
    const updatedProducts = [
      ...existingProducts,
      { name: newProductName, url: newProductUrl, photo_url: photoUrl },
    ]

    const { data, error } = await updateLightingIdea(lightingId, {
      products: updatedProducts,
      product_url: updatedProducts[0]?.url || null,
    })

    setAddingSaving(false)
    if (!error && data) {
      setIdea(data)
      resetAddForm()
    }
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

      <div className="item-detail-section">
        <div className="lighting-detail-products-header">
          <h3 className="item-detail-section-title">Products</h3>
          {!showAddProduct && (
            <button
              className="lighting-detail-add-product-btn"
              onClick={() => setShowAddProduct(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add product
            </button>
          )}
        </div>

        {idea.products && idea.products.length > 0 && (
          <div className="lighting-detail-products">
            {idea.products.map((p, i) => (
              <a
                key={i}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="lighting-detail-product"
              >
                {p.photo_url && (
                  <img
                    src={p.photo_url}
                    alt={p.name || ''}
                    className="lighting-detail-product-img"
                  />
                )}
                <div className="lighting-detail-product-info">
                  <span className="lighting-detail-product-name">
                    {p.name || tryHostname(p.url)}
                  </span>
                  {p.name && (
                    <span className="lighting-detail-product-url">{tryHostname(p.url)}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {!idea.products?.length && idea.product_url && (
          <div className="lighting-detail-products">
            <a
              href={idea.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="lighting-detail-product"
            >
              <div className="lighting-detail-product-info">
                <span className="lighting-detail-product-name">
                  {tryHostname(idea.product_url)}
                </span>
              </div>
            </a>
          </div>
        )}

        {!idea.products?.length && !idea.product_url && !showAddProduct && (
          <p className="lighting-detail-no-products">No products added yet.</p>
        )}

        {showAddProduct && (
          <div
            className={`lighting-detail-add-form${dragOver ? ' lighting-detail-add-form--drag' : ''}`}
            onDragEnter={handleAddDragEnter}
            onDragOver={handleAddDragOver}
            onDragLeave={handleAddDragLeave}
            onDrop={handleAddDrop}
          >
            <div className="lighting-detail-add-photo-col">
              {newProductPreview ? (
                <div className="lighting-product-photo">
                  <img src={newProductPreview} alt="" />
                  <button
                    className="item-form-thumb-remove"
                    onClick={() => {
                      if (newProductPreview) URL.revokeObjectURL(newProductPreview)
                      setNewProductFile(null)
                      setNewProductPreview(null)
                    }}
                    aria-label="Remove photo"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <label className="lighting-product-photo-add">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProductFileInput}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
            <div className="lighting-detail-add-fields">
              <input
                className="space-form-input"
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Product name"
              />
              <input
                className="space-form-input"
                type="url"
                value={newProductUrl}
                onChange={(e) => setNewProductUrl(e.target.value)}
                placeholder="https://..."
              />
              <div className="lighting-detail-add-actions">
                <button
                  className="space-form-btn space-form-btn--cancel lighting-detail-add-cancel"
                  onClick={resetAddForm}
                >
                  Cancel
                </button>
                <button
                  className="space-form-btn space-form-btn--save lighting-detail-add-save"
                  onClick={handleSaveProduct}
                  disabled={!newProductUrl.trim() || addingSaving}
                >
                  {addingSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
