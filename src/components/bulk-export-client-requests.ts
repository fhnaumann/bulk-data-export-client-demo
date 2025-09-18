import { ref } from 'vue'

interface PollResult {
  status: 'in-progress' | 'complete' | 'error'
  progress?: string
  data?: BulkExportResult
  error?: string
}

interface BulkExportOutput {
  type: string
  url: string
  count?: number
}

interface BulkExportResult {
  transactionTime: string
  request: string
  requiresAccessToken: boolean
  output: BulkExportOutput[]
  deleted?: BulkExportOutput[]
  error?: BulkExportOutput[]
}

export function useBulkExportClient() {
  const pollResult = ref<PollResult>()
  const completeResult = ref<BulkExportResult>()
  const errorResult = ref()

  async function startExport(exportUrl: string): Promise<string> {
    const response = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/fhir+json',
        Prefer: 'respond-async',
      },
    })

    if (response.status !== 202) {
      throw new Error(`Expected 202, got ${response.status}`)
    }

    const contentLocation = response.headers.get('Content-Location')
    if (!contentLocation) {
      throw new Error('Missing Content-Location header')
    }

    return contentLocation
  }

  async function pollStatus(statusUrl: string): Promise<PollResult> {
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (response.status === 202) {
      // Still in progress
      const progress = response.headers.get('X-Progress')
      return {
        status: 'in-progress',
        progress: progress || undefined,
      }
    } else if (response.status === 200) {
      // Complete
      const data = await response.json()
      return {
        status: 'complete',
        data,
      }
    } else {
      // Error
      const errorText = await response.text()
      return {
        status: 'error',
        error: errorText,
      }
    }
  }

  async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function executeExport(exportUrl: string, maxAttempts = 30): Promise<BulkExportResult> {
    // Start the export
    const statusUrl = await startExport(exportUrl)

    // Poll with exponential backoff
    let attempt = 0
    let delay = 1000 // Start with 1 second

    while (attempt < maxAttempts) {
      await sleep(delay)

      const result = await pollStatus(statusUrl)
      pollResult.value = result
      if (result.status === 'complete') {
        completeResult.value = result.data
        return result.data!
      } else if (result.status === 'error') {
        throw new Error(`Export failed: ${result.error}`)
      }

      // Log progress if available
      if (result.progress) {
        console.log(`Export progress: ${result.progress}`)
      }

      // Exponential backoff: double the delay, max 30 seconds
      delay = Math.min(delay * 2, 30000)
      attempt++
    }

    throw new Error('Export timed out after maximum polling attempts')
  }

  return { pollResult, completeResult, executeExport }
}
