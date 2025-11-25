'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { Trash2, Search, Loader2, Image as ImageIcon, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageFile {
  name: string
  url: string
  size: number
  modified: number
  type: string
}

interface ImageGalleryProps {
  type: 'product' | 'category' | 'support' | 'pdf'
  onSelect?: (image: ImageFile) => void
  selectMode?: boolean
  className?: string
  refreshTrigger?: number // Trigger refresh when this changes
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export default function ImageGallery({
  type,
  onSelect,
  selectMode = false,
  className = '',
  refreshTrigger
}: ImageGalleryProps) {
  const [images, setImages] = useState<ImageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [deleteStatus, setDeleteStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [page, setPage] = useState(0)
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const deleteButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  useEffect(() => {
    // Reset to page 0 when type changes
    setPage(0)
    setIsSearchMode(false)
    // Use preview mode for initial load (faster)
    loadImages(0, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, refreshTrigger])

  // Load images when page changes (but not in search mode)
  useEffect(() => {
    if (!isSearchMode && page > 0) {
      // Use full pagination when navigating pages
      loadImages(page, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const loadImages = async (pageNum: number = page, usePreview: boolean = false) => {
    try {
      setLoading(true)
      // Use preview mode for initial load (page 0), full pagination otherwise
      const url = usePreview && pageNum === 0
        ? `/api/admin/images/list?type=${type}&preview=1`
        : `/api/admin/images/list?type=${type}&page=${pageNum}&limit=300`
      
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setImages(data.images || [])
        
        // Set pagination info (API always provides it now)
        const newPaginationInfo = {
          total: data.total || 0,
          page: data.page ?? pageNum,
          limit: data.limit || 300,
          totalPages: data.totalPages || 1,
          hasNextPage: data.hasNextPage || false,
          hasPreviousPage: data.hasPreviousPage || false
        }
        setPaginationInfo(newPaginationInfo)
        
        // WCAG: Announce page change to screen readers
        if (pageNum > 0 || !usePreview) {
          setTimeout(() => {
            const statusEl = document.getElementById('pagination-status')
            if (statusEl) {
              statusEl.textContent = `Page ${newPaginationInfo.page + 1} of ${newPaginationInfo.totalPages}`
            }
          }, 100)
        }
      } else {
        // Handle API errors
        setDeleteStatus({ 
          type: 'error', 
          message: data.error || 'Failed to load images. Please try again.' 
        })
      }
    } catch (error) {
      console.error('Error loading images:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (filename: string, currentIndex: number) => {
    // Confirm deletion with accessible dialog
    const confirmed = window.confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)
    if (!confirmed) {
      return
    }

    // Store current filtered images for focus management
    const currentFilteredImages = images.filter(img =>
      img.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    try {
      setDeleting(filename)
      setDeleteStatus(null)
      
      const response = await fetch(
        `/api/admin/images/delete?filename=${encodeURIComponent(filename)}&type=${type}`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (data.success) {
        setDeleteStatus({ type: 'success', message: `Successfully deleted ${filename}` })
        
        // Reload images to ensure consistency
        await loadImages(page, isSearchMode ? false : (page === 0))
        
        if (selectedImage === filename) {
          setSelectedImage(null)
        }
        
        // Focus management: focus on next available item after deletion
        const remainingImages = currentFilteredImages.filter(img => img.name !== filename)
        if (remainingImages.length > 0) {
          const nextIndex = Math.min(currentIndex, remainingImages.length - 1)
          const nextImageName = remainingImages[nextIndex]?.name
          if (nextImageName) {
            // Focus on next delete button after a short delay to allow DOM update
            setTimeout(() => {
              const nextButton = deleteButtonRefs.current.get(nextImageName)
              if (nextButton) {
                nextButton.focus()
              }
            }, 200)
          }
        } else {
          // If no images remain, focus on search input
          setTimeout(() => {
            const searchInput = document.getElementById('image-search') as HTMLInputElement
            if (searchInput) {
              searchInput.focus()
            }
          }, 200)
        }
      } else {
        setDeleteStatus({ type: 'error', message: data.error || 'Failed to delete image' })
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      setDeleteStatus({ type: 'error', message: 'Failed to delete image. Please try again.' })
    } finally {
      setDeleting(null)
      // Clear status message after 5 seconds
      setTimeout(() => setDeleteStatus(null), 5000)
    }
  }

  const handleImageClick = (image: ImageFile) => {
    if (selectMode) {
      setSelectedImage(image.name)
      onSelect?.(image)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Load all images for search (matching legacy behavior)
  // OWASP: Limit to max 10 pages (3000 images) to prevent DoS
  const MAX_SEARCH_PAGES = 10
  const loadAllImages = async () => {
    try {
      setLoading(true)
      // Load first page to get total count
      const firstPageResponse = await fetch(`/api/admin/images/list?type=${type}&page=0&limit=300`)
      const firstPageData = await firstPageResponse.json()
      
      if (firstPageData.success) {
        if (firstPageData.totalPages > 1 && firstPageData.totalPages <= MAX_SEARCH_PAGES) {
          // Load all pages in parallel (limited to prevent DoS)
          const pagePromises = []
          for (let p = 0; p < firstPageData.totalPages; p++) {
            pagePromises.push(
              fetch(`/api/admin/images/list?type=${type}&page=${p}&limit=300`)
                .then(res => {
                  if (!res.ok) {
                    throw new Error(`Failed to load page ${p}`)
                  }
                  return res.json()
                })
                .catch(error => {
                  console.error(`Error loading page ${p}:`, error)
                  return { success: false, images: [] }
                })
            )
          }
          
          const allPagesData = await Promise.all(pagePromises)
          const allImages: ImageFile[] = []
          allPagesData.forEach(pageData => {
            if (pageData.success) {
              allImages.push(...(pageData.images || []))
            }
          })
          
          setImages(allImages)
        } else if (firstPageData.totalPages > MAX_SEARCH_PAGES) {
          // Too many pages - show warning and limit to first MAX_SEARCH_PAGES
          console.warn(`Too many images for search. Limiting to first ${MAX_SEARCH_PAGES * 300} images.`)
          const pagePromises = []
          for (let p = 0; p < MAX_SEARCH_PAGES; p++) {
            pagePromises.push(
              fetch(`/api/admin/images/list?type=${type}&page=${p}&limit=300`)
                .then(res => res.json())
                .catch(() => ({ success: false, images: [] }))
            )
          }
          const limitedPagesData = await Promise.all(pagePromises)
          const limitedImages: ImageFile[] = []
          limitedPagesData.forEach(pageData => {
            if (pageData.success) {
              limitedImages.push(...(pageData.images || []))
            }
          })
          setImages(limitedImages)
        } else {
          // Only one page, use that
          setImages(firstPageData.images || [])
        }
      }
    } catch (error) {
      console.error('Error loading all images:', error)
      setDeleteStatus({ 
        type: 'error', 
        message: 'Failed to load images for search. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle search - when searching, show all results (no pagination like legacy)
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setIsSearchMode(query.length > 0)
    if (query.length > 0) {
      // Load all images for search (matching legacy behavior)
      loadAllImages()
    } else {
      // Return to paginated view
      setPage(0)
      loadImages(0, true) // Use preview mode for faster initial load
    }
  }

  const filteredImages = images.filter(img =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination handlers with WCAG improvements
  const handlePreviousPage = () => {
    if (paginationInfo?.hasPreviousPage) {
      const newPage = Math.max(0, page - 1)
      setPage(newPage)
      // WCAG: Focus management - scroll and focus on gallery
      setTimeout(() => {
        const gallery = document.querySelector('[role="list"][aria-label="Image gallery"]') as HTMLElement
        if (gallery) {
          gallery.focus()
          gallery.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  const handleNextPage = () => {
    if (paginationInfo?.hasNextPage) {
      const newPage = page + 1
      setPage(newPage)
      // WCAG: Focus management - scroll and focus on gallery
      setTimeout(() => {
        const gallery = document.querySelector('[role="list"][aria-label="Image gallery"]') as HTMLElement
        if (gallery) {
          gallery.focus()
          gallery.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  // WCAG: Keyboard shortcuts for pagination
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in input
      if (e.target instanceof HTMLInputElement) return
      
      if (e.key === 'ArrowLeft' && paginationInfo?.hasPreviousPage) {
        e.preventDefault()
        const newPage = Math.max(0, page - 1)
        setPage(newPage)
        setTimeout(() => {
          const gallery = document.querySelector('[role="list"][aria-label="Image gallery"]') as HTMLElement
          if (gallery) {
            gallery.focus()
            gallery.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      } else if (e.key === 'ArrowRight' && paginationInfo?.hasNextPage) {
        e.preventDefault()
        const newPage = page + 1
        setPage(newPage)
        setTimeout(() => {
          const gallery = document.querySelector('[role="list"][aria-label="Image gallery"]') as HTMLElement
          if (gallery) {
            gallery.focus()
            gallery.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      }
    }

    if (!isSearchMode && paginationInfo && paginationInfo.totalPages > 1) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [page, paginationInfo, isSearchMode])

  const handleReturnToListings = () => {
    setSearchQuery('')
    setIsSearchMode(false)
    setPage(0)
    loadImages(0, true) // Use preview mode for faster load
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`} role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading images...</span>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Search and Actions */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <label htmlFor="image-search" className="sr-only">
            Search images
          </label>
          <input
            id="image-search"
            type="text"
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search images by filename"
          />
        </div>
        <Button
          variant="outline"
          onClick={loadImages}
          disabled={loading}
          aria-label={loading ? "Refreshing image list..." : "Refresh image list"}
          aria-busy={loading}
          title="Refresh image list"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          {loading && <span className="sr-only">Refreshing...</span>}
        </Button>
      </div>

      {/* Image Grid */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400" role="status">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
          <p>No images found</p>
          {searchQuery && (
            <p className="text-sm mt-2">
              Try a different search term
            </p>
          )}
        </div>
      ) : (
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" 
          role="list" 
          aria-label="Image gallery"
          tabIndex={-1}
        >
          {filteredImages.map((image, index) => (
            <div
              key={image.name}
              className={`relative group border rounded-lg overflow-hidden bg-white dark:bg-gray-800 ${
                selectMode && selectedImage === image.name
                  ? 'ring-2 ring-blue-500 border-blue-500'
                  : 'border-gray-200 dark:border-gray-700'
              } ${selectMode ? 'cursor-pointer hover:border-blue-400' : ''}`}
              onClick={() => handleImageClick(image)}
              role={selectMode ? "button" : "listitem"}
              tabIndex={selectMode ? 0 : -1}
              aria-label={selectMode ? `Select image ${image.name}` : `Image ${image.name}`}
              aria-pressed={selectMode && selectedImage === image.name ? "true" : "false"}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (selectMode && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  handleImageClick(image)
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
                    alt={`${image.name} - ${formatFileSize(image.size)} - ${formatDate(image.modified)}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  />
                </div>
              )}

              {/* Action Buttons - Always visible in top-right corner */}
              {!selectMode && (
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(image.name, index)
                    }}
                    disabled={deleting === image.name}
                    aria-label={`Delete ${image.name}`}
                    aria-busy={deleting === image.name}
                    className="inline-flex items-center justify-center rounded px-2 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    ref={(el) => {
                      if (el) {
                        deleteButtonRefs.current.set(image.name, el)
                      } else {
                        deleteButtonRefs.current.delete(image.name)
                      }
                    }}
                  >
                    {deleting === image.name ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span className="sr-only">Deleting {image.name}...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">Delete {image.name}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Hover overlay for better visual feedback */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity pointer-events-none" />

              {/* Image Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-xs">
                <p className="truncate font-medium">{image.name}</p>
                <p className="text-gray-300">
                  {formatFileSize(image.size)} • {formatDate(image.modified)}
                </p>
              </div>

              {selectMode && selectedImage === image.name && (
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
            </div>
          ))}
        </div>
      )}

      {/* Delete Status Message */}
      {deleteStatus && (
        <div 
          className={`mt-4 p-3 rounded-lg ${
            deleteStatus.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <p>{deleteStatus.message}</p>
        </div>
      )}

      {/* Pagination Controls (matching legacy FileManager behavior) */}
      {!isSearchMode && paginationInfo && paginationInfo.totalPages > 1 && (
        <nav 
          className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4" 
          role="navigation" 
          aria-label="Pagination navigation"
        >
          <div className="flex items-center gap-2">
            {/* WCAG: Use disabled button instead of span for better accessibility */}
            <Button
              onClick={handlePreviousPage}
              variant="outline"
              size="sm"
              disabled={!paginationInfo.hasPreviousPage}
              aria-label={`Previous page${paginationInfo.hasPreviousPage ? '' : ' (disabled)'}`}
              aria-disabled={!paginationInfo.hasPreviousPage}
            >
              <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
              Previous Page
            </Button>
          </div>
          
          {/* WCAG: Update aria-live when page changes */}
          <div 
            className="text-sm text-gray-600 dark:text-gray-400" 
            role="status" 
            aria-live="polite"
            aria-atomic="true"
            id="pagination-status"
          >
            Page {paginationInfo.page + 1} of {paginationInfo.totalPages}
            {paginationInfo.total > 0 && (
              <span className="ml-2" aria-label={`Total of ${paginationInfo.total} images`}>
                ({paginationInfo.total} total images)
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* WCAG: Use disabled button instead of span for better accessibility */}
            <Button
              onClick={handleNextPage}
              variant="outline"
              size="sm"
              disabled={!paginationInfo.hasNextPage}
              aria-label={`Next page${paginationInfo.hasNextPage ? '' : ' (disabled)'}`}
              aria-disabled={!paginationInfo.hasNextPage}
            >
              Next Page
              <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
            </Button>
          </div>
          
          {/* WCAG: Keyboard shortcut hint for screen readers */}
          <div className="sr-only" aria-live="polite">
            Use left and right arrow keys to navigate pages
          </div>
        </nav>
      )}

      {/* Return to Listings (when in search mode, matching legacy) */}
      {isSearchMode && (
        <div className="mt-6 flex items-center justify-center border-t border-gray-200 dark:border-gray-700 pt-4">
          <Button
            onClick={handleReturnToListings}
            variant="outline"
            size="sm"
            aria-label="Return to paginated listings"
          >
            <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
            Return to Listings
          </Button>
        </div>
      )}

      {/* Image Count */}
      {filteredImages.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center" role="status" aria-live="polite">
          {isSearchMode ? (
            <>Showing {filteredImages.length} {filteredImages.length === 1 ? 'result' : 'results'}</>
          ) : (
            <>Showing {filteredImages.length} of {paginationInfo?.total || images.length} images</>
          )}
        </div>
      )}
    </div>
  )
}

