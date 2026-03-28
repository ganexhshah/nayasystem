"use client"

import { useState } from "react"
import { Download, FlaskConical, Package, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useBatchInventories } from "@/hooks/useApi"

const STATUS_OPTIONS = ["All Status", "draft", "completed"]

const STATUS_STYLES: Record<string, string> = {
  draft:     "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
}

export default function BatchReportsPage() {
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [status, setStatus]         = useState("All Status")
  const [startDate, setStart]       = useState("")
  const [endDate, setEnd]           = useState("")

  const { data, isLoading } = useBatchInventories()
  const batches = data?.data ?? []

  const filtered = batches.filter((b) => {
    if (typeFilter !== "All Types" && b.type !== typeFilter) return false
    if (status !== "All Status" && b.status !== status) return false
    if (startDate && b.processed_at && b.processed_at < startDate) return false
    if (endDate && b.processed_at && b.processed_at > endDate) return false
    return true
  })

  const totalBatches   = filtered.length
  const activeCount    = filtered.filter((b) => b.status === "draft").length
  const completedCount = filtered.filter((b) => b.status === "completed").length

  const TYPE_OPTIONS = ["All Types", ...Array.from(new Set(batches.map((b) => b.type)))]

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Batch Reports</h1>
          <p className="text-sm text-muted-foreground">View production history and batch inventory reports</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-8">
          <Download className="size-3.5" /> Export
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Batches", value: totalBatches,   icon: FlaskConical, color: "text-blue-600"    },
          { label: "Draft",         value: activeCount,    icon: Package,      color: "text-yellow-600"  },
          { label: "Completed",     value: completedCount, icon: Trash2,       color: "text-green-600"   },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className={cn("size-4", color)} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
          <SelectTrigger className="h-8 text-xs w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => v && setStatus(v)}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">From</span>
          <input type="date" value={startDate} onChange={(e) => setStart(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2 text-xs outline-none focus-visible:border-ring" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">To</span>
          <input type="date" value={endDate} onChange={(e) => setEnd(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2 text-xs outline-none focus-visible:border-ring" />
        </div>

        {(typeFilter !== "All Types" || status !== "All Status" || startDate || endDate) && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground"
            onClick={() => { setTypeFilter("All Types"); setStatus("All Status"); setStart(""); setEnd("") }}>
            Clear Filters
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {["Batch #", "Type", "Status", "Notes", "Processed At", "Items"].map((h) => (
                <TableHead key={h} className="text-xs uppercase tracking-wide font-medium">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-sm text-muted-foreground">Loading…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-sm text-muted-foreground">No batch records found</TableCell>
              </TableRow>
            ) : filtered.map((b) => (
              <TableRow key={b.id} className="hover:bg-muted/20">
                <TableCell className="font-medium text-sm">{b.batch_number}</TableCell>
                <TableCell className="text-muted-foreground text-sm capitalize">{b.type}</TableCell>
                <TableCell>
                  <Badge className={cn("text-xs font-medium border-0 capitalize", STATUS_STYLES[b.status] ?? "bg-muted text-muted-foreground")}>
                    {b.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{b.notes ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {b.processed_at ? new Date(b.processed_at).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="text-sm">{b.items?.length ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
