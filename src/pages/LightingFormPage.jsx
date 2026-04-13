import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useLightingIdea,
  createLightingIdea,
  updateLightingIdea,
  uploadLightingPhotos,
  deleteLightingPhotos,
} from '../hooks/useLightingIdeas'
import '../styles/item-form.css'

export default function LightingFormPage() {
  const { id: spaceId, lightingId } = useParams()
  const isEdit = Boolean(lightingId)
  const navigate = useNavigate()
  const { idea, loading: ideaLoading } = useLightingIdea(isEdit ? lightingId : null)

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [existingPhotos, setExistingPhotos] = useState([])
  const [removedPhotos, setRemovedPhotos] = useState([])
  const [newFiles, setNewFiles] = useState([])
  const [newPreviews, setNewPreviews] = useState([])
  const [products, setProducts] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [dragOverProduct, setDragOverProduct] = useState(null)
  const dragCounters = useRef({})

  useEffect(() => {
    if (isEdit && idea) {
      setTitle(idea.title || '')
      setNotes(idea.notes || '')
      setExistingPhotos(idea.photo_urls || [])
      if (idea.products && idea.products.length > 0) {
        setProducts(idea.products.map((p) => ({ ...p })))
      } else if (idea.product_url) {
        setProducts([{ name: '', url: idea.product_url, photo_url: null }])
      }
    }
  }, [isEdit, idea])

  useEffect(() => {
    const urls = newFiles.map((f) => URL.createObjectURL(f))
    setNewPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [newFiles])

  if (isEdit && ideaLoading) {
    return (
      <div className="page">
        <p className="page-placeholder">Loading...</p>
      </div>
    )
  }

  function handleAddPhotos(e) {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setNewFiles((prev) => [...prev, ...files])
    }
    e.target.value = ''
  }

  function handleRemoveExisting(url) {
    setExistingPhotos((prev) => prev.filter((u) => u !== url))
    setRemovedPhotos((prev) => [...prev, url])
  }

  function handleRemoveNew(index) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleAddProduct() {
    setProducts((prev) => [...prev, { name: '', url: '', photo_url: null }])
  }

  function handleProductChange(index, field, value) {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  function handleRemoveProduct(index) {
    const product = products[index]
    // Track removed photo for cleanup
    if (product.photo_url) {
      setRemovedPhotos((prev) => [...prev, product.photo_url])
    }
    if (product._preview) URL.revokeObjectURL(product._preview)
    setProducts((prev) => prev.filter((_, i) => i !== index))
  }

  function handleProductPhoto(index, e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    // If there was an existing photo, mark it for deletion
    const old = products[index]
    if (old.photo_url) {
      setRemovedPhotos((prev) => [...prev, old.photo_url])
    }
    if (old._preview) URL.revokeObjectURL(old._preview)
    const preview = URL.createObjectURL(file)
    setProducts((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, photo_url: null, _newFile: file, _preview: preview } : p
      )
    )
  }

  function handleRemoveProductPhoto(index) {
    const product = products[index]
    if (product.photo_url) {
      setRemovedPhotos((prev) => [...prev, product.photo_url])
    }
    if (product._preview) URL.revokeObjectURL(product._preview)
    setProducts((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, photo_url: null, _newFile: undefined, _preview: undefined } : p
      )
    )
  }

  function handleProductDragEnter(e, index) {
    e.preventDefault()
    dragCounters.current[index] = (dragCounters.current[index] || 0) + 1
    if (e.dataTransfer.types.includes('Files')) {
      setDragOverProduct(index)
    }
  }

  function handleProductDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function handleProductDragLeave(e, index) {
    e.preventDefault()
    dragCounters.current[index] = (dragCounters.current[index] || 1) - 1
    if (dragCounters.current[index] <= 0) {
      dragCounters.current[index] = 0
      setDragOverProduct((prev) => (prev === index ? null : prev))
    }
  }

  function handleProductDrop(e, index) {
    e.preventDefault()
    dragCounters.current[index] = 0
    setDragOverProduct(null)
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const old = products[index]
    if (old.photo_url) {
      setRemovedPhotos((prev) => [...prev, old.photo_url])
    }
    if (old._preview) URL.revokeObjectURL(old._preview)
    const preview = URL.createObjectURL(file)
    setProducts((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, photo_url: null, _newFile: file, _preview: preview } : p
      )
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    // Delete removed photos (general + product photos)
    if (removedPhotos.length > 0) {
      await deleteLightingPhotos(removedPhotos)
    }

    // Upload general photos
    let photoUrls = [...existingPhotos]
    if (newFiles.length > 0) {
      const { urls, error: uploadError } = await uploadLightingPhotos(newFiles)
      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }
      photoUrls = [...photoUrls, ...urls]
    }

    // Upload product photos and build clean products array
    const cleanProducts = []
    for (const p of products) {
      if (!p.url.trim()) continue
      let photoUrl = p.photo_url || null
      if (p._newFile) {
        const { urls, error: uploadError } = await uploadLightingPhotos([p._newFile])
        if (uploadError) {
          setError(uploadError.message)
          setSaving(false)
          return
        }
        photoUrl = urls[0]
      }
      cleanProducts.push({
        name: p.name,
        url: p.url,
        photo_url: photoUrl,
      })
    }

    const firstUrl = cleanProducts.length > 0 ? cleanProducts[0].url : null

    const fields = {
      space_id: spaceId,
      title,
      notes: notes || null,
      photo_urls: photoUrls.length > 0 ? photoUrls : null,
      product_url: firstUrl,
      products: cleanProducts.length > 0 ? cleanProducts : null,
    }

    if (isEdit) {
      const { error: updateError } = await updateLightingIdea(lightingId, fields)
      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
      navigate(`/spaces/${spaceId}/lighting/${lightingId}`)
    } else {
      const { data, error: createError } = await createLightingIdea(fields)
      if (createError) {
        setError(createError.message)
        setSaving(false)
        return
      }
      navigate(`/spaces/${spaceId}/lighting/${data.id}`)
    }
  }

  return (
    <div className="page">
      <form className="space-form" onSubmit={handleSubmit}>
        <h1>{isEdit ? 'Edit Lighting Idea' : 'New Lighting Idea'}</h1>

        <div className="item-form-photos">
          <span className="space-form-label">Photos</span>
          <div className="item-form-thumbs">
            {existingPhotos.map((url) => (
              <div key={url} className="item-form-thumb">
                <img src={url} alt="" />
                <button
                  type="button"
                  className="item-form-thumb-remove"
                  onClick={() => handleRemoveExisting(url)}
                  aria-label="Remove photo"
                >
                  &times;
                </button>
              </div>
            ))}
            {newPreviews.map((url, i) => (
              <div key={url} className="item-form-thumb">
                <img src={url} alt="" />
                <button
                  type="button"
                  className="item-form-thumb-remove"
                  onClick={() => handleRemoveNew(i)}
                  aria-label="Remove photo"
                >
                  &times;
                </button>
              </div>
            ))}
            <label className="item-form-thumb-add">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddPhotos}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="lighting-title">
            Title <span className="space-form-required">*</span>
          </label>
          <input
            id="lighting-title"
            className="space-form-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Pendant light over island"
            required
          />
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="lighting-notes">
            Notes
          </label>
          <textarea
            id="lighting-notes"
            className="space-form-input space-form-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Details, dimensions, style notes..."
            rows={4}
          />
        </div>

        <div className="lighting-products-section">
          <span className="space-form-label">Products</span>
          {products.map((product, i) => {
            const photoSrc = product._preview || product.photo_url
            const isDragTarget = dragOverProduct === i
            return (
              <div
                key={i}
                className={`lighting-product-card${isDragTarget ? ' lighting-product-card--drag' : ''}`}
                onDragEnter={(e) => handleProductDragEnter(e, i)}
                onDragOver={handleProductDragOver}
                onDragLeave={(e) => handleProductDragLeave(e, i)}
                onDrop={(e) => handleProductDrop(e, i)}
              >
                <div className="lighting-product-photo-col">
                  {photoSrc ? (
                    <div className="lighting-product-photo">
                      <img src={photoSrc} alt="" />
                      <button
                        type="button"
                        className="item-form-thumb-remove"
                        onClick={() => handleRemoveProductPhoto(i)}
                        aria-label="Remove product photo"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <label className="lighting-product-photo-add">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleProductPhoto(i, e)}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>
                <div className="lighting-product-fields">
                  <input
                    className="space-form-input"
                    type="text"
                    value={product.name}
                    onChange={(e) => handleProductChange(i, 'name', e.target.value)}
                    placeholder="Product name"
                  />
                  <input
                    className="space-form-input"
                    type="url"
                    value={product.url}
                    onChange={(e) => handleProductChange(i, 'url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <button
                  type="button"
                  className="lighting-product-remove"
                  onClick={() => handleRemoveProduct(i)}
                  aria-label="Remove product"
                >
                  &times;
                </button>
              </div>
            )
          })}
          <button
            type="button"
            className="lighting-product-add"
            onClick={handleAddProduct}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add product
          </button>
        </div>

        {error && <p className="space-form-error">{error}</p>}

        <div className="space-form-actions">
          <button
            type="button"
            className="space-form-btn space-form-btn--cancel"
            onClick={() =>
              navigate(
                isEdit
                  ? `/spaces/${spaceId}/lighting/${lightingId}`
                  : `/spaces/${spaceId}`
              )
            }
          >
            Cancel
          </button>
          <button
            type="submit"
            className="space-form-btn space-form-btn--save"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add idea'}
          </button>
        </div>
      </form>
    </div>
  )
}
