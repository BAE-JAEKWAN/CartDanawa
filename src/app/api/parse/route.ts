import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not set' },
        { status: 500 }
      )
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
    You are a smart shopping assistant. 
    Extract the "Product Name" and "Price" from the following OCR text.
    The text might be messy, contain random characters, or be a mix of Korean and English.
    
    Rules:
    1. **Price**: Look for the largest number that likely represents a price (e.g., 4830, 10000). Ignore small numbers like "100g", "1등급".
    2. **Product Name**: Look for the main product description (e.g., "한우 등심", "서울우유"). Ignore "Price", "Discount", "Origin".
    3. **Correction**: Fix obvious OCR typos (e.g., "한우 둥심" -> "한우 등심").
    
    Return ONLY a JSON object with this format:
    {
      "productName": "string",
      "price": number
    }
    
    OCR Text:
    """
    ${text}
    """
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const textResponse = response.text()

    // Clean up markdown code blocks if present
    const jsonString = textResponse.replace(/```json|```/g, '').trim()
    const data = JSON.parse(jsonString)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Gemini API Error:', error)
    return NextResponse.json({ error: 'Failed to parse text' }, { status: 500 })
  }
}
