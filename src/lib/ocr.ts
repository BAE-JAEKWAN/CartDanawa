import { createWorker } from 'tesseract.js'

export interface OCRResult {
  text: string
  price: number | null
  productName: string | null
}

export async function processImage(imageSrc: string): Promise<OCRResult> {
  try {
    const preprocessedImage = await preprocessImage(imageSrc)

    console.log('Initializing Tesseract worker...')
    const worker = await createWorker('kor+eng', 1, {
      logger: m => console.log(m),
    })

    console.log('Recognizing text...')
    const {
      data: { text },
    } = await worker.recognize(preprocessedImage)

    console.log('Raw OCR Text:', text)
    await worker.terminate()

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

// Image Preprocessing: Grayscale + High Contrast
async function preprocessImage(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(imageSrc)
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Contrast factor (0-255). 50 is a good starting point.
      const contrast = 50
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))

      for (let i = 0; i < data.length; i += 4) {
        // Grayscale
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114

        // Apply Contrast
        const newColor = factor * (gray - 128) + 128

        // Clamp to 0-255
        const final = Math.max(0, Math.min(255, newColor))

        data[i] = final // R
        data[i + 1] = final // G
        data[i + 2] = final // B
        // Alpha (data[i+3]) remains unchanged
      }

      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/jpeg'))
    }
    img.onerror = reject
    img.src = imageSrc
  })
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
