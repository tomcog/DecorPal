import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useRenders } from '../hooks/useRenders'
import { uploadRenderImage, saveRender, fileToDataUrl } from '../hooks/useStudio'
import '../styles/renders.css'

export default function RendersTab({ spaceId }) {
  const { renders, loading, refetch } = useRenders(spaceId)
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const dragCounter = useRef(0)

  const uploadFiles = useCallback(async (files) => {
    if (files.length === 0) return
    setUploading(true)
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      const dataUrl = await fileToDataUrl(file)
      const { url, error: uploadError } = await uploadRenderImage(dataUrl)
      if (uploadError || !url) continue
      const today = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      await saveRender({
        spaceId,
        name: file.name.replace(/\.[^.]+$/, '') || `Image · ${today}`,
        imageUrl: url,
        promptText: null,
        promptMetadata: null,
      })
    }
    setUploading(false)
    refetch()
  }, [spaceId, refetch])

  function handleFileInput(e) {
    uploadFiles(Array.from(e.target.files || []))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDragEnter(e) {
    e.preventDefault()
    dragCounter.current++
    if (e.dataTransfer.types.includes('Files')) {
      setDragOver(true)
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function handleDragLeave(e) {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragOver(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    dragCounter.current = 0
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length > 0) {
      uploadFiles(files)
    }
  }

  const dropProps = {
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  }

  if (loading) {
    return <p className="page-placeholder">Loading images...</p>
  }

  if (renders.length === 0) {
    return (
      <div
        className={`renders-drop-zone${dragOver ? ' renders-drop-zone--active' : ''}`}
        {...dropProps}
      >
        <div className="renders-empty">
          <div className="renders-empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <h3 className="renders-empty-title">No images yet</h3>
          <p className="renders-empty-text">
            {dragOver
              ? 'Drop images here to upload'
              : 'Drag and drop images here, or use the buttons below.'}
          </p>
          <div className="renders-empty-actions">
            <button
              className="renders-empty-btn renders-empty-btn--upload"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload images'}
            </button>
            <Link to="/ai-studio" className="renders-empty-btn">
              Open AI Studio
            </Link>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="sr-only"
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`renders-drop-zone${dragOver ? ' renders-drop-zone--active' : ''}`}
      {...dropProps}
    >
      {dragOver && (
        <div className="renders-drop-overlay">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>Drop images to upload</span>
        </div>
      )}
      <div className="renders-tab-header">
        <button
          className="renders-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="sr-only"
        />
      </div>
      <div className="renders-grid">
        {renders.map((render) => (
          <Link
            key={render.id}
            to={`/spaces/${spaceId}/renders/${render.id}`}
            className="render-card"
          >
            <div className="render-card-img-wrap">
              {render.image_url ? (
                <img
                  src={render.image_url}
                  alt={render.name}
                  className="render-card-img"
                />
              ) : (
                <div className="render-card-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
              {render.prompt_text && (
                <span className="render-card-badge">AI</span>
              )}
            </div>
            <div className="render-card-body">
              <span className="render-card-name">{render.name || 'Untitled'}</span>
              <span className="render-card-date">
                {new Date(render.created_at).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
