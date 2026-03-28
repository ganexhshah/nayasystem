"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useBatchInventories, useCreateBatchInventory } from "@/hooks/useApi"
import type { BatchInventory } from "@/lib/types"

const STATUS_FILTERS = ["All Status", "draft", "completed"]

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
}

function ProduceBatchModal({ onClose }: { onClose: () => void }) {
  const createBatch = useCreateBatchInventory()
  const [type, setType]   = useState<"production" | "waste" | "adjustment">("production")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  async function handleSave() {
    setError("")
    try {
      await createBatch.mutateAsync({ type, notes: notes || undefined, status: "draft" })
      onClose()
    } catch {
      setError("Failed to create batch.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">Create Batch</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="space-y-1.5">
            <Label>Batch Type <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              {(["production", "waste", "adjustment"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                    type === t ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted")}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <textarea rows={3} placeholder="Optional notes..." value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={createBatch.isPending}>
            {createBatch.isPending ? "Saving..." : "Create Batch"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function BatchInventoryPage() {
  const { data: batchData, isLoading } = useBatchInventories()
  const batches = batchData?.data ?? []

  const [statusFilter, setStatus] = useState("All Status")
  const [typeFilter, setType]     = useState("All Types")
  const [open, setOpen]           = useState(false)

  const filtered = batches.filter((b) => {
    const matchS = statusFilter === "All Status" || b.status === statusFilter
    const matchT = typeFilter   === "All Types"  || b.type   === typeFilter
    return matchS && matchT
  })

  return (
    <>
      {open && <ProduceBatchModal onClose={() => setOpen(false)} />}
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold">Batch Inventory</h1>
            <p className="text-sm text-muted-foreground">View and manage batch stock levels</p>
          </div>
          <Button size="sm" className="gap-1.5 h-8" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> Create Batch
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize",
                statusFilter === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
              {s}
            </button>
          ))}
          {["All Types", "production", "waste", "adjustment"].map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize",
                typeFilter === t ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
              {t}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {["Batch Number", "Type", "Status", "Notes", "Created On"].map((h) => (
                  <TableHead key={h} className="text-xs uppercase tracking-wide font-medium">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-16 text-center text-sm text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-16 text-center text-sm text-muted-foreground">No batch stock found</TableCell></TableRow>
              ) : filtered.map((b) => (
                <TableRow key={b.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium text-sm">{b.batch_number}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{b.type}</TableCell>
                  <TableCell>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", STATUS_COLORS[b.status] ?? "bg-muted text-muted-foreground")}>{b.status}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{b.notes || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{b.processed_at ? new Date(b.processed_at).toLocaleDateString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}
