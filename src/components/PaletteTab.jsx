import { Link } from 'react-router-dom'
import { usePalettes } from '../hooks/usePalettes'
import '../styles/palette-tab.css'

export default function PaletteTab({ spaceId }) {
  const { palettes, loading } = usePalettes(spaceId)

  if (loading) {
    return <p className="page-placeholder">Loading...</p>
  }

  return (
    <div className="palette-tab">
      <div className="palette-tab-section-header">
        <h3 className="palette-tab-section-title">Color Palettes</h3>
        <Link
          to={`/spaces/${spaceId}/palettes/new`}
          className="palette-tab-add-btn"
        >
          Add palette
        </Link>
      </div>

      {palettes.length === 0 ? (
        <div className="palette-tab-empty">
          <div className="palette-tab-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="6.5" r="2.5" />
              <circle cx="17.5" cy="10.5" r="2.5" />
              <circle cx="8.5" cy="7.5" r="2.5" />
              <circle cx="6.5" cy="12.5" r="2.5" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
            </svg>
          </div>
          <p className="palette-tab-empty-text">
            No palettes yet. Add one to start exploring colors.
          </p>
        </div>
      ) : (
        <div className="palette-tab-grid">
          {palettes.map((palette) => {
            const swatches = palette.swatches || []
            return (
              <Link
                key={palette.id}
                to={`/spaces/${spaceId}/palettes/${palette.id}`}
                className="palette-card"
              >
                <div className="palette-card-swatches">
                  {swatches.map((hex, i) => (
                    <span
                      key={i}
                      className="palette-card-swatch"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
                <div className="palette-card-info">
                  {palette.name && (
                    <span className="palette-card-name">{palette.name}</span>
                  )}
                  <span className="palette-card-count">
                    {swatches.length} {swatches.length === 1 ? 'color' : 'colors'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
