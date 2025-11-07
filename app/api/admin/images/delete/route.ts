import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { join, resolve } from 'path'
import { existsSync } from 'fs'
import { requirePermissionWithAudit, PERMISSION_LEVEL } from '@/lib/admin-permissions'

// Image type configurations
const IMAGE_TYPES = {
  product: {
    directory: 'ProdImages'
  },
  category: {
    directory: 'ProdImages/category'
  },
  support: {
    directory: 'ProdImages/support'
  },
  pdf: {
    directory: 'ProdImages/PDF'
  }
} as const

type ImageType = keyof typeof IMAGE_TYPES

export const DELETE = requirePermissionWithAudit(
  'ProductImages',
  PERMISSION_LEVEL.FULL_CONTROL,
  'delete_image',
  'images'
)(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    const type = (searchParams.get('type') as ImageType) || 'product'

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      )
    }

    // Validate image type
    if (!IMAGE_TYPES[type]) {
      return NextResponse.json(
        { error: 'Invalid image type' },
        { status: 400 }
      )
    }

    // Security: Prevent directory traversal and validate filename
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\') || filename.length > 255) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    const config = IMAGE_TYPES[type]
    const publicDir = resolve(process.cwd(), 'public', config.directory)
    const allowedBaseDir = resolve(process.cwd(), 'public')
    
    // Security: Ensure directory is within allowed base directory
    if (!publicDir.startsWith(allowedBaseDir)) {
      return NextResponse.json(
        { error: 'Invalid directory path' },
        { status: 400 }
      )
    }
    
    const filePath = resolve(publicDir, filename)
    
    // Security: Double-check resolved path is within allowed directory (prevent path traversal)
    if (!filePath.startsWith(publicDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      )
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Delete file
    await unlink(filePath)

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      filename
    })

  } catch (error: any) {
    console.error('Error deleting image:', error)
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
})

