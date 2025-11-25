'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import Button from '@/components/ui/Button'
import { Upload, Loader2, Check, AlertCircle } from 'lucide-react'

interface ImageUploaderProps {
  type: 'product' | 'category' | 'support' | 'pdf'
  onUploadSuccess?: (filename: string, url: string) => void
  onUploadError?: (error: string) => void
  maxSize?: number
  maxFiles?: number // OWASP: Limit number of files to prevent DoS
  className?: string
}

interface FileUploadStatus {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  filename?: string
  url?: string
  error?: string
}

export default function ImageUploader({
  type,
  onUploadSuccess,
  onUploadError,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 50, // OWASP: Default limit to prevent DoS attacks
  className = ''
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadStatuses, setUploadStatuses] = useState<FileUploadStatus[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null) // WCAG: Better error handling
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

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

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await handleFilesUpload(files)
    }
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await handleFilesUpload(Array.from(files))
    }
  }

  const handleFilesUpload = async (files: File[]) => {
    // OWASP: Validate file count to prevent DoS
    if (files.length > maxFiles) {
      const error = `Too many files. Maximum ${maxFiles} files allowed per upload.`
      setErrorMessage(error)
      onUploadError?.(error)
      // WCAG: Announce error to screen readers
      setTimeout(() => setErrorMessage(null), 5000)
      return
    }

    // Validate all files first
    const validFiles: File[] = []
    const invalidFiles: { file: File; error: string }[] = []

    files.forEach(file => {
      // OWASP: Additional validation - check for empty files
      if (file.size === 0) {
        invalidFiles.push({
          file,
          error: 'File is empty'
        })
      } else if (file.size > maxSize) {
        invalidFiles.push({
          file,
          error: `File is too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`
        })
      } else {
        validFiles.push(file)
      }
    })

    // Initialize upload statuses for all files
    const initialStatuses: FileUploadStatus[] = [
      ...validFiles.map(file => ({ 
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file, 
        status: 'pending' as const 
      })),
      ...invalidFiles.map(({ file, error }) => ({ 
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file, 
        status: 'error' as const, 
        error 
      }))
    ]
    setUploadStatuses(initialStatuses)
    setUploading(true)

    // Report errors for invalid files immediately
    invalidFiles.forEach(({ error }) => {
      onUploadError?.(error)
    })

    // Upload valid files sequentially (like legacy code)
    for (const file of validFiles) {
      await uploadSingleFile(file)
    }

    setUploading(false)

    // Reset file input after all uploads complete
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadSingleFile = async (file: File) => {
    // Find the status entry for this file
    let statusId: string | null = null
    setUploadStatuses(prev => {
      const updated = [...prev]
      const index = updated.findIndex(s => s.file === file && s.status === 'pending')
      if (index !== -1) {
        statusId = updated[index].id
        updated[index] = { ...updated[index], status: 'uploading' }
      }
      return updated
    })

    if (!statusId) return

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

      // Update status to success
      setUploadStatuses(prev => {
        const updated = [...prev]
        const index = updated.findIndex(s => s.id === statusId)
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            status: 'success',
            filename: data.filename,
            url: data.url
          }
        }
        return updated
      })

      onUploadSuccess?.(data.filename, data.url)
    } catch (error: any) {
      console.error('Upload error:', error)
      // OWASP: Sanitize error message to prevent information leakage
      let errorMessage = 'Failed to upload image'
      if (error.message) {
        // Only include safe error messages, filter out internal details
        const safeError = error.message.toLowerCase()
        if (safeError.includes('too large') || safeError.includes('size')) {
          errorMessage = `File is too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`
        } else if (safeError.includes('type') || safeError.includes('extension')) {
          errorMessage = 'Invalid file type. Please check the file format.'
        } else if (safeError.includes('rate limit') || safeError.includes('too many')) {
          errorMessage = 'Too many upload requests. Please try again later.'
        } else {
          // Generic error for security - don't expose internal details
          errorMessage = 'Upload failed. Please check the file and try again.'
        }
      }
      
      // Update status to error
      setUploadStatuses(prev => {
        const updated = [...prev]
        const index = updated.findIndex(s => s.id === statusId)
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            status: 'error',
            error: errorMessage
          }
        }
        return updated
      })

      onUploadError?.(`${file.name}: ${errorMessage}`)
    }
  }

  const clearUploadStatuses = () => {
    setUploadStatuses([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getAcceptedTypes = () => {
    if (type === 'pdf') {
      return '.pdf'
    }
    return '.jpg,.jpeg,.png,.gif,.webp'
  }

  // WCAG: Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={className}>
      {/* WCAG: Error announcement for screen readers and visual users */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <p>{errorMessage}</p>
          </div>
        </div>
      )}
      <div
        ref={dropZoneRef}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        role="region"
        aria-label="File upload area"
        tabIndex={uploading ? -1 : 0}
        aria-describedby={`file-upload-desc-${type}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptedTypes()}
          onChange={handleFileSelect}
          className="hidden"
          id={`file-upload-${type}`}
          multiple
          disabled={uploading}
          aria-label={`Upload ${type === 'pdf' ? 'PDF' : 'image'} files`}
          aria-describedby={`file-upload-desc-${type}`}
        />

        {uploadStatuses.length > 0 ? (
          <div className="flex flex-col gap-4">
            {/* WCAG: Status region with appropriate live region */}
            <div 
              role="status" 
              aria-live="polite" 
              aria-atomic="false"
              aria-label="Upload status for files"
              className="space-y-2"
            >
              {uploadStatuses.map((status) => (
                <div
                  key={status.id}
                  role="status"
                  aria-live={status.status === 'error' ? 'assertive' : 'polite'}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    status.status === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : status.status === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : status.status === 'uploading'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {status.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" aria-hidden="true" />
                  )}
                  {status.status === 'success' && (
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
                  )}
                  {status.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" aria-hidden="true" />
                  )}
                  {status.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {/* WCAG: Better semantic structure with proper labels */}
                    <p 
                      className={`text-sm font-medium truncate ${
                        status.status === 'success'
                          ? 'text-green-800 dark:text-green-200'
                          : status.status === 'error'
                          ? 'text-red-800 dark:text-red-200'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                      aria-label={`File ${status.file.name}, status: ${status.status}`}
                    >
                      {status.file.name}
                    </p>
                    {status.status === 'success' && status.filename && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1" aria-hidden="true">
                        Uploaded as: {status.filename}
                      </p>
                    )}
                    {status.status === 'error' && status.error && (
                      <p 
                        className="text-xs text-red-600 dark:text-red-400 mt-1"
                        role="alert"
                        aria-live="assertive"
                      >
                        Error: {status.error}
                      </p>
                    )}
                    {status.status === 'pending' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true">
                        Waiting to upload...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {!uploading && (
              <Button
                onClick={clearUploadStatuses}
                variant="outline"
                size="sm"
                aria-label="Upload more files"
                className="w-full"
              >
                Upload More Files
              </Button>
            )}
          </div>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" aria-hidden="true" />
            <p className="text-gray-600 dark:text-gray-400">Uploading files...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Upload className="w-12 h-12 text-gray-400" aria-hidden="true" />
            <div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Drag and drop {type === 'pdf' ? 'PDF files' : 'images'} here
              </p>
              <p id={`file-upload-desc-${type}`} className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                or click to browse (you can select multiple files)
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              aria-label={`Select ${type === 'pdf' ? 'PDF' : 'image'} files to upload`}
            >
              Select Files
            </Button>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Max size: {Math.round(maxSize / 1024 / 1024)}MB per file. Maximum {maxFiles} files per upload.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

