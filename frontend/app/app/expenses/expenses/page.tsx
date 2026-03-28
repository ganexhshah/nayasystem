"use client"

import { useState } from "react"
import { Plus, Search, SlidersHorizontal, Pencil, Trash2, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useExpenses, useExpenseCategories, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/useApi"
import type { Expense } from "@/lib/types"

const EMPTY = { title: "", category_id: "", amount: "", date: "", notes: "" }

export default function ExpensesPage() {
  const { data: expensesData, isLoading } = useExpenses()
  const { data: categories = [] } = useExpenseCategories()
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  const expenses = expensesData?.data ?? []

  const [query, setQuery]     = useState("")
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [form, setForm]       = useState(EMPTY)
  const [error, setError]     = useState("")

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  function openAdd() { setEditing(null); setForm(EMPTY); setError(""); setOpen(true) }
  function openEdit(e: Expense) {
    setEditing(e)
    setForm({ title: e.title, category_id: String(e.category_id), amount: String(e.amount), date: e.date, notes: e.notes ?? "" })
    setError("")
    setOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.category_id || !form.amount || !form.date) return
    setError("")
    try {
      const payload = { title: form.title, category_id: Number(form.category_id), amount: Number(form.amount), date: form.date, notes: form.notes }
      if (editing) {
        await updateExpense.mutateAsync({ id: editing.id, ...payload })
      } else {
        await createExpense.mutateAsync(payload)
      }
      setOpen(false)
    } catch {
      setError("Failed to save.")
    }
  }

  const filtered = expenses.filter((e) =>
    e.title.toLowerCase().includes(query.toLowerCase()) ||
    (e.category?.name ?? "").toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Expenses</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8 h-8 w-48" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-8"><SlidersHorizontal className="size-3.5" /> Show Filters</Button>
          <Button size="sm" className="gap-1.5 h-8" onClick={openAdd}><Plus className="size-4" /> Add Expense</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {["Expense Title", "Category", "Amount", "Date", "Notes", "Action"].map((h) => (
                <TableHead key={h} className="text-xs uppercase tracking-wide font-medium whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-20 text-sm">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-20 text-sm">No Expenses Found</TableCell></TableRow>
            ) : filtered.map((e) => (
              <TableRow key={e.id} className="hover:bg-muted/20">
                <TableCell className="font-medium text-sm">{e.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.category?.name ?? "—"}</TableCell>
                <TableCell className="text-sm">
                  <span className="flex items-center gap-0.5"><IndianRupee className="size-3.5 text-muted-foreground" />{e.amount}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{e.date || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{e.notes || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(e)}>
                      <Pencil className="size-3" /> Update
                    </Button>
                    <Button variant="ghost" size="icon-sm"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteExpense.mutate(e.id)}>
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Expense" : "Add Expense"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="Expense title" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category <span className="text-destructive">*</span></Label>
              <Select value={form.category_id || undefined} onValueChange={(v) => set("category_id", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input type="number" placeholder="0.00" className="pl-8" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <textarea placeholder="Optional notes" rows={3} value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}
              disabled={!form.title.trim() || !form.category_id || !form.amount || !form.date || createExpense.isPending || updateExpense.isPending}>
              {createExpense.isPending || updateExpense.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
