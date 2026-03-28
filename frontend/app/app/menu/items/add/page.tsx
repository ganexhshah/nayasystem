"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, X, IndianRupee, Loader2, Crop, Search, Plus, Trash2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useMenuCategories, useCreateMenuItem, useCreateMenuCategory } from "@/hooks/useApi"
import { api, ApiError } from "@/lib/api"
import type { MenuItem } from "@/lib/types"
import ImageCropModal from "@/components/ui/ImageCropModal"
import ImageSearchModal from "@/components/ui/ImageSearchModal"

const ITEM_TYPES = ["Veg", "Non Veg", "Egg", "Drink", "Halal", "Other"] as const
type ItemType = (typeof ITEM_TYPES)[number]

const TYPE_COLORS: Record<string, string> = {
  Veg: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30",
  "Non Veg": "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30",
  Egg: "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30",
  Drink: "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30",
  Halal: "border-green-600 bg-green-50 text-green-700 dark:bg-green-950/30",
  Other: "border-border bg-muted text-muted-foreground",
}

type AddMode = "single" | "bulk"

type BulkRow = {
  id: string
  name: string
  categoryId: string
  itemType: ItemType
  kitchenItem: boolean
  price: string
  imageFile: File | null
  imagePreview: string | null
}

function createBulkRow(categoryId = "", sample = false): BulkRow {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: sample ? "Momo" : "",
    categoryId,
    itemType: "Veg",
    kitchenItem: true,
    price: sample ? "180" : "",
    imageFile: null,
    imagePreview: null,
  }
}

