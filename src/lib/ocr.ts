export interface OCRResult {
  text: string
  price: number | null
  productName: string | null
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
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, image }),
    })

    if (!response.ok) {
      throw new Error('API request failed')
    }

    const data = await response.json()
    return {
      price: data.price,
      productName: data.productName,
    }
  } catch (error) {
    console.error('Gemini Parsing Failed, falling back to regex:', error)
    return parsePriceTag(text || '') // Fallback to local regex if API fails
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
