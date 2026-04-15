import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  usePaint,
  createPaint,
  updatePaint,
  deletePaint,
} from '../hooks/usePaints'
import { usePalettes } from '../hooks/usePalettes'
import '../styles/paint-form.css'

const FINISHES = ['flat', 'matte', 'eggshell', 'satin', 'semi-gloss', 'gloss']
const STATUSES = ['considering', 'decided', 'purchased']

export default function PaintFormPage() {
  const { id: spaceId, paintId } = useParams()
  const isEdit = Boolean(paintId)
  const navigate = useNavigate()
  const { paint, loading: paintLoading } = usePaint(isEdit ? paintId : null)

  const [name, setName] = useState('')
  const [source, setSource] = useState('')
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
  const [showPalettePicker, setShowPalettePicker] = useState(false)
  const { palettes, loading: palettesLoading } = usePalettes(spaceId)

  useEffect(() => {
    if (isEdit && paint) {
      setName(paint.name || '')
      setSource(paint.source || '')
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
      name: name || null,
      source: source || null,
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
            Color name
          </label>
          <input
            id="paint-name"
            className="space-form-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Swiss Coffee"
          />
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="paint-source">
            Source / Store
          </label>
          <input
            id="paint-source"
            className="space-form-input"
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. Home Depot"
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
            Color
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
            <button
              type="button"
              className="paint-form-palette-btn"
              onClick={() => setShowPalettePicker(true)}
            >
              From palette
            </button>
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

      {showPalettePicker && (
        <div
          className="space-detail-overlay"
          onClick={() => setShowPalettePicker(false)}
        >
          <div
            className="paint-palette-picker"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="paint-palette-picker-header">
              <h3 className="paint-palette-picker-title">Pick a color</h3>
              <button
                type="button"
                className="paint-palette-picker-close"
                onClick={() => setShowPalettePicker(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {palettesLoading ? (
              <p className="page-placeholder">Loading palettes...</p>
            ) : palettes.length === 0 ? (
              <p className="paint-palette-picker-empty">
                No palettes yet in this space. Create one in the Palette section first.
              </p>
            ) : (
              <div className="paint-palette-picker-list">
                {palettes.map((palette) => (
                  <div key={palette.id} className="paint-palette-picker-row">
                    <span className="paint-palette-picker-name">
                      {palette.name || 'Untitled palette'}
                    </span>
                    <div className="paint-palette-picker-swatches">
                      {(palette.swatches || []).map((swatchHex, i) => (
                        <button
                          key={`${palette.id}-${i}`}
                          type="button"
                          className={`paint-palette-picker-swatch${
                            hex.toLowerCase() === swatchHex.toLowerCase()
                              ? ' paint-palette-picker-swatch--selected'
                              : ''
                          }`}
                          style={{ backgroundColor: swatchHex }}
                          title={swatchHex}
                          onClick={() => {
                            setHex(swatchHex)
                            setShowPalettePicker(false)
                          }}
                        >
                          <span className="sr-only">{swatchHex}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
