import {
  getBusinessReviews,
  getImportedProductReviews,
  getProductReviews,
  type TrustPilotReview,
} from '../trustpilot/client'
import { upsertReview, type ReviewSource } from '../db/reviews'

export interface SyncReviewsOptions {
  pages?: number
  perPage?: number
  productSkus?: string[]
  includeImported?: boolean
  log?: boolean
}

export interface SyncResult {
  processed: number
  inserted: number
  updated: number
  errors: string[]
}

function mapReviewSource(source: 'business' | 'product' | 'imported'): ReviewSource {
  return source === 'imported' ? 'imported' : 'trustpilot'
}

function extractMetadata(review: TrustPilotReview) {
  const { consumer, companyReply, ...rest } = review as any
  return {
    ...rest,
  }
}

function upsertFromTrustpilot(
  review: TrustPilotReview,
  options: {
    source: 'business' | 'product' | 'imported'
    productSku?: string | null
  }
) {
  upsertReview({
    review_id: review.id,
    source: mapReviewSource(options.source),
    product_sku: options.productSku ?? null,
    rating: review.stars,
    title: review.title ?? null,
    text: review.text ?? null,
    consumer_name: review.consumer?.displayName ?? null,
    consumer_location: review.consumer?.displayLocation ?? null,
    is_verified: Boolean(review.isVerified),
    reply_text: review.companyReply?.text ?? null,
    reply_posted_at: review.companyReply?.createdAt ?? null,
    reviewed_at: review.createdAt,
    metadata: extractMetadata(review),
  })
}

async function syncReviewPage(
  fetcher: (page: number, perPage: number) => Promise<{ reviews: TrustPilotReview[] }>,
  options: {
    pages: number
    perPage: number
    source: 'business' | 'product' | 'imported'
    productSku?: string
    log?: boolean
  }
): Promise<SyncResult> {
  let page = 1
  let processed = 0
  const errors: string[] = []

  while (page <= options.pages) {
    const response = await fetcher(page, options.perPage)
    const reviews = response.reviews || []

    if (options.log) {
      console.log(
        `📄 Synced ${reviews.length} ${options.source} review(s) from Trustpilot (page ${page})`
      )
    }

    for (const review of reviews) {
      try {
        upsertFromTrustpilot(review, {
          source: options.source,
          productSku: options.productSku,
        })
        processed += 1
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error storing Trustpilot review'
        errors.push(message)
        if (options.log) {
          console.error('❌ Failed to store review', review.id, message)
        }
      }
    }

    if (reviews.length < options.perPage) {
      break
    }

    page += 1
  }

  return {
    processed,
    inserted: processed,
    updated: 0,
    errors,
  }
}

export async function syncBusinessReviews(options: SyncReviewsOptions = {}): Promise<SyncResult> {
  const pages = Math.max(1, options.pages ?? 2)
  const perPage = Math.max(1, Math.min(options.perPage ?? 100, 200))

  return syncReviewPage(getBusinessReviews, {
    pages,
    perPage,
    source: 'business',
    log: options.log,
  })
}

export async function syncProductReviews(
  sku: string,
  options: SyncReviewsOptions = {}
): Promise<SyncResult> {
  const pages = Math.max(1, options.pages ?? 1)
  const perPage = Math.max(1, Math.min(options.perPage ?? 50, 200))
  const includeImported = options.includeImported ?? true

  const results: SyncResult = {
    processed: 0,
    inserted: 0,
    updated: 0,
    errors: [],
  }

  const primary = await syncReviewPage(
    (page, perPage) => getProductReviews(sku, page, perPage),
    {
      pages,
      perPage,
      source: 'product',
      productSku: sku,
      log: options.log,
    }
  )

  results.processed += primary.processed
  results.inserted += primary.inserted
  results.errors.push(...primary.errors)

  if (!includeImported) {
    return results
  }

  const imported = await syncReviewPage(
    (page, perPage) => getImportedProductReviews(sku, page, perPage),
    {
      pages,
      perPage,
      source: 'imported',
      productSku: sku,
      log: options.log,
    }
  )

  results.processed += imported.processed
  results.inserted += imported.inserted
  results.errors.push(...imported.errors)

  return results
}

export async function syncTrustpilotReviews(options: SyncReviewsOptions = {}): Promise<SyncResult> {
  const aggregate: SyncResult = {
    processed: 0,
    inserted: 0,
    updated: 0,
    errors: [],
  }

  const businessResult = await syncBusinessReviews(options)
  aggregate.processed += businessResult.processed
  aggregate.inserted += businessResult.inserted
  aggregate.errors.push(...businessResult.errors)

  const skus = options.productSkus ?? []
  for (const sku of skus) {
    const productResult = await syncProductReviews(sku, options)
    aggregate.processed += productResult.processed
    aggregate.inserted += productResult.inserted
    aggregate.errors.push(...productResult.errors)
  }

  if (options.log) {
    console.log(`✅ Trustpilot sync complete. Reviews processed: ${aggregate.processed}`)
  }

  return aggregate
}


