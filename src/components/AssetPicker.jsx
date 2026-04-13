import { useState } from 'react'
import { useAllSpacesWithAssets } from '../hooks/useStudio'
import '../styles/asset-picker.css'

export default function AssetPicker({ onConfirm, onClose, existingIds }) {
  const { spaces, loading } = useAllSpacesWithAssets()
  const [expanded, setExpanded] = useState({})
  const [selected, setSelected] = useState([])

  function toggleSpace(spaceId) {
    setExpanded((prev) => ({ ...prev, [spaceId]: !prev[spaceId] }))
  }

  function isAlreadyAttached(id) {
    return existingIds.has(id)
  }

  function isSelected(id) {
    return selected.some((s) => s.id === id)
  }

  function toggleAsset(asset) {
    if (isSelected(asset.id)) {
      setSelected(selected.filter((s) => s.id !== asset.id))
    } else {
      setSelected([...selected, asset])
    }
  }

  function handleConfirm() {
    onConfirm(selected)
  }

  function buildAssetEntry(type, id, name, details) {
    return { type, id, name, details }
  }

  return (
    <div className="asset-picker-overlay" onClick={onClose}>
      <div className="asset-picker" onClick={(e) => e.stopPropagation()}>
        <div className="asset-picker-header">
          <h2 className="asset-picker-title">Attach from spaces</h2>
          <button
            className="asset-picker-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="asset-picker-body">
          {loading ? (
            <p className="page-placeholder">Loading spaces...</p>
          ) : spaces.length === 0 ? (
            <p className="page-placeholder">No spaces with assets yet.</p>
          ) : (
            spaces.map((space) => {
              const isExpanded = expanded[space.id]
              const totalAssets =
                space.items.length +
                space.palettes.length +
                space.lighting.length +
                space.renders.length
              if (totalAssets === 0) return null

              return (
                <div key={space.id} className="asset-picker-space">
                  <button
                    className="asset-picker-space-header"
                    onClick={() => toggleSpace(space.id)}
                  >
                    <span className="asset-picker-space-name">{space.name}</span>
                    <svg
                      className={`asset-picker-chevron${isExpanded ? '' : ' asset-picker-chevron--collapsed'}`}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="asset-picker-assets">
                      {space.palettes.map((p) => {
                        const swatchStr = (p.swatches || []).join(', ')
                        const asset = buildAssetEntry(
                          'palette',
                          p.id,
                          p.name || 'Untitled palette',
                          `Colors: ${swatchStr || 'none'}`
                        )
                        const disabled = isAlreadyAttached(p.id)
                        return (
                          <button
                            key={p.id}
                            className={`asset-picker-item${isSelected(p.id) ? ' asset-picker-item--selected' : ''}${disabled ? ' asset-picker-item--disabled' : ''}`}
                            onClick={() => !disabled && toggleAsset(asset)}
                            disabled={disabled}
                          >
                            <div className="asset-picker-item-icon">
                              <div className="asset-picker-swatch-row">
                                {(p.swatches || []).slice(0, 5).map((hex, i) => (
                                  <span
                                    key={i}
                                    className="asset-picker-swatch-dot"
                                    style={{ backgroundColor: hex }}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="asset-picker-item-info">
                              <span className="asset-picker-item-name">
                                {p.name || 'Untitled palette'}
                              </span>
                              <span className="asset-picker-item-type">Palette</span>
                            </div>
                            {(isSelected(p.id) || disabled) && (
                              <span className="asset-picker-item-check">&#10003;</span>
                            )}
                          </button>
                        )
                      })}

                      {space.items.map((item) => {
                        const asset = buildAssetEntry(
                          'item',
                          item.id,
                          item.name,
                          [item.category, item.vendor, item.price != null ? `$${item.price}` : null]
                            .filter(Boolean)
                            .join(' · ') || 'Furnishing item'
                        )
                        const disabled = isAlreadyAttached(item.id)
                        return (
                          <button
                            key={item.id}
                            className={`asset-picker-item${isSelected(item.id) ? ' asset-picker-item--selected' : ''}${disabled ? ' asset-picker-item--disabled' : ''}`}
                            onClick={() => !disabled && toggleAsset(asset)}
                            disabled={disabled}
                          >
                            <div className="asset-picker-item-icon">
                              {item.photo_urls && item.photo_urls.length > 0 ? (
                                <img
                                  src={item.photo_urls[0]}
                                  alt=""
                                  className="asset-picker-item-thumb"
                                />
                              ) : (
                                <div className="asset-picker-item-placeholder">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="asset-picker-item-info">
                              <span className="asset-picker-item-name">{item.name}</span>
                              <span className="asset-picker-item-type">Item</span>
                            </div>
                            {(isSelected(item.id) || disabled) && (
                              <span className="asset-picker-item-check">&#10003;</span>
                            )}
                          </button>
                        )
                      })}

                      {space.lighting.map((l) => {
                        const asset = buildAssetEntry(
                          'lighting',
                          l.id,
                          l.title || 'Untitled',
                          l.notes ? l.notes.slice(0, 80) : 'Lighting idea'
                        )
                        const disabled = isAlreadyAttached(l.id)
                        return (
                          <button
                            key={l.id}
                            className={`asset-picker-item${isSelected(l.id) ? ' asset-picker-item--selected' : ''}${disabled ? ' asset-picker-item--disabled' : ''}`}
                            onClick={() => !disabled && toggleAsset(asset)}
                            disabled={disabled}
                          >
                            <div className="asset-picker-item-icon">
                              {l.photo_urls && l.photo_urls.length > 0 ? (
                                <img
                                  src={l.photo_urls[0]}
                                  alt=""
                                  className="asset-picker-item-thumb"
                                />
                              ) : (
                                <div className="asset-picker-item-placeholder">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M9 18h6" />
                                    <path d="M10 22h4" />
                                    <path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="asset-picker-item-info">
                              <span className="asset-picker-item-name">{l.title || 'Untitled'}</span>
                              <span className="asset-picker-item-type">Lighting</span>
                            </div>
                            {(isSelected(l.id) || disabled) && (
                              <span className="asset-picker-item-check">&#10003;</span>
                            )}
                          </button>
                        )
                      })}

                      {space.renders.map((r) => {
                        const asset = buildAssetEntry(
                          'render',
                          r.id,
                          r.name || 'Untitled image',
                          r.prompt_text ? r.prompt_text.slice(0, 80) : 'Saved image'
                        )
                        const disabled = isAlreadyAttached(r.id)
                        return (
                          <button
                            key={r.id}
                            className={`asset-picker-item${isSelected(r.id) ? ' asset-picker-item--selected' : ''}${disabled ? ' asset-picker-item--disabled' : ''}`}
                            onClick={() => !disabled && toggleAsset(asset)}
                            disabled={disabled}
                          >
                            <div className="asset-picker-item-icon">
                              {r.image_url ? (
                                <img
                                  src={r.image_url}
                                  alt=""
                                  className="asset-picker-item-thumb"
                                />
                              ) : (
                                <div className="asset-picker-item-placeholder">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="asset-picker-item-info">
                              <span className="asset-picker-item-name">
                                {r.name || 'Untitled image'}
                              </span>
                              <span className="asset-picker-item-type">Image</span>
                            </div>
                            {(isSelected(r.id) || disabled) && (
                              <span className="asset-picker-item-check">&#10003;</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="asset-picker-footer">
          <button
            className="space-form-btn space-form-btn--cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="space-form-btn space-form-btn--save"
            onClick={handleConfirm}
            disabled={selected.length === 0}
          >
            Attach {selected.length > 0 ? `(${selected.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
