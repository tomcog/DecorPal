import { Link } from 'react-router-dom'
import '../styles/paint-chip.css'

function hexToRgb(hex) {
  if (!hex) return null
  const clean = hex.replace('#', '').trim()
  if (clean.length !== 3 && clean.length !== 6) return null
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean
  const num = parseInt(full, 16)
  if (Number.isNaN(num)) return null
  return { r: (num >> 16) & 0xff, g: (num >> 8) & 0xff, b: num & 0xff }
}

function isDark(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return false
  const l = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return l < 0.6
}

export default function PaintChip({ paint, to }) {
  const hex = paint.hex || (Array.isArray(paint.hexes) && paint.hexes[0]) || '#e5e5e5'
  const dark = isDark(hex)
  const modifier = dark ? 'paint-chip--dark' : 'paint-chip--light'

  const cells = [
    { label: 'Source', value: paint.source },
    { label: 'Brand', value: paint.brand },
    { label: 'Finish', value: paint.finish },
  ]

  const content = (
    <div
      className={`paint-chip ${modifier}`}
      style={{ backgroundColor: hex }}
    >
      <div className="paint-chip-header">
        <span className="paint-chip-name">{paint.name || 'Untitled'}</span>
        {paint.color_code && (
          <span className="paint-chip-code">{paint.color_code}</span>
        )}
      </div>
      <div className="paint-chip-table">
        {cells.map(({ label, value }) => (
          <div key={label} className="paint-chip-cell">
            <span className="paint-chip-cell-label">{label}</span>
            <span className="paint-chip-cell-value">{value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="paint-chip-link">
        {content}
      </Link>
    )
  }
  return content
}
