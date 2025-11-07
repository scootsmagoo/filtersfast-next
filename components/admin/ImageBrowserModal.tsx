'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { X, Search, Image as ImageIcon, Loader2 } from 'lucide-react'

interface ImageFile {
  name: string
  url: string
  size: number
  modified: number
  type: string
}

interface ImageBrowserModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (image: ImageFile) => void
  type: 'product' | 'category' | 'support' | 'pdf'
  title?: string
}

export default function ImageBrowserModal({
  isOpen,
  onClose,
  onSelect,
  type,
  title = 'Select Image'
}: ImageBrowserModalProps) {
  const [images, setImages] = useState<ImageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadImages()
    }
  }, [isOpen, type])

  const loadImages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/images/list?type=${type}`)
      const data = await response.json()

      if (data.success) {
        setImages(data.images || [])
      }
    } catch (error) {
      console.error('Error loading images:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = () => {
    const image = images.find(img => img.name === selectedImage)
    if (image) {
      onSelect(image)
      onClose()
    }
  }

  const filteredImages = images.filter(img =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  // Handle ESC key to close modal and focus management
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    // Focus trap: focus search input when modal opens
    const searchInput = document.getElementById('modal-image-search') as HTMLElement
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 100)
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <label htmlFor="modal-image-search" className="sr-only">
                Search images
              </label>
              <input
                id="modal-image-search"
                type="text"
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search images by filename"
              />
            </div>
          </div>

          {/* Image Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" aria-hidden="true" />
                <span className="sr-only">Loading images...</span>
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400" role="status">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                <p>No images found</p>
                {searchQuery && (
                  <p className="text-sm mt-2">Try a different search term</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4" role="list" aria-label="Image gallery">
                {filteredImages.map((image) => (
                  <div
                    key={image.name}
                    className={`relative group border rounded-lg overflow-hidden bg-white dark:bg-gray-800 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      selectedImage === image.name
                        ? 'ring-2 ring-blue-500 border-blue-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                    }`}
                    onClick={() => setSelectedImage(image.name)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select image ${image.name}`}
                    aria-pressed={selectedImage === image.name ? "true" : "false"}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedImage(image.name)
                      }
                    }}
                  >
                    {type === 'pdf' ? (
                      <div className="aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                        <div className="text-center p-4">
                          <div className="text-4xl mb-2">📄</div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {image.name}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square relative bg-gray-100 dark:bg-gray-700">
                        <Image
                          src={image.url}
                          alt={`Image: ${image.name}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 33vw, (max-width: 1200px) 20vw, 200px"
                        />
                      </div>
                    )}

                    {selectedImage === image.name && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Image Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-xs">
                      <p className="truncate">{image.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredImages.length} of {images.length} images
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} aria-label="Cancel image selection">
                Cancel
              </Button>
              <Button
                onClick={handleSelect}
                disabled={!selectedImage}
                aria-label={selectedImage ? `Select image ${selectedImage}` : "Select an image first"}
              >
                Select Image
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

