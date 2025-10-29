/**
 * Saved Models API Route
 * Manage customer's saved appliance models
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSavedModels, saveModel, isModelSaved } from '@/lib/db/models';
import { SaveModelInput } from '@/lib/types/model';
import { sanitizeInput } from '@/lib/security';
import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
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

    const savedModels = await getSavedModels(session.user.id);

    logger.info('Retrieved saved models', {
      customerId: session.user.id.substring(0, 8) + '***',
      count: savedModels.length,
    });

    return NextResponse.json({
      savedModels,
      total: savedModels.length,
    });
  } catch (error) {
    logger.error('Get saved models error', {
      error: process.env.NODE_ENV === 'development' ? error : 'Fetch failed',
    });
    return NextResponse.json(
      { error: 'Failed to get saved models' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(identifier, rateLimitPresets.standard);
    
    if (!rateLimitResult.success) {
      logger.warn('Save model rate limit exceeded', {
        customerId: session.user.id.substring(0, 8) + '***',
      });
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const body: SaveModelInput = await request.json();

    // Validate and sanitize input
    if (!body.modelId || typeof body.modelId !== 'string') {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    // Sanitize optional text fields
    const sanitizedInput: SaveModelInput = {
      modelId: body.modelId,
      nickname: body.nickname ? sanitizeInput(body.nickname).substring(0, 50) : undefined,
      location: body.location ? sanitizeInput(body.location).substring(0, 100) : undefined,
      notes: body.notes ? sanitizeInput(body.notes).substring(0, 500) : undefined,
      reminderEnabled: body.reminderEnabled ?? true,
    };

    // Check if already saved
    const alreadySaved = await isModelSaved(body.modelId, session.user.id);
    if (alreadySaved) {
      logger.info('Duplicate model save attempt', {
        customerId: session.user.id.substring(0, 8) + '***',
        modelId: body.modelId,
      });
      return NextResponse.json(
        { error: 'Model already saved to your account' },
        { status: 409 }
      );
    }

    const savedModel = await saveModel(
      session.user.id,
      session.user.email,
      sanitizedInput
    );

    logger.info('Model saved successfully', {
      customerId: session.user.id.substring(0, 8) + '***',
      modelId: body.modelId,
      savedModelId: savedModel.id,
    });

    return NextResponse.json({
      savedModel,
      message: 'Model saved successfully',
    }, { status: 201 });
  } catch (error) {
    logger.error('Save model error', {
      error: process.env.NODE_ENV === 'development' ? error : 'Save failed',
      identifier: identifier.substring(0, 8) + '***',
    });
    
    if (error instanceof Error && error.message === 'Model not found') {
      return NextResponse.json(
        { error: 'Model not found. Please try searching again.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save model' },
      { status: 500 }
    );
  }
}
