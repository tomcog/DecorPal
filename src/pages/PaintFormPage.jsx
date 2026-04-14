import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  usePaint,
  createPaint,
  updatePaint,
  deletePaint,
} from '../hooks/usePaints'
import '../styles/paint-form.css'

const FINISHES = ['flat', 'matte', 'eggshell', 'satin', 'semi-gloss', 'gloss']
const STATUSES = ['considering', 'decided', 'purchased']

export default function PaintFormPage() {
  const { id: spaceId, paintId } = useParams()
  const isEdit = Boolean(paintId)
  const navigate = useNavigate()
  const { paint, loading: paintLoading } = usePaint(isEdit ? paintId : null)

  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [colorCode, setColorCode] = useState('')
  const [hex, setHex] = useState('#ffffff')
  const [finish, setFinish] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('considering')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (isEdit && paint) {
      setName(paint.name || '')
      setBrand(paint.brand || '')
      setColorCode(paint.color_code || '')
      setHex(paint.hex || '#ffffff')
      setFinish(paint.finish || '')
      setNotes(paint.notes || '')
      setStatus(paint.status || 'considering')
    }
  }, [isEdit, paint])

  if (isEdit && paintLoading) {
    return (
      <div className="page">
        <p className="page-placeholder">Loading...</p>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const fields = {
      space_id: spaceId,
      name,
      brand: brand || null,
      color_code: colorCode || null,
      hex: hex || null,
      finish: finish || null,
      notes: notes || null,
      status,
    }

    if (isEdit) {
      const { error: updateError } = await updatePaint(paintId, fields)
      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
    } else {
      const { error: createError } = await createPaint(fields)
      if (createError) {
        setError(createError.message)
        setSaving(false)
        return
      }
    }
    navigate(`/spaces/${spaceId}`)
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await deletePaint(paintId)
    if (error) {
      setDeleting(false)
      return
    }
    navigate(`/spaces/${spaceId}`, { replace: true })
  }

  return (
    <div className="page">
      <form className="space-form" onSubmit={handleSubmit}>
        <h1>{isEdit ? 'Edit Paint' : 'New Paint'}</h1>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="paint-name">
            Color name <span className="space-form-required">*</span>
          </label>
          <input
            id="paint-name"
            className="space-form-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Swiss Coffee"
            required
          />
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="paint-brand">
            Brand
          </label>
          <input
            id="paint-brand"
            className="space-form-input"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Benjamin Moore"
          />
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="paint-code">
            Color code
          </label>
          <input
            id="paint-code"
            className="space-form-input"
            type="text"
            value={colorCode}
            onChange={(e) => setColorCode(e.target.value)}
            placeholder="e.g. OC-45"
          />
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="paint-hex">
            Color preview
          </label>
          <div className="paint-form-color-row">
            <input
              id="paint-hex"
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="paint-form-color-picker"
            />
            <input
              className="space-form-input paint-form-hex-input"
              type="text"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              placeholder="#ffffff"
            />
          </div>
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="paint-finish">
            Finish
          </label>
          <select
            id="paint-finish"
            className="space-form-input space-form-select"
            value={finish}
            onChange={(e) => setFinish(e.target.value)}
          >
            <option value="">Select a finish...</option>
            {FINISHES.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="paint-status">
            Status
          </label>
          <select
            id="paint-status"
            className="space-form-input space-form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="paint-notes">
            Notes
          </label>
          <textarea
            id="paint-notes"
            className="space-form-input space-form-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Where to use it, which walls, etc."
            rows={3}
          />
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
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add paint'}
          </button>
        </div>

        {isEdit && (
          <button
            type="button"
            className="paint-form-delete-btn"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete paint
          </button>
        )}
      </form>

      {showDeleteConfirm && (
        <div className="space-detail-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="space-detail-confirm" onClick={(e) => e.stopPropagation()}>
            <h3 className="space-detail-confirm-title">Delete paint?</h3>
            <p className="space-detail-confirm-text">
              This will permanently delete this paint color. This cannot be undone.
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
