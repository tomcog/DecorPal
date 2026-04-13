import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createItem, uploadItemPhotos } from '../hooks/useItems'
import '../styles/item-form.css'

const CATEGORIES = [
  'furniture',
  'lighting',
  'paint/supplies',
  'textiles',
  'decor',
  'other',
]

export default function QuickAddItemPage() {
  const { id: spaceId } = useParams()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [finalVendor, setFinalVendor] = useState('')
  const [finalPrice, setFinalPrice] = useState('')
  const [finalPurchaseDate, setFinalPurchaseDate] = useState('')
  const [finalPurchaseNotes, setFinalPurchaseNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null)
      return
    }
    const url = URL.createObjectURL(photoFile)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (file) setPhotoFile(file)
  }

  function handleRemovePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    let photoUrls = null

    if (photoFile) {
      const { urls, error: uploadError } = await uploadItemPhotos([photoFile])
      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }
      photoUrls = urls
    }

    const fields = {
      space_id: spaceId,
      name,
      category: category || null,
      photo_urls: photoUrls,
      status: 'acquired',
      acquired: true,
      final_vendor: finalVendor || null,
      final_price: finalPrice ? Number(finalPrice) : null,
      final_purchase_date: finalPurchaseDate || null,
      final_purchase_notes: finalPurchaseNotes || null,
    }

    const { error: createError } = await createItem(fields)
    if (createError) {
      setError(createError.message)
      setSaving(false)
      return
    }
    navigate(`/spaces/${spaceId}`)
  }

  return (
    <div className="page">
      <form className="space-form" onSubmit={handleSubmit}>
        <h1>Log a Purchase</h1>

        <div className="item-form-photos">
          <span className="space-form-label">Photo (optional)</span>
          <div className="item-form-thumbs">
            {photoPreview ? (
              <div className="item-form-thumb">
                <img src={photoPreview} alt="" />
                <button
                  type="button"
                  className="item-form-thumb-remove"
                  onClick={handleRemovePhoto}
                  aria-label="Remove photo"
                >
                  &times;
                </button>
              </div>
            ) : (
              <label className="item-form-thumb-add">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="sr-only"
                />
              </label>
            )}
          </div>
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="qa-name">
            Name <span className="space-form-required">*</span>
          </label>
          <input
            id="qa-name"
            className="space-form-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What did you buy?"
            required
          />
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="qa-category">
            Category
          </label>
          <select
            id="qa-category"
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

        <div className="item-form-acquired-fields">
          <div className="space-form-field">
            <label className="space-form-label" htmlFor="qa-final-vendor">
              Purchased from
            </label>
            <input
              id="qa-final-vendor"
              className="space-form-input"
              type="text"
              value={finalVendor}
              onChange={(e) => setFinalVendor(e.target.value)}
              placeholder="Where did you buy it?"
            />
          </div>

          <div className="space-form-field">
            <label className="space-form-label" htmlFor="qa-final-price">
              Final price
            </label>
            <div className="space-form-budget-wrap">
              <span className="space-form-budget-symbol">$</span>
              <input
                id="qa-final-price"
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
            <label className="space-form-label" htmlFor="qa-final-date">
              Purchase date
            </label>
            <input
              id="qa-final-date"
              className="space-form-input"
              type="date"
              value={finalPurchaseDate}
              onChange={(e) => setFinalPurchaseDate(e.target.value)}
            />
          </div>

          <div className="space-form-field">
            <label className="space-form-label" htmlFor="qa-final-notes">
              Purchase notes
            </label>
            <textarea
              id="qa-final-notes"
              className="space-form-input space-form-textarea"
              value={finalPurchaseNotes}
              onChange={(e) => setFinalPurchaseNotes(e.target.value)}
              placeholder="Order number, delivery notes, etc."
              rows={2}
            />
          </div>
        </div>

        {error && <p className="space-form-error">{error}</p>}

        <div className="space-form-actions">
          <button
            type="button"
            className="space-form-btn space-form-btn--cancel"
            onClick={() => navigate(`/spaces/${spaceId}`)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="space-form-btn space-form-btn--save"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Log purchase'}
          </button>
        </div>
      </form>
    </div>
  )
}
