import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join, resolve } from 'path'
import { existsSync } from 'fs'
import { requirePermission, PERMISSION_LEVEL } from '@/lib/admin-permissions'

// Image type configurations
const IMAGE_TYPES = {
  product: {
    directory: 'ProdImages',
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  },
  category: {
    directory: 'ProdImages/category',
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  },
  support: {
    directory: 'ProdImages/support',
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  },
  pdf: {
    directory: 'ProdImages/PDF',
    allowedExtensions: ['.pdf']
  }
} as const

type ImageType = keyof typeof IMAGE_TYPES

interface ImageFile {
  name: string
  url: string
  size: number
  modified: number
  type: string
}

export const GET = requirePermission(
  'ProductImages',
  PERMISSION_LEVEL.READ_ONLY
)(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') as ImageType) || 'product'
    const preview = searchParams.get('preview') === '1'

    // Validate image type
    if (!IMAGE_TYPES[type]) {
      return NextResponse.json(
        { error: 'Invalid image type' },
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

    // Check if directory exists
    if (!existsSync(publicDir)) {
      return NextResponse.json({
        success: true,
        images: [],
        total: 0
      })
    }

    // Read directory
    const files = await readdir(publicDir)
    const images: ImageFile[] = []

    for (const file of files) {
      // Security: Validate filename
      if (file.includes('..') || file.includes('/') || file.includes('\\') || file.length > 255) {
        continue
      }
      
      const filePath = resolve(publicDir, file)
      
      // Security: Ensure resolved path is within allowed directory
      if (!filePath.startsWith(publicDir)) {
        continue
      }
      
      const fileStat = await stat(filePath)

      // Skip directories
      if (fileStat.isDirectory()) {
        continue
      }

      // Check file extension
      const fileParts = file.split('.')
      if (fileParts.length < 2) {
        continue
      }
      const fileExtension = '.' + fileParts.pop()?.toLowerCase()
      if (!fileExtension || !config.allowedExtensions.includes(fileExtension)) {
        continue
      }

      // Get relative URL
      const relativePath = type === 'product' 
        ? file 
        : `${type}/${file}`
      const url = `/${config.directory}/${file}`

      images.push({
        name: file,
        url,
        size: fileStat.size,
        modified: fileStat.mtimeMs,
        type: fileExtension
      })
    }

    // Sort by modified date (newest first)
    images.sort((a, b) => b.modified - a.modified)

    // If preview mode, limit results
    const result = preview && images.length > 50 
      ? images.slice(0, 50) 
      : images

    return NextResponse.json({
      success: true,
      images: result,
      total: images.length,
      type,
      directory: config.directory
    })

  } catch (error: any) {
    console.error('Error listing images:', error)
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to list images' },
      { status: 500 }
    )
  }
})

