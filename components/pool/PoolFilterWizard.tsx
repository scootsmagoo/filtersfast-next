'use client';

import { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircle2, ChevronLeft, ChevronRight, Info, Sparkles, ThermometerSun } from 'lucide-react';
import {
  DIMENSION_TOLERANCE_INCHES,
  POOL_FILTER_CATALOG,
  SEASONAL_PROMO_MAP,
} from '@/lib/data/pool-filter-wizard';
import {
  ConnectorStyle,
  PoolFilterCatalogItem,
  PoolWizardInput,
  PoolWizardMatch,
  PoolWizardResult,
} from '@/lib/types/pool-filter';
import { MOCK_PROMO_CODES } from '@/lib/db/promo-codes-mock';
import { formatCurrency } from '@/lib/i18n-utils';
import { cn } from '@/lib/utils';

interface PoolFilterWizardProps {
  onResult?: (result: PoolWizardResult) => void;
}

interface Step {
  id: number;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    title: 'Pool or Spa Type',
    description: 'Tell us what you are filtering so we can narrow compatible systems.',
  },
  {
    id: 2,
    title: 'Filter System',
    description: 'Choose the filtration style currently on your equipment pad.',
  },
  {
    id: 3,
    title: 'Brand & Series',
    description: 'We’ll match cartridges and media that fit your housing.',
  },
  {
    id: 4,
    title: 'Dimensions & Flow',
    description: 'Fine-tune by size and performance for precision compatibility.',
  },
  {
    id: 5,
    title: 'Wizard Matches',
    description: 'Review best-fit filters, calculators, and seasonal savings.',
  },
];

const turnoverGuidelines = [
  { label: 'Residential pools', hours: 8 },
  { label: 'Heavy-use pools', hours: 6 },
  { label: 'Spas & hot tubs', hours: 4 },
];

