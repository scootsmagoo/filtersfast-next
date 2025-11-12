export type PoolSystemType = 'cartridge' | 'sand' | 'de';

export type PoolEnvironmentType = 'in-ground' | 'above-ground' | 'spa';

export type ConnectorStyle =
  | 'open'
  | 'open w/ molded gasket'
  | 'threaded male slip'
  | 'female slip'
  | 'handle'
  | 'closed'
  | 'bayonet'
  | 'push-pull'
  | 'union connection';

export interface PoolFilterDimensions {
  diameter?: number;
  length?: number;
  topStyle?: ConnectorStyle;
  bottomStyle?: ConnectorStyle;
  connectorNotes?: string;
}

export interface PoolFilterCompatibility {
  brand: string;
  sku: string;
  notes?: string;
}

export interface PoolFilterRecommendationWindow {
  minGallons: number;
  maxGallons: number;
}

export interface PoolFilterCatalogItem {
  id: number;
  name: string;
  sku: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  inStock: boolean;
  defaultBadges?: string[];
  productUrl: string;
  environment: PoolEnvironmentType;
  system: PoolSystemType;
  series: string;
  dimensions: PoolFilterDimensions;
  flowRateGpm: number;
  surfaceAreaSqFt?: number;
  turnoverHours?: number;
  recommendedVolume: PoolFilterRecommendationWindow;
  compatibility: PoolFilterCompatibility[];
  features: string[];
  maintenanceTips: string[];
  promoTags: string[];
}

export interface PoolWizardInput {
  environment?: PoolEnvironmentType;
  system?: PoolSystemType;
  brand?: string;
  series?: string;
  diameter?: number;
  length?: number;
  topStyle?: ConnectorStyle | 'any';
  bottomStyle?: ConnectorStyle | 'any';
  poolVolume?: number;
  desiredTurnoverHours?: number;
}

export interface PoolWizardMatch {
  productId: number;
  score: number;
  reasoning: string[];
}

export interface PoolWizardResult {
  inputs: PoolWizardInput;
  matches: PoolWizardMatch[];
  calculatedFlowRate?: number;
  maintenanceReminder?: string;
}



