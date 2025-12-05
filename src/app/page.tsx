'use client'

import { useState, useEffect } from 'react'
import { CameraScanner } from '@/components/CameraScanner'
import { Button } from '@/components/ui/Button'
import { Camera } from 'lucide-react'
import { processImage } from '@/lib/ocr'
import { useCartStore } from '@/lib/store'
import { CartList } from '@/components/CartList'
import { TotalBar } from '@/components/TotalBar'

export default function Home() {
  const [isScanning, setIsScanning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastScanned, setLastScanned] = useState<{
    price: number
    time: number
  } | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const addItem = useCartStore(state => state.addItem)

  // Clear toast after 2 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  const handleCapture = async (imageSrc: string) => {
    // If already processing or recently scanned same item, skip
    if (isProcessing) return

    setIsProcessing(true)

    try {
      const result = await processImage(imageSrc)
      console.log('imageSrc:', imageSrc)
      console.log('OCR Result:', result)

      if (result.price) {
        const now = Date.now()
        // Duplicate check: Same price within 3 seconds
        if (
          lastScanned &&
          lastScanned.price === result.price &&
          now - lastScanned.time < 3000
        ) {
          // Skip duplicate
        } else {
          // Add new item
          addItem(result.productName || 'Item', result.price)
          setLastScanned({ price: result.price, time: now })
          setToastMessage(`Added: ${result.price.toLocaleString()}원`)

          // Optional: Vibrate device
          if (navigator.vibrate) navigator.vibrate(200)

          // Close camera after successful scan
          setIsScanning(false)
        }
      }
    } catch (error) {
      console.error('Processing failed', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gray-50">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 text-white px-6 py-3 rounded-full shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      <header className="w-full max-w-md py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cart Danawa</h1>
      </header>

      <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center space-y-8">
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
