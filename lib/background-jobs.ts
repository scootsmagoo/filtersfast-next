/**
 * Minimal background job queue for admin operations.
 *
 * Jobs are processed sequentially in FIFO order within the same Node.js process.
 * This is sufficient for long-running admin tasks (CSV import/export, bulk edits)
 * while keeping the implementation lightweight.
 */

type JobExecutor = () => Promise<void> | void

interface BackgroundJob {
  id: string
  description?: string
  run: JobExecutor
}

const jobQueue: BackgroundJob[] = []
let processing = false

/**
 * Enqueue a background job for asynchronous processing.
 */
export function enqueueBackgroundJob(job: BackgroundJob): void {
  jobQueue.push(job)
  if (!processing) {
    void processQueue()
  }
}

/**
 * Inspect queue state (useful for diagnostics/UI).
 */
export function getBackgroundJobState(): {
  pending: number
  processing: boolean
} {
  return {
    pending: jobQueue.length + (processing ? 1 : 0),
    processing
  }
}

async function processQueue(): Promise<void> {
  if (processing) return
  processing = true

  try {
    while (jobQueue.length > 0) {
      const job = jobQueue.shift()
      if (!job) continue

      try {
        await Promise.resolve(job.run())
      } catch (error) {
        console.error(`Background job "${job.id}" failed:`, error)
      }
    }
  } finally {
    processing = false
  }
}