const connectorLabel = (style?: ConnectorStyle) => {
  if (!style) return 'Any';
  return style
    .split(' ')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const withinTolerance = (expected?: number, actual?: number, tolerance = DIMENSION_TOLERANCE_INCHES) => {
  if (expected === undefined || actual === undefined) return true;
  return Math.abs(expected - actual) <= tolerance;
};

const formatGallons = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

const deriveSeasonalPromos = (promoTags: string[]) => {
  return SEASONAL_PROMO_MAP.filter((season) => promoTags.some((tag) => tag === season.tag)).map((season) => {
    const promos = season.recommendedPromoCodes
      .map((code) => MOCK_PROMO_CODES.find((promo) => promo.code === code && promo.active))
      .filter(Boolean);
    return {
      ...season,
      promos,
    };
  });
};

const uniqueSeries = (items: PoolFilterCatalogItem[], environment?: string, system?: string, brand?: string) => {
  const series = items
    .filter((item) => (!environment || item.environment === environment) && (!system || item.system === system) && (!brand || item.brand === brand))
    .map((item) => item.series);
  return [...new Set(series)].sort();
};

export default function PoolFilterWizard({ onResult }: PoolFilterWizardProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [inputs, setInputs] = useState<PoolWizardInput>({
    desiredTurnoverHours: 8,
  });
  const [wizardResult, setWizardResult] = useState<PoolWizardResult | null>(null);

  const diameterSelectId = 'pool-wizard-diameter';
  const lengthSelectId = 'pool-wizard-length';
  const topConnectorSelectId = 'pool-wizard-top-connector';
  const bottomConnectorSelectId = 'pool-wizard-bottom-connector';
  const poolVolumeInputId = 'pool-wizard-volume';
  const turnoverSelectId = 'pool-wizard-turnover';
  const seriesSelectId = 'pool-wizard-series';

  const environments = useMemo(
    () => [...new Set(POOL_FILTER_CATALOG.map((item) => item.environment))].sort(),
    []
  );

  const systems = useMemo(() => {
    if (!inputs.environment) {
      return [...new Set(POOL_FILTER_CATALOG.map((item) => item.system))].sort();
    }
    return [
      ...new Set(
        POOL_FILTER_CATALOG.filter((item) => item.environment === inputs.environment).map(
          (item) => item.system
        )
      ),
    ].sort();
  }, [inputs.environment]);

  const brands = useMemo(() => {
    return [
      ...new Set(
        POOL_FILTER_CATALOG.filter(
          (item) =>
            (!inputs.environment || item.environment === inputs.environment) &&
            (!inputs.system || item.system === inputs.system)
        ).map((item) => item.brand)
      ),
    ].sort();
  }, [inputs.environment, inputs.system]);

  const seriesOptions = useMemo(
    () =>
      uniqueSeries(
        POOL_FILTER_CATALOG,
        inputs.environment,
        inputs.system,
        inputs.brand
      ),
    [inputs.environment, inputs.system, inputs.brand]
  );

  const diameterOptions = useMemo(
    () =>
      [
        ...new Set(
          POOL_FILTER_CATALOG.filter(
            (item) =>
              (!inputs.environment || item.environment === inputs.environment) &&
              (!inputs.system || item.system === inputs.system) &&
              (!inputs.brand || item.brand === inputs.brand)
          )
            .map((item) => item.dimensions.diameter)
            .filter(Boolean)
        ),
      ]
        .sort((a, b) => (a! > b! ? 1 : -1))
        .map((value) => value!),
    [inputs.environment, inputs.system, inputs.brand]
  );

  const lengthOptions = useMemo(
    () =>
      [
        ...new Set(
          POOL_FILTER_CATALOG.filter(
            (item) =>
              (!inputs.environment || item.environment === inputs.environment) &&
              (!inputs.system || item.system === inputs.system) &&
              (!inputs.brand || item.brand === inputs.brand)
          )
            .map((item) => item.dimensions.length)
            .filter(Boolean)
        ),
      ]
        .sort((a, b) => (a! > b! ? 1 : -1))
        .map((value) => value!),
    [inputs.environment, inputs.system, inputs.brand]
  );

  const topConnectorOptions = useMemo(
    () =>
      [
        ...new Set(
          POOL_FILTER_CATALOG.filter(
            (item) =>
              (!inputs.environment || item.environment === inputs.environment) &&
              (!inputs.system || item.system === inputs.system)
          )
            .map((item) => item.dimensions.topStyle)
            .filter(Boolean)
        ),
      ] as ConnectorStyle[],
    [inputs.environment, inputs.system]
  );

  const bottomConnectorOptions = useMemo(
    () =>
      [
        ...new Set(
          POOL_FILTER_CATALOG.filter(
            (item) =>
              (!inputs.environment || item.environment === inputs.environment) &&
              (!inputs.system || item.system === inputs.system)
          )
            .map((item) => item.dimensions.bottomStyle)
            .filter(Boolean)
        ),
      ] as ConnectorStyle[],
    [inputs.environment, inputs.system]
  );

  const turnoverRecommendation = useMemo(() => {
    if (!inputs.poolVolume || !inputs.desiredTurnoverHours) return undefined;
    const flowRate = parseFloat(
      (inputs.poolVolume / (inputs.desiredTurnoverHours * 60)).toFixed(1)
    );
    return flowRate;
  }, [inputs.poolVolume, inputs.desiredTurnoverHours]);

  const calculateMatches = (payload: PoolWizardInput): PoolWizardMatch[] => {
    let candidates = [...POOL_FILTER_CATALOG];

    if (payload.environment) {
      candidates = candidates.filter((item) => item.environment === payload.environment);
    }
    if (payload.system) {
      candidates = candidates.filter((item) => item.system === payload.system);
    }
    if (payload.brand) {
      candidates = candidates.filter((item) => item.brand === payload.brand);
    }
    if (payload.series) {
      candidates = candidates.filter((item) => item.series === payload.series);
    }

    const withScores = candidates.map((item) => {
      const reasoning: string[] = [];
      let score = 0;

      if (payload.environment && item.environment === payload.environment) {
        score += 25;
        reasoning.push(`Designed for ${payload.environment.replace('-', ' ')} applications.`);
      }
      if (payload.system && item.system === payload.system) {
        score += 25;
        reasoning.push(`Matches your ${payload.system.toUpperCase()} filter system.`);
      }
      if (payload.brand && item.brand === payload.brand) {
        score += 20;
        reasoning.push(`OEM fit for ${payload.brand} housings.`);
      }
      if (payload.series && item.series === payload.series) {
        score += 10;
        reasoning.push(`Exact match for the ${payload.series} series.`);
      }

      const diameterMatch = withinTolerance(payload.diameter, item.dimensions.diameter);
      const lengthMatch = withinTolerance(payload.length, item.dimensions.length);
      if (payload.diameter && diameterMatch) {
        score += 10;
        reasoning.push('Diameter within \u00B10.25" tolerance.');
      }
      if (payload.length && lengthMatch) {
        score += 10;
        reasoning.push('Length within \u00B10.25" tolerance.');
      }

      const topMatch =
        payload.topStyle === 'any' ||
        !payload.topStyle ||
        !item.dimensions.topStyle ||
        item.dimensions.topStyle === payload.topStyle;
      if (payload.topStyle && topMatch) {
        score += 5;
        reasoning.push(`Top connector style matches (${connectorLabel(item.dimensions.topStyle)}).`);
      }

      const bottomMatch =
        payload.bottomStyle === 'any' ||
        !payload.bottomStyle ||
        !item.dimensions.bottomStyle ||
        item.dimensions.bottomStyle === payload.bottomStyle;
      if (payload.bottomStyle && bottomMatch) {
        score += 5;
        reasoning.push(
          `Bottom connector style matches (${connectorLabel(item.dimensions.bottomStyle)}).`
        );
      }

      if (payload.poolVolume && item.recommendedVolume) {
        if (
          payload.poolVolume >= item.recommendedVolume.minGallons &&
          payload.poolVolume <= item.recommendedVolume.maxGallons
        ) {
          score += 10;
          reasoning.push('Sized correctly for your pool volume.');
        } else {
          reasoning.push(
            `Recommended for pools ${formatGallons(item.recommendedVolume.minGallons)} - ${formatGallons(
              item.recommendedVolume.maxGallons
            )} gallons.`
          );
        }
      }

      return { productId: item.id, score, reasoning };
    });

    return withScores
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  };

  const handleAdvance = (direction: 'next' | 'prev') => {
    setActiveStep((prev) => {
      if (direction === 'next') {
        return Math.min(prev + 1, STEPS.length);
      }
      return Math.max(prev - 1, 1);
    });
  };

  const handleInputChange = (changes: Partial<PoolWizardInput>) => {
    setInputs((prev) => ({ ...prev, ...changes }));
  };

  const handleGenerateMatches = () => {
    const matches = calculateMatches(inputs);
    const result: PoolWizardResult = {
      inputs,
      matches,
      calculatedFlowRate: turnoverRecommendation,
      maintenanceReminder:
        inputs.poolVolume && inputs.desiredTurnoverHours
          ? `Aim for a pump and filter combination that circulates ${formatGallons(
              inputs.poolVolume
            )} gallons every ${inputs.desiredTurnoverHours} hours.`
          : undefined,
    };
    setWizardResult(result);
    onResult?.(result);
    setActiveStep(5);
  };

  const resetWizard = () => {
    setInputs({ desiredTurnoverHours: 8 });
    setWizardResult(null);
    setActiveStep(1);
  };

  const renderStepActions = () => (
    <div className="flex justify-between items-center mt-6">
      <Button
        variant="secondary"
        className="flex items-center gap-2"
        onClick={() => handleAdvance('prev')}
        disabled={activeStep === 1}
        type="button"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </Button>
      {activeStep < 4 && (
        <Button
          className="flex items-center gap-2"
          onClick={() => handleAdvance('next')}
          disabled={
            (activeStep === 1 && !inputs.environment) ||
            (activeStep === 2 && !inputs.system) ||
            (activeStep === 3 && !inputs.brand)
          }
          type="button"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
      {activeStep === 4 && (
        <Button className="flex items-center gap-2" onClick={handleGenerateMatches} type="button">
          Generate Matches
          <Sparkles className="w-4 h-4" />
        </Button>
      )}
    </div>
  );

  const renderSummaryCard = () => {
    if (!wizardResult || wizardResult.matches.length === 0) {
      return (
        <Card className="p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <Sparkles className="w-10 h-10 text-brand-orange" />
            <div>
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-gray-100">
                Ready for a precise match
              </h3>
              <p className="text-brand-gray-600 dark:text-gray-300">
                Confirm your measurements or broaden filters. We’ll map out compatible cartridges and
                media automatically.
              </p>
            </div>
            <Button onClick={resetWizard} type="button">
              Start Over
            </Button>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {wizardResult.matches.map((match) => {
          const product = POOL_FILTER_CATALOG.find((item) => item.id === match.productId);
          if (!product) return null;
          const seasonalPromos = deriveSeasonalPromos(product.promoTags);
          return (
            <Card key={product.id} className="p-6 space-y-4 border border-brand-orange/20">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-brand-orange font-semibold uppercase">
                    <Sparkles className="w-4 h-4" />
                    Wizard Match Score: {match.score}
                  </div>
                  <h3 className="text-2xl font-bold text-brand-gray-900 dark:text-gray-100 mt-1">
                    {product.name}
                  </h3>
                  <p className="text-brand-gray-600 dark:text-gray-300">
                    {product.brand} • SKU {product.sku}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.defaultBadges?.map((badge) => (
                      <span
                        key={badge}
                        className="px-3 py-1 text-xs font-semibold rounded-full bg-brand-blue/10 text-brand-blue"
                      >
                        {badge}
                      </span>
                    ))}
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-brand-orange/10 text-brand-orange">
                      Wizard Pick
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-brand-orange">{formatCurrency(product.price)}</div>
                  {product.originalPrice && (
                    <div className="text-sm text-brand-gray-500 line-through">
                      {formatCurrency(product.originalPrice)}
                    </div>
                  )}
                  <div className="mt-2 text-green-600 flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-4 h-4" />
                    In Stock & ready to ship
                  </div>
                  <a
                    href={product.productUrl}
                    className="inline-flex items-center justify-center mt-4 px-4 py-2 rounded-lg bg-brand-orange text-white font-semibold hover:bg-brand-orange/90 transition"
                  >
                    View Details
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-brand-gray-700 dark:text-gray-300">
                <div>
                  <h4 className="font-semibold text-brand-gray-900 dark:text-gray-100 mb-2">Sizing</h4>
                  <ul className="space-y-1">
                    {product.dimensions.diameter && (
                      <li>Diameter: {product.dimensions.diameter.toFixed(3)}"</li>
                    )}
                    {product.dimensions.length && <li>Length: {product.dimensions.length.toFixed(3)}"</li>}
                    {product.dimensions.topStyle && (
                      <li>Top: {connectorLabel(product.dimensions.topStyle)}</li>
                    )}
                    {product.dimensions.bottomStyle && (
                      <li>Bottom: {connectorLabel(product.dimensions.bottomStyle)}</li>
                    )}
                    {product.dimensions.connectorNotes && <li>{product.dimensions.connectorNotes}</li>}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-brand-gray-900 dark:text-gray-100 mb-2">
                    Performance
                  </h4>
                  <ul className="space-y-1">
                    <li>Flow Rate: {product.flowRateGpm} GPM</li>
                    {product.surfaceAreaSqFt && <li>Surface Area: {product.surfaceAreaSqFt} sq ft</li>}
                    <li>
                      Ideal Pool Volume:{' '}
                      {formatGallons(product.recommendedVolume.minGallons)} –{' '}
                      {formatGallons(product.recommendedVolume.maxGallons)} gallons
                    </li>
                    {wizardResult.calculatedFlowRate && (
                      <li>
                        Matches required flow of{' '}
                        <strong>{wizardResult.calculatedFlowRate.toFixed(1)} GPM</strong>
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-brand-gray-900 dark:text-gray-100 mb-2">
                    Compatible With
                  </h4>
                  <ul className="space-y-1">
                    {product.compatibility.map((compat) => (
                      <li key={`${compat.brand}-${compat.sku}`}>
                        {compat.brand} — {compat.sku}
                        {compat.notes && <span className="block text-xs text-brand-gray-500">{compat.notes}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {match.reasoning.length > 0 && (
                <div className="bg-brand-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-sm text-brand-gray-700 dark:text-gray-200">
                  <h4 className="font-semibold text-brand-gray-900 dark:text-gray-100 mb-2">
                    Why we matched this filter
                  </h4>
                  <ul className="list-disc ml-5 space-y-1">
                    {match.reasoning.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {seasonalPromos.length > 0 && (
                <div className="border rounded-lg border-brand-orange/30 bg-brand-orange/5 p-4">
                  <div className="flex items-center gap-2 text-brand-orange font-semibold uppercase text-xs tracking-wide">
                    <ThermometerSun className="w-4 h-4" />
                    Seasonal Specials
                  </div>
                  <div className="mt-3 space-y-3">
                    {seasonalPromos.map((season) => (
                      <div key={season.tag}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h5 className="text-brand-gray-900 dark:text-gray-100 font-semibold text-sm">
                            {season.title} <span className="text-xs text-brand-gray-500">({season.months})</span>
                          </h5>
                          {season.promos.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {season.promos.map((promo) => (
                                <span
                                  key={promo!.code}
                                  className="px-3 py-1 rounded-full bg-white text-brand-orange border border-brand-orange/40 text-xs font-semibold"
                                >
                                  Code: {promo!.code}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-brand-gray-600 dark:text-gray-300 mt-1">
                          {season.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-brand-gray-700 dark:text-gray-300">
                <div>
                  <h4 className="font-semibold text-brand-gray-900 dark:text-gray-100 mb-2">
                    Maintenance Checklist
                  </h4>
                  <ul className="list-disc ml-5 space-y-1">
                    {product.maintenanceTips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-brand-gray-900 dark:text-gray-100 mb-2">
                    Feature Highlights
                  </h4>
                  <ul className="list-disc ml-5 space-y-1">
                    {product.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {environments.map((environment) => {
              const selected = inputs.environment === environment;
              return (
                <button
                  key={environment}
                  type="button"
                  className={cn(
                    'rounded-lg border-2 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 bg-white dark:bg-gray-800',
                    selected ? 'border-brand-orange bg-brand-orange/10 shadow-lg' : 'border-transparent'
                  )}
                  onClick={() => handleInputChange({ environment })}
                  aria-pressed={selected}
                >
                  <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 capitalize">
                    {environment.replace('-', ' ')}
                  </h3>
                  <p className="mt-2 text-sm text-brand-gray-600 dark:text-gray-300">
                    {environment === 'in-ground' &&
                      'Full-size residential pool systems with multi-speed pumps and large housings.'}
                    {environment === 'above-ground' &&
                      'Compact pool systems with plug-and-play equipment packs and smaller cartridges.'}
                    {environment === 'spa' &&
                      'Hot tubs & swim spas needing quick turnover and high-temperature resistant media.'}
                  </p>
                </button>
              );
            })}
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {systems.map((system) => {
              const selected = inputs.system === system;
              return (
                <button
                  key={system}
                  type="button"
                  className={cn(
                    'rounded-lg border-2 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 bg-white dark:bg-gray-800',
                    selected ? 'border-brand-orange bg-brand-orange/10 shadow-lg' : 'border-transparent'
                  )}
                  onClick={() => handleInputChange({ system })}
                  aria-pressed={selected}
                >
                  <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 capitalize">
                    {system.toUpperCase()}
                  </h3>
                  <p className="mt-2 text-sm text-brand-gray-600 dark:text-gray-300">
                    {system === 'cartridge' &&
                      'Most common residential system. Requires diameter/length matching for precise fit.'}
                    {system === 'sand' &&
                      'Sand media filters sized by tank diameter and pump flow. Great for above-ground pools.'}
                    {system === 'de' &&
                      'DE (diatomaceous earth) grids offer the clearest water. Match grid assembly size to tank.'}
                  </p>
                </button>
              );
            })}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {brands.map((brand) => {
                const selected = inputs.brand === brand;
                return (
                  <button
                    key={brand}
                    type="button"
                    className={cn(
                      'rounded-lg border-2 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 bg-white dark:bg-gray-800',
                      selected ? 'border-brand-orange bg-brand-orange/10 shadow-lg' : 'border-transparent'
                    )}
                    onClick={() => handleInputChange({ brand })}
                    aria-pressed={selected}
                  >
                    <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100">
                      {brand}
                    </h3>
                    <p className="mt-2 text-sm text-brand-gray-600 dark:text-gray-300">
                      {brand} compatible filters in stock with full warranty coverage.
                    </p>
                  </button>
                );
              })}
            </div>
            {seriesOptions.length > 0 && (
              <div className="bg-brand-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <label
                  className="text-sm font-semibold text-brand-gray-900 dark:text-gray-100"
                  htmlFor={seriesSelectId}
                >
                  Filter Series (optional)
                </label>
                <select
                  id={seriesSelectId}
                  className="mt-2 w-full px-4 py-2 rounded-lg border border-brand-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-brand-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  value={inputs.series ?? ''}
                  onChange={(event) =>
                    handleInputChange({ series: event.target.value || undefined })
                  }
                >
                  <option value="">Any compatible series</option>
                  {seriesOptions.map((series) => (
                    <option key={series} value={series}>
                      {series}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="text-sm font-semibold text-brand-gray-900 dark:text-gray-100"
                  htmlFor={diameterSelectId}
                >
                  Cartridge Diameter (inches)
                </label>
                <select
                  id={diameterSelectId}
                  className="mt-2 w-full px-4 py-2 rounded-lg border border-brand-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-brand-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  value={inputs.diameter ?? ''}
                  onChange={(event) =>
                    handleInputChange({
                      diameter: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                  disabled={inputs.system !== 'cartridge'}
                >
                  <option value="">Skip / Not sure</option>
                  {diameterOptions.map((diameter) => (
                    <option key={diameter} value={diameter}>
                      {diameter.toFixed(3)}"
                    </option>
                  ))}
                </select>
                <p className="text-xs text-brand-gray-500 mt-2">
                  We match within ±{DIMENSION_TOLERANCE_INCHES}" tolerance. Measure edge-to-edge across the tank.
                </p>
              </div>
              <div>
                <label
                  className="text-sm font-semibold text-brand-gray-900 dark:text-gray-100"
                  htmlFor={lengthSelectId}
                >
                  Cartridge Length (inches)
                </label>
                <select
                  id={lengthSelectId}
                  className="mt-2 w-full px-4 py-2 rounded-lg border border-brand-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-brand-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  value={inputs.length ?? ''}
                  onChange={(event) =>
                    handleInputChange({
                      length: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                  disabled={inputs.system !== 'cartridge'}
                >
                  <option value="">Skip / Not sure</option>
                  {lengthOptions.map((length) => (
                    <option key={length} value={length}>
                      {length.toFixed(3)}"
                    </option>
                  ))}
                </select>
                <p className="text-xs text-brand-gray-500 mt-2">
                  Length measured gasket-to-gasket. Include any molded handles.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="text-sm font-semibold text-brand-gray-900 dark:text-gray-100"
                  htmlFor={topConnectorSelectId}
                >
                  Top Connector Style
                </label>
                <select
                  id={topConnectorSelectId}
                  className="mt-2 w-full px-4 py-2 rounded-lg border border-brand-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-brand-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  value={inputs.topStyle ?? 'any'}
                  onChange={(event) =>
                    handleInputChange({
                      topStyle:
                        event.target.value === 'any'
                          ? 'any'
                          : (event.target.value as ConnectorStyle),
                    })
                  }
                >
                  <option value="any">Any / Not sure</option>
                  {topConnectorOptions.map((style) => (
                    <option key={style} value={style}>
                      {connectorLabel(style)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="text-sm font-semibold text-brand-gray-900 dark:text-gray-100"
                  htmlFor={bottomConnectorSelectId}
                >
                  Bottom Connector Style
                </label>
                <select
                  id={bottomConnectorSelectId}
                  className="mt-2 w-full px-4 py-2 rounded-lg border border-brand-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-brand-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  value={inputs.bottomStyle ?? 'any'}
                  onChange={(event) =>
                    handleInputChange({
                      bottomStyle:
                        event.target.value === 'any'
                          ? 'any'
                          : (event.target.value as ConnectorStyle),
                    })
                  }
                >
                  <option value="any">Any / Not sure</option>
                  {bottomConnectorOptions.map((style) => (
                    <option key={style} value={style}>
                      {connectorLabel(style)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="text-sm font-semibold text-brand-gray-900 dark:text-gray-100"
                  htmlFor={poolVolumeInputId}
                >
                  Pool Volume (gallons)
                </label>
                <input
                  type="number"
                  id={poolVolumeInputId}
                  className="mt-2 w-full px-4 py-2 rounded-lg border border-brand-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-brand-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  placeholder="e.g. 20,000"
                  min={0}
                  value={inputs.poolVolume ?? ''}
                  onChange={(event) =>
                    handleInputChange({
                      poolVolume: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
                <p className="text-xs text-brand-gray-500 mt-2">
                  Not sure? Multiply (length × width × average depth × 7.5) for pools, 7.48 for spas.
                </p>
              </div>
              <div>
                <label
                  className="text-sm font-semibold text-brand-gray-900 dark:text-gray-100"
                  htmlFor={turnoverSelectId}
                >
                  Desired Turnover (hours)
                </label>
                <select
                  id={turnoverSelectId}
                  className="mt-2 w-full px-4 py-2 rounded-lg border border-brand-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-brand-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  value={inputs.desiredTurnoverHours}
                  onChange={(event) =>
                    handleInputChange({
                      desiredTurnoverHours: Number(event.target.value),
                    })
                  }
                >
                  {turnoverGuidelines.map((option) => (
                    <option key={option.label} value={option.hours}>
                      {option.label} ({option.hours} hours)
                    </option>
                  ))}
                  <option value={12}>Energy saver (12 hours)</option>
                </select>
                <p className="text-xs text-brand-gray-500 mt-2">
                  Faster turnover improves clarity but requires higher flow and energy.
                </p>
              </div>
            </div>

            {turnoverRecommendation && (
              <Card className="p-4 bg-brand-blue/5 border border-brand-blue/30">
                <div className="flex items-start gap-3 text-sm text-brand-gray-700 dark:text-gray-200">
                  <Info className="w-5 h-5 text-brand-blue mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-brand-gray-900 dark:text-gray-100">
                      Recommended Flow Rate
                    </h4>
                    <p>
                      To turn over {formatGallons(inputs.poolVolume!)} gallons every{' '}
                      {inputs.desiredTurnoverHours} hours, target{' '}
                      <strong>{turnoverRecommendation.toFixed(1)} GPM</strong>. Select filters and pumps
                      rated for this flow.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );
      case 5:
        return <div className="space-y-6">{renderSummaryCard()}</div>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
                Pool Filter Finder Wizard
              </div>
              <h2 className="text-3xl font-bold text-brand-gray-900 dark:text-gray-100 mt-1">
                Guided compatibility for crystal clear water
              </h2>
              <p className="text-brand-gray-600 dark:text-gray-300 mt-2">
                Follow the guided steps to match filters by environment, system, dimensions, and performance.
                We’ll surface compatible cartridges, media, and seasonal promos automatically.
              </p>
            </div>
            <div className="text-sm text-brand-gray-500">
              Step {activeStep} of {STEPS.length}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {STEPS.map((step) => (
              <button
                key={step.id}
                type="button"
                className={cn(
                  'text-left rounded-lg border p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2',
                  step.id === activeStep
                    ? 'border-brand-orange bg-brand-orange/10 text-brand-gray-900 dark:text-gray-100'
                    : 'border-brand-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-brand-gray-600 dark:text-gray-300'
                )}
                onClick={() => setActiveStep(step.id)}
                aria-current={step.id === activeStep ? 'step' : undefined}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-brand-orange">
                  Step {step.id}
                </div>
                <div className="mt-1 text-sm font-semibold text-brand-gray-900 dark:text-gray-100">
                  {step.title}
                </div>
                <p className="mt-1 text-xs text-brand-gray-500">{step.description}</p>
              </button>
            ))}
          </div>

          <div>{renderStepContent()}</div>

          {activeStep < 5 && renderStepActions()}
        </div>
      </Card>

      {activeStep === 5 && wizardResult && (
        <div className="bg-brand-gray-50 dark:bg-gray-800/50 border border-brand-orange/20 rounded-lg p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
                Personalized Plan
              </div>
              <h3 className="text-2xl font-bold text-brand-gray-900 dark:text-gray-100">
                Recommended replacements & upkeep schedule
              </h3>
              <p className="text-brand-gray-600 dark:text-gray-300 mt-1">
                Based on your selections we’ve mapped out compatible filters, flow targets, and seasonal promos.
              </p>
            </div>
            <Button variant="secondary" onClick={resetWizard} type="button">
              Start a new wizard
            </Button>
          </div>
          {wizardResult.maintenanceReminder && (
            <Card className="p-4 bg-white dark:bg-gray-900">
              <div className="flex items-start gap-3 text-sm text-brand-gray-700 dark:text-gray-300">
                <Info className="w-5 h-5 text-brand-orange mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-brand-gray-900 dark:text-gray-100">
                    Flow Planning Tip
                  </h4>
                  <p>{wizardResult.maintenanceReminder}</p>
                </div>
              </div>
            </Card>
          )}
          {renderSummaryCard()}
        </div>
      )}
    </div>
  );
}


