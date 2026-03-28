"use client"

import { useState, useRef, useCallback } from "react"
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react"

interface ImageCropModalProps {
  imageSrc: string
  onCropComplete: (croppedFile: File, previewUrl: string) => void
  onClose: () => void
  aspect?: number
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  )
}

export default function ImageCropModal({ imageSrc, onCropComplete, onClose, aspect = 1 }: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspect))
  }

  const getCroppedImg = useCallback(async (): Promise<{ file: File; url: string } | null> => {
    const image = imgRef.current
    if (!image || !completedCrop) return null

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    const pixelRatio = window.devicePixelRatio
    canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio)
    canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio)

    ctx.scale(pixelRatio, pixelRatio)
    ctx.imageSmoothingQuality = "high"

    const cropX = completedCrop.x * scaleX
    const cropY = completedCrop.y * scaleY
    const rotateRads = (rotate * Math.PI) / 180
    const centerX = image.naturalWidth / 2
    const centerY = image.naturalHeight / 2

    ctx.save()
    ctx.translate(-cropX, -cropY)
    ctx.translate(centerX, centerY)
    ctx.rotate(rotateRads)
    ctx.scale(scale, scale)
    ctx.translate(-centerX, -centerY)
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, image.naturalWidth, image.naturalHeight)
    ctx.restore()

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) { resolve(null); return }
        const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" })
        const url = URL.createObjectURL(blob)
        resolve({ file, url })
      }, "image/jpeg", 0.9)
    })
  }, [completedCrop, scale, rotate])

  async function handleApply() {
    const result = await getCroppedImg()
    if (!result) return
    onCropComplete(result.file, result.url)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Crop Image</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex justify-center bg-muted/40 rounded-lg overflow-hidden max-h-[400px]">
          <ReactCrop
            crop={crop}
            onChange={(_, pct) => setCrop(pct)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            minWidth={50}
            minHeight={50}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              style={{ transform: `scale(${scale}) rotate(${rotate}deg)`, maxHeight: "400px", maxWidth: "100%" }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(1)))}
            className="p-2 rounded-md border border-border hover:bg-muted"
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" />
          </button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(3, +(s + 0.1).toFixed(1)))}
            className="p-2 rounded-md border border-border hover:bg-muted"
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={() => setRotate((r) => (r + 90) % 360)}
            className="p-2 rounded-md border border-border hover:bg-muted"
            aria-label="Rotate"
          >
            <RotateCw className="size-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleApply} disabled={!completedCrop}>Apply Crop</Button>
        </div>
      </div>
    </div>
  )
}
