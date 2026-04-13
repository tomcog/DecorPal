/**
 * Extract dominant colors from an image using canvas pixel sampling
 * and median-cut color quantization.
 */

export function extractColorsFromImageUrl(imageUrl, count = 6) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        resolve(extractColorsFromImage(img, count))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}

function extractColorsFromImage(img, count) {
  const canvas = document.createElement('canvas')
  // Sample at a small size for performance
  const size = 64
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, size, size)

  const imageData = ctx.getImageData(0, 0, size, size)
  const pixels = []

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i]
    const g = imageData.data[i + 1]
    const b = imageData.data[i + 2]
    const a = imageData.data[i + 3]
    // Skip transparent pixels
    if (a < 128) continue
    pixels.push([r, g, b])
  }

  if (pixels.length === 0) return ['#000000']

  const buckets = medianCut(pixels, count)
  const colors = buckets
    .map((bucket) => averageColor(bucket))
    .sort((a, b) => luminance(a) - luminance(b))
    .map(([r, g, b]) => rgbToHex(r, g, b))

  // Deduplicate very similar colors
  const unique = [colors[0]]
  for (let i = 1; i < colors.length; i++) {
    const isDuplicate = unique.some(
      (c) => colorDistance(hexToRgb(c), hexToRgb(colors[i])) < 30
    )
    if (!isDuplicate) unique.push(colors[i])
  }

  return unique.slice(0, count)
}

function medianCut(pixels, depth) {
  if (depth <= 1 || pixels.length <= 1) return [pixels]

  // Find channel with greatest range
  let maxRange = -1
  let splitChannel = 0
  for (let ch = 0; ch < 3; ch++) {
    const values = pixels.map((p) => p[ch])
    const range = Math.max(...values) - Math.min(...values)
    if (range > maxRange) {
      maxRange = range
      splitChannel = ch
    }
  }

  pixels.sort((a, b) => a[splitChannel] - b[splitChannel])
  const mid = Math.floor(pixels.length / 2)

  return [
    ...medianCut(pixels.slice(0, mid), depth - 1),
    ...medianCut(pixels.slice(mid), depth - 1),
  ]
}

function averageColor(pixels) {
  if (pixels.length === 0) return [0, 0, 0]
  let r = 0, g = 0, b = 0
  for (const [pr, pg, pb] of pixels) {
    r += pr
    g += pg
    b += pb
  }
  const n = pixels.length
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)]
}

function luminance([r, g, b]) {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function colorDistance(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)
}

/**
 * Pick the color at a specific point on a canvas.
 * x, y are in CSS pixel coordinates relative to the canvas element.
 */
export function pickColorFromCanvas(canvas, x, y) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  // Clamp to canvas bounds to avoid out-of-range reads
  const px = Math.max(0, Math.min(Math.round(x), canvas.width - 1))
  const py = Math.max(0, Math.min(Math.round(y), canvas.height - 1))
  const [r, g, b] = ctx.getImageData(px, py, 1, 1).data
  return rgbToHex(r, g, b)
}
