"use client"

import { useMemo, useState } from "react"
import { Download, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCancelledReport } from "@/hooks/useApi"
import { buildReportFilename, dateRangeForFilter, downloadCsv, formatReportDateTime, REPORT_DATE_FILTERS } from "@/lib/reporting"
import { cn } from "@/lib/utils"

interface CancelledOrderRow {
  id: number
  order_number: string
  order_type: string
  total: number
  notes?: string | null
  created_at: string
  customer?: {
    name?: string | null
  } | null
  user?: {
    name?: string | null
  } | null
}

export default function CancelledOrderReportPage() {
  const [dateFilter, setDateFilter] = useState("Current Week")
  const { from, to } = useMemo(() => dateRangeForFilter(dateFilter), [dateFilter])
  const params = useMemo(() => ({ from, to }), [from, to])
  const { data: rows = [], isLoading } = useCancelledReport(params) as { data: CancelledOrderRow[]; isLoading: boolean }

  function handleExport() {
    downloadCsv(
      buildReportFilename("cancelled-orders", from, to),
      ["Order", "Type", "Customer", "Amount", "Cancelled By", "Notes", "Date & Time"],
      rows.map((row) => [
        row.order_number,
        row.order_type,
        row.customer?.name ?? "-",
        Number(row.total ?? 0).toFixed(2),
        row.user?.name ?? "-",
        row.notes ?? "-",
        formatReportDateTime(row.created_at),
      ])
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Cancelled Order Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review cancelled orders and internal notes
          <span className="ml-1 text-xs">({from} to {to})</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {REPORT_DATE_FILTERS.map((f) => (
          <button key={f} onClick={() => setDateFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-xs border transition-colors whitespace-nowrap",
              dateFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
            {f}
          </button>
        ))}
        <Button variant="outline" size="sm" className="gap-1.5 h-8 ml-auto" onClick={handleExport} disabled={isLoading || rows.length === 0}>
          <Download className="size-3.5" /> Export
        </Button>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {["Order", "Type", "Customer", "Amount", "Cancelled By", "Reason", "Date & Time"].map((h) => (
                <TableHead key={h} className="text-xs font-medium whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-16 text-sm">Loading...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-16 text-sm">No cancelled orders found for this period.</TableCell></TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/20">
                <TableCell className="text-sm font-medium">{row.order_number}</TableCell>
                <TableCell className="text-sm capitalize">{row.order_type.replace("_", " ")}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.customer?.name ?? "-"}</TableCell>
                <TableCell className="text-sm"><span className="flex items-center gap-0.5"><IndianRupee className="size-3 text-muted-foreground" />{Number(row.total ?? 0).toFixed(2)}</span></TableCell>
                <TableCell className="text-sm">{row.user?.name ?? "-"}</TableCell>
                <TableCell className="max-w-56 text-sm text-muted-foreground">{row.notes ?? "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatReportDateTime(row.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
