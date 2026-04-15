import { useState } from 'react'
import { usePaints, createPaint } from '../hooks/usePaints'
import { usePalettes } from '../hooks/usePalettes'
import PaintChip from './PaintChip'
import '../styles/paint-tab.css'

export default function PaintTab({ spaceId }) {
  const { paints, loading, refetch } = usePaints(spaceId)
  const { palettes, loading: palettesLoading } = usePalettes(spaceId)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selection, setSelection] = useState([])
  const [saving, setSaving] = useState(false)

  if (loading) {
    return <p className="page-placeholder">Loading...</p>
  }

  function openPicker() {
    setSelection([])
    setPickerOpen(true)
  }

  function toggleColor(hex) {
    const selected = selection.some((h) => h.toLowerCase() === hex.toLowerCase())
    if (selected) {
      setSelection(selection.filter((h) => h.toLowerCase() !== hex.toLowerCase()))
    } else if (selection.length < 3) {
      setSelection([...selection, hex])
    }
  }

  async function handleSaveSelection() {
    if (selection.length === 0) return
    setSaving(true)
    for (const hex of selection) {
      await createPaint({
        space_id: spaceId,
        hex,
        status: 'considering',
      })
    }
    setSaving(false)
    setPickerOpen(false)
    setSelection([])
    refetch()
  }

  return (
    <div className="paint-tab">
      <div className="paint-tab-header">
        <h3 className="paint-tab-title">Paint Colors</h3>
        <button
          type="button"
          onClick={openPicker}
          className="paint-tab-add-btn"
        >
          New paint chip
        </button>
      </div>

      {paints.length === 0 ? (
        <div className="paint-tab-empty">
          <div className="paint-tab-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <p className="paint-tab-empty-text">
            No paint chips yet. Pick colors from your palettes to start a new chip.
          </p>
          <button
            type="button"
            className="paint-tab-add-btn"
            onClick={openPicker}
          >
            Pick from palette
          </button>
        </div>
      ) : (
        <div className="paint-tab-list">
          {paints.map((paint) => (
            <PaintChip
              key={paint.id}
              paint={paint}
              to={`/spaces/${spaceId}/paints/${paint.id}`}
            />
          ))}
        </div>
      )}

      {pickerOpen && (
        <div
          className="space-detail-overlay"
          onClick={() => !saving && setPickerOpen(false)}
        >
          <div
            className="paint-palette-picker"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="paint-palette-picker-header">
              <h3 className="paint-palette-picker-title">New paint chip</h3>
              <button
                type="button"
                className="paint-palette-picker-close"
                onClick={() => setPickerOpen(false)}
                aria-label="Close"
                disabled={saving}
              >
                ×
              </button>
            </div>
            <p className="paint-palette-picker-hint">
              Pick up to 3 palette colors — each becomes its own chip ({selection.length}/3).
            </p>
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
                      {(palette.swatches || []).map((swatchHex, i) => {
                        const selected = selection.some(
                          (h) => h.toLowerCase() === swatchHex.toLowerCase(),
                        )
                        const atLimit = !selected && selection.length >= 3
                        return (
                          <button
                            key={`${palette.id}-${i}`}
                            type="button"
                            className={`paint-palette-picker-swatch${
                              selected ? ' paint-palette-picker-swatch--selected' : ''
                            }`}
                            style={{ backgroundColor: swatchHex }}
                            title={swatchHex}
                            disabled={atLimit}
                            onClick={() => toggleColor(swatchHex)}
                          >
                            <span className="sr-only">{swatchHex}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="paint-palette-picker-actions">
              <button
                type="button"
                className="space-form-btn space-form-btn--cancel"
                onClick={() => setPickerOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="space-form-btn space-form-btn--save"
                onClick={handleSaveSelection}
                disabled={saving || selection.length === 0}
              >
                {saving
                  ? 'Saving...'
                  : selection.length > 1
                  ? `Save ${selection.length} chips`
                  : 'Save chip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
