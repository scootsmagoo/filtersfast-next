/**
 * Individual Saved Model API Route
 * Update or delete a specific saved model
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSavedModelById, updateSavedModel, deleteSavedModel } from '@/lib/db/models';
import { UpdateSavedModelInput } from '@/lib/types/model';
import { sanitizeInput } from '@/lib/security';
import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const savedModel = await getSavedModelById(id, session.user.id);

    if (!savedModel) {
      return NextResponse.json(
        { error: 'Saved model not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ savedModel });
  } catch (error) {
    console.error('Get saved model error:', error);
    return NextResponse.json(
      { error: 'Failed to get saved model' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const identifier = getClientIdentifier(request);
  
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(identifier, rateLimitPresets.standard);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const { id: modelId } = await params;
    const body: UpdateSavedModelInput = await request.json();

    // Sanitize optional text fields
    const sanitizedUpdates: UpdateSavedModelInput = {
      ...(body.nickname !== undefined && { 
        nickname: sanitizeInput(body.nickname).substring(0, 50) 
      }),
      ...(body.location !== undefined && { 
        location: sanitizeInput(body.location).substring(0, 100) 
      }),
      ...(body.notes !== undefined && { 
        notes: sanitizeInput(body.notes).substring(0, 500) 
      }),
      ...(body.reminderEnabled !== undefined && { 
        reminderEnabled: body.reminderEnabled 
      }),
      ...(body.nextReminderDate !== undefined && { 
        nextReminderDate: body.nextReminderDate 
      }),
    };

    const updatedModel = await updateSavedModel(
      modelId,
      session.user.id,
      sanitizedUpdates
    );

    logger.info('Saved model updated', {
      customerId: session.user.id.substring(0, 8) + '***',
      savedModelId: modelId,
    });

    return NextResponse.json({
      savedModel: updatedModel,
      message: 'Model updated successfully',
    });
  } catch (error) {
    logger.error('Update saved model error', {
      error: process.env.NODE_ENV === 'development' ? error : 'Update failed',
    });
    
    if (error instanceof Error && error.message === 'Saved model not found') {
      return NextResponse.json(
        { error: 'Saved model not found or you do not have access to it' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update saved model' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const identifier = getClientIdentifier(request);
  
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(identifier, rateLimitPresets.standard);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const { id } = await params;
    await deleteSavedModel(id, session.user.id);

    logger.info('Saved model deleted', {
      customerId: session.user.id.substring(0, 8) + '***',
    });

    return NextResponse.json({
      message: 'Model removed from your saved list',
    });
  } catch (error) {
    logger.error('Delete saved model error', {
      error: process.env.NODE_ENV === 'development' ? error : 'Delete failed',
    });
    
    if (error instanceof Error && error.message === 'Saved model not found') {
      return NextResponse.json(
        { error: 'Saved model not found or you do not have access to it' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete saved model' },
      { status: 500 }
    );
  }
}
