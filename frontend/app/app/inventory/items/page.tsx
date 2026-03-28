"use client"

import { useState } from "react"
import { Plus, Search, Pencil, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useInventoryItems, useInventoryCategories, useInventoryUnits, useCreateInventoryItem, useUpdateInventoryItem } from "@/hooks/useApi"
import type { InventoryItem } from "@/lib/types"

const PAGE_SIZE = 10
const EMPTY = { name: "", category_id: "", unit_id: "", cost_price: "", reorder_level: "" }

export default function InventoryItemsPage() {
  const { data: itemsData, isLoading } = useInventoryItems()
  const { data: categories = [] } = useInventoryCategories()
  const { data: units = [] } = useInventoryUnits()
  const createItem = useCreateInventoryItem()
  const updateItem = useUpdateInventoryItem()

  const items = itemsData?.data ?? []

  const [query, setQuery]     = useState("")
  const [page, setPage]       = useState(1)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [form, setForm]       = useState(EMPTY)
  const [error, setError]     = useState("")

  function set(k: keyof typeof EMPTY, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  function openAdd() { setEditing(null); setForm(EMPTY); setError(""); setOpen(true) }
  function openEdit(i: InventoryItem) {
    setEditing(i)
    setForm({ name: i.name, category_id: String(i.category_id ?? ""), unit_id: String(i.unit_id ?? ""), cost_price: String(i.cost_price), reorder_level: String(i.reorder_level) })
    setError("")
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setError("")
    try {
      const payload = {
        name: form.name,
        category_id: form.category_id ? Number(form.category_id) : undefined,
        unit_id: form.unit_id ? Number(form.unit_id) : undefined,
        cost_price: Number(form.cost_price) || 0,
        reorder_level: Number(form.reorder_level) || 0,
      }
      if (editing) {
        await updateItem.mutateAsync({ id: editing.id, ...payload })
      } else {
        await createItem.mutateAsync(payload)
      }
      setOpen(false)
    } catch {
      setError("Failed to save.")
    }
  }

  const filtered   = items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Inventory Items</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8 h-8 w-48" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} />
          </div>
          <Button size="sm" className="gap-1.5 h-8" onClick={openAdd}>
            <Plus className="size-4" /> Add Inventory Item
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {["Item Name", "Category", "Unit", "Reorder Level", "Cost Price", "Action"].map((h) => (
                <TableHead key={h} className="text-xs uppercase tracking-wide font-medium">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-16 text-sm">Loading...</TableCell></TableRow>
            ) : paged.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-16 text-sm">No items found.</TableCell></TableRow>
            ) : paged.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/20">
                <TableCell className="font-medium text-sm">{item.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.category?.name ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.unit?.abbreviation ?? "—"}</TableCell>
                <TableCell className="text-sm">{item.reorder_level}</TableCell>
                <TableCell className="text-sm">{item.cost_price}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(item)}>
                    <Pencil className="size-3" /> Update
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} To {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} results</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" className="size-7" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="size-3.5" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={p === page ? "default" : "outline"} size="icon-sm" className="size-7 text-xs" onClick={() => setPage(p)}>{p}</Button>
          ))}
          <Button variant="outline" size="icon-sm" className="size-7" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Inventory Item" : "Add Inventory Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Item Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Chicken Breast" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category_id || undefined} onValueChange={(v) => v && set("category_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={form.unit_id || undefined} onValueChange={(v) => v && set("unit_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Unit" /></SelectTrigger>
                  <SelectContent>{units.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.abbreviation})</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Cost Price</Label>
                <Input type="number" placeholder="0.00" value={form.cost_price} onChange={(e) => set("cost_price", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Reorder Level</Label>
                <Input type="number" placeholder="0" value={form.reorder_level} onChange={(e) => set("reorder_level", e.target.value)} />
              </div>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || createItem.isPending || updateItem.isPending}>
              {createItem.isPending || updateItem.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
