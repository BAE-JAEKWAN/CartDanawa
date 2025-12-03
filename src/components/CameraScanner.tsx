'use client'

import React, { useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { Button } from './ui/Button'
import { X } from 'lucide-react'

interface CameraScannerProps {
  onCapture: (imageSrc: string) => void
  onClose: () => void
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onCapture,
  onClose,
}) => {
  const webcamRef = useRef<Webcam>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)

  // Auto-capture every 1000ms
  React.useEffect(() => {
    let interval: NodeJS.Timeout

    if (isCameraReady) {
      interval = setInterval(() => {
        const imageSrc = webcamRef.current?.getScreenshot()
        if (imageSrc) {
          onCapture(imageSrc)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isCameraReady, onCapture])

  const videoConstraints = {
    facingMode: 'environment',
    width: { ideal: 1280 },
    height: { ideal: 720 },
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between p-4 bg-linear-to-b from-black/50 to-transparent">
        <div className="text-white font-medium px-2 py-1 bg-black/30 rounded backdrop-blur-sm">
          Auto-Scanning...
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="absolute inset-0 h-full w-full object-cover"
          onUserMedia={() => setIsCameraReady(true)}
          onUserMediaError={err => console.error('Camera error:', err)}
        />

        {/* Scanning Overlay Guide */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-64 w-64 border-2 border-white/50 rounded-lg relative animate-pulse">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>

            {/* Scanning Line Animation */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
          </div>
          <p className="absolute mt-80 text-white/90 text-sm font-medium bg-black/60 px-4 py-2 rounded-full backdrop-blur-md">
            Point at a price tag
          </p>
        </div>
      </div>
    </div>
  )
}
