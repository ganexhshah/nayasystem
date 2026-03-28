"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  useTableAreas, useCreateTableArea, useUpdateTableArea, useDeleteTableArea,
} from "@/hooks/useApi"
import type { TableArea } from "@/lib/types"

export default function AreasPage() {
  const { data: areas = [], isLoading } = useTableAreas()
  const createMutation = useCreateTableArea()
  const updateMutation = useUpdateTableArea()
  const deleteMutation = useDeleteTableArea()

  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TableArea | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const filtered = areas.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))

  function openAdd() { setEditing(null); setName(""); setDescription(""); setOpen(true) }
  function openEdit(a: TableArea) { setEditing(a); setName(a.name); setDescription(a.description ?? ""); setOpen(true) }

  function handleSave() {
    if (!name.trim()) return
    if (editing) {
      updateMutation.mutate({ id: editing.id, name, description: description || undefined })
    } else {
      createMutation.mutate({ name, description: description || undefined })
    }
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">All Areas</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search areas..." className="pl-8 h-8 w-44" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button size="sm" className="gap-1.5 h-8" onClick={openAdd}>
            <Plus className="size-4" /> Add Area
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs uppercase tracking-wide font-medium">Area Name</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium">Description</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium">No Of Tables</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12 text-sm">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12 text-sm">No areas found.</TableCell></TableRow>
            ) : filtered.map((area) => (
              <TableRow key={area.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{area.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{area.description ?? "—"}</TableCell>
                <TableCell>{area.tables?.length ?? 0}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(area)}>
                      <Pencil className="size-3" /> Update
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(area.id)}
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
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Area" : "Add Area"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="areaName">Area Name <span className="text-destructive">*</span></Label>
              <Input
                id="areaName"
                placeholder="e.g. Lounge"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="areaDesc">Description</Label>
              <Input
                id="areaDesc"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
