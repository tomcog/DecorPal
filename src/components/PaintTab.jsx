import { Link } from 'react-router-dom'
import { usePaints } from '../hooks/usePaints'
import '../styles/paint-tab.css'

const STATUS_LABELS = {
  considering: 'Considering',
  decided: 'Decided',
  purchased: 'Purchased',
}

export default function PaintTab({ spaceId }) {
  const { paints, loading } = usePaints(spaceId)

  if (loading) {
    return <p className="page-placeholder">Loading...</p>
  }

  return (
    <div className="paint-tab">
      <div className="paint-tab-header">
        <h3 className="paint-tab-title">Paint Colors</h3>
        <Link
          to={`/spaces/${spaceId}/paints/new`}
          className="paint-tab-add-btn"
        >
          Add paint
        </Link>
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
            No paint colors yet. Add one to start tracking your paint choices.
          </p>
        </div>
      ) : (
        <div className="paint-tab-list">
          {paints.map((paint) => (
            <Link
              key={paint.id}
              to={`/spaces/${spaceId}/paints/${paint.id}`}
              className="paint-card"
            >
              <span
                className="paint-card-swatch"
                style={{ backgroundColor: paint.hex || '#ccc' }}
              />
              <div className="paint-card-body">
                <span className="paint-card-name">{paint.name}</span>
                <span className="paint-card-meta">
                  {[paint.brand, paint.color_code, paint.finish].filter(Boolean).join(' · ')}
                </span>
              </div>
              <span className={`paint-card-status paint-card-status--${paint.status}`}>
                {STATUS_LABELS[paint.status] || paint.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
