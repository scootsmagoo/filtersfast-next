/**
 * Saved Models API Routes
 * 
 * GET /api/models/saved - Get all saved models for current user
 * POST /api/models/saved - Save a new model
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RateLimiter } from '@/lib/security';
import type { SavedModel, SaveModelRequest } from '@/lib/types/models';

// Rate limiters
const getRateLimiter = new RateLimiter(60, 60 * 1000); // 60/min for GET
const postRateLimiter = new RateLimiter(20, 60 * 1000); // 20/min for POST

/**
 * GET - Fetch all saved models for current user
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!getRateLimiter.isAllowed(clientId)) {
      const retryAfter = getRateLimiter.getRemainingTime(clientId);
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
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // TODO: Replace with actual database query
    const savedModels = await getSavedModels(session.user.id);

    return NextResponse.json({
      success: true,
      models: savedModels,
      count: savedModels.length,
    });

  } catch (error) {
    console.error('Error fetching saved models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved models' },
      { status: 500 }
    );
  }
}

/**
 * POST - Save a new model
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!postRateLimiter.isAllowed(clientId)) {
      const retryAfter = postRateLimiter.getRemainingTime(clientId);
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
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: SaveModelRequest = await request.json();

    // Validate model number
    if (!body.modelNumber || body.modelNumber.trim().length === 0) {
      return NextResponse.json(
        { error: 'Model number is required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const modelNumber = body.modelNumber.trim().toUpperCase().substring(0, 50);
    const nickname = body.nickname?.trim().substring(0, 100);
    const location = body.location?.trim().substring(0, 100);

    // TODO: Replace with actual database insert
    const savedModel = await saveModel(
      session.user.id,
      modelNumber,
      nickname,
      location
    );

    return NextResponse.json({
      success: true,
      model: savedModel,
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving model:', error);
    return NextResponse.json(
      { error: 'Failed to save model' },
      { status: 500 }
    );
  }
}

/**
 * Get saved models for user
 * TODO: Replace with actual database query
 */
async function getSavedModels(userId: string): Promise<SavedModel[]> {
  // Mock data for development
  return [
    {
      id: '1',
      userId: userId,
      modelId: '1',
      model: {
        id: '1',
        modelNumber: 'RF28R7351SR',
        brand: 'Samsung',
        type: 'refrigerator',
        description: 'Samsung 28 cu. ft. 4-Door French Door Refrigerator',
        imageUrl: '/images/appliances/samsung-rf28r7351sr.jpg',
      },
      nickname: 'Kitchen Fridge',
      location: 'Kitchen',
      dateAdded: '2025-01-15T10:00:00Z',
      lastUsed: '2025-01-20T14:30:00Z',
    },
    {
      id: '2',
      userId: userId,
      modelId: '2',
      model: {
        id: '2',
        modelNumber: 'MZFD30X',
        brand: 'Honeywell',
        type: 'hvac',
        description: 'Honeywell 16x25x4 MERV 11 Filter',
      },
      nickname: 'Home AC',
      location: 'Basement',
      dateAdded: '2024-12-10T08:00:00Z',
      lastUsed: '2025-01-18T09:15:00Z',
    },
  ];
}

/**
 * Save a new model
 * TODO: Replace with actual database insert
 */
async function saveModel(
  userId: string,
  modelNumber: string,
  nickname?: string,
  location?: string
): Promise<SavedModel> {
  // Mock implementation
  // In production, this would:
  // 1. Look up the model in tFridgeModelLookup or create new entry
  // 2. Insert into customer_models table
  // 3. Return the saved model
  
  return {
    id: Date.now().toString(),
    userId: userId,
    modelId: '1',
    model: {
      id: '1',
      modelNumber: modelNumber,
      brand: 'Samsung',
      type: 'refrigerator',
      description: 'Appliance Model',
    },
    nickname: nickname,
    location: location,
    dateAdded: new Date().toISOString(),
  };
}

