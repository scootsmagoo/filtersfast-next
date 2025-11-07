'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'
import ImageUploader from '@/components/admin/ImageUploader'
import ImageGallery from '@/components/admin/ImageGallery'
import { Image, Upload, Check } from 'lucide-react'

type ImageType = 'product' | 'category' | 'support' | 'pdf'

const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  product: 'Product Images',
  category: 'Category Images',
  support: 'Support Images',
  pdf: 'PDFs'
}

export default function ImageManagementPage() {
  const [activeTab, setActiveTab] = useState<ImageType>('product')
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [galleryRefreshTrigger, setGalleryRefreshTrigger] = useState(0)

  const handleUploadSuccess = (filename: string, url: string) => {
    setUploadSuccess(filename)
    // Refresh gallery after a short delay
    setTimeout(() => {
      setUploadSuccess(null)
      setGalleryRefreshTrigger(prev => prev + 1)
    }, 1500)
  }

  const handleUploadError = (error: string) => {
    // Note: Using alert() for simplicity. In production, consider a toast notification component
    window.alert(`Upload failed: ${error}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminBreadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Image Management', href: '/admin/images' }
        ]}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Image Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload and manage product images, category images, support images, and PDFs
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8" role="tablist" aria-label="Image type selection">
          {(['product', 'category', 'support', 'pdf'] as ImageType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              role="tab"
              aria-selected={activeTab === type}
              aria-controls={`tab-panel-${type}`}
              id={`tab-${type}`}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t ${
                activeTab === type
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {IMAGE_TYPE_LABELS[type]}
            </button>
          ))}
        </nav>
      </div>

      {/* Success Message */}
      {uploadSuccess && (
        <div 
          className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
          <div>
            <p className="text-green-800 dark:text-green-200 font-medium">
              Successfully uploaded {uploadSuccess}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              The image gallery will refresh automatically
            </p>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <Card className="mb-6">
        <div className="p-6" role="tabpanel" id={`tab-panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Upload {IMAGE_TYPE_LABELS[activeTab]}
            </h2>
          </div>
          <ImageUploader
            type={activeTab}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            maxSize={
              activeTab === 'pdf' 
                ? 20 * 1024 * 1024 
                : activeTab === 'product' 
                ? 10 * 1024 * 1024 
                : 5 * 1024 * 1024
            }
          />
        </div>
      </Card>

      {/* Gallery Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Browse {IMAGE_TYPE_LABELS[activeTab]}
            </h2>
          </div>
          <ImageGallery type={activeTab} refreshTrigger={galleryRefreshTrigger} />
        </div>
      </Card>
    </div>
  )
}

