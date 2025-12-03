'use client'

import React, { useCallback, useRef, useState } from 'react'
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

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      onCapture(imageSrc)
    }
  }, [webcamRef, onCapture])

  const videoConstraints = {
    facingMode: 'environment', // Use back camera on mobile
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-end p-4">
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
          <div className="h-64 w-64 border-2 border-white/50 rounded-lg relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
          </div>
          <p className="absolute mt-80 text-white/80 text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
            Align price tag here
          </p>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-black p-8 flex justify-center pb-12">
        <Button
          onClick={capture}
          disabled={!isCameraReady}
          className="h-20 w-20 rounded-full border-4 border-white bg-transparent p-1 hover:bg-white/10 disabled:opacity-50"
        >
          <div className="h-full w-full rounded-full bg-white" />
        </Button>
      </div>
    </div>
  )
}
