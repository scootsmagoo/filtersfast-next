import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { resolve } from 'path'
import { existsSync } from 'fs'
import { requirePermissionWithAudit, PERMISSION_LEVEL } from '@/lib/admin-permissions'
import { rateLimit } from '@/lib/rate-limit'

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

interface BulkDeleteResult {
  success: string[]
  failed: Array<{ filename: string; error: string }>
}

export const POST = requirePermissionWithAudit(
  'ProductImages',
  PERMISSION_LEVEL.FULL_CONTROL,
  'bulk_delete_images',
  'images'
)(async (request: NextRequest) => {
  try {
    // OWASP: Rate limiting - 10 bulk delete operations per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const rateLimitResult = await rateLimit(`image-bulk-delete:${ip}`, 10, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many bulk delete requests. Please try again later.' },
        { status: 429 }
      )
    }

    // OWASP: Validate Content-Type header
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected application/json' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { filenames, type } = body

    // OWASP: Type validation - ensure filenames is an array
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return NextResponse.json(
        { error: 'Filenames array is required and must not be empty' },
        { status: 400 }
      )
    }

    // OWASP: Remove duplicates and empty values to prevent processing same file twice
    const uniqueFilenames = Array.from(new Set(filenames.filter((f: any) => 
      typeof f === 'string' && f.trim().length > 0
    )))

    if (uniqueFilenames.length === 0) {
      return NextResponse.json(
        { error: 'No valid filenames provided' },
        { status: 400 }
      )
    }

    // OWASP: Limit bulk delete to prevent DoS (max 100 files per request)
    if (uniqueFilenames.length > 100) {
      return NextResponse.json(
        { error: 'Cannot delete more than 100 files at once' },
        { status: 400 }
      )
    }

    // Validate image type
    const imageType = (type as ImageType) || 'product'
    if (!IMAGE_TYPES[imageType]) {
      return NextResponse.json(
        { error: 'Invalid image type' },
        { status: 400 }
      )
    }

    const config = IMAGE_TYPES[imageType]
    const publicDir = resolve(process.cwd(), 'public', config.directory)
    const allowedBaseDir = resolve(process.cwd(), 'public')
    
    // Security: Ensure directory is within allowed base directory
    if (!publicDir.startsWith(allowedBaseDir)) {
      return NextResponse.json(
        { error: 'Invalid directory path' },
        { status: 400 }
      )
    }

    const result: BulkDeleteResult = {
      success: [],
      failed: []
    }

    // OWASP: Set timeout protection (max 30 seconds for bulk operation)
    const startTime = Date.now()
    const MAX_OPERATION_TIME = 30000 // 30 seconds

    // Process deletions sequentially (like legacy pattern)
    for (const filename of uniqueFilenames) {
      // OWASP: Check timeout to prevent long-running operations
      if (Date.now() - startTime > MAX_OPERATION_TIME) {
        result.failed.push({
          filename: '...',
          error: 'Operation timeout - some files may not have been deleted'
        })
        break
      }
      // OWASP: Type validation - ensure filename is a string (already filtered, but double-check)
      if (typeof filename !== 'string' || filename.trim().length === 0) {
        result.failed.push({
          filename: '...',
          error: 'Invalid filename'
        })
        continue
      }

      // Security: Prevent directory traversal and validate filename
      const invalidChars = ['..', '/', '\\']
      if (
        invalidChars.some(char => filename.includes(char)) ||
        filename.length > 255 ||
        filename.includes('\0')
      ) {
        result.failed.push({
          filename,
          error: 'Invalid filename'
        })
        continue
      }

      const filePath = resolve(publicDir, filename)
      
      // Security: Double-check resolved path is within allowed directory (prevent path traversal)
      if (!filePath.startsWith(publicDir)) {
        result.failed.push({
          filename,
          error: 'Invalid file path'
        })
        continue
      }

      try {
        // Check if file exists before attempting deletion
        if (!existsSync(filePath)) {
          result.failed.push({
            filename,
            error: 'File not found'
          })
          continue
        }

        // Delete file
        await unlink(filePath)
        result.success.push(filename)
      } catch (error: any) {
        console.error(`Error deleting file ${filename}:`, error)
        result.failed.push({
          filename,
          error: 'Failed to delete file'
        })
      }
    }

    // Return results
    return NextResponse.json({
      success: true,
      deleted: result.success.length,
      failed: result.failed.length,
      results: result
    })

  } catch (error: any) {
    console.error('Error in bulk delete:', error)
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to process bulk delete request' },
      { status: 500 }
    )
  }
})

