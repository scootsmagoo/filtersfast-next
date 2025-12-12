import { NextRequest, NextResponse } from 'next/server'
import { requirePermissionWithAudit, PERMISSION_LEVEL } from '@/lib/admin-permissions'
import { setProductOptionImage, removeProductOptionImage } from '@/lib/db/product-options'

export const POST = requirePermissionWithAudit(
  'Products',
  PERMISSION_LEVEL.FULL_CONTROL,
  'set_option_image',
  'products'
)(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) => {
  try {
    const { id: productId, optionId } = await params
    const body = await request.json()
    const { imageUrl } = body

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    // Validate imageUrl format (allow relative paths like /ProdImages/image.jpg or full URLs)
    const trimmedUrl = imageUrl.trim()
    if (trimmedUrl.length === 0 || trimmedUrl.length > 2048) {
      return NextResponse.json(
        { error: 'Image URL is invalid or too long' },
        { status: 400 }
      )
    }

    // Security: Prevent directory traversal
    if (trimmedUrl.includes('..') || trimmedUrl.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      )
    }

    const optionImage = setProductOptionImage(productId, optionId, imageUrl)

    return NextResponse.json({
      success: true,
      optionImage
    })

  } catch (error: any) {
    console.error('Error setting option image:', error)
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to set option image' },
      { status: 500 }
    )
  }
})

export const DELETE = requirePermissionWithAudit(
  'Products',
  PERMISSION_LEVEL.FULL_CONTROL,
  'remove_option_image',
  'products'
)(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) => {
  try {
    const { id: productId, optionId } = await params

    const success = removeProductOptionImage(productId, optionId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove option image' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Option image removed successfully'
    })

  } catch (error: any) {
    console.error('Error removing option image:', error)
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to remove option image' },
      { status: 500 }
    )
  }
})

