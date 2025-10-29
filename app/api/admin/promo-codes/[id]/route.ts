/**
 * Individual Promo Code Management API
 * PATCH /api/admin/promo-codes/[id] - Update promo code
 * DELETE /api/admin/promo-codes/[id] - Delete promo code
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  updatePromoCode,
  deletePromoCode
} from '@/lib/db/promo-codes'

/**
 * Update promo code (admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // TODO: Check if user is admin
    
    const { id } = await params
    const body = await req.json()
    const updated = updatePromoCode(id, body)
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Promo code updated successfully'
    })
  } catch (error) {
    console.error('Error updating promo code:', error)
    return NextResponse.json(
      { error: 'Failed to update promo code' },
      { status: 500 }
    )
  }
}

/**
 * Delete promo code (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // TODO: Check if user is admin
    
    const { id } = await params
    const deleted = deletePromoCode(id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Promo code deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting promo code:', error)
    return NextResponse.json(
      { error: 'Failed to delete promo code' },
      { status: 500 }
    )
  }
}


