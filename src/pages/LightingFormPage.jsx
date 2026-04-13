import { useState, useEffect } from 'react'
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
  const [productUrl, setProductUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isEdit && idea) {
      setTitle(idea.title || '')
      setNotes(idea.notes || '')
      setExistingPhotos(idea.photo_urls || [])
      setProductUrl(idea.product_url || '')
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

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    if (removedPhotos.length > 0) {
      await deleteLightingPhotos(removedPhotos)
    }

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

    const fields = {
      space_id: spaceId,
      title,
      notes: notes || null,
      photo_urls: photoUrls.length > 0 ? photoUrls : null,
      product_url: productUrl || null,
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

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="lighting-product-url">
            Product URL
          </label>
          <input
            id="lighting-product-url"
            className="space-form-input"
            type="url"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="https://..."
          />
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
