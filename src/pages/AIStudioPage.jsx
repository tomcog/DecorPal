import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  generateVisualization,
  saveRender,
  uploadRenderImage,
  fileToDataUrl,
} from '../hooks/useStudio'
import { useSpaces } from '../hooks/useSpaces'
import AssetPicker from '../components/AssetPicker'
import '../styles/studio.css'

const ASSET_ICONS = {
  palette: '\u25CF',
  item: '\u25A0',
  lighting: '\u2600',
  render: '\u25A3',
}

export default function AIStudioPage() {
  const navigate = useNavigate()
  const { spaces } = useSpaces()
  const fileInputRef = useRef(null)

  const [promptText, setPromptText] = useState('')
  const [attachments, setAttachments] = useState([])
  const [photoFiles, setPhotoFiles] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])

  const [showPicker, setShowPicker] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [genError, setGenError] = useState(null)

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveSpaceId, setSaveSpaceId] = useState('')
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const hasUnsavedRender = generatedImage && !saving

  // Photo previews
  useEffect(() => {
    const urls = photoFiles.map((f) => URL.createObjectURL(f))
    setPhotoPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [photoFiles])

  // Leave confirmation
  useEffect(() => {
    if (!hasUnsavedRender) return
    function handleBeforeUnload(e) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedRender])

  // Block navigation with React Router
  const blockRef = useRef(null)
  useEffect(() => {
    if (!hasUnsavedRender) return
    const handler = (e) => {
      if (!hasUnsavedRender) return
      if (!window.confirm('Leave without saving this render?')) {
        e.preventDefault()
      }
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [hasUnsavedRender])

  const hasContent = promptText.trim() || attachments.length > 0 || photoFiles.length > 0

  function handleAddPhotos(e) {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setPhotoFiles((prev) => [...prev, ...files])
    }
    e.target.value = ''
  }

  function handleRemovePhoto(index) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleRemoveAttachment(id) {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  function handlePickerConfirm(selected) {
    setAttachments((prev) => [...prev, ...selected])
    setShowPicker(false)
  }

  function handleClearAll() {
    setPromptText('')
    setAttachments([])
    setPhotoFiles([])
    setGeneratedImage(null)
    setGenError(null)
  }

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    setGenError(null)
    setGeneratedImage(null)

    const photoDataUrls = await Promise.all(photoFiles.map(fileToDataUrl))

    const { imageUrl, error } = await generateVisualization({
      promptText,
      attachments,
      photoDataUrls,
    })

    setGenerating(false)

    if (error) {
      setGenError(error.message)
    } else if (imageUrl) {
      setGeneratedImage(imageUrl)
    }
  }, [promptText, attachments, photoFiles])

  function handleRegenerate() {
    handleGenerate()
  }

  function handleOpenSave() {
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    setSaveName(`Render · ${today}`)
    setSaveSpaceId(spaces.length > 0 ? spaces[0].id : '')
    setSaveError(null)
    setShowSaveModal(true)
  }

  async function handleSave() {
    if (!saveSpaceId || !saveName) return
    setSaving(true)
    setSaveError(null)

    const { url, error: uploadError } = await uploadRenderImage(generatedImage)
    if (uploadError) {
      setSaveError(uploadError.message)
      setSaving(false)
      return
    }

    const promptMetadata = {
      attachments: attachments.map((a) => ({ type: a.type, id: a.id, name: a.name })),
      had_photos: photoFiles.length > 0,
    }

    const { data, error: saveErr } = await saveRender({
      spaceId: saveSpaceId,
      name: saveName,
      imageUrl: url,
      promptText,
      promptMetadata,
    })

    if (saveErr) {
      setSaveError(saveErr.message)
      setSaving(false)
      return
    }

    setGeneratedImage(null)
    setShowSaveModal(false)
    navigate(`/spaces/${saveSpaceId}`)
  }

  const existingAttachmentIds = new Set(attachments.map((a) => a.id))

  return (
    <div className="page studio">
      <h1>AI Studio</h1>

      {/* Prompt composer */}
      <div className="studio-composer">
        <textarea
          className="studio-textarea"
          placeholder="Describe what you're going for..."
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows={5}
        />

        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="studio-chips">
            {attachments.map((a) => (
              <span key={a.id} className="studio-chip">
                <span className="studio-chip-icon">{ASSET_ICONS[a.type]}</span>
                <span className="studio-chip-name">{a.name}</span>
                <button
                  className="studio-chip-remove"
                  onClick={() => handleRemoveAttachment(a.id)}
                  aria-label={`Remove ${a.name}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Photo uploads */}
        {photoPreviews.length > 0 && (
          <div className="item-form-thumbs">
            {photoPreviews.map((url, i) => (
              <div key={url} className="item-form-thumb">
                <img src={url} alt="" />
                <button
                  className="item-form-thumb-remove"
                  onClick={() => handleRemovePhoto(i)}
                  aria-label="Remove photo"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="studio-actions">
          <button
            className="studio-action-btn"
            onClick={() => setShowPicker(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
            Attach from spaces
          </button>
          <button
            className="studio-action-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Upload photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleAddPhotos}
            className="sr-only"
          />
        </div>

        <div className="studio-submit-row">
          {hasContent && (
            <button
              className="studio-clear-btn"
              onClick={handleClearAll}
            >
              Clear all
            </button>
          )}
          <button
            className="studio-generate-btn"
            onClick={handleGenerate}
            disabled={!hasContent || generating}
          >
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Error */}
      {genError && (
        <div className="studio-error">
          <p>{genError}</p>
        </div>
      )}

      {/* Generated image */}
      {generatedImage && !generating && (
        <div className="studio-result">
          <img
            src={generatedImage}
            alt="Generated visualization"
            className="studio-result-img"
          />
          <div className="studio-result-actions">
            <button
              className="space-form-btn space-form-btn--cancel"
              onClick={handleRegenerate}
            >
              Regenerate
            </button>
            <button
              className="space-form-btn space-form-btn--save"
              onClick={handleOpenSave}
            >
              Save to space
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {generating && (
        <div className="studio-loading-overlay">
          <div className="studio-loading-spinner" />
          <p className="studio-loading-text">Creating your visualization...</p>
        </div>
      )}

      {/* Asset picker */}
      {showPicker && (
        <AssetPicker
          onConfirm={handlePickerConfirm}
          onClose={() => setShowPicker(false)}
          existingIds={existingAttachmentIds}
        />
      )}

      {/* Save modal */}
      {showSaveModal && (
        <div className="space-detail-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="space-detail-confirm studio-save-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="space-detail-confirm-title">Save render</h3>

            <div className="space-form-field">
              <label className="space-form-label" htmlFor="save-space">
                Space
              </label>
              <select
                id="save-space"
                className="space-form-input space-form-select"
                value={saveSpaceId}
                onChange={(e) => setSaveSpaceId(e.target.value)}
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-form-field">
              <label className="space-form-label" htmlFor="save-name">
                Name
              </label>
              <input
                id="save-name"
                className="space-form-input"
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
            </div>

            {saveError && <p className="space-form-error">{saveError}</p>}

            <div className="space-detail-confirm-actions">
              <button
                className="space-form-btn space-form-btn--cancel"
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </button>
              <button
                className="space-form-btn space-form-btn--save"
                onClick={handleSave}
                disabled={saving || !saveSpaceId}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
