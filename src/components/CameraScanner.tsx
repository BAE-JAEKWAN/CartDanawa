'use client'

import { useRef, useState, useEffect } from 'react'
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
  const videoContainerRef = useRef<HTMLDivElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const isProcessingRef = useRef(false)

  // Capture high-resolution image directly from video element and crop to overlay
  const captureHighResImage = () => {
    const video = webcamRef.current?.video
    const videoContainer = videoContainerRef.current
    const overlay = overlayRef.current

    if (!video || !videoContainer || !overlay) return null

    // 1. Get dimensions
    const videoW = video.videoWidth
    const videoH = video.videoHeight
    const containerRect = videoContainer.getBoundingClientRect()
    const overlayRect = overlay.getBoundingClientRect()

    if (videoW === 0 || videoH === 0) return null

    // 2. Calculate scale and offsets (object-fit: cover logic)
    const scale = Math.max(
      containerRect.width / videoW,
      containerRect.height / videoH
    )
    const displayedW = videoW * scale
    const displayedH = videoH * scale
    const offsetX = (displayedW - containerRect.width) / 2
    const offsetY = (displayedH - containerRect.height) / 2

    // 3. Calculate crop coordinates relative to the video source
    // Overlay position relative to the container
    const overlayRelX = overlayRect.left - containerRect.left
    const overlayRelY = overlayRect.top - containerRect.top

    // Map overlay coordinates to video source coordinates
    // (overlayRelX + offsetX) is the x-position in the scaled video
    // Divide by scale to get the x-position in the original video
    const cropX = (overlayRelX + offsetX) / scale
    const cropY = (overlayRelY + offsetY) / scale
    const cropW = overlayRect.width / scale
    const cropH = overlayRect.height / scale

    // 4. Draw to canvas
    const canvas = document.createElement('canvas')
    // Set canvas size to the cropped size (high resolution)
    canvas.width = cropW
    canvas.height = cropH
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    // Draw the cropped portion of the video to the canvas
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

    // console.log(`Captured: ${Math.round(cropW)}x${Math.round(cropH)} from ${videoW}x${videoH}`)
    return canvas.toDataURL('image/jpeg', 0.9)
  }

  // Auto-capture every 1000ms
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isCameraReady) {
      interval = setInterval(() => {
        // Avoid overlapping processing
        if (isProcessingRef.current) return

        const imageSrc = captureHighResImage()
        if (imageSrc) {
          ;(async () => {
            try {
              isProcessingRef.current = true
              onCapture(imageSrc)
            } catch (err) {
              console.error('Capture failed', err)
            } finally {
              isProcessingRef.current = false
            }
          })()
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isCameraReady, onCapture])

  const videoConstraints = {
    facingMode: 'environment',
    width: { ideal: 1920 },
    height: { ideal: 1080 },
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
      <div
        ref={videoContainerRef}
        className="relative flex-1 flex items-center justify-center overflow-hidden"
      >
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
          <div
            ref={overlayRef}
            className="h-64 w-64 border-2 border-white/50 rounded-lg relative animate-pulse"
          >
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