function isVegType(itemType: ItemType) {
  return !["Non Veg", "Egg", "Halal"].includes(itemType)
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

function RsInput({ placeholder, value, onChange }: { placeholder?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
        <IndianRupee className="size-3.5 text-muted-foreground" />
      </div>
      <Input
        type="number"
        min="0"
        step="0.01"
        placeholder={placeholder ?? "0.00"}
        className="pl-7"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export default function AddMenuItemPage() {
  const router = useRouter()
  const { data: categories = [] } = useMenuCategories()
  const createMutation = useCreateMenuItem()
  const createCategoryMutation = useCreateMenuCategory()

  const [mode, setMode] = useState<AddMode>("single")

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [itemType, setItemType] = useState<ItemType>("Veg")
  const [prepTime, setPrepTime] = useState("")
  const [available, setAvailable] = useState(true)
  const [isInstant, setIsInstant] = useState(false)
  const [basePrice, setBasePrice] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [saving, setSaving] = useState(false)
  const imgRef = useRef<HTMLInputElement>(null)

  const [bulkRows, setBulkRows] = useState<BulkRow[]>([createBulkRow()])
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkMessage, setBulkMessage] = useState<string | null>(null)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkFailures, setBulkFailures] = useState<string[]>([])

  async function createCategoryInline(): Promise<number | null> {
    const name = window.prompt("Enter new category name")
    if (!name) return null

    const trimmed = name.trim()
    if (!trimmed) return null

    try {
      const created = await createCategoryMutation.mutateAsync({ name: trimmed, is_active: true })
      return created.id
    } catch {
      setBulkError("Could not create category. Please try again.")
      return null
    }
  }

  async function handleSingleCategoryChange(value: string) {
    if (value === "__add_new__") {
      const newId = await createCategoryInline()
      if (newId) setCategoryId(String(newId))
      return
    }
    setCategoryId(value)
  }

  async function handleBulkCategoryChange(rowId: string, value: string) {
    if (value === "__add_new__") {
      const newId = await createCategoryInline()
      if (newId) setBulkRowValue(rowId, { categoryId: String(newId) })
      return
    }
    setBulkRowValue(rowId, { categoryId: value })
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    setCropSrc(url)
    e.target.value = ""
  }

  function handleCropComplete(croppedFile: File, previewUrl: string) {
    setImageFile(croppedFile)
    setImagePreview(previewUrl)
    setCropSrc(null)
  }

  function setBulkRowValue(id: string, patch: Partial<BulkRow>) {
    setBulkRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function addBulkRow(sample = false) {
    const defaultCategoryId = categories[0]?.id ? String(categories[0].id) : ""
    setBulkRows((rows) => [...rows, createBulkRow(defaultCategoryId, sample)])
  }

  function deleteBulkRow(id: string) {
    setBulkRows((rows) => {
      if (rows.length === 1) {
        const only = rows[0]
        if (only.imagePreview) URL.revokeObjectURL(only.imagePreview)
        const defaultCategoryId = categories[0]?.id ? String(categories[0].id) : ""
        return [createBulkRow(defaultCategoryId)]
      }
      const row = rows.find((r) => r.id === id)
      if (row?.imagePreview) URL.revokeObjectURL(row.imagePreview)
      return rows.filter((r) => r.id !== id)
    })
  }

  function duplicateBulkRow(id: string) {
    setBulkRows((rows) => {
      const index = rows.findIndex((row) => row.id === id)
      if (index === -1) return rows

      const source = rows[index]
      const duplicate: BulkRow = {
        ...source,
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        imagePreview: source.imageFile ? URL.createObjectURL(source.imageFile) : null,
      }

      const next = [...rows]
      next.splice(index + 1, 0, duplicate)
      return next
    })
  }

  function handleBulkImage(rowId: string, file: File | null) {
    if (!file) return

    setBulkRows((rows) =>
      rows.map((row) => {
        if (row.id !== rowId) return row
        if (row.imagePreview) URL.revokeObjectURL(row.imagePreview)
        return {
          ...row,
          imageFile: file,
          imagePreview: URL.createObjectURL(file),
        }
      })
    )
  }

  function clearBulkImage(rowId: string) {
    setBulkRows((rows) =>
      rows.map((row) => {
        if (row.id !== rowId) return row
        if (row.imagePreview) URL.revokeObjectURL(row.imagePreview)
        return { ...row, imageFile: null, imagePreview: null }
      })
    )
  }

  async function handleSaveSingle() {
    if (!name || !categoryId || !basePrice) return
    setSaving(true)
    try {
      if (imageFile) {
        const fd = new FormData()
        fd.append("name", name)
        fd.append("description", description)
        fd.append("category_id", categoryId)
        fd.append("price", basePrice)
        fd.append("item_type", itemType)
        fd.append("is_veg", isVegType(itemType) ? "1" : "0")
        fd.append("is_available", available ? "1" : "0")
        fd.append("is_instant", isInstant ? "1" : "0")
        if (prepTime) fd.append("preparation_time", prepTime)
        fd.append("image", imageFile)
        await api.upload<MenuItem>("/menu-items", fd)
      } else {
        await createMutation.mutateAsync({
          name,
          description: description || undefined,
          category_id: Number(categoryId),
          price: Number(basePrice),
          item_type: itemType,
          is_veg: isVegType(itemType),
          is_available: available,
          is_instant: isInstant,
          preparation_time: prepTime ? Number(prepTime) : undefined,
        })
      }
      router.back()
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveBulk() {
    setBulkError(null)
    setBulkMessage(null)
    setBulkFailures([])

    const preparedRows = bulkRows
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => row.name.trim() || row.categoryId || row.price || row.imageFile)

    if (preparedRows.length === 0) {
      setBulkError("Add at least one item row before saving.")
      return
    }

    const invalidCount = preparedRows.filter(({ row }) => !row.name.trim() || !row.categoryId || !row.price).length
    if (invalidCount > 0) {
      setBulkError(`Please fill item name, category, and price for all rows. Incomplete rows: ${invalidCount}.`)
      return
    }

    setBulkSaving(true)
    let successCount = 0
    const failures: string[] = []

    try {
      for (const { row, idx } of preparedRows) {
        try {
          const fd = new FormData()
          fd.append("name", row.name.trim())
          fd.append("category_id", row.categoryId)
          fd.append("price", row.price)
          fd.append("item_type", row.itemType)
          fd.append("is_veg", isVegType(row.itemType) ? "1" : "0")
          fd.append("is_available", "1")
          fd.append("is_instant", row.kitchenItem ? "0" : "1")
          if (row.imageFile) fd.append("image", row.imageFile)

          await api.upload<MenuItem>("/menu-items", fd)
          successCount += 1
        } catch (error) {
          const message = error instanceof ApiError ? error.message : "Failed to save item"
          failures.push(`Row ${idx + 1} (${row.name || "Unnamed"}): ${message}`)
        }
      }

      if (successCount > 0) {
        setBulkMessage(`${successCount} item(s) added successfully.`)
      }

      if (failures.length > 0) {
        setBulkError(`Some rows failed (${failures.length}).`)
        setBulkFailures(failures)
        return
      }

      router.push("/app/menu/items")
    } finally {
      setBulkSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.back()} className="text-xs text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1">
          {"<-"} Back to Menu Items
        </button>
        <h1 className="text-xl font-semibold">Add Menu Item</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {mode === "single"
            ? "Fill in the details below to add one menu item."
            : "Add multiple rows like a sheet, then save all at once."}
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-border bg-background p-1">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={cn(
            "px-3 py-1.5 text-sm rounded-md transition-colors",
            mode === "single" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Single Item
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          className={cn(
            "px-3 py-1.5 text-sm rounded-md transition-colors",
            mode === "bulk" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Bulk Add (Manual)
        </button>
      </div>

      {mode === "single" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SectionCard title="Product Information">
              <Field label="Item Name" required>
                <Input placeholder="Enter item name" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>

              <Field label="Item Description">
                <textarea
                  rows={3}
                  placeholder="Enter item description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Item Category" required>
                  <select
                    value={categoryId}
                    onChange={(e) => void handleSingleCategoryChange(e.target.value)}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-ring/50"
                  >
                    <option value="">--</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__add_new__">+ Add New Category</option>
                  </select>
                </Field>

                <Field label="Preparation Time (mins)">
                  <Input type="number" min="0" placeholder="e.g. 15" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} />
                </Field>
              </div>

              <Field label="Item Type">
                <div className="flex flex-wrap gap-2">
                  {ITEM_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setItemType(t)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all",
                        itemType === t ? TYPE_COLORS[t] : "border-border text-muted-foreground hover:border-muted-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Is Available">
                <div className="flex items-center gap-4">
                  {["Yes", "No"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="available"
                        checked={available === (opt === "Yes")}
                        onChange={() => setAvailable(opt === "Yes")}
                        className="accent-primary"
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Kitchen Item">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setIsInstant((v) => !v)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none",
                      isInstant ? "bg-primary" : "bg-input"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                        isInstant ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                  <div>
                    <p className="text-sm leading-none">{isInstant ? "No kitchen prep needed" : "Sent to kitchen"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Turn on for instant/non-kitchen items. Turn off for kitchen items.</p>
                  </div>
                </div>
              </Field>
            </SectionCard>

            <SectionCard title="Pricing Details">
              <Field label="Base Price" required>
                <RsInput value={basePrice} onChange={setBasePrice} />
                <p className="text-xs text-muted-foreground mt-1">Used as the default price for all order types.</p>
              </Field>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="Item Image">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Item" className="w-full aspect-square object-cover rounded-lg border border-border" />
                  <button
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    className="absolute top-2 right-2 bg-background border border-border rounded-full p-1 hover:bg-muted"
                    aria-label="Remove image"
                  >
                    <X className="size-3.5" />
                  </button>
                  <label
                    htmlFor="item-image"
                    className="absolute bottom-2 right-2 flex items-center gap-1 bg-background border border-border rounded-full px-2 py-1 cursor-pointer hover:bg-muted text-xs font-medium"
                  >
                    <Crop className="size-3" />
                    Change
                    <input ref={imgRef} id="item-image" type="file" accept="image/*" className="hidden" onChange={handleImage} />
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <label
                    htmlFor="item-image"
                    className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <div className="bg-muted rounded-full p-3">
                      <Upload className="size-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">Click to upload and crop image</p>
                    <input ref={imgRef} id="item-image" type="file" accept="image/*" className="hidden" onChange={handleImage} />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSearch(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
                  >
                    <Search className="size-3.5" />
                    Search image online
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed">JPEG, PNG, JPG, GIF. Max 2MB. Recommended: 200x200px.</p>
            </SectionCard>

            {cropSrc && (
              <ImageCropModal imageSrc={cropSrc} aspect={1} onCropComplete={handleCropComplete} onClose={() => setCropSrc(null)} />
            )}

            {showSearch && (
              <ImageSearchModal
                onSelect={(file, url) => {
                  setCropSrc(url)
                  setImageFile(file)
                }}
                onClose={() => setShowSearch(false)}
              />
            )}

            <div className="flex flex-col gap-2">
              <Button className="w-full" onClick={handleSaveSingle} disabled={saving || !name || !categoryId || !basePrice}>
                {saving && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                Save
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-base">Bulk Add Sheet</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => addBulkRow(false)} className="gap-1.5">
                    <Plus className="size-3.5" />
                    Add Row
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addBulkRow(true)} className="gap-1.5">
                    <Plus className="size-3.5" />
                    Add Example Row
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Fill rows like a sheet. Required per row: name, category, price.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {bulkError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{bulkError}</div>
              )}
              {bulkMessage && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                  {bulkMessage}
                </div>
              )}

              {bulkRows.map((row, idx) => (
                <div key={row.id} className="rounded-xl border border-border p-4 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Row {idx + 1}</p>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => duplicateBulkRow(row.id)} className="gap-1.5">
                        <Copy className="size-4" />
                        Duplicate Row
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBulkRow(row.id)}
                        className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                        Delete Row
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="lg:col-span-2 space-y-1.5">
                      <Label>Item Name</Label>
                      <Input
                        value={row.name}
                        onChange={(e) => setBulkRowValue(row.id, { name: e.target.value })}
                        placeholder="Momo"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <select
                        value={row.categoryId}
                        onChange={(e) => void handleBulkCategoryChange(row.id, e.target.value)}
                        className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-ring/50"
                      >
                        <option value="">Select</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                        <option value="__add_new__">+ Add New Category</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Type</Label>
                      <select
                        value={row.itemType}
                        onChange={(e) => setBulkRowValue(row.id, { itemType: e.target.value as BulkRow["itemType"] })}
                        className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-ring/50"
                      >
                        {ITEM_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Price</Label>
                      <RsInput value={row.price} onChange={(v) => setBulkRowValue(row.id, { price: v })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Kitchen Item</Label>
                      <div className="flex items-center gap-4 h-10">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            checked={row.kitchenItem}
                            onChange={() => setBulkRowValue(row.id, { kitchenItem: true })}
                            className="accent-primary"
                          />
                          Yes
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            checked={!row.kitchenItem}
                            onChange={() => setBulkRowValue(row.id, { kitchenItem: false })}
                            className="accent-primary"
                          />
                          No (Instant)
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Picture</Label>
                      {row.imagePreview ? (
                        <div className="flex items-center gap-3 rounded-lg border border-border p-2">
                          <img src={row.imagePreview} alt={row.name || "preview"} className="size-12 rounded object-cover border border-border" />
                          <div className="flex-1 text-xs text-muted-foreground">Image selected</div>
                          <Button type="button" variant="outline" size="sm" onClick={() => clearBulkImage(row.id)}>
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleBulkImage(row.id, e.target.files?.[0] ?? null)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {bulkFailures.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                  <p className="text-xs font-medium mb-1">Failed rows:</p>
                  <ul className="space-y-1">
                    {bulkFailures.map((failure, i) => (
                      <li key={`${failure}-${i}`} className="text-xs text-destructive">
                        {failure}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSaveBulk} disabled={bulkSaving}>
              {bulkSaving && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
              Save All Rows
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
