'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import Button from '@/components/ui/Button'
import { Upload, X, Loader2, Check } from 'lucide-react'

interface ImageUploaderProps {
  type: 'product' | 'category' | 'support' | 'pdf'
  onUploadSuccess?: (filename: string, url: string) => void
  onUploadError?: (error: string) => void
  maxSize?: number
  className?: string
}

export default function ImageUploader({
  type,
  onUploadSuccess,
  onUploadError,
  maxSize = 10 * 1024 * 1024,
  className = ''
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await handleFileUpload(files[0])
    }
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    // Validate file size
    if (file.size > maxSize) {
      const error = `File is too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`
      onUploadError?.(error)
      return
    }

    setUploading(true)
    setUploadedFile(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/admin/images/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setUploadedFile(data.filename)
      onUploadSuccess?.(data.filename, data.url)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      onUploadError?.(error.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const getAcceptedTypes = () => {
    if (type === 'pdf') {
      return '.pdf'
    }
    return '.jpg,.jpeg,.png,.gif,.webp'
  }

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        role="region"
        aria-label="File upload area"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptedTypes()}
          onChange={handleFileSelect}
          className="hidden"
          id={`file-upload-${type}`}
          disabled={uploading}
          aria-label={`Upload ${type === 'pdf' ? 'PDF' : 'image'} file`}
          aria-describedby={`file-upload-desc-${type}`}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" aria-hidden="true" />
            <p className="text-gray-600 dark:text-gray-400">Uploading...</p>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center" aria-hidden="true">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-green-600 dark:text-green-400 font-medium">
                Uploaded successfully!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {uploadedFile}
              </p>
            </div>
            <Button
              onClick={() => {
                setUploadedFile(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
              variant="outline"
              size="sm"
              aria-label="Upload another file"
            >
              Upload Another
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Upload className="w-12 h-12 text-gray-400" aria-hidden="true" />
            <div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Drag and drop {type === 'pdf' ? 'a PDF' : 'an image'} here
              </p>
              <p id={`file-upload-desc-${type}`} className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                or click to browse
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              aria-label={`Select ${type === 'pdf' ? 'PDF' : 'image'} file to upload`}
            >
              Select File
            </Button>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Max size: {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

