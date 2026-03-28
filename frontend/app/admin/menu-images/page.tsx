"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Upload, X, Loader2, CheckCircle2, AlertCircle, ImagePlus, Crop, Trash2, Search, RefreshCw } from "lucide-react"
import { useAdminAuthStore } from "@/store/adminAuth"
import ImageCropModal from "@/components/ui/ImageCropModal"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

// ── Types ─────────────────────────────────────────────────────────────────────
interface ExistingItem {
  id: number
  name: string
  image: string
  restaurant_id: number
  category?: { name: string }
}

interface RowItem {
  id: string
  name: string
  imageFile: File | null
  imagePreview: string | null
  status: "pending" | "uploading" | "done" | "error"
  error?: string
  resultUrl?: string
}

interface CropTarget { rowId: string; src: string }

function uid() { return Math.random().toString(36).slice(2) }
function makeRow(name = ""): RowItem {
  return { id: uid(), name, imageFile: null, imagePreview: null, status: "pending" }
}

// ── Per-row drag-drop image cell ──────────────────────────────────────────────
function ImageCell({ row, onFile, onClear, onCrop, disabled }: {
  row: RowItem
  onFile: (id: string, file: File) => void
  onClear: (id: string) => void
  onCrop: (id: string) => void
  disabled: boolean
}) {
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith("image/")) onFile(row.id, f)
  }

  if (row.imagePreview) {
    return (
      <div className="relative size-14 shrink-0">
        <img src={row.imagePreview} alt="" className="size-14 rounded-lg object-cover border border-slate-700" />
        {row.status !== "done" && (
          <>
            <button onClick={() => onClear(row.id)}
              className="absolute -top-1.5 -right-1.5 size-4 bg-slate-950 border border-slate-700 rounded-full flex items-center justify-center hover:bg-red-900/50 z-10">
              <X className="size-2.5 text-slate-400" />
            </button>
            <button onClick={() => onCrop(row.id)} title="Crop"
              className="absolute bottom-0.5 right-0.5 size-5 bg-slate-900/90 border border-slate-600 rounded flex items-center justify-center hover:bg-indigo-600 transition-colors">
              <Crop className="size-3 text-slate-300" />
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <label htmlFor={`img-${row.id}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`size-14 shrink-0 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors
        ${dragging ? "border-indigo-400 bg-indigo-500/10" : "border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/5"}`}>
      <ImagePlus className={`size-5 ${dragging ? "text-indigo-400" : "text-slate-500"}`} />
      <input id={`img-${row.id}`} type="file" accept="image/*" className="hidden" disabled={disabled}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(row.id, f); e.target.value = "" }} />
    </label>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminMenuImagesPage() {
  const { token } = useAdminAuthStore()

  // Upload state
  const [rows, setRows] = useState<RowItem[]>([makeRow()])
  const [uploading, setUploading] = useState(false)
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null)
  const [globalDragging, setGlobalDragging] = useState(false)

  // Existing images state
  const [existing, setExisting] = useState<ExistingItem[]>([])
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  // ── Load existing ──
  const loadExisting = useCallback(async (p = 1, q = "") => {
    setLoadingExisting(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (q) params.set("search", q)
      const res = await fetch(`${BASE}/admin/menu-images?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      })
      const data = await res.json()
      setExisting(p === 1 ? data.data : (prev) => [...prev, ...data.data])
      setLastPage(data.last_page ?? 1)
      setPage(p)
    } catch { /* ignore */ } finally { setLoadingExisting(false) }
  }, [token])

  useEffect(() => { loadExisting(1, "") }, [loadExisting])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setExisting([])
    loadExisting(1, searchQuery)
  }

  async function handleDelete(item: ExistingItem) {
    if (!confirm(`Remove image from "${item.name}"?`)) return
    setDeletingId(item.id)
    try {
      await fetch(`${BASE}/admin/menu-images/${item.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      })
      setExisting((prev) => prev.filter((i) => i.id !== item.id))
    } catch { alert("Failed to delete") } finally { setDeletingId(null) }
  }

  // ── Upload helpers ──
  function applyFile(id: string, file: File) {
    const url = URL.createObjectURL(file)
    setCropTarget({ rowId: id, src: url })
    setRows((r) => r.map((row) => row.id === id ? { ...row, imageFile: file, imagePreview: url, status: "pending" } : row))
  }

  function clearImage(id: string) {
    setRows((r) => r.map((row) => row.id === id ? { ...row, imageFile: null, imagePreview: null, status: "pending" } : row))
  }

  function openCrop(id: string) {
    const row = rows.find((r) => r.id === id)
    if (row?.imagePreview) setCropTarget({ rowId: id, src: row.imagePreview })
  }

  function handleCropComplete(croppedFile: File, previewUrl: string) {
    if (!cropTarget) return
    setRows((r) => r.map((row) => row.id === cropTarget.rowId
      ? { ...row, imageFile: croppedFile, imagePreview: previewUrl, status: "pending" } : row))
    setCropTarget(null)
  }

  function handleGlobalDrop(e: React.DragEvent) {
    e.preventDefault(); setGlobalDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))
    if (!files.length) return
    setRows((prev) => {
      const updated = [...prev]
      files.forEach((file) => {
        const url = URL.createObjectURL(file)
        const emptyIdx = updated.findIndex((r) => !r.imageFile && r.status === "pending")
        if (emptyIdx >= 0) updated[emptyIdx] = { ...updated[emptyIdx], imageFile: file, imagePreview: url }
        else updated.push({ id: uid(), name: "", imageFile: file, imagePreview: url, status: "pending" })
      })
      return updated
    })
  }

  async function uploadAll() {
    const valid = rows.filter((r) => r.name.trim() && r.imageFile)
    if (!valid.length) return
    setUploading(true)
    for (const row of valid) {
      setRows((r) => r.map((x) => x.id === row.id ? { ...x, status: "uploading" } : x))
      try {
        const fd = new FormData()
        fd.append("name", row.name.trim())
        fd.append("image", row.imageFile!)
        const res = await fetch(`${BASE}/admin/menu-images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          body: fd,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.message ?? "Upload failed")
        setRows((r) => r.map((x) => x.id === row.id ? { ...x, status: "done", resultUrl: data.url } : x))
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed"
        setRows((r) => r.map((x) => x.id === row.id ? { ...x, status: "error", error: msg } : x))
      }
    }
    setUploading(false)
    // Refresh existing list
    setExisting([])
    loadExisting(1, searchQuery)
  }

  const doneCount = rows.filter((r) => r.status === "done").length
  const readyCount = rows.filter((r) => r.name.trim() && r.imageFile).length

  return (
    <div className="space-y-8 max-w-5xl"
      onDragOver={(e) => { e.preventDefault(); setGlobalDragging(true) }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setGlobalDragging(false) }}
      onDrop={handleGlobalDrop}>

      {/* Global drag overlay */}
      {globalDragging && (
        <div className="fixed inset-0 z-40 bg-indigo-950/80 border-4 border-dashed border-indigo-400 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Upload className="size-12 text-indigo-300 mx-auto mb-3" />
            <p className="text-xl font-semibold text-indigo-200">Drop images here</p>
            <p className="text-sm text-indigo-400 mt-1">Assigned to empty rows automatically</p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-white">Menu Images</h1>
        <p className="text-sm text-slate-400 mt-0.5">Upload new images in bulk or manage existing ones.</p>
      </div>

      {/* ── UPLOAD SECTION ── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Upload New</h2>

        {/* Paste names */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-slate-400">
          <p className="font-medium text-slate-300 mb-1">Quick-fill names</p>
          <textarea rows={2} placeholder={"Momo\nBurger\nPizza"}
            onChange={(e) => {
              const lines = e.target.value.split("\n").map((l) => l.trim()).filter(Boolean)
              if (lines.length > 0) { setRows(lines.map((name) => makeRow(name))); e.target.value = "" }
            }}
            className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 resize-none" />
        </div>

        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={row.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
              <span className="text-xs text-slate-600 w-5 shrink-0 text-right">{i + 1}</span>
              <input value={row.name} onChange={(e) => setRows((r) => r.map((x) => x.id === row.id ? { ...x, name: e.target.value } : x))}
                placeholder="Item name e.g. Momo" disabled={row.status === "uploading" || row.status === "done"}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 disabled:opacity-50" />
              <ImageCell row={row} onFile={applyFile} onClear={clearImage} onCrop={openCrop}
                disabled={row.status === "uploading" || row.status === "done"} />
              <div className="shrink-0 w-5">
                {row.status === "uploading" && <Loader2 className="size-4 text-indigo-400 animate-spin" />}
                {row.status === "done" && <CheckCircle2 className="size-4 text-emerald-400" />}
                {row.status === "error" && <span title={row.error}><AlertCircle className="size-4 text-red-400" /></span>}
              </div>
              {rows.length > 1 && row.status !== "uploading" && row.status !== "done" && (
                <button onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}
                  className="shrink-0 text-slate-600 hover:text-red-400 transition-colors"><X className="size-4" /></button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setRows((r) => [...r, makeRow()])} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors disabled:opacity-50">
            <ImagePlus className="size-4" /> Add Row
          </button>
          <button onClick={uploadAll} disabled={uploading || readyCount === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Upload {readyCount > 0 ? `${readyCount} item${readyCount > 1 ? "s" : ""}` : ""}
          </button>
          {doneCount > 0 && (
            <span className="text-sm text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="size-4" /> {doneCount} uploaded
            </span>
          )}
        </div>
      </div>

      {/* ── EXISTING IMAGES ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Existing Images
            {existing.length > 0 && <span className="ml-2 text-slate-500 font-normal normal-case">({existing.length} shown)</span>}
          </h2>
          <button onClick={() => { setExisting([]); loadExisting(1, searchQuery) }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item name..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500" />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700 transition-colors">
            Search
          </button>
        </form>

        {loadingExisting && existing.length === 0 ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-500">
            <Loader2 className="size-5 animate-spin" /> Loading...
          </div>
        ) : existing.length === 0 ? (
          <div className="text-center py-16 text-slate-600 text-sm">No images found.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {existing.map((item) => (
                <div key={item.id} className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="aspect-square">
                    <img src={item.image} alt={item.name}
                      className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-slate-300 truncate font-medium">{item.name}</p>
                    {item.category && <p className="text-xs text-slate-600 truncate">{item.category.name}</p>}
                  </div>
                  {/* Delete overlay */}
                  <button onClick={() => handleDelete(item)} disabled={deletingId === item.id}
                    className="absolute top-1.5 right-1.5 size-6 bg-slate-950/80 border border-slate-700 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/70 hover:border-red-700">
                    {deletingId === item.id
                      ? <Loader2 className="size-3 text-slate-400 animate-spin" />
                      : <Trash2 className="size-3 text-slate-400 hover:text-red-300" />}
                  </button>
                </div>
              ))}
            </div>

            {page < lastPage && (
              <div className="flex justify-center pt-2">
                <button onClick={() => loadExisting(page + 1, searchQuery)} disabled={loadingExisting}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors disabled:opacity-50">
                  {loadingExisting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Crop modal */}
      {cropTarget && (
        <ImageCropModal imageSrc={cropTarget.src} aspect={1}
          onCropComplete={handleCropComplete} onClose={() => setCropTarget(null)} />
      )}
    </div>
  )
}
