"use client"

import { useState } from "react"
import { Search, Plus, X, Pencil, ChefHat, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useKitchens, useCreateKitchen, useUpdateKitchen, useDeleteKitchen } from "@/hooks/useApi"
import type { Kitchen } from "@/lib/types"

const KITCHEN_TYPES = [
  { value: "default", label: "Default" },
  { value: "veg",     label: "Veg" },
  { value: "non_veg", label: "Non-Veg" },
]

function KitchenModal({ onClose, onSave, editing, saving }: {
  onClose: () => void
  onSave: (data: { name: string; type: "default" | "veg" | "non_veg"; is_active: boolean }) => void
  editing?: Kitchen | null
  saving?: boolean
}) {
  const [name, setName]   = useState(editing?.name ?? "")
  const [type, setType]   = useState<"default" | "veg" | "non_veg">(editing?.type ?? "default")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">{editing ? "Edit Kitchen" : "Add Kitchen"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="space-y-1.5">
            <Label>Kitchen Name <span className="text-destructive">*</span></Label>
            <Input placeholder="Kitchen name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Type <span className="text-destructive">*</span></Label>
            <Select value={type} onValueChange={(v) => v && setType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KITCHEN_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!name || saving}
            onClick={() => { if (name) { onSave({ name, type, is_active: true }); } }}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function KitchenSettingsPage() {
  const { data: kitchens = [], isLoading } = useKitchens()
  const createKitchen = useCreateKitchen()
  const updateKitchen = useUpdateKitchen()
  const deleteKitchen = useDeleteKitchen()

  const [search, setSearch]       = useState("")
  const [editModal, setEditModal] = useState<Kitchen | null>(null)
  const [addOpen, setAddOpen]     = useState(false)

  const filtered = kitchens.filter((k) => k.name.toLowerCase().includes(search.toLowerCase()))

  async function handleSave(data: { name: string; type: "default" | "veg" | "non_veg"; is_active: boolean }) {
    if (editModal) {
      await updateKitchen.mutateAsync({ id: editModal.id, ...data })
    } else {
      await createKitchen.mutateAsync(data)
    }
    setEditModal(null)
    setAddOpen(false)
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this kitchen?")) return
    await deleteKitchen.mutateAsync(id)
  }

  const isSaving = createKitchen.isPending || updateKitchen.isPending

  return (
    <>
      {(editModal || addOpen) && (
        <KitchenModal
          editing={editModal}
          onClose={() => { setEditModal(null); setAddOpen(false) }}
          onSave={handleSave}
          saving={isSaving}
        />
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-semibold">Kitchens</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input placeholder="Search" className="pl-8 h-8 w-48 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button size="sm" className="gap-1.5 h-8" onClick={() => { setEditModal(null); setAddOpen(true) }}>
              <Plus className="size-3.5" /> Add Kitchen
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-10 text-center">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">No kitchens found</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((kitchen) => (
              <div key={kitchen.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-start justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <ChefHat className="size-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{kitchen.name}</span>
                  </div>
                  <Badge className={cn("text-xs border-0", kitchen.is_active
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400")}>
                    {kitchen.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="px-4 py-3 text-xs text-muted-foreground">
                  <span className="capitalize">Type: {kitchen.type.replace("_", "-")}</span>
                </div>

                <div className="flex gap-2 px-4 py-3 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs"
                    onClick={() => setEditModal(kitchen)}>
                    <Pencil className="size-3" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(kitchen.id)}
                    disabled={deleteKitchen.isPending}>
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
