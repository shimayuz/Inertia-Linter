import { useState, useCallback } from 'react'
import type { ImageData } from '../types/vision.ts'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])

interface UseImageUploadResult {
  readonly imageData: ImageData | null
  readonly previewUrl: string | null
  readonly error: string | null
  readonly handleFiles: (files: FileList) => void
  readonly clearImage: () => void
}

function extractBase64(dataUrl: string): string {
  const idx = dataUrl.indexOf(';base64,')
  return idx >= 0 ? dataUrl.slice(idx + 8) : dataUrl
}

function getMediaType(fileType: string): ImageData['mediaType'] {
  if (fileType === 'image/png') return 'image/png'
  if (fileType === 'image/jpeg') return 'image/jpeg'
  if (fileType === 'image/webp') return 'image/webp'
  if (fileType === 'image/gif') return 'image/gif'
  return 'image/png'
}

export function useImageUpload(): UseImageUploadResult {
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const clearImage = useCallback(() => {
    setImageData(null)
    setPreviewUrl(null)
    setError(null)
  }, [])

  const handleFiles = useCallback((files: FileList) => {
    const file = files[0]
    if (!file) {
      setError('No file selected')
      return
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      setError('Unsupported file type. Use PNG, JPEG, WebP, or GIF.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 5MB.')
      return
    }

    setError(null)

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = extractBase64(dataUrl)
      const mediaType = getMediaType(file.type)

      setImageData({
        base64,
        mediaType,
        fileName: file.name,
        fileSizeBytes: file.size,
      })
      setPreviewUrl(dataUrl)
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsDataURL(file)
  }, [])

  return { imageData, previewUrl, error, handleFiles, clearImage }
}
