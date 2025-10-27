/**
 * Saved Model Operations API
 * 
 * PUT /api/models/saved/[id] - Update a saved model
 * DELETE /api/models/saved/[id] - Delete a saved model
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RateLimiter } from '@/lib/security';
import type { UpdateModelRequest } from '@/lib/types/models';

// Rate limiter
const rateLimiter = new RateLimiter(30, 60 * 1000);

/**
 * PUT - Update a saved model (nickname, location)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!rateLimiter.isAllowed(clientId)) {
      const retryAfter = rateLimiter.getRemainingTime(clientId);
      return NextResponse.json(
        { error: 'Too many requests', retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    // Get authenticated user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const modelId = params.id;

    // Parse request body
    const body: UpdateModelRequest = await request.json();

    // Sanitize inputs
    const nickname = body.nickname?.trim().substring(0, 100);
    const location = body.location?.trim().substring(0, 100);

    // TODO: Replace with actual database update
    // Verify user owns this model and update
    const updated = await updateSavedModel(
      modelId,
      session.user.id,
      nickname,
      location
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'Model not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      model: updated,
    });

  } catch (error) {
    console.error('Error updating model:', error);
    return NextResponse.json(
      { error: 'Failed to update model' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a saved model
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!rateLimiter.isAllowed(clientId)) {
      const retryAfter = rateLimiter.getRemainingTime(clientId);
      return NextResponse.json(
        { error: 'Too many requests', retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    // Get authenticated user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const modelId = params.id;

    // TODO: Replace with actual database delete
    // Verify user owns this model and delete
    const deleted = await deleteSavedModel(modelId, session.user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Model not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Model deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting model:', error);
    return NextResponse.json(
      { error: 'Failed to delete model' },
      { status: 500 }
    );
  }
}

/**
 * Update saved model
 * TODO: Replace with actual database update
 */
async function updateSavedModel(
  modelId: string,
  userId: string,
  nickname?: string,
  location?: string
): Promise<any | null> {
  // Mock implementation
  // In production: UPDATE customer_models SET ... WHERE id = ? AND userId = ?
  return {
    id: modelId,
    userId,
    nickname,
    location,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Delete saved model
 * TODO: Replace with actual database delete
 */
async function deleteSavedModel(
  modelId: string,
  userId: string
): Promise<boolean> {
  // Mock implementation
  // In production: DELETE FROM customer_models WHERE id = ? AND userId = ?
  return true;
}

