import { useRef, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { ExtractionResult } from '../types/vision.ts'
import { useImageUpload } from '../hooks/useImageUpload.ts'
import { useVisionExtraction } from '../hooks/useVisionExtraction.ts'
import { ImageConsentDialog, hasImageConsent, storeImageConsent } from './ImageConsentDialog.tsx'

interface ImageUploadProps {
  readonly onExtracted: (result: ExtractionResult) => void
}

export function ImageUpload({ onExtracted }: ImageUploadProps) {
  const { t } = useTranslation()
  const { imageData, previewUrl, error: uploadError, handleFiles, clearImage } = useImageUpload()
  const { extract, result, isExtracting, error: extractionError } = useVisionExtraction()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    if (result) {
      onExtracted(result)
    }
  }, [result, onExtracted])

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const files = e.clipboardData?.files
      if (files && files.length > 0) {
        e.preventDefault()
        handleFiles(files)
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const handleExtract = useCallback(() => {
    if (!imageData) return
    if (!hasImageConsent()) {
      setShowConsent(true)
      return
    }
    void extract(imageData)
  }, [imageData, extract])

  const handleConsentAccept = useCallback(() => {
    storeImageConsent()
    setShowConsent(false)
    if (imageData) {
      void extract(imageData)
    }
  }, [imageData, extract])

  const handleConsentDecline = useCallback(() => {
    setShowConsent(false)
  }, [])

  const handleClear = useCallback(() => {
    clearImage()
  }, [clearImage])

  const error = uploadError ?? extractionError

  if (isExtracting) {
    return (
      <div className="bg-white rounded-lg border border-teal-100 p-5 mb-3 text-center">
        <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-teal-200 border-t-teal-600" />
        <p className="text-sm font-medium text-teal-700">{t('image.extractingData')}</p>
        <p className="text-xs text-teal-400 mt-1">{t('image.analyzingVision')}</p>
      </div>
    )
  }

  if (previewUrl && imageData) {
    return (
      <>
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
          <div className="mb-3 flex items-center justify-center bg-gray-50 rounded-lg p-2">
            <img
              src={previewUrl}
              alt="Uploaded medical record preview"
              className="max-h-36 rounded object-contain"
            />
          </div>
          <p className="mb-3 text-center text-xs text-gray-400">
            {imageData.fileName} ({Math.round(imageData.fileSizeBytes / 1024)}KB)
          </p>
          {error && (
            <p className="mb-3 text-center text-xs text-red-500">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExtract}
              className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors"
            >
              {t('image.extractData')}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              {t('image.clear')}
            </button>
          </div>
        </div>
        <ImageConsentDialog
          isOpen={showConsent}
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
      </>
    )
  }

  return (
    <>
      <div
        className={`cursor-pointer rounded-lg border-2 border-dashed p-5 mb-3 text-center transition-all duration-200 ${
          isDragging
            ? 'border-teal-400 bg-teal-50/80 scale-[1.01]'
            : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/30'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-teal-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-600">
          {t('image.dropOrPaste')}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {t('image.fileFormats')}
        </p>
        {error && (
          <p className="mt-2 text-xs text-red-500">{error}</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <ImageConsentDialog
        isOpen={showConsent}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    </>
  )
}
