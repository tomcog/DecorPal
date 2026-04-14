import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useSpace,
  createSpace,
  updateSpace,
  uploadCoverPhoto,
  deleteCoverPhoto,
} from '../hooks/useSpaces'
import '../styles/space-form.css'

const SPACE_TYPES = [
  'bedroom',
  'living room',
  'kitchen',
  'bathroom',
  'dining room',
  'backyard',
  'garage',
  'office',
  'other',
]

export default function SpaceFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { space, loading: spaceLoading } = useSpace(isEdit ? id : null)

  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [styleTags, setStyleTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [budget, setBudget] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const dragCounter = useRef(0)

  function handleDragEnter(e) {
    e.preventDefault()
    dragCounter.current++
    if (e.dataTransfer.types.includes('Files')) setDragOver(true)
  }
  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }
  function handleDragLeave(e) {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setDragOver(false)
  }
  function handleDrop(e) {
    e.preventDefault()
    dragCounter.current = 0
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) setCoverFile(file)
  }

  useEffect(() => {
    if (isEdit && space) {
      setName(space.name || '')
      setType(space.type || '')
      setDescription(space.description || '')
      setCoverPhotoUrl(space.cover_photo_url || null)
      setStyleTags(space.style_tags || [])
      setBudget(space.budget != null ? String(space.budget) : '')
    }
  }, [isEdit, space])

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null)
      return
    }
    const url = URL.createObjectURL(coverFile)
    setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])

  if (isEdit && spaceLoading) {
    return (
      <div className="page">
        <p className="page-placeholder">Loading...</p>
      </div>
    )
  }

  function handleCoverSelect(e) {
    const file = e.target.files?.[0]
    if (file) setCoverFile(file)
  }

  function handleRemoveCover() {
    setCoverFile(null)
    setCoverPreview(null)
    setCoverPhotoUrl(null)
  }

  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  function addTag() {
    const tag = tagInput.trim().replace(/,/g, '')
    if (tag && !styleTags.includes(tag)) {
      setStyleTags([...styleTags, tag])
    }
    setTagInput('')
  }

  function removeTag(tagToRemove) {
    setStyleTags(styleTags.filter((t) => t !== tagToRemove))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    let photoUrl = coverPhotoUrl

    if (coverFile) {
      if (isEdit && space?.cover_photo_url) {
        await deleteCoverPhoto(space.cover_photo_url)
      }
      const { url, error: uploadError } = await uploadCoverPhoto(coverFile)
      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }
      photoUrl = url
    } else if (!coverPhotoUrl && isEdit && space?.cover_photo_url) {
      await deleteCoverPhoto(space.cover_photo_url)
      photoUrl = null
    }

    const fields = {
      name,
      type: type || null,
      description: description || null,
      cover_photo_url: photoUrl,
      style_tags: styleTags.length > 0 ? styleTags : null,
      budget: budget ? Number(budget) : null,
    }

    if (isEdit) {
      const { error: updateError } = await updateSpace(id, fields)
      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
      navigate(`/spaces/${id}`)
    } else {
      const { data, error: createError } = await createSpace(fields)
      if (createError) {
        setError(createError.message)
        setSaving(false)
        return
      }
      navigate(`/spaces/${data.id}`)
    }
  }

  const previewSrc = coverPreview || coverPhotoUrl

  return (
    <div className="page">
      <form className="space-form" onSubmit={handleSubmit}>
        <h1>{isEdit ? 'Edit Space' : 'New Space'}</h1>

        <div
          className={`space-form-cover${dragOver ? ' space-form-cover--drag' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {dragOver && (
            <div className="space-form-cover-drag-overlay">Drop image here</div>
          )}
          {previewSrc ? (
            <div className="space-form-cover-preview">
              <img src={previewSrc} alt="Cover preview" />
              <button
                type="button"
                className="space-form-cover-remove"
                onClick={handleRemoveCover}
                aria-label="Remove cover photo"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ) : (
            <label className="space-form-cover-upload">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Add or drop cover photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                className="sr-only"
              />
            </label>
          )}
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="space-name">
            Name <span className="space-form-required">*</span>
          </label>
          <input
            id="space-name"
            className="space-form-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Master Bedroom"
            required
          />
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="space-type">
            Type
          </label>
          <select
            id="space-type"
            className="space-form-input space-form-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Select a type...</option>
            {SPACE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="space-description">
            Description
          </label>
          <textarea
            id="space-description"
            className="space-form-input space-form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you going for in this space?"
            rows={3}
          />
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="space-tags">
            Style tags
          </label>
          {styleTags.length > 0 && (
            <div className="space-form-tags">
              {styleTags.map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                  <button
                    type="button"
                    className="chip-remove"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove ${tag}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            id="space-tags"
            className="space-form-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            placeholder="Type a tag and press Enter"
          />
        </div>

        <div className="space-form-field">
          <label className="space-form-label" htmlFor="space-budget">
            Budget
          </label>
          <div className="space-form-budget-wrap">
            <span className="space-form-budget-symbol">$</span>
            <input
              id="space-budget"
              className="space-form-input space-form-budget"
              type="number"
              min="0"
              step="any"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        {error && <p className="space-form-error">{error}</p>}

        <div className="space-form-actions">
          <button
            type="button"
            className="space-form-btn space-form-btn--cancel"
            onClick={() => navigate(isEdit ? `/spaces/${id}` : '/')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="space-form-btn space-form-btn--save"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create space'}
          </button>
        </div>
      </form>
    </div>
  )
}
