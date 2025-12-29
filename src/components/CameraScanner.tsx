'use client'

import { useRef, useState, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Button } from './ui/Button'
import { X, Camera, Loader2 } from 'lucide-react'

interface CameraScannerProps {
  onCapture: (imageSrc: string) => Promise<void>
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
  const [isCapturing, setIsCapturing] = useState(false)

  // Capture high-resolution image directly from video element and crop to overlay
  const captureHighResImage = useCallback(() => {
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

    return canvas.toDataURL('image/jpeg', 0.9)
  }, [])

  const handleManualCapture = async () => {
    if (isCapturing || !isCameraReady) return

    const imageSrc = captureHighResImage()
    if (!imageSrc) return

    try {
      setIsCapturing(true)
      await onCapture(imageSrc)
    } catch (err) {
      console.error('Capture failed', err)
    } finally {
      setIsCapturing(false)
    }
  }

  const videoConstraints = {
    facingMode: 'environment',
    width: { ideal: 1024 },
    height: { ideal: 1024 },
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between p-4 bg-linear-to-b from-black/50 to-transparent">
        <div className="text-white font-medium px-2 py-1 bg-black/30 rounded backdrop-blur-sm">
          Manual Scan Mode
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
            className="h-64 w-64 border-2 border-white/50 rounded-lg relative"
          >
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
          </div>
          <p className="absolute mt-80 text-white/90 text-sm font-medium bg-black/60 px-4 py-2 rounded-full backdrop-blur-md">
            Align price tag & Tap button
          </p>
        </div>
      </div>

      {/* Footer / Shutter Button */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-8 flex justify-center bg-linear-to-t from-black/80 to-transparent">
        <Button
          size="icon"
          className="h-20 w-20 rounded-full border-4 border-white bg-transparent hover:bg-white/20 active:bg-white/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleManualCapture}
          disabled={!isCameraReady || isCapturing}
        >
          {isCapturing ? (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-white" />
          )}
        </Button>
      </div>
    </div>
  )
}
