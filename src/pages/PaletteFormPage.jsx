import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  usePalette,
  createPalette,
  updatePalette,
  deletePalette,
} from '../hooks/usePalettes'
import { useSpace } from '../hooks/useSpaces'
import { useItems } from '../hooks/useItems'
import { useLightingIdeas } from '../hooks/useLightingIdeas'
import { useRenders } from '../hooks/useRenders'
import { extractColorsFromImageUrl, pickColorFromCanvas } from '../lib/colorExtractor'
import { fileToDataUrl } from '../hooks/useStudio'
import '../styles/palette-form.css'

export default function PaletteFormPage() {
  const { id: spaceId, paletteId } = useParams()
  const isEdit = Boolean(paletteId)
  const navigate = useNavigate()
  const { palette, loading: paletteLoading } = usePalette(isEdit ? paletteId : null)
  const colorInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)

  const { space } = useSpace(spaceId)
  const { items } = useItems(spaceId)
  const { ideas: lightingIdeas } = useLightingIdeas(spaceId)
  const { renders } = useRenders(spaceId)

  const [name, setName] = useState('')
  const [swatches, setSwatches] = useState(['#7c6ff7'])
  const [editingIndex, setEditingIndex] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [sourceImage, setSourceImage] = useState(null)
  const [colorCount, setColorCount] = useState(6)
  const [hoverColor, setHoverColor] = useState(null)
  const [pasteValue, setPasteValue] = useState('')

  useEffect(() => {
    if (isEdit && palette) {
      setName(palette.name || '')
      setSwatches(palette.swatches && palette.swatches.length > 0 ? palette.swatches : ['#7c6ff7'])
    }
  }, [isEdit, palette])

  // Draw the source image onto the canvas at its CSS display size.
  // For remote URLs, fetch as blob first to avoid CORS-tainting the canvas.
  const drawImageToCanvas = useCallback(async (imgSrc) => {
    const canvas = canvasRef.current
    if (!canvas || !imgSrc) return

    let src = imgSrc
    // Remote URLs: fetch as blob to guarantee an untainted canvas
    if (imgSrc.startsWith('http')) {
      try {
        const resp = await fetch(imgSrc)
        const blob = await resp.blob()
        src = URL.createObjectURL(blob)
      } catch {
        // Fall back to direct src (may taint canvas)
        src = imgSrc
      }
    }

    const img = new Image()
    img.onload = () => {
      // Size the canvas to match its CSS layout so coordinates are 1:1
      const parentW = canvas.parentElement?.getBoundingClientRect().width
      const displayW = parentW || 400
      const aspect = img.naturalHeight / img.naturalWidth
      const displayH = Math.min(displayW * aspect, 320)
      const finalW = displayH / aspect

      canvas.width = Math.round(finalW)
      canvas.height = Math.round(displayH)
      canvas.style.width = `${Math.round(finalW)}px`
      canvas.style.height = `${Math.round(displayH)}px`

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Clean up blob URL if we created one
      if (src !== imgSrc) URL.revokeObjectURL(src)
    }
    img.src = src
  }, [])

  useEffect(() => {
    if (sourceImage) drawImageToCanvas(sourceImage)
  }, [sourceImage, drawImageToCanvas])

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

  // Collect all images available in this space
  const spaceImages = []
  if (space?.cover_photo_url) {
    spaceImages.push({ url: space.cover_photo_url, label: 'Space cover', type: 'cover' })
  }
  for (const item of items) {
    if (item.photo_urls) {
      for (const url of item.photo_urls) {
        spaceImages.push({ url, label: item.name || 'Furnishing item', type: 'item' })
      }
    }
  }
  for (const idea of lightingIdeas) {
    if (idea.photo_urls) {
      for (const url of idea.photo_urls) {
        spaceImages.push({ url, label: idea.title || 'Lighting idea', type: 'lighting' })
      }
    }
  }
  for (const render of renders) {
    if (render.image_url) {
      spaceImages.push({ url: render.image_url, label: render.name || 'Image', type: 'render' })
    }
  }

  async function handleExtractColors(imgSrc) {
    setExtracting(true)
    setError(null)
    try {
      const colors = await extractColorsFromImageUrl(imgSrc, colorCount)
      setSwatches(colors)
    } catch {
      setError('Could not extract colors from that image. Try another.')
    }
    setExtracting(false)
  }

  async function handleLoadImage(imgSrc) {
    setSourceImage(imgSrc)
    setShowImagePicker(false)
    await handleExtractColors(imgSrc)
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await fileToDataUrl(file)
      await handleLoadImage(dataUrl)
    } catch {
      setError('Could not load that image. Try another.')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleCanvasClick(e) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const hex = pickColorFromCanvas(canvas, x, y)
    setSwatches((prev) => [...prev, hex])
  }

  function handleCanvasMove(e) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const hex = pickColorFromCanvas(canvas, x, y)
    setHoverColor(hex)
  }

  function handleCanvasLeave() {
    setHoverColor(null)
  }

  function handlePasteColors() {
    const hexPattern = /#?([0-9a-fA-F]{6})\b/g
    const matches = []
    let m
    while ((m = hexPattern.exec(pasteValue)) !== null) {
      matches.push('#' + m[1].toLowerCase())
    }
    if (matches.length > 0) {
      setSwatches(matches)
      setPasteValue('')
      setError(null)
    } else {
      setError('No valid hex colors found. Use formats like #FF5733 or FF5733.')
    }
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

        <div className="palette-extract-section">
          <span className="space-form-label">Extract from image</span>

          {sourceImage ? (
            <div className="palette-source">
              <div className="palette-source-image-wrap">
                <canvas
                  ref={canvasRef}
                  className="palette-source-canvas"
                  onClick={handleCanvasClick}
                  onMouseMove={handleCanvasMove}
                  onMouseLeave={handleCanvasLeave}
                />
                {hoverColor && (
                  <div className="palette-source-loupe">
                    <span
                      className="palette-source-loupe-swatch"
                      style={{ backgroundColor: hoverColor }}
                    />
                    <span className="palette-source-loupe-hex">{hoverColor}</span>
                  </div>
                )}
                <p className="palette-source-hint">Click anywhere to pick a color</p>
              </div>
              <div className="palette-source-controls">
                <div className="palette-source-count">
                  <label className="space-form-label" htmlFor="color-count">Colors</label>
                  <div className="palette-source-stepper">
                    <button
                      type="button"
                      className="palette-source-stepper-btn"
                      onClick={() => setColorCount((c) => Math.max(2, c - 1))}
                      disabled={colorCount <= 2}
                      aria-label="Fewer colors"
                    >
                      &minus;
                    </button>
                    <span className="palette-source-stepper-value">{colorCount}</span>
                    <button
                      type="button"
                      className="palette-source-stepper-btn"
                      onClick={() => setColorCount((c) => Math.min(12, c + 1))}
                      disabled={colorCount >= 12}
                      aria-label="More colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="palette-extract-btn"
                  onClick={() => handleExtractColors(sourceImage)}
                  disabled={extracting}
                >
                  {extracting ? 'Extracting...' : 'Re-extract'}
                </button>
                <button
                  type="button"
                  className="palette-source-clear"
                  onClick={() => { setSourceImage(null); setHoverColor(null) }}
                >
                  Clear image
                </button>
              </div>
            </div>
          ) : (
            <div className="palette-extract-actions">
              <button
                type="button"
                className="palette-extract-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload a photo
              </button>
              {spaceImages.length > 0 && (
                <button
                  type="button"
                  className="palette-extract-btn"
                  onClick={() => setShowImagePicker(true)}
                  disabled={extracting}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Pick from space
                </button>
              )}
            </div>
          )}

          {extracting && !sourceImage && (
            <p className="palette-extract-status">Extracting colors...</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="palette-form-color-input"
            onChange={handleFileUpload}
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>

        <div className="palette-paste-section">
          <span className="space-form-label">Paste hex colors</span>
          <div className="palette-paste-row">
            <textarea
              className="space-form-input palette-paste-input"
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              placeholder={"#FF5733, #33FF57, #3357FF\nor one per line"}
              rows={2}
            />
            <button
              type="button"
              className="palette-extract-btn"
              onClick={handlePasteColors}
              disabled={!pasteValue.trim()}
            >
              Apply
            </button>
          </div>
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

      {showImagePicker && (
        <div className="space-detail-overlay" onClick={() => setShowImagePicker(false)}>
          <div className="palette-image-picker" onClick={(e) => e.stopPropagation()}>
            <h3 className="palette-image-picker-title">Pick an image</h3>
            <div className="palette-image-picker-grid">
              {spaceImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  className="palette-image-picker-item"
                  onClick={() => handleLoadImage(img.url)}
                >
                  <img src={img.url} alt={img.label} className="palette-image-picker-img" />
                  <span className="palette-image-picker-label">{img.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="space-form-btn space-form-btn--cancel"
              onClick={() => setShowImagePicker(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
