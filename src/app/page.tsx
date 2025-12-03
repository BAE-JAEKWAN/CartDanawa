'use client'

import { useState } from 'react'
import { CameraScanner } from '@/components/CameraScanner'
import { Button } from '@/components/ui/Button'
import { Camera, Loader2, Plus } from 'lucide-react'
import Image from 'next/image'
import { processImage, type OCRResult } from '@/lib/ocr'
import { useCartStore } from '@/lib/store'
import { CartList } from '@/components/CartList'
import { TotalBar } from '@/components/TotalBar'

export default function Home() {
  const [isScanning, setIsScanning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [scannedImage, setScannedImage] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)

  const addItem = useCartStore(state => state.addItem)

  const handleAddToCart = () => {
    if (ocrResult) {
      addItem(ocrResult.productName || 'Unknown Item', ocrResult.price || 0)
      setScannedImage(null)
      setOcrResult(null)
    }
  }

  const handleCapture = async (imageSrc: string) => {
    setScannedImage(imageSrc)
    setIsScanning(false)
    setIsProcessing(true)

    try {
      const result = await processImage(imageSrc)
      setOcrResult(result)
    } catch (error) {
      console.error('Processing failed', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gray-50">
      <header className="w-full max-w-md py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cart Danawa</h1>
      </header>

      <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center space-y-8">
        {scannedImage ? (
          <div className="w-full space-y-4">
            <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <Image
                src={scannedImage}
                alt="Scanned price tag"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setScannedImage(null)
                  setOcrResult(null)
                }}
              >
                Retake
              </Button>
              <Button className="flex-1" onClick={() => setIsScanning(true)}>
                Scan Another
              </Button>
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600">Analyzing price tag...</span>
              </div>
            )}

            {ocrResult && !isProcessing && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <h3 className="font-semibold text-gray-900">Detected Info</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Price:</div>
                  <div className="font-bold text-blue-600">
                    {ocrResult.price
                      ? `${ocrResult.price.toLocaleString()}원`
                      : 'Not found'}
                  </div>
                  <div className="text-gray-500">Product:</div>
                  <div className="truncate">
                    {ocrResult.productName || 'Unknown'}
                  </div>
                </div>

                <Button className="w-full" onClick={handleAddToCart}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>

                <details className="mt-2 text-xs text-gray-400">
                  <summary className="cursor-pointer hover:text-gray-600">
                    Raw Text
                  </summary>
                  <pre className="mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                    {ocrResult.text}
                  </pre>
                </details>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <CartList />
            </div>

            {/* Floating Action Button for Scanning */}
            <div className="fixed bottom-24 right-4 z-30">
              <Button
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsScanning(true)}
              >
                <Camera className="h-6 w-6 text-white" />
              </Button>
            </div>

            <TotalBar />
          </div>
        )}
      </div>

      {isScanning && (
        <CameraScanner
          onCapture={handleCapture}
          onClose={() => setIsScanning(false)}
        />
      )}
    </main>
  )
}
