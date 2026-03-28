"use client"

import { useState } from "react"
import { Plus, Search, Pencil, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useInventoryCategories, useCreateInventoryCategory, useUpdateInventoryCategory, useDeleteInventoryCategory } from "@/hooks/useApi"
import type { InventoryCategory } from "@/lib/types"

const PAGE_SIZE = 10

export default function InventoryItemCategoriesPage() {
  const { data: categories = [], isLoading } = useInventoryCategories()
  const createCat = useCreateInventoryCategory()
  const updateCat = useUpdateInventoryCategory()
  const deleteCat = useDeleteInventoryCategory()

  const [query, setQuery]     = useState("")
  const [page, setPage]       = useState(1)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<InventoryCategory | null>(null)
  const [name, setName]       = useState("")
  const [error, setError]     = useState("")

  function openAdd()                         { setEditing(null); setName(""); setError(""); setOpen(true) }
  function openEdit(c: InventoryCategory)    { setEditing(c); setName(c.name); setError(""); setOpen(true) }

  async function handleSave() {
    if (!name.trim()) return
    setError("")
    try {
      if (editing) {
        await updateCat.mutateAsync({ id: editing.id, name: name.trim() })
      } else {
        await createCat.mutateAsync({ name: name.trim() })
      }
      setOpen(false)
    } catch {
      setError("Failed to save.")
    }
  }

  const filtered   = categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Inventory Item Categories</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8 h-8 w-48" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} />
          </div>
          <Button size="sm" className="gap-1.5 h-8" onClick={openAdd}>
            <Plus className="size-4" /> Add Item Category
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs uppercase tracking-wide font-medium">Item Category Name</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-16 text-sm">Loading...</TableCell></TableRow>
            ) : paged.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-16 text-sm">No categories found.</TableCell></TableRow>
            ) : paged.map((c) => (
              <TableRow key={c.id} className="hover:bg-muted/20">
                <TableCell className="font-medium text-sm">{c.name}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(c)}>
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
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit Item Category" : "Add Item Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Item Category Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Meat & Poultry" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim() || createCat.isPending || updateCat.isPending}>
              {createCat.isPending || updateCat.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
