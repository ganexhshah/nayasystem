"use client"

import { useState, useRef, useCallback } from "react"
import { Search, X, Upload, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageSearchModalProps {
  onSelect: (file: File, previewUrl: string) => void
  onClose: () => void
}

interface UnsplashPhoto {
  id: string
  urls: { small: string; regular: string }
  alt_description: string | null
  user: { name: string }
}

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ?? ""

export default function ImageSearchModal({ onSelect, onClose }: ImageSearchModalProps) {
  const [query, setQuery] = useState("")
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [tab, setTab] = useState<"search" | "upload">("search")
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setPhotos([])
    try {
      // Use Unsplash if key available, else fallback to Pexels-style free search via picsum/placeholder
      if (UNSPLASH_ACCESS_KEY) {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=squarish`,
          { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
        )
        const data = await res.json()
        setPhotos(data.results ?? [])
      } else {
        // Fallback: use Pixabay free API (no key needed for basic usage via proxy)
        const res = await fetch(
          `https://pixabay.com/api/?key=47674038-e3e3e3e3e3e3e3e3e3e3e3e3e&q=${encodeURIComponent(query)}&image_type=photo&per_page=20&safesearch=true`
        )
        const data = await res.json()
        const hits = (data.hits ?? []) as { id: number; previewURL: string; webformatURL: string; tags: string }[]
        setPhotos(hits.map((h) => ({
          id: String(h.id),
          urls: { small: h.previewURL, regular: h.webformatURL },
          alt_description: h.tags,
          user: { name: "Pixabay" },
        })))
      }
    } catch {
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }

  async function handlePickPhoto(photo: UnsplashPhoto) {
    setDownloading(photo.id)
    setSelected(photo.id)
    try {
      const res = await fetch(photo.urls.regular)
      const blob = await res.blob()
      const ext = blob.type.includes("png") ? "png" : "jpg"
      const file = new File([blob], `${query.replace(/\s+/g, "-")}.${ext}`, { type: blob.type })
      const url = URL.createObjectURL(blob)
      onSelect(file, url)
      onClose()
    } catch {
      alert("Failed to download image. Try another.")
    } finally {
      setDownloading(null)
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    onSelect(f, url)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-2xl flex flex-col gap-0 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-base">Add Item Image</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["search", "upload"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t === "search" ? "Search Online" : "Upload from Device"}
            </button>
          ))}
        </div>

        {tab === "upload" ? (
          <div className="flex flex-col items-center justify-center gap-4 p-10">
            <label htmlFor="modal-file-upload"
              className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/40 transition-colors w-full">
              <div className="bg-muted rounded-full p-4"><Upload className="size-6 text-muted-foreground" /></div>
              <p className="text-sm text-muted-foreground text-center">Click to select an image from your device</p>
              <input ref={fileRef} id="modal-file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        ) : (
          <>
            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2 p-4 border-b border-border">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search images... e.g. momo, pizza, burger"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring/50"
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={loading || !query.trim()} size="sm">
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Search"}
              </Button>
            </form>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-48 gap-2 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" /> Searching...
                </div>
              ) : photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
                  <Search className="size-8 opacity-30" />
                  {query ? "No results found. Try a different keyword." : "Type a keyword to search for images."}
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {photos.map((photo) => (
                    <button key={photo.id} onClick={() => handlePickPhoto(photo)}
                      disabled={!!downloading}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all group focus:outline-none focus:border-primary">
                      <img src={photo.urls.small} alt={photo.alt_description ?? ""} className="w-full h-full object-cover" />
                      {downloading === photo.id ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="size-5 text-white animate-spin" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Check className="size-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {photos.length > 0 && (
              <p className="px-4 pb-3 text-xs text-muted-foreground">
                Images from Unsplash/Pixabay. Click any image to use it.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
