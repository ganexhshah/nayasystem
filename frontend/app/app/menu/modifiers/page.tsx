"use client"

import { useState } from "react"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  useModifiers, useModifierGroups, useMenuItems,
  useCreateModifier, useUpdateModifier, useDeleteModifier,
} from "@/hooks/useApi"
import type { Modifier } from "@/lib/types"

const EMPTY = { modifier_group_id: 0, name: "", price: "" }

export default function ItemModifiersPage() {
  const { data: modifiers = [], isLoading } = useModifiers()
  const { data: groups = [] } = useModifierGroups()
  const { data: itemsPage } = useMenuItems()
  const menuItems = itemsPage?.data ?? []

  const createMutation = useCreateModifier()
  const updateMutation = useUpdateModifier()
  const deleteMutation = useDeleteModifier()

  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Modifier | null>(null)
  const [form, setForm] = useState<typeof EMPTY>(EMPTY)

  const filtered = modifiers.filter(
    (r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      (r.group?.name ?? "").toLowerCase().includes(query.toLowerCase())
  )

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(row: Modifier) {
    setEditing(row)
    setForm({ modifier_group_id: row.modifier_group_id, name: row.name, price: String(row.price) })
    setOpen(true)
  }

  function handleSave() {
    if (!form.modifier_group_id || !form.name) return
    const payload = { modifier_group_id: Number(form.modifier_group_id), name: form.name, price: Number(form.price) || 0 }
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Item Modifiers</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8 h-8 w-48" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button size="sm" className="gap-1.5 h-8" onClick={openAdd}>
            <Plus className="size-4" /> Add Item Modifier
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs uppercase tracking-wide font-medium">Modifier Name</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium">Group</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium">Price</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-sm text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12 text-sm">No modifiers found.</TableCell></TableRow>
            ) : filtered.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/30">
                <TableCell className="text-sm font-medium">{row.name}</TableCell>
                <TableCell className="text-sm">
                  <Badge variant="outline">{row.group?.name ?? `Group #${row.modifier_group_id}`}</Badge>
                </TableCell>
                <TableCell className="text-sm">₹{Number(row.price).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={row.is_active ? "default" : "secondary"}>{row.is_active ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(row)}>
                      <Pencil className="size-3" /> Update
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(row.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Modifier" : "Add Modifier"}</DialogTitle>
            <DialogDescription>{editing ? "Update modifier details." : "Add a modifier option."}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Modifier Group <span className="text-destructive">*</span></Label>
              <select
                value={form.modifier_group_id}
                onChange={(e) => setForm((f) => ({ ...f, modifier_group_id: Number(e.target.value) }))}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-ring/50"
              >
                <option value={0}>Select Group</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Modifier Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Extra Cheese"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Price</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.modifier_group_id || !form.name}>
              {editing ? "Save Changes" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
