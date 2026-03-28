"use client"

import { useRef, useState } from "react"
import { Plus, LayoutGrid, List, Pencil, Trash2, Upload, Sofa, UtensilsCrossed, CopyPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  useTables, useTableAreas, useCreateTable, useUpdateTable, useDeleteTable, useUploadTableImage,
} from "@/hooks/useApi"
import type { Table as TableType } from "@/lib/types"

type Status = "available" | "occupied" | "reserved" | "cleaning"

const STATUS_STYLES: Record<Status, string> = {
  available: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800",
  occupied:  "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800",
  reserved:  "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800",
  cleaning:  "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800",
}

const STATUS_LABELS: Record<Status, string> = {
  available: "Available", occupied: "Occupied", reserved: "Reserved", cleaning: "Cleaning",
}

const SPECIAL_FEATURE_OPTIONS = [
  "Window View", "Private", "AC", "Outdoor", "Rooftop", "VIP", "Couple Seat", "Family", "Wheelchair Accessible",
]

const EMPTY_FORM = {
  area_id: "", name: "", type: "table" as "table" | "cabin",
  capacity: "", is_active: true, description: "", special_features: [] as string[],
}

const EMPTY_BULK_FORM = {
  area_id: "",
  type: "table" as "table" | "cabin",
  prefix: "T-",
  start_number: "1",
  count: "5",
  capacity: "4",
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:8000"

function tableImageUrl(t: TableType) {
  if (!t.image) return null
  if (t.image.startsWith("http")) return t.image
  return `${API_BASE}/storage/${t.image}`
}

export default function TablesPage() {
  const { data: tables = [], isLoading } = useTables()
  const { data: areas = [] } = useTableAreas()
  const createMutation = useCreateTable()
  const updateMutation = useUpdateTable()
  const deleteMutation = useDeleteTable()
  const uploadImage = useUploadTableImage()

  const [view, setView] = useState<"grid" | "list">("grid")
  const [activeArea, setActiveArea] = useState("all")
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all")
  const [open, setOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editing, setEditing] = useState<TableType | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [bulkForm, setBulkForm] = useState(EMPTY_BULK_FORM)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = tables.filter((t) => {
    const matchArea = activeArea === "all" || t.area_id === Number(activeArea)
    const matchStatus = filterStatus === "all" || t.status === filterStatus
    return matchArea && matchStatus
  })

  const grouped = areas.map((area) => ({
    area,
    tables: filtered.filter((t) => t.area_id === area.id),
  }))

  const ungrouped = filtered.filter((t) => !t.area_id)

  function openAdd() {
    setEditing(null); setForm(EMPTY_FORM); setImagePreview(null); setPendingFile(null); setOpen(true)
  }

  function openBulkAdd() {
    setBulkForm(EMPTY_BULK_FORM)
    setBulkOpen(true)
  }

  function openEdit(t: TableType) {
    setEditing(t)
    setForm({
      area_id: String(t.area_id ?? ""), name: t.name, type: t.type ?? "table",
      capacity: String(t.capacity), is_active: t.is_active,
      description: t.description ?? "", special_features: t.special_features ?? [],
    })
    setImagePreview(tableImageUrl(t))
    setPendingFile(null)
    setOpen(true)
  }

  function toggleFeature(f: string) {
    setForm((prev) => ({
      ...prev,
      special_features: prev.special_features.includes(f)
        ? prev.special_features.filter((x) => x !== f)
        : [...prev.special_features, f],
    }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.name || !form.capacity) return
    const payload = {
      name: form.name, type: form.type,
      capacity: Number(form.capacity),
      area_id: form.area_id ? Number(form.area_id) : undefined,
      is_active: form.is_active,
      description: form.description || undefined,
      special_features: form.special_features.length ? form.special_features : undefined,
    }
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload })
      if (pendingFile) await uploadImage.mutateAsync({ id: editing.id, file: pendingFile })
    } else {
      const created = await createMutation.mutateAsync(payload)
      if (pendingFile && (created as TableType).id) {
        await uploadImage.mutateAsync({ id: (created as TableType).id, file: pendingFile })
      }
    }
    setOpen(false)
  }

  async function handleBulkSave() {
    const startNumber = Number(bulkForm.start_number)
    const count = Number(bulkForm.count)
    const capacity = Number(bulkForm.capacity)

    if (!bulkForm.prefix.trim() || !Number.isInteger(startNumber) || !Number.isInteger(count) || count < 1 || !capacity) {
      return
    }

    for (let index = 0; index < count; index += 1) {
      await createMutation.mutateAsync({
        name: `${bulkForm.prefix}${startNumber + index}`,
        type: bulkForm.type,
        capacity,
        area_id: bulkForm.area_id ? Number(bulkForm.area_id) : undefined,
      })
    }

    setBulkOpen(false)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || uploadImage.isPending
  const bulkPreview = (() => {
    const startNumber = Number(bulkForm.start_number)
    const count = Math.min(Number(bulkForm.count) || 0, 4)

    if (!bulkForm.prefix.trim() || !Number.isInteger(startNumber) || count < 1) {
      return ""
    }

    return Array.from({ length: count }, (_, index) => `${bulkForm.prefix}${startNumber + index}`).join(", ")
  })()

  function TableCard({ t }: { t: TableType }) {
    const status = (t.status ?? "available") as Status
    const imgUrl = tableImageUrl(t)
    return (
      <div className={cn("rounded-xl border-2 overflow-hidden flex flex-col transition-all hover:shadow-md", STATUS_STYLES[status])}>
        {imgUrl ? (
          <div className="h-28 overflow-hidden bg-muted">
            <img src={imgUrl} alt={t.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-28 flex items-center justify-center bg-muted/40">
            {t.type === "cabin" ? <Sofa className="size-10 text-muted-foreground/30" /> : <UtensilsCrossed className="size-10 text-muted-foreground/30" />}
          </div>
        )}
        <div className="p-3 flex flex-col gap-1.5 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-sm truncate">{t.name}</span>
            <span className={cn("text-xs px-1.5 py-0.5 rounded-full border font-medium shrink-0", STATUS_STYLES[status])}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="capitalize">{t.type ?? "table"}</span>
            <span>.</span>
            <span>{t.capacity} Seat{t.capacity !== 1 ? "s" : ""}</span>
          </div>
          {t.special_features && t.special_features.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {t.special_features.slice(0, 3).map((f) => (
                <span key={f} className="text-xs bg-background/60 border border-border rounded px-1.5 py-0.5">{f}</span>
              ))}
              {t.special_features.length > 3 && (
                <span className="text-xs text-muted-foreground">+{t.special_features.length - 3}</span>
              )}
            </div>
          )}
          <div className="flex gap-1 mt-auto pt-1">
            <Button variant="outline" size="sm" className="flex-1 h-6 text-xs gap-1 bg-white/60 dark:bg-black/20" onClick={() => openEdit(t)}>
              <Pencil className="size-3" /> Edit
            </Button>
            <Button variant="ghost" size="icon-sm"
              className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => deleteMutation.mutate(t.id)} aria-label="Delete">
              <Trash2 className="size-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  function TableListRow({ t }: { t: TableType }) {
    const status = (t.status ?? "available") as Status
    const imgUrl = tableImageUrl(t)
    return (
      <tr className="border-b border-border last:border-0 hover:bg-muted/20">
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-3">
            {imgUrl ? (
              <img src={imgUrl} alt={t.name} className="size-9 rounded-lg object-cover border border-border" />
            ) : (
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center border border-border">
                {t.type === "cabin" ? <Sofa className="size-4 text-muted-foreground/50" /> : <UtensilsCrossed className="size-4 text-muted-foreground/50" />}
              </div>
            )}
            <div>
              <p className="font-medium text-sm">{t.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{t.type ?? "table"}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-2.5 text-sm">{t.capacity} Seat(s)</td>
        <td className="px-4 py-2.5">
          {t.special_features?.length ? (
            <div className="flex flex-wrap gap-1">
              {t.special_features.slice(0, 2).map((f) => (
                <span key={f} className="text-xs border border-border rounded px-1.5 py-0.5 bg-muted/50">{f}</span>
              ))}
              {t.special_features.length > 2 && <span className="text-xs text-muted-foreground">+{t.special_features.length - 2}</span>}
            </div>
          ) : <span className="text-xs text-muted-foreground">-</span>}
        </td>
        <td className="px-4 py-2.5">
          <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", STATUS_STYLES[status])}>
            {STATUS_LABELS[status]}
          </span>
        </td>
        <td className="px-4 py-2.5 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(t)}>
              <Pencil className="size-3" /> Edit
            </Button>
            <Button variant="ghost" size="icon-sm"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => deleteMutation.mutate(t.id)} aria-label="Delete">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  function AreaSection({ label, areaId, tablesToShow }: { label: string; areaId?: number; tablesToShow: TableType[] }) {
    if (activeArea !== "all" && String(areaId ?? "") !== activeArea) return null
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-semibold text-sm">{label}</h2>
          <span className="text-xs text-muted-foreground">{tablesToShow.length} Table{tablesToShow.length !== 1 ? "s" : ""}</span>
        </div>
        {tablesToShow.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No tables in this area</div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {tablesToShow.map((t) => <TableCard key={t.id} t={t} />)}
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Seats</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Features</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>{tablesToShow.map((t) => <TableListRow key={t.id} t={t} />)}</tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Tables & Cabins</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button onClick={() => setView("list")} className={cn("px-2.5 py-1.5 text-sm transition-colors", view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")} aria-label="List view"><List className="size-4" /></button>
            <button onClick={() => setView("grid")} className={cn("px-2.5 py-1.5 text-sm transition-colors", view === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")} aria-label="Grid view"><LayoutGrid className="size-4" /></button>
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as Status | "all")}
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background outline-none focus:ring-2 focus:ring-ring/50 h-8">
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
            <option value="cleaning">Cleaning</option>
          </select>
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={openBulkAdd}>
            <CopyPlus className="size-4" /> Bulk Add
          </Button>
          <Button size="sm" className="gap-1.5 h-8" onClick={openAdd}><Plus className="size-4" /> Add Table / Cabin</Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => setActiveArea("all")}
          className={cn("px-3 py-1.5 rounded-lg text-sm transition-colors border", activeArea === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground")}>
          All Areas
        </button>
        {areas.map((a) => (
          <button key={a.id} onClick={() => setActiveArea(String(a.id))}
            className={cn("px-3 py-1.5 rounded-lg text-sm transition-colors border", activeArea === String(a.id) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground")}>
            {a.name}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {(Object.entries(STATUS_LABELS) as [Status, string][]).map(([s, label]) => (
            <span key={s} className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", STATUS_STYLES[s])}>{label}</span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ area, tables: t }) => <AreaSection key={area.id} label={area.name} areaId={area.id} tablesToShow={t} />)}
          {ungrouped.length > 0 && <AreaSection label="Unassigned" tablesToShow={ungrouped} />}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Table / Cabin" : "Add Table / Cabin"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Photo</Label>
              <div
                className="relative h-36 rounded-xl border-2 border-dashed border-border overflow-hidden cursor-pointer hover:border-primary transition-colors bg-muted/30 flex items-center justify-center"
                onClick={() => fileRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="size-8" />
                    <span className="text-xs">Click to upload image</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["table", "cabin"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={cn("flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors",
                      form.type === t ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted")}>
                    {t === "cabin" ? <Sofa className="size-4" /> : <UtensilsCrossed className="size-4" />}
                    <span className="capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Area</Label>
                <select value={form.area_id} onChange={(e) => setForm((f) => ({ ...f, area_id: e.target.value }))}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-ring/50">
                  <option value="">No Area</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input placeholder="e.g. T-11 or Cabin A" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Seating Capacity *</Label>
              <Input type="number" min="1" placeholder="e.g. 4" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea rows={2} placeholder="Describe this table or cabin..."
                value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus-visible:border-ring" />
            </div>

            <div className="space-y-1.5">
              <Label>Special Features</Label>
              <div className="flex flex-wrap gap-2">
                {SPECIAL_FEATURE_OPTIONS.map((f) => (
                  <button key={f} type="button" onClick={() => toggleFeature(f)}
                    className={cn("px-2.5 py-1 rounded-full text-xs border transition-colors",
                      form.special_features.includes(f) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="flex items-center gap-4">
                {["Active", "Inactive"].map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name="tableStatus" checked={form.is_active === (s === "Active")} onChange={() => setForm((f) => ({ ...f, is_active: s === "Active" }))} className="accent-primary" />
                    {s}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.capacity || isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={(v) => !v && setBulkOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Add Tables / Cabins</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Area</Label>
                <select value={bulkForm.area_id} onChange={(e) => setBulkForm((prev) => ({ ...prev, area_id: e.target.value }))}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-ring/50">
                  <option value="">No Area</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select value={bulkForm.type} onChange={(e) => setBulkForm((prev) => ({ ...prev, type: e.target.value as "table" | "cabin" }))}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-ring/50">
                  <option value="table">Table</option>
                  <option value="cabin">Cabin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prefix *</Label>
                <Input
                  placeholder="e.g. T-"
                  value={bulkForm.prefix}
                  onChange={(e) => setBulkForm((prev) => ({ ...prev, prefix: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Start Number *</Label>
                <Input
                  type="number"
                  min="1"
                  value={bulkForm.start_number}
                  onChange={(e) => setBulkForm((prev) => ({ ...prev, start_number: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>How Many *</Label>
                <Input
                  type="number"
                  min="1"
                  value={bulkForm.count}
                  onChange={(e) => setBulkForm((prev) => ({ ...prev, count: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Seats Per Table *</Label>
                <Input
                  type="number"
                  min="1"
                  value={bulkForm.capacity}
                  onChange={(e) => setBulkForm((prev) => ({ ...prev, capacity: e.target.value }))}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">Preview</p>
              <p className="text-sm mt-1">
                {bulkPreview || "Add a prefix, start number, and quantity to preview table names."}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBulkSave}
              disabled={
                createMutation.isPending ||
                !bulkForm.prefix.trim() ||
                !bulkForm.start_number ||
                !bulkForm.count ||
                !bulkForm.capacity
              }
            >
              {createMutation.isPending ? "Creating..." : "Create Tables"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
