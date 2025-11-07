import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join, resolve } from 'path'
import { existsSync } from 'fs'
import { requirePermissionWithAudit, PERMISSION_LEVEL } from '@/lib/admin-permissions'
import { rateLimit } from '@/lib/rate-limit'

// Image type configurations
const IMAGE_TYPES = {
  product: {
    directory: 'ProdImages',
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  category: {
    directory: 'ProdImages/category',
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  support: {
    directory: 'ProdImages/support',
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  pdf: {
    directory: 'ProdImages/PDF',
    allowedExtensions: ['.pdf'],
    maxSize: 20 * 1024 * 1024 // 20MB
  }
} as const

type ImageType = keyof typeof IMAGE_TYPES

export const POST = requirePermissionWithAudit(
  'ProductImages',
  PERMISSION_LEVEL.FULL_CONTROL,
  'upload_image',
  'images'
)(async (request: NextRequest) => {
  try {
    // Rate limiting: 20 uploads per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const rateLimitResult = await rateLimit(`image-upload:${ip}`, 20, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as ImageType) || 'product'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
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

    const config = IMAGE_TYPES[type]

    // Validate file extension
    const fileNameParts = file.name.split('.')
    if (fileNameParts.length < 2) {
      return NextResponse.json(
        { error: 'File must have an extension' },
        { status: 400 }
      )
    }
    const fileExtension = '.' + fileNameParts.pop()?.toLowerCase()
    if (!fileExtension || fileExtension.length > 10 || !config.allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${config.allowedExtensions.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > config.maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${config.maxSize / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Generate unique filename with strict sanitization
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    // Sanitize filename: only allow alphanumeric, dots, hyphens, underscores
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase()
      .substring(0, 100) // Limit filename length
    const filename = `${timestamp}-${randomStr}-${sanitizedName}`
    
    // Security: Validate filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    // Create directory if it doesn't exist
    const publicDir = resolve(process.cwd(), 'public', config.directory)
    const allowedBaseDir = resolve(process.cwd(), 'public')
    
    // Security: Ensure we're writing to the correct directory (prevent path traversal)
    if (!publicDir.startsWith(allowedBaseDir)) {
      return NextResponse.json(
        { error: 'Invalid directory path' },
        { status: 400 }
      )
    }
    
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true })
    }

    // Write file with path validation
    const filePath = resolve(publicDir, filename)
    
    // Security: Double-check resolved path is within allowed directory
    if (!filePath.startsWith(publicDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      )
    }
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Security: Validate file content matches extension (basic MIME type check)
    const fileType = file.type.toLowerCase()
    
    // Validate MIME type matches extension (if MIME type is provided)
    if (fileType && fileType !== 'application/octet-stream') {
      const mimeTypeMap: Record<string, string[]> = {
        '.jpg': ['image/jpeg'],
        '.jpeg': ['image/jpeg'],
        '.png': ['image/png'],
        '.gif': ['image/gif'],
        '.webp': ['image/webp'],
        '.pdf': ['application/pdf']
      }
      
      const expectedMimeTypes = mimeTypeMap[fileExtension]
      if (expectedMimeTypes && !expectedMimeTypes.includes(fileType)) {
        return NextResponse.json(
          { error: 'File type mismatch. File content does not match extension.' },
          { status: 400 }
        )
      }
    }
    
    await writeFile(filePath, buffer)

    // Return success with image URL
    const imageUrl = `/${config.directory}/${filename}`
    const relativePath = type === 'product' 
      ? filename 
      : `${type}/${filename}`

    return NextResponse.json({
      success: true,
      filename,
      url: imageUrl,
      relativePath,
      size: file.size,
      type: file.type
    })

  } catch (error: any) {
    console.error('Error uploading image:', error)
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
})

