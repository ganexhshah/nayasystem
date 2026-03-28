"use client"

import { useState } from "react"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from "@/hooks/useApi"
import type { Supplier } from "@/lib/types"

const EMPTY = { name: "", email: "", phone: "", address: "", contact_person: "" }

export default function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useSuppliers()
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const deleteSupplier = useDeleteSupplier()

  const [query, setQuery]     = useState("")
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm]       = useState(EMPTY)
  const [error, setError]     = useState("")

  function set(k: keyof typeof EMPTY, v: string) { setForm((f) => ({ ...f, [k]: v })) }
  function openAdd()             { setEditing(null); setForm(EMPTY); setError(""); setOpen(true) }
  function openEdit(s: Supplier) { setEditing(s); setForm({ name: s.name, email: s.email ?? "", phone: s.phone ?? "", address: s.address ?? "", contact_person: s.contact_person ?? "" }); setError(""); setOpen(true) }

  async function handleSave() {
    if (!form.name.trim()) return
    setError("")
    try {
      if (editing) {
        await updateSupplier.mutateAsync({ id: editing.id, ...form })
      } else {
        await createSupplier.mutateAsync(form)
      }
      setOpen(false)
    } catch {
      setError("Failed to save.")
    }
  }

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Suppliers</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8 h-8 w-48" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button size="sm" className="gap-1.5 h-8" onClick={openAdd}>
            <Plus className="size-4" /> Add Supplier
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {["Name", "Email", "Phone", "Address", "Contact Person", "Actions"].map((h) => (
                <TableHead key={h} className="text-xs uppercase tracking-wide font-medium">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-16 text-center text-sm text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-16 text-center text-sm text-muted-foreground">No suppliers found</TableCell></TableRow>
            ) : filtered.map((s) => (
              <TableRow key={s.id} className="hover:bg-muted/20">
                <TableCell className="font-medium text-sm">{s.name}</TableCell>
                <TableCell className="text-muted-foreground">{s.email || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{s.phone || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{s.address || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{s.contact_person || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => openEdit(s)}>
                      <Pencil className="size-3" /> Update
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteSupplier.mutate(s.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input placeholder="Supplier name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="supplier@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input placeholder="+1 234 567 8900" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Person</Label>
              <Input placeholder="Contact person name" value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <textarea rows={2} placeholder="Street, City, State" value={form.address} onChange={(e) => set("address", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || createSupplier.isPending || updateSupplier.isPending}>
              {createSupplier.isPending || updateSupplier.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
