import { NextRequest, NextResponse } from 'next/server'
import { rename } from 'fs/promises'
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

export const POST = requirePermissionWithAudit(
  'ProductImages',
  PERMISSION_LEVEL.FULL_CONTROL,
  'rename_image',
  'images'
)(async (request: NextRequest) => {
  try {
    // OWASP: Rate limiting - 30 renames per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const rateLimitResult = await rateLimit(`image-rename:${ip}`, 30, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many rename requests. Please try again later.' },
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
    const { filename, newFilename, type } = body

    // OWASP: Type validation - ensure inputs are strings
    if (!filename || !newFilename || typeof filename !== 'string' || typeof newFilename !== 'string') {
      return NextResponse.json(
        { error: 'Filename and new filename are required and must be strings' },
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

    // Security: Prevent directory traversal and validate filenames
    const invalidChars = ['..', '/', '\\']
    if (
      invalidChars.some(char => filename.includes(char)) ||
      filename.length > 255 ||
      invalidChars.some(char => newFilename.includes(char)) ||
      newFilename.length > 255
    ) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    // Security: Validate filename doesn't contain null bytes or control characters
    if (filename.includes('\0') || newFilename.includes('\0')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    // OWASP: Validate filenames have extensions (prevent hidden files)
    const oldExtensionIndex = filename.lastIndexOf('.')
    const newExtensionIndex = newFilename.lastIndexOf('.')
    
    if (oldExtensionIndex === -1 || oldExtensionIndex === 0 || oldExtensionIndex === filename.length - 1) {
      return NextResponse.json(
        { error: 'Invalid filename format' },
        { status: 400 }
      )
    }
    
    if (newExtensionIndex === -1 || newExtensionIndex === 0 || newExtensionIndex === newFilename.length - 1) {
      return NextResponse.json(
        { error: 'Invalid new filename format' },
        { status: 400 }
      )
    }

    // Security: Ensure new filename preserves the same extension
    const oldExtension = filename.substring(oldExtensionIndex)
    const newExtension = newFilename.substring(newExtensionIndex)
    if (oldExtension !== newExtension) {
      return NextResponse.json(
        { error: 'Cannot change file extension' },
        { status: 400 }
      )
    }

    // Security: Validate new filename has valid characters (alphanumeric, dots, hyphens, underscores)
    const validFilenamePattern = /^[a-zA-Z0-9._-]+$/
    const newFilenameWithoutExt = newFilename.substring(0, newFilename.lastIndexOf('.'))
    
    // Validate filename is not empty and doesn't start/end with dots or spaces
    if (!newFilenameWithoutExt || newFilenameWithoutExt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Filename cannot be empty' },
        { status: 400 }
      )
    }
    
    if (newFilenameWithoutExt.startsWith('.') || newFilenameWithoutExt.endsWith('.')) {
      return NextResponse.json(
        { error: 'Filename cannot start or end with a dot' },
        { status: 400 }
      )
    }
    
    if (!validFilenamePattern.test(newFilenameWithoutExt)) {
      return NextResponse.json(
        { error: 'New filename contains invalid characters. Only letters, numbers, dots, hyphens, and underscores are allowed.' },
        { status: 400 }
      )
    }
    
    // Prevent filenames that are too short or too long
    if (newFilenameWithoutExt.length < 1 || newFilenameWithoutExt.length > 200) {
      return NextResponse.json(
        { error: 'Filename must be between 1 and 200 characters' },
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
    
    const oldFilePath = resolve(publicDir, filename)
    const newFilePath = resolve(publicDir, newFilename)
    
    // Security: Double-check resolved paths are within allowed directory (prevent path traversal)
    if (!oldFilePath.startsWith(publicDir) || !newFilePath.startsWith(publicDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      )
    }

    // OWASP: Check if source file exists (prevent race conditions)
    if (!existsSync(oldFilePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // OWASP: Check if destination file already exists (prevent overwrites)
    if (existsSync(newFilePath)) {
      return NextResponse.json(
        { error: 'A file with this name already exists' },
        { status: 409 }
      )
    }

    // OWASP: Atomic rename operation (prevents race conditions)
    // The rename() function is atomic on most filesystems
    await rename(oldFilePath, newFilePath)

    // Return success with updated URL
    const imageUrl = `/${config.directory}/${newFilename}`

    return NextResponse.json({
      success: true,
      message: 'File renamed successfully',
      filename: newFilename,
      url: imageUrl
    })

  } catch (error: any) {
    console.error('Error renaming image:', error)
    // Handle specific error cases
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }
    if (error.code === 'EEXIST' || error.code === 'ENOTEMPTY') {
      return NextResponse.json(
        { error: 'A file with this name already exists' },
        { status: 409 }
      )
    }
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to rename image' },
      { status: 500 }
    )
  }
})

