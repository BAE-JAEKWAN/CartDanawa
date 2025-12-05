import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { text, image } = await req.json()

    console.log('=== Gemini API Request ===')
    console.log('API Key exists:', !!process.env.GEMINI_API_KEY)
    console.log('Text length:', text?.length)
    console.log('Image provided:', !!image)

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set!')
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not set' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    let prompt = []

    const commonInstructions = `
    You are a smart shopping assistant. 
    Extract the "Product Name" and "Price" from the provided input (image or text).
    
    Rules:
    1. **Price**: Look for the largest number that likely represents a price (e.g., 4830, 10000). Ignore small numbers like "100g", "1등급".
    2. **Product Name**: Look for the main product description (e.g., "한우 등심", "서울우유"). Ignore "Price", "Discount", "Origin".
    3. **Correction**: Fix obvious typos if the input is text.
    
    Return ONLY a JSON object with this format:
    {
      "productName": "string",
      "price": number
    }
    `

    if (image) {
      // Image input (Vision)
      // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
      const base64Data = image.split(',')[1] || image

      prompt = [
        commonInstructions,
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg',
          },
        },
      ]
    } else {
      // Text input (Legacy/Fallback)
      prompt = [
        `
        ${commonInstructions}
        
        OCR Text:
        """
        ${text}
        """
        `,
      ]
    }

    console.log('Calling Gemini API...')
    const result = await model.generateContent(prompt)
    const response = await result.response
    const textResponse = response.text()

    console.log('Gemini response:', textResponse)

    // Clean up markdown code blocks if present
    const jsonString = textResponse.replace(/```json|```/g, '').trim()
    const data = JSON.parse(jsonString)

    console.log('Parsed data:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('=== Gemini API Error ===')
    console.error(
      'Error type:',
      error instanceof Error ? error.constructor.name : typeof error
    )
    console.error(
      'Error message:',
      error instanceof Error ? error.message : String(error)
    )
    console.error('Full error:', error)
    return NextResponse.json({ error: 'Failed to parse text' }, { status: 500 })
  }
}
