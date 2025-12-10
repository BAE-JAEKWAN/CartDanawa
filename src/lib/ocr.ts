export interface OCRResult {
  text: string
  price: number | null
  productName: string | null
}

// --- Gemini throttling queue (module-scoped) ---
type GeminiPayload = { text?: string; image?: string }
type GeminiResult = { price: number | null; productName: string | null }
type ApiParseResponse = { price?: number | null; productName?: string | null }

type GeminiQueueItem = {
  payload: GeminiPayload
  resolve: (value: GeminiResult) => void
  reject: (reason?: unknown) => void
}

const GEMINI_THROTTLE_MS = 1500 // ms between image requests
const geminiQueue: GeminiQueueItem[] = []
let geminiProcessing = false

async function runGeminiQueue() {
  if (geminiProcessing) return
  geminiProcessing = true
  while (geminiQueue.length > 0) {
    const item = geminiQueue.shift()
    if (!item) break
    try {
      const resp = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      })
      if (!resp.ok) throw new Error(`API request failed: ${resp.status}`)
      const data: ApiParseResponse = await resp.json()
      item.resolve({ price: data.price ?? null, productName: data.productName ?? null })
    } catch (err) {
      item.reject(err)
    }
    // throttle pause between image requests
    await new Promise(r => setTimeout(r, GEMINI_THROTTLE_MS))
  }
  geminiProcessing = false
}

export async function processImage(imageSrc: string): Promise<OCRResult> {
  try {
    console.log('Processing image with Gemini Vision...')

    const { price, productName } = await parseWithGemini(undefined, imageSrc)

    return {
      text: 'Gemini Vision',
      price,
      productName,
    }
  } catch (error) {
    console.error('OCR Error:', error)
    return { text: '', price: null, productName: null }
  }
}

async function parseWithGemini(
  text?: string,
  image?: string
): Promise<{ price: number | null; productName: string | null }> {
  try {
    const payload: GeminiPayload = { text, image }

    // If an image is provided, enqueue the request to the throttled queue
    // so that multiple rapid image-analysis calls won't overload the server
    // or the Gemini model. Text-only requests are lightweight and sent
    // immediately.
    if (image) {
      return new Promise((resolve, reject) => {
        geminiQueue.push({
          payload,
          resolve: (res: GeminiResult) => resolve(res),
          reject: (err: unknown) => reject(err),
        })
        // Start the queue runner if not already running
        runGeminiQueue().catch(e => console.error('Gemini queue runner failed', e))
      })
    }

    // Text-only: send immediately
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error('API request failed')
    const data: ApiParseResponse = await response.json()
    return { price: data.price ?? null, productName: data.productName ?? null }
  } catch (error) {
    console.error('Gemini Parsing Failed, falling back to regex:', error)
    return parsePriceTag(text || '')
  }
}

function parsePriceTag(text: string): {
  price: number | null
  productName: string | null
} {
  // Clean up text
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  let price: number | null = null
  let productName: string | null = null

  // Regex for price: looks for numbers with optional commas, potentially ending with '원' or starting with currency symbol
  // Examples: 10,000원, 10000, ₩10,000
  const priceRegex = /([0-9,]+)\s*(원|₩)?/g

  // Heuristic: The largest number found is likely the price (or the one explicitly marked with '원')
  let maxNumber = 0

  for (const line of lines) {
    // Try to find price
    const matches = line.matchAll(priceRegex)
    for (const match of matches) {
      const numberStr = match[1].replace(/,/g, '')
      const number = parseInt(numberStr, 10)

      if (!isNaN(number) && number > maxNumber) {
        // Filter out small numbers that might be quantities or weights (e.g. 100g)
        // Prices are usually > 100 in KRW
        if (number > 100) {
          maxNumber = number
          price = number
        }
      }
    }
  }

  // Heuristic: Product name is usually the longest line of text that is NOT the price
  // This is very basic and will need refinement
  let longestLine = ''
  for (const line of lines) {
    // Skip if line looks like a price
    if (line.match(/[0-9,]+원?/) && line.replace(/[^0-9]/g, '').length > 3)
      continue

    if (line.length > longestLine.length) {
      longestLine = line
    }
  }

  if (longestLine) {
    productName = longestLine
  }

  return { price, productName }
}
