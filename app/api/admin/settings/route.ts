/**
 * Settings API
 * Endpoints for managing system configuration and module toggles
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getSystemConfig,
  updateSystemConfig,
  type UpdateSystemConfigRequest,
} from '@/lib/db/system-config'
import { verifyAdmin, logAdminAction } from '@/lib/admin-permissions'
import { sanitizeText } from '@/lib/sanitize'

/**
 * GET /api/admin/settings
 * Get system configuration
 */
export async function GET(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    const config = getSystemConfig()

    await logAdminAction({
      action: 'admin.settings.view',
      resource: 'settings',
      details: {},
    }, 'success', undefined, request)

    return NextResponse.json({ config })
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/settings
 * Update system configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    // Validate request body size (prevent DoS)
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 10000) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      )
    }

    let body: any
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate body is an object
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Invalid request body format' },
        { status: 400 }
      )
    }

    const {
      titles,
      insurance,
      shipping,
      discount,
      related,
      featuredcart,
      featwording,
      productshipping,
      callLongWait,
      chatActive,
      phoneNumActive,
      txtChatEnabled,
    } = body

    // Build update object with only provided fields
    const updateData: UpdateSystemConfigRequest = {}

    if (titles !== undefined) {
      // Validate type before parsing
      if (typeof titles !== 'number' && typeof titles !== 'string') {
        return NextResponse.json(
          { error: 'Invalid value for titles. Must be a number' },
          { status: 400 }
        )
      }
      const parsed = typeof titles === 'number' ? titles : parseInt(String(titles), 10)
      if (isNaN(parsed) || (parsed !== 0 && parsed !== 1)) {
        return NextResponse.json(
          { error: 'Invalid value for titles. Must be 0 or 1' },
          { status: 400 }
        )
      }
      updateData.titles = parsed
    }

    if (insurance !== undefined) {
      if (typeof insurance !== 'number' && typeof insurance !== 'string') {
        return NextResponse.json(
          { error: 'Invalid value for insurance. Must be a number' },
          { status: 400 }
        )
      }
      const parsed = typeof insurance === 'number' ? insurance : parseInt(String(insurance), 10)
      if (isNaN(parsed) || (parsed !== 0 && parsed !== 1)) {
        return NextResponse.json(
          { error: 'Invalid value for insurance. Must be 0 or 1' },
          { status: 400 }
        )
      }
      updateData.insurance = parsed
    }

    if (shipping !== undefined) {
      if (typeof shipping !== 'number' && typeof shipping !== 'string') {
        return NextResponse.json(
          { error: 'Invalid value for shipping. Must be a number' },
          { status: 400 }
        )
      }
      const parsed = typeof shipping === 'number' ? shipping : parseInt(String(shipping), 10)
      if (isNaN(parsed) || (parsed !== 0 && parsed !== 1)) {
        return NextResponse.json(
          { error: 'Invalid value for shipping. Must be 0 or 1' },
          { status: 400 }
        )
      }
      updateData.shipping = parsed
    }

    if (discount !== undefined) {
      if (typeof discount !== 'number' && typeof discount !== 'string') {
        return NextResponse.json(
          { error: 'Invalid value for discount. Must be a number' },
          { status: 400 }
        )
      }
      const parsed = typeof discount === 'number' ? discount : parseInt(String(discount), 10)
      if (isNaN(parsed) || (parsed !== 0 && parsed !== 1)) {
        return NextResponse.json(
          { error: 'Invalid value for discount. Must be 0 or 1' },
          { status: 400 }
        )
      }
      updateData.discount = parsed
    }

    if (related !== undefined) {
      if (typeof related !== 'number' && typeof related !== 'string') {
        return NextResponse.json(
          { error: 'Invalid value for related. Must be a number' },
          { status: 400 }
        )
      }
      const parsed = typeof related === 'number' ? related : parseInt(String(related), 10)
      if (isNaN(parsed) || (parsed !== 0 && parsed !== 1)) {
        return NextResponse.json(
          { error: 'Invalid value for related. Must be 0 or 1' },
          { status: 400 }
        )
      }
      updateData.related = parsed
    }

    if (featuredcart !== undefined) {
      if (typeof featuredcart !== 'number' && typeof featuredcart !== 'string') {
        return NextResponse.json(
          { error: 'Invalid value for featuredcart. Must be a number' },
          { status: 400 }
        )
      }
      const parsed = typeof featuredcart === 'number' ? featuredcart : parseInt(String(featuredcart), 10)
      if (isNaN(parsed) || (parsed !== 0 && parsed !== 1)) {
        return NextResponse.json(
          { error: 'Invalid value for featuredcart. Must be 0 or 1' },
          { status: 400 }
        )
      }
      updateData.featuredcart = parsed
    }

    if (featwording !== undefined) {
      if (typeof featwording !== 'string') {
        return NextResponse.json(
          { error: 'Invalid value for featwording. Must be a string' },
          { status: 400 }
        )
      }
      // Validate length before sanitizing
      if (featwording.length > 255) {
        return NextResponse.json(
          { error: 'featwording must be 255 characters or less' },
          { status: 400 }
        )
      }
      updateData.featwording = sanitizeText(featwording)
    }

    if (productshipping !== undefined) {
      if (typeof productshipping !== 'number' && typeof productshipping !== 'string') {
        return NextResponse.json(
          { error: 'Invalid value for productshipping. Must be a number' },
          { status: 400 }
        )
      }
      const parsed = typeof productshipping === 'number' ? productshipping : parseInt(String(productshipping), 10)
      if (isNaN(parsed) || (parsed !== 0 && parsed !== 1)) {
        return NextResponse.json(
          { error: 'Invalid value for productshipping. Must be 0 or 1' },
          { status: 400 }
        )
      }
      updateData.productshipping = parsed
    }

    if (callLongWait !== undefined) {
      if (typeof callLongWait !== 'number' && typeof callLongWait !== 'string') {
        return NextResponse.json(
          { error: 'Invalid value for callLongWait. Must be a number' },
          { status: 400 }
        )
      }
      const parsed = typeof callLongWait === 'number' ? callLongWait : parseInt(String(callLongWait), 10)
      if (isNaN(parsed) || (parsed !== 0 && parsed !== 1 && parsed !== 2)) {
        return NextResponse.json(
          { error: 'Invalid value for callLongWait. Must be 0, 1, or 2' },
          { status: 400 }
        )
      }
      updateData.callLongWait = parsed
    }

    if (chatActive !== undefined) {
      if (typeof chatActive !== 'number' && typeof chatActive !== 'string') {
        return NextResponse.json(
          { error: 'Invalid value for chatActive. Must be a number' },
          { status: 400 }
        )
      }
      const parsed = typeof chatActive === 'number' ? chatActive : parseInt(String(chatActive), 10)
      if (isNaN(parsed) || (parsed !== 0 && parsed !== 1)) {
        return NextResponse.json(
          { error: 'Invalid value for chatActive. Must be 0 or 1' },
          { status: 400 }
        )
      }
      updateData.chatActive = parsed
    }

    if (phoneNumActive !== undefined) {
      if (typeof phoneNumActive !== 'number' && typeof phoneNumActive !== 'string') {
        return NextResponse.json(
          { error: 'Invalid value for phoneNumActive. Must be a number' },
          { status: 400 }
        )
      }
      const parsed = typeof phoneNumActive === 'number' ? phoneNumActive : parseInt(String(phoneNumActive), 10)
      if (isNaN(parsed) || (parsed !== 0 && parsed !== 1)) {
        return NextResponse.json(
          { error: 'Invalid value for phoneNumActive. Must be 0 or 1' },
          { status: 400 }
        )
      }
      updateData.phoneNumActive = parsed
    }

    if (txtChatEnabled !== undefined) {
      if (typeof txtChatEnabled !== 'number' && typeof txtChatEnabled !== 'string') {
        return NextResponse.json(
          { error: 'Invalid value for txtChatEnabled. Must be a number' },
          { status: 400 }
        )
      }
      const parsed = typeof txtChatEnabled === 'number' ? txtChatEnabled : parseInt(String(txtChatEnabled), 10)
      if (isNaN(parsed) || (parsed !== 0 && parsed !== 1)) {
        return NextResponse.json(
          { error: 'Invalid value for txtChatEnabled. Must be 0 or 1' },
          { status: 400 }
        )
      }
      updateData.txtChatEnabled = parsed
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const config = updateSystemConfig(updateData)

    await logAdminAction({
      action: 'admin.settings.update',
      resource: 'settings',
      details: updateData,
    }, 'success', undefined, request)

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      config 
    })
  } catch (error: any) {
    console.error('Error updating settings:', error)
    const errorMessage = error.message && !error.message.includes('Database error')
      ? error.message
      : 'Failed to update settings'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

