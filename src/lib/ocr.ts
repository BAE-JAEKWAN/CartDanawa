import Tesseract from 'tesseract.js'

export interface OCRResult {
  text: string
  price: number | null
  productName: string | null
}

export async function processImage(imageSrc: string): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(imageSrc, 'kor+eng', {
      logger: m => console.log(m), // Optional: log progress
    })

    const text = result.data.text
    const { price, productName } = parsePriceTag(text)

    return {
      text,
      price,
      productName,
    }
  } catch (error) {
    console.error('OCR Error:', error)
    return { text: '', price: null, productName: null }
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
