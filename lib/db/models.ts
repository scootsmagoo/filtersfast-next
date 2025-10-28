/**
 * Appliance Models Database Layer
 * 
 * Handles model lookups, search, and saved models
 */

import { 
  ApplianceModel, 
  SavedModel, 
  ModelSearchQuery,
  SaveModelInput,
  UpdateSavedModelInput,
  ApplianceType,
  BrandInfo
} from '@/lib/types/model';

// Mock data store (replace with real database in production)
// This simulates a database for development
const mockModels: ApplianceModel[] = [];
const mockSavedModels: SavedModel[] = [];

// Auto-seed in development
if (process.env.NODE_ENV === 'development' && mockModels.length === 0) {
  import('@/scripts/seed-models').then(({ seedModels }) => {
    seedModels();
  }).catch(err => {
    console.error('Failed to auto-seed models:', err);
  });
}

/**
 * Search for appliance models
 */
export async function searchModels(query: ModelSearchQuery): Promise<{ models: ApplianceModel[]; total: number }> {
  const { query: searchTerm, brand, applianceType, limit = 20, offset = 0 } = query;
  
  // Simulate database search
  let results = mockModels.filter(model => {
    const matchesSearch = !searchTerm || 
      model.searchableText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.modelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBrand = !brand || model.brand.toLowerCase() === brand.toLowerCase();
    const matchesType = !applianceType || model.applianceType === applianceType;
    
    return matchesSearch && matchesBrand && matchesType;
  });
  
  // Sort by popularity
  results.sort((a, b) => b.popularity - a.popularity);
  
  const total = results.length;
  const paginated = results.slice(offset, offset + limit);
  
  return { models: paginated, total };
}

/**
 * Get model by ID
 */
export async function getModelById(modelId: string): Promise<ApplianceModel | null> {
  const model = mockModels.find(m => m.id === modelId);
  return model || null;
}

/**
 * Get model by exact model number and brand
 */
export async function getModelByNumber(brand: string, modelNumber: string): Promise<ApplianceModel | null> {
  const model = mockModels.find(
    m => m.brand.toLowerCase() === brand.toLowerCase() && 
         m.modelNumber.toLowerCase() === modelNumber.toLowerCase()
  );
  return model || null;
}

/**
 * Get all brands
 */
export async function getAllBrands(): Promise<BrandInfo[]> {
  const brandMap = new Map<string, BrandInfo>();
  
  mockModels.forEach(model => {
    if (!brandMap.has(model.brand)) {
      brandMap.set(model.brand, {
        name: model.brand,
        slug: model.brand.toLowerCase().replace(/\s+/g, '-'),
        modelCount: 0,
        applianceTypes: [],
      });
    }
    
    const brand = brandMap.get(model.brand)!;
    brand.modelCount++;
    
    if (!brand.applianceTypes.includes(model.applianceType)) {
      brand.applianceTypes.push(model.applianceType);
    }
  });
  
  return Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get customer's saved models
 */
export async function getSavedModels(customerId: string): Promise<SavedModel[]> {
  const saved = mockSavedModels.filter(sm => sm.customerId === customerId);
  return saved.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Get saved model by ID
 */
export async function getSavedModelById(savedModelId: string, customerId: string): Promise<SavedModel | null> {
  const saved = mockSavedModels.find(
    sm => sm.id === savedModelId && sm.customerId === customerId
  );
  return saved || null;
}

/**
 * Check if model is saved by customer
 */
export async function isModelSaved(modelId: string, customerId: string): Promise<boolean> {
  return mockSavedModels.some(
    sm => sm.modelId === modelId && sm.customerId === customerId
  );
}

/**
 * Save a model to customer's account
 */
export async function saveModel(
  customerId: string,
  customerEmail: string,
  input: SaveModelInput
): Promise<SavedModel> {
  // Check if already saved
  const existing = mockSavedModels.find(
    sm => sm.modelId === input.modelId && sm.customerId === customerId
  );
  
  if (existing) {
    throw new Error('Model already saved');
  }
  
  // Get model details
  const model = await getModelById(input.modelId);
  if (!model) {
    throw new Error('Model not found');
  }
  
  const savedModel: SavedModel = {
    id: `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    customerId,
    modelId: input.modelId,
    brand: model.brand,
    modelNumber: model.modelNumber,
    applianceType: model.applianceType,
    nickname: input.nickname,
    location: input.location,
    notes: input.notes,
    reminderEnabled: input.reminderEnabled ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockSavedModels.push(savedModel);
  
  // Increment model popularity
  model.popularity = (model.popularity || 0) + 1;
  
  return savedModel;
}

/**
 * Update a saved model
 */
export async function updateSavedModel(
  savedModelId: string,
  customerId: string,
  updates: UpdateSavedModelInput
): Promise<SavedModel> {
  const index = mockSavedModels.findIndex(
    sm => sm.id === savedModelId && sm.customerId === customerId
  );
  
  if (index === -1) {
    throw new Error('Saved model not found');
  }
  
  const savedModel = mockSavedModels[index];
  
  mockSavedModels[index] = {
    ...savedModel,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  return mockSavedModels[index];
}

/**
 * Delete a saved model
 */
export async function deleteSavedModel(savedModelId: string, customerId: string): Promise<void> {
  const index = mockSavedModels.findIndex(
    sm => sm.id === savedModelId && sm.customerId === customerId
  );
  
  if (index === -1) {
    throw new Error('Saved model not found');
  }
  
  mockSavedModels.splice(index, 1);
}

/**
 * Create a new model (admin only)
 */
export async function createModel(model: Omit<ApplianceModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApplianceModel> {
  const newModel: ApplianceModel = {
    ...model,
    id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    searchableText: `${model.brand} ${model.modelNumber} ${model.modelName || ''}`.toLowerCase(),
    popularity: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockModels.push(newModel);
  
  return newModel;
}

/**
 * Get popular models
 */
export async function getPopularModels(limit: number = 10): Promise<ApplianceModel[]> {
  return [...mockModels]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

/**
 * Get recent searches (would come from search logs in production)
 */
export async function getRecentSearches(limit: number = 10): Promise<string[]> {
  // Mock implementation - in production, track actual searches
  return [];
}

// Export for seeding
export { mockModels, mockSavedModels };

