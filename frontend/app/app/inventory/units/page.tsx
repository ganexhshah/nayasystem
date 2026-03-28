"use client"

import { useState } from "react"
import { Plus, Search, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useInventoryUnits, useCreateInventoryUnit, useUpdateInventoryUnit, useDeleteInventoryUnit } from "@/hooks/useApi"
import type { InventoryUnit } from "@/lib/types"

const EMPTY = { name: "", abbreviation: "" }

export default function UnitsPage() {
  const { data: units = [], isLoading } = useInventoryUnits()
  const createUnit = useCreateInventoryUnit()
  const updateUnit = useUpdateInventoryUnit()
  const deleteUnit = useDeleteInventoryUnit()

  const [query, setQuery]     = useState("")
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<InventoryUnit | null>(null)
  const [form, setForm]       = useState(EMPTY)
  const [error, setError]     = useState("")

  function set(k: keyof typeof EMPTY, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  function openAdd()              { setEditing(null); setForm(EMPTY); setError(""); setOpen(true) }
  function openEdit(u: InventoryUnit) { setEditing(u); setForm({ name: u.name, abbreviation: u.abbreviation }); setError(""); setOpen(true) }

  async function handleSave() {
    if (!form.name.trim() || !form.abbreviation.trim()) return
    setError("")
    try {
      if (editing) {
        await updateUnit.mutateAsync({ id: editing.id, name: form.name, abbreviation: form.abbreviation })
      } else {
        await createUnit.mutateAsync({ name: form.name, abbreviation: form.abbreviation })
      }
      setOpen(false)
    } catch {
      setError("Failed to save.")
    }
  }

  const filtered = units.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.abbreviation.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Units</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8 h-8 w-48" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button size="sm" className="gap-1.5 h-8" onClick={openAdd}>
            <Plus className="size-4" /> Add Unit
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs uppercase tracking-wide font-medium">Unit Name</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium">Symbol</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-16 text-sm">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-16 text-sm">No units found.</TableCell></TableRow>
            ) : filtered.map((u) => (
              <TableRow key={u.id} className="hover:bg-muted/20">
                <TableCell className="font-medium text-sm">{u.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.abbreviation}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(u)}>
                    <Pencil className="size-3" /> Update
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit Unit" : "Add Unit"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Unit Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Kilogram" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit Symbol <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. kg" value={form.abbreviation} onChange={(e) => set("abbreviation", e.target.value)} />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || !form.abbreviation.trim() || createUnit.isPending || updateUnit.isPending}>
              {createUnit.isPending || updateUnit.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
