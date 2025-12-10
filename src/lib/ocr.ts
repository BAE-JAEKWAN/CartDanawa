// --- Types ---
export type OCRResult = {
  text: string
  price: number | null
  productName: string | null
}

type GeminiPayload = { text?: string; image?: string }
type GeminiResponse = { price: number | null; productName: string | null }

// ES2024: Promise.withResolvers 타입 정의 (혹시 환경에 없을 경우 대비)
type PromiseController<T> = {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

type QueueItem = {
  payload: GeminiPayload
  promiseControls: PromiseController<GeminiResponse>
}

// --- Constants ---
const GEMINI_THROTTLE_MS = 1500
const MIN_PRICE = 100

// --- 1. Queue Factory (Closure + Arrow Functions) ---
const createThrottledQueue = (delayMs: number) => {
  const queue: QueueItem[] = []
  let isProcessing = false

  // 내부 함수도 화살표 함수로 정의
  const process = async () => {
    if (isProcessing || queue.length === 0) return
    isProcessing = true

    while (queue.length > 0) {
      const { payload, promiseControls } = queue.shift()!

      try {
        const result = await fetchParseApi(payload)
        promiseControls.resolve(result)
      } catch (err) {
        promiseControls.reject(err)
      }

      if (queue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
    isProcessing = false
  }

  // 외부 노출 함수
  return (payload: GeminiPayload): Promise<GeminiResponse> => {
    // ✨ ES2024: Promise.withResolvers 사용
    const promiseControls = Promise.withResolvers<GeminiResponse>()
    
    queue.push({ payload, promiseControls })
    process() // Trigger processing

    return promiseControls.promise
  }
}

// --- 2. API Fetcher (Arrow Function) ---
const fetchParseApi = async (payload: GeminiPayload): Promise<GeminiResponse> => {
  const res = await fetch('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  
  const data = await res.json() as Partial<GeminiResponse>
  return { 
    price: data.price ?? null, 
    productName: data.productName ?? null 
  }
}

// --- 3. Parsing Logic (Arrow Function & Functional Chaining) ---
const parsePriceTag = (text: string): GeminiResponse => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const priceRegex = /([\d,]+)\s*(원|₩)?/g

  // Implicit Return을 활용한 깔끔한 계산 로직
  const maxPrice = lines
    .flatMap(line => Array.from(line.matchAll(priceRegex)))
    .map(match => Number(match[1].replace(/,/g, '')))
    .filter(num => !Number.isNaN(num) && num > MIN_PRICE)
    .reduce((max, curr) => Math.max(max, curr), 0)

  const productName = lines
    .filter(line => {
      const numericPart = line.replace(/\D/g, '')
      const isPriceLike = numericPart.length > 3 && /[\d,]+(원|₩)?/.test(line)
      return !isPriceLike
    })
    .reduce((longest, curr) => (curr.length > longest.length ? curr : longest), '')

  return {
    price: maxPrice || null,
    productName: productName || null,
  }
}

// 큐 인스턴스 초기화
const enqueueImageRequest = createThrottledQueue(GEMINI_THROTTLE_MS)

// --- 4. Main Export (Arrow Function) ---
export const processImage = async (imageSrc: string): Promise<OCRResult> => {
  console.log('Processing with Gemini Vision...')

  try {
    const result = imageSrc
      ? await enqueueImageRequest({ image: imageSrc })
      : await fetchParseApi({ text: 'text-fallback' })

    return { text: 'Gemini Vision', ...result }
  } catch (error) {
    console.error('OCR Error:', error)
    return { text: '', ...parsePriceTag('') }
  }
}

// --- Polyfill (ES2024 Support for older environments) ---
if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = <T>() => {
    let resolve!: (value: T | PromiseLike<T>) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}