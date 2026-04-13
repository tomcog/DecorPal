import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  usePalette,
  createPalette,
  updatePalette,
  deletePalette,
} from '../hooks/usePalettes'
import '../styles/palette-form.css'

export default function PaletteFormPage() {
  const { id: spaceId, paletteId } = useParams()
  const isEdit = Boolean(paletteId)
  const navigate = useNavigate()
  const { palette, loading: paletteLoading } = usePalette(isEdit ? paletteId : null)
  const colorInputRef = useRef(null)

  const [name, setName] = useState('')
  const [swatches, setSwatches] = useState(['#7c6ff7'])
  const [editingIndex, setEditingIndex] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (isEdit && palette) {
      setName(palette.name || '')
      setSwatches(palette.swatches && palette.swatches.length > 0 ? palette.swatches : ['#7c6ff7'])
    }
  }, [isEdit, palette])

  if (isEdit && paletteLoading) {
    return (
      <div className="page">
        <p className="page-placeholder">Loading...</p>
      </div>
    )
  }

  function handleSwatchClick(index) {
    setEditingIndex(index)
    setTimeout(() => {
      if (colorInputRef.current) colorInputRef.current.click()
    }, 0)
  }

  function handleColorChange(e) {
    if (editingIndex == null) return
    const updated = [...swatches]
    updated[editingIndex] = e.target.value
    setSwatches(updated)
  }

  function handleAddSwatch() {
    const newColor = '#ffffff'
    setSwatches([...swatches, newColor])
    setEditingIndex(swatches.length)
    setTimeout(() => {
      if (colorInputRef.current) colorInputRef.current.click()
    }, 0)
  }

  function handleRemoveSwatch(index) {
    if (swatches.length <= 1) return
    setSwatches(swatches.filter((_, i) => i !== index))
    setEditingIndex(null)
  }

  function handleMoveUp(index) {
    if (index === 0) return
    const updated = [...swatches]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    setSwatches(updated)
  }

  function handleMoveDown(index) {
    if (index === swatches.length - 1) return
    const updated = [...swatches]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    setSwatches(updated)
  }

  function handleDragStart(e, index) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e, targetIndex) {
    e.preventDefault()
    const sourceIndex = Number(e.dataTransfer.getData('text/plain'))
    if (sourceIndex === targetIndex) return
    const updated = [...swatches]
    const [moved] = updated.splice(sourceIndex, 1)
    updated.splice(targetIndex, 0, moved)
    setSwatches(updated)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const fields = {
      space_id: spaceId,
      name: name || null,
      swatches,
    }

    if (isEdit) {
      const { error: updateError } = await updatePalette(paletteId, fields)
      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
    } else {
      const { error: createError } = await createPalette(fields)
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
    const { error } = await deletePalette(paletteId)
    if (error) {
      setDeleting(false)
      return
    }
    navigate(`/spaces/${spaceId}`, { replace: true })
  }

  return (
    <div className="page">
      <form className="space-form" onSubmit={handleSubmit}>
        <h1>{isEdit ? 'Edit Palette' : 'New Palette'}</h1>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="palette-name">
            Name
          </label>
          <input
            id="palette-name"
            className="space-form-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Earthy Tones"
          />
        </div>

        <div className="palette-form-swatches-section">
          <span className="space-form-label">Swatches</span>
          <div className="palette-form-swatches">
            {swatches.map((hex, i) => (
              <div
                key={i}
                className="palette-form-swatch"
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, i)}
              >
                <button
                  type="button"
                  className="palette-form-swatch-circle"
                  style={{ backgroundColor: hex }}
                  onClick={() => handleSwatchClick(i)}
                  aria-label={`Edit color ${hex}`}
                />
                <span className="palette-form-swatch-hex">{hex}</span>
                <div className="palette-form-swatch-actions">
                  <button
                    type="button"
                    className="palette-form-swatch-move"
                    onClick={() => handleMoveUp(i)}
                    disabled={i === 0}
                    aria-label="Move up"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="palette-form-swatch-move"
                    onClick={() => handleMoveDown(i)}
                    disabled={i === swatches.length - 1}
                    aria-label="Move down"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {swatches.length > 1 && (
                    <button
                      type="button"
                      className="palette-form-swatch-remove"
                      onClick={() => handleRemoveSwatch(i)}
                      aria-label={`Remove ${hex}`}
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="palette-form-add-btn"
            onClick={handleAddSwatch}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add color
          </button>
          <input
            ref={colorInputRef}
            type="color"
            className="palette-form-color-input"
            value={editingIndex != null ? swatches[editingIndex] : '#ffffff'}
            onChange={handleColorChange}
            aria-hidden="true"
            tabIndex={-1}
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
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create palette'}
          </button>
        </div>

        {isEdit && (
          <button
            type="button"
            className="palette-form-delete-btn"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete palette
          </button>
        )}
      </form>

      {showDeleteConfirm && (
        <div className="space-detail-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="space-detail-confirm" onClick={(e) => e.stopPropagation()}>
            <h3 className="space-detail-confirm-title">Delete palette?</h3>
            <p className="space-detail-confirm-text">
              This will permanently delete this palette. This cannot be undone.
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
