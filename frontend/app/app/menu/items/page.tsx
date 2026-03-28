"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import MenuItemsTable from "@/components/dashboard/MenuItemsTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, Loader2, ImageOff } from "lucide-react"
import {
  useMenuItems, useUpdateMenuItem, useDeleteMenuItem,
  useMenuCategories, useMenus,
} from "@/hooks/useApi"
import { api, apiUpload } from "@/lib/api"
import type { MenuItem } from "@/lib/types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "")

function resolveImageUrl(image?: string | null): string | undefined {
  if (!image) return undefined
  if (/^https?:\/\//i.test(image) || image.startsWith("data:")) return image
  return `${API_ORIGIN}${image.startsWith("/") ? "" : "/"}${image}`
}

interface EditDialogProps {
  item: MenuItem | null
  categories: { id: number; name: string }[]
  onClose: () => void
  onSaved: () => void
}

function EditMenuItemDialog({ item, categories, onClose, onSaved }: EditDialogProps) {
  const updateMutation = useUpdateMenuItem()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isAvailable, setIsAvailable] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const imgRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (item) {
      setName(item.name)
      setDescription(item.description ?? "")
      setPrice(String(item.price))
      setCategoryId(String(item.category_id))
      setIsAvailable(item.is_available)
      setImageFile(null)
      setImagePreview(resolveImageUrl(item.image) ?? null)
    }
  }, [item])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (imgRef.current) imgRef.current.value = ""
  }

  async function handleSave() {
    if (!item || !name || !categoryId || !price) return
    setSaving(true)
    try {
      if (imageFile) {
        const fd = new FormData()
        fd.append("_method", "PUT")
        fd.append("name", name)
        fd.append("description", description)
        fd.append("category_id", categoryId)
        fd.append("price", price)
        fd.append("is_available", isAvailable ? "1" : "0")
        fd.append("image", imageFile)
        await apiUpload(`/menu-items/${item.id}`, fd, "POST")
      } else {
        await updateMutation.mutateAsync({
          id: item.id,
          name,
          description: description || undefined,
          category_id: Number(categoryId),
          price: Number(price),
          is_available: isAvailable,
        })
      }
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
          <DialogDescription>Fill in the details for this menu item.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Image upload */}
          <div className="space-y-1.5">
            <Label>Item Image</Label>
            {imagePreview ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-background/90 border border-border rounded-full p-1 hover:bg-muted"
                  aria-label="Remove image"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="edit-item-image"
                className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <div className="bg-muted rounded-full p-2.5"><Upload className="size-4 text-muted-foreground" /></div>
                <p className="text-xs text-muted-foreground">Click to upload image (JPEG, PNG, max 2MB)</p>
              </label>
            )}
            <input ref={imgRef} id="edit-item-image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Item Name <span className="text-destructive">*</span></Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Butter Chicken" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Description</Label>
            <textarea
              id="edit-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category <span className="text-destructive">*</span></Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-price">Price <span className="text-destructive">*</span></Label>
              <Input id="edit-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch id="edit-avail" checked={isAvailable} onCheckedChange={setIsAvailable} />
            <Label htmlFor="edit-avail" className="cursor-pointer">Is Available</Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name || !categoryId || !price}>
            {saving && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function MenuItemsPage() {
  const { data: itemsPage, isLoading, refetch } = useMenuItems()
  const { data: categories = [] } = useMenuCategories()
  const { data: menus = [] } = useMenus()
  const deleteMutation = useDeleteMenuItem()
  const items = itemsPage?.data ?? []

  const [editing, setEditing] = useState<MenuItem | null>(null)

  const tableItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    price: `₹${Number(item.price).toFixed(2)}`,
    category: item.category?.name ?? "",
    menuName: "",
    available: item.is_available,
    showOnSite: item.is_available,
    image: item.image,
    _raw: item,
  }))

  return (
    <>
      <MenuItemsTable
        items={tableItems}
        menus={menus.map((m) => m.name)}
        loading={isLoading}
        onEdit={(row) => setEditing((row as typeof tableItems[0])._raw)}
        onDelete={(row) => deleteMutation.mutate(row.id)}
      />
      <EditMenuItemDialog
        item={editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSaved={() => refetch()}
      />
    </>
  )
}
