import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useItem,
  createItem,
  updateItem,
  uploadItemPhotos,
  deleteItemPhotos,
} from '../hooks/useItems'
import '../styles/item-form.css'

const CATEGORIES = [
  'furniture',
  'lighting',
  'paint/supplies',
  'textiles',
  'decor',
  'other',
]

const STATUSES = ['considering', 'decided', 'acquired']

export default function ItemFormPage() {
  const { id: spaceId, itemId } = useParams()
  const isEdit = Boolean(itemId)
  const navigate = useNavigate()
  const { item, loading: itemLoading } = useItem(isEdit ? itemId : null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [existingPhotos, setExistingPhotos] = useState([])
  const [removedPhotos, setRemovedPhotos] = useState([])
  const [newFiles, setNewFiles] = useState([])
  const [newPreviews, setNewPreviews] = useState([])
  const [vendor, setVendor] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [price, setPrice] = useState('')
  const [status, setStatus] = useState('considering')
  const [acquired, setAcquired] = useState(false)
  const [finalVendor, setFinalVendor] = useState('')
  const [finalPrice, setFinalPrice] = useState('')
  const [finalPurchaseDate, setFinalPurchaseDate] = useState('')
  const [finalPurchaseNotes, setFinalPurchaseNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isEdit && item) {
      setName(item.name || '')
      setCategory(item.category || '')
      setDescription(item.description || '')
      setNotes(item.notes || '')
      setExistingPhotos(item.photo_urls || [])
      setVendor(item.vendor || '')
      setProductUrl(item.product_url || '')
      setPrice(item.price != null ? String(item.price) : '')
      setStatus(item.status || 'considering')
      setAcquired(item.acquired || false)
      setFinalVendor(item.final_vendor || '')
      setFinalPrice(item.final_price != null ? String(item.final_price) : '')
      setFinalPurchaseDate(item.final_purchase_date || '')
      setFinalPurchaseNotes(item.final_purchase_notes || '')
    }
  }, [isEdit, item])

  useEffect(() => {
    const urls = newFiles.map((f) => URL.createObjectURL(f))
    setNewPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [newFiles])

  if (isEdit && itemLoading) {
    return (
      <div className="page">
        <p className="page-placeholder">Loading...</p>
      </div>
    )
  }

  function handleAddPhotos(e) {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setNewFiles((prev) => [...prev, ...files])
    }
    e.target.value = ''
  }

  function handleRemoveExisting(url) {
    setExistingPhotos((prev) => prev.filter((u) => u !== url))
    setRemovedPhotos((prev) => [...prev, url])
  }

  function handleRemoveNew(index) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleStatusChange(newStatus) {
    setStatus(newStatus)
    if (newStatus === 'acquired') {
      setAcquired(true)
    }
  }

  function handleAcquiredToggle(checked) {
    setAcquired(checked)
    if (checked && status !== 'acquired') {
      setStatus('acquired')
    } else if (!checked && status === 'acquired') {
      setStatus('considering')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    if (removedPhotos.length > 0) {
      await deleteItemPhotos(removedPhotos)
    }

    let photoUrls = [...existingPhotos]

    if (newFiles.length > 0) {
      const { urls, error: uploadError } = await uploadItemPhotos(newFiles)
      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }
      photoUrls = [...photoUrls, ...urls]
    }

    const fields = {
      space_id: spaceId,
      name,
      category: category || null,
      description: description || null,
      notes: notes || null,
      photo_urls: photoUrls.length > 0 ? photoUrls : null,
      vendor: vendor || null,
      product_url: productUrl || null,
      price: price ? Number(price) : null,
      status,
      acquired,
      final_vendor: acquired && finalVendor ? finalVendor : null,
      final_price: acquired && finalPrice ? Number(finalPrice) : null,
      final_purchase_date: acquired && finalPurchaseDate ? finalPurchaseDate : null,
      final_purchase_notes: acquired && finalPurchaseNotes ? finalPurchaseNotes : null,
    }

    if (isEdit) {
      const { error: updateError } = await updateItem(itemId, fields)
      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
      navigate(`/spaces/${spaceId}/items/${itemId}`)
    } else {
      const { data, error: createError } = await createItem(fields)
      if (createError) {
        setError(createError.message)
        setSaving(false)
        return
      }
      navigate(`/spaces/${spaceId}/items/${data.id}`)
    }
  }

  return (
    <div className="page">
      <form className="space-form" onSubmit={handleSubmit}>
        <h1>{isEdit ? 'Edit Item' : 'New Item'}</h1>

        <div className="item-form-photos">
          <span className="space-form-label">Photos</span>
          <div className="item-form-thumbs">
            {existingPhotos.map((url) => (
              <div key={url} className="item-form-thumb">
                <img src={url} alt="" />
                <button
                  type="button"
                  className="item-form-thumb-remove"
                  onClick={() => handleRemoveExisting(url)}
                  aria-label="Remove photo"
                >
                  &times;
                </button>
              </div>
            ))}
            {newPreviews.map((url, i) => (
              <div key={url} className="item-form-thumb">
                <img src={url} alt="" />
                <button
                  type="button"
                  className="item-form-thumb-remove"
                  onClick={() => handleRemoveNew(i)}
                  aria-label="Remove photo"
                >
                  &times;
                </button>
              </div>
            ))}
            <label className="item-form-thumb-add">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddPhotos}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="item-name">
            Name <span className="space-form-required">*</span>
          </label>
          <input
            id="item-name"
            className="space-form-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Eames Lounge Chair"
            required
          />
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="item-category">
            Category
          </label>
          <select
            id="item-category"
            className="space-form-input space-form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select a category...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="item-description">
            Description
          </label>
          <textarea
            id="item-description"
            className="space-form-input space-form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this item"
            rows={2}
          />
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="item-notes">
            Notes
          </label>
          <textarea
            id="item-notes"
            className="space-form-input space-form-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes, measurements, ideas..."
            rows={3}
          />
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="item-vendor">
            Vendor
          </label>
          <input
            id="item-vendor"
            className="space-form-input"
            type="text"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="e.g. West Elm"
          />
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="item-product-url">
            Product URL
          </label>
          <input
            id="item-product-url"
            className="space-form-input"
            type="url"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="item-price">
            Price
          </label>
          <div className="space-form-budget-wrap">
            <span className="space-form-budget-symbol">$</span>
            <input
              id="item-price"
              className="space-form-input space-form-budget"
              type="number"
              min="0"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="item-status">
            Status
          </label>
          <select
            id="item-status"
            className="space-form-input space-form-select"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="item-form-toggle-row">
          <label className="item-form-toggle-label" htmlFor="item-acquired">
            Acquired
          </label>
          <button
            type="button"
            id="item-acquired"
            role="switch"
            aria-checked={acquired}
            className={`item-form-toggle${acquired ? ' item-form-toggle--on' : ''}`}
            onClick={() => handleAcquiredToggle(!acquired)}
          >
            <span className="item-form-toggle-thumb" />
          </button>
        </div>

        {acquired && (
          <div className="item-form-acquired-fields">
            <div className="space-form-field">
              <label className="space-form-label" htmlFor="item-final-vendor">
                Purchased from
              </label>
              <input
                id="item-final-vendor"
                className="space-form-input"
                type="text"
                value={finalVendor}
                onChange={(e) => setFinalVendor(e.target.value)}
                placeholder="Where did you buy it?"
              />
            </div>

            <div className="space-form-field">
              <label className="space-form-label" htmlFor="item-final-price">
                Final price
              </label>
              <div className="space-form-budget-wrap">
                <span className="space-form-budget-symbol">$</span>
                <input
                  id="item-final-price"
                  className="space-form-input space-form-budget"
                  type="number"
                  min="0"
                  step="any"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-form-field">
              <label className="space-form-label" htmlFor="item-final-date">
                Purchase date
              </label>
              <input
                id="item-final-date"
                className="space-form-input"
                type="date"
                value={finalPurchaseDate}
                onChange={(e) => setFinalPurchaseDate(e.target.value)}
              />
            </div>

            <div className="space-form-field">
              <label className="space-form-label" htmlFor="item-final-notes">
                Purchase notes
              </label>
              <textarea
                id="item-final-notes"
                className="space-form-input space-form-textarea"
                value={finalPurchaseNotes}
                onChange={(e) => setFinalPurchaseNotes(e.target.value)}
                placeholder="Order number, delivery notes, etc."
                rows={2}
              />
            </div>
          </div>
        )}

        {error && <p className="space-form-error">{error}</p>}

        <div className="space-form-actions">
          <button
            type="button"
            className="space-form-btn space-form-btn--cancel"
            onClick={() =>
              navigate(
                isEdit
                  ? `/spaces/${spaceId}/items/${itemId}`
                  : `/spaces/${spaceId}`
              )
            }
          >
            Cancel
          </button>
          <button
            type="submit"
            className="space-form-btn space-form-btn--save"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add item'}
          </button>
        </div>
      </form>
    </div>
  )
}
