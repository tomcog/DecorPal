import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useItems, updateItem } from '../hooks/useItems'
import '../styles/items.css'

const STATUS_GROUPS = [
  { key: 'considering', label: 'Considering' },
  { key: 'decided', label: 'Decided' },
  { key: 'acquired', label: 'Acquired' },
]

export default function ItemsList({ spaceId }) {
  const { items, loading, refetch } = useItems(spaceId)
  const [collapsed, setCollapsed] = useState({})
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverGroup, setDragOverGroup] = useState(null)
  const [optimisticStatus, setOptimisticStatus] = useState({})

  if (loading) {
    return <p className="page-placeholder">Loading items...</p>
  }

  const statusOf = (item) => optimisticStatus[item.id] ?? item.status
  const grouped = {
    considering: items.filter((i) => statusOf(i) === 'considering'),
    decided: items.filter((i) => statusOf(i) === 'decided'),
    acquired: items.filter((i) => statusOf(i) === 'acquired'),
  }

  const hasItems = items.length > 0

  function toggleGroup(key) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleItemDragStart(e, item) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/x-item-id', item.id)
    e.dataTransfer.setData('text/plain', item.id)
    setDraggingId(item.id)
  }

  function handleItemDragEnd() {
    setDraggingId(null)
    setDragOverGroup(null)
  }

  function handleGroupDragOver(e, groupKey) {
    if (draggingId === null) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverGroup !== groupKey) setDragOverGroup(groupKey)
  }

  function handleGroupDragLeave(e, groupKey) {
    if (e.currentTarget.contains(e.relatedTarget)) return
    if (dragOverGroup === groupKey) setDragOverGroup(null)
  }

  async function handleGroupDrop(e, groupKey) {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('application/x-item-id') || e.dataTransfer.getData('text/plain')
    setDraggingId(null)
    setDragOverGroup(null)
    if (!itemId) return
    const item = items.find((i) => i.id === itemId)
    if (!item) return
    if (statusOf(item) === groupKey) return
    setOptimisticStatus((prev) => ({ ...prev, [itemId]: groupKey }))
    const fields = { status: groupKey }
    if (groupKey === 'acquired') fields.acquired = true
    else fields.acquired = false
    const { error } = await updateItem(itemId, fields)
    if (error) {
      setOptimisticStatus((prev) => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })
      return
    }
    await refetch()
    setOptimisticStatus((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
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
            const groupClasses = ['items-group']
            if (dragOverGroup === key) groupClasses.push('items-group--drag-over')
            return (
              <div
                key={key}
                className={groupClasses.join(' ')}
                onDragOver={(e) => handleGroupDragOver(e, key)}
                onDragLeave={(e) => handleGroupDragLeave(e, key)}
                onDrop={(e) => handleGroupDrop(e, key)}
              >
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
                          className={`item-card${draggingId === item.id ? ' item-card--dragging' : ''}`}
                          draggable
                          onDragStart={(e) => handleItemDragStart(e, item)}
                          onDragEnd={handleItemDragEnd}
                        >
                          <div className="item-card-photo">
                            {item.photo_urls && item.photo_urls.length > 0 ? (
                              <img
                                src={item.photo_urls[0]}
                                alt={item.name}
                                className="item-card-img"
                                draggable={false}
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
