"use client"

import { useState } from "react"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useExpenseCategories, useCreateExpenseCategory, useUpdateExpenseCategory, useDeleteExpenseCategory } from "@/hooks/useApi"
import type { ExpenseCategory } from "@/lib/types"

const EMPTY = { name: "", description: "" }

export default function ExpenseCategoriesPage() {
  const { data: categories = [], isLoading } = useExpenseCategories()
  const createCat = useCreateExpenseCategory()
  const updateCat = useUpdateExpenseCategory()
  const deleteCat = useDeleteExpenseCategory()

  const [query, setQuery]     = useState("")
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<ExpenseCategory | null>(null)
  const [form, setForm]       = useState(EMPTY)
  const [error, setError]     = useState("")

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  function openAdd() { setEditing(null); setForm(EMPTY); setError(""); setOpen(true) }
  function openEdit(c: ExpenseCategory) { setEditing(c); setForm({ name: c.name, description: c.description ?? "" }); setError(""); setOpen(true) }

  async function handleSave() {
    if (!form.name.trim()) return
    setError("")
    try {
      if (editing) {
        await updateCat.mutateAsync({ id: editing.id, name: form.name, description: form.description })
      } else {
        await createCat.mutateAsync({ name: form.name, description: form.description })
      }
      setOpen(false)
    } catch {
      setError("Failed to save.")
    }
  }

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.description ?? "").toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Expenses Category</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8 h-8 w-48" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button size="sm" className="gap-1.5 h-8" onClick={openAdd}>
            <Plus className="size-4" /> Add Category
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs uppercase tracking-wide font-medium">Category</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium">Description</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-16 text-sm">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-16 text-sm">No categories found.</TableCell></TableRow>
            ) : filtered.map((c) => (
              <TableRow key={c.id} className="hover:bg-muted/20">
                <TableCell className="font-medium text-sm">{c.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.description || "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(c)}>
                      <Pencil className="size-3" /> Update
                    </Button>
                    <Button variant="ghost" size="icon-sm"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteCat.mutate(c.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} categor{filtered.length !== 1 ? "ies" : "y"}</p>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Expense Category" : "Add Expense Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Category <span className="text-destructive">*</span></Label>
              <Input placeholder="Category name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea placeholder="Optional description" rows={3} value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || createCat.isPending || updateCat.isPending}>
              {createCat.isPending || updateCat.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
