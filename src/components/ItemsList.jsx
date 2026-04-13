import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useItems } from '../hooks/useItems'
import '../styles/items.css'

const STATUS_GROUPS = [
  { key: 'considering', label: 'Considering' },
  { key: 'decided', label: 'Decided' },
  { key: 'acquired', label: 'Acquired' },
]

export default function ItemsList({ spaceId }) {
  const { items, loading } = useItems(spaceId)
  const [collapsed, setCollapsed] = useState({})

  if (loading) {
    return <p className="page-placeholder">Loading items...</p>
  }

  const grouped = {
    considering: items.filter((i) => i.status === 'considering'),
    decided: items.filter((i) => i.status === 'decided'),
    acquired: items.filter((i) => i.status === 'acquired'),
  }

  const hasItems = items.length > 0

  function toggleGroup(key) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="items-list">
      {!hasItems ? (
        <div className="items-empty">
          <div className="items-empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="items-empty-title">No items yet</h3>
          <p className="items-empty-text">
            Start adding furniture, decor, and supplies for this space.
          </p>
          <Link to={`/spaces/${spaceId}/items/new`} className="items-empty-btn">
            Add an item
          </Link>
        </div>
      ) : (
        <>
          {STATUS_GROUPS.map(({ key, label }) => {
            const groupItems = grouped[key]
            const isCollapsed = collapsed[key]
            return (
              <div key={key} className="items-group">
                <button
                  className="items-group-header"
                  onClick={() => toggleGroup(key)}
                >
                  <span className="items-group-label">
                    {label}
                    <span className="items-group-count">{groupItems.length}</span>
                  </span>
                  <svg
                    className={`items-group-chevron${isCollapsed ? ' items-group-chevron--collapsed' : ''}`}
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
                {!isCollapsed && (
                  groupItems.length === 0 ? (
                    <p className="items-group-empty">No {label.toLowerCase()} items.</p>
                  ) : (
                    <div className="items-grid">
                      {groupItems.map((item) => (
                        <Link
                          key={item.id}
                          to={`/spaces/${spaceId}/items/${item.id}`}
                          className="item-card"
                        >
                          <div className="item-card-photo">
                            {item.photo_urls && item.photo_urls.length > 0 ? (
                              <img
                                src={item.photo_urls[0]}
                                alt={item.name}
                                className="item-card-img"
                              />
                            ) : (
                              <div className="item-card-placeholder">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="item-card-body">
                            <div className="item-card-top">
                              <span className="item-card-name">{item.name}</span>
                              {item.acquired && (
                                <span className="item-card-badge">Acquired</span>
                              )}
                            </div>
                            {item.category && (
                              <span className="item-card-category">{item.category}</span>
                            )}
                            <div className="item-card-meta">
                              {item.vendor && (
                                <span className="item-card-vendor">{item.vendor}</span>
                              )}
                              {item.price != null && (
                                <span className="item-card-price">
                                  ${Number(item.price).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )
                )}
              </div>
            )
          })}
        </>
      )}

      {hasItems && (
        <div className="items-actions">
          <Link
            to={`/spaces/${spaceId}/items/quick-add`}
            className="items-log-btn"
          >
            Log a purchase
          </Link>
        </div>
      )}

      <Link
        to={`/spaces/${spaceId}/items/new`}
        className="fab"
        aria-label="Add a new item"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>
    </div>
  )
}
