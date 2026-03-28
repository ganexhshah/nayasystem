"use client"

import { useMemo, useState } from "react"
import { Download, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCodReport } from "@/hooks/useApi"
import { buildReportFilename, dateRangeForFilter, downloadCsv, formatReportDateTime, REPORT_DATE_FILTERS } from "@/lib/reporting"
import { cn } from "@/lib/utils"

interface CodPaymentRow {
  id: number
  amount: number
  method: string
  status: string
  reference?: string | null
  paid_at?: string | null
  created_at?: string | null
  order?: {
    order_number?: string | null
    customer?: {
      name?: string | null
    } | null
  } | null
  customer?: {
    name?: string | null
  } | null
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  refunded: "bg-red-100 text-red-700 border-red-200",
  failed: "bg-red-100 text-red-700 border-red-200",
}

export default function CODReportPage() {
  const [dateFilter, setDateFilter] = useState("Current Week")
  const { from, to } = useMemo(() => dateRangeForFilter(dateFilter), [dateFilter])
  const params = useMemo(() => ({ from, to }), [from, to])
  const { data: rows = [], isLoading } = useCodReport(params) as { data: CodPaymentRow[]; isLoading: boolean }
  const totalCollected = rows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)

  function handleExport() {
    downloadCsv(
      buildReportFilename("cod-report", from, to),
      ["Order", "Customer", "Amount", "Method", "Reference", "Date & Time", "Status"],
      rows.map((row) => [
        row.order?.order_number ?? `Payment #${row.id}`,
        row.order?.customer?.name ?? row.customer?.name ?? "-",
        Number(row.amount ?? 0).toFixed(2),
        row.method,
        row.reference ?? "-",
        formatReportDateTime(row.paid_at ?? row.created_at),
        row.status,
      ])
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">COD Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Cash on delivery collections for delivery orders
          <span className="ml-1 text-xs">({from} to {to})</span>
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">COD Payments</p>
          <p className="mt-1 text-lg font-bold">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Collected</p>
          <p className="mt-1 flex items-center gap-0.5 text-lg font-bold">
            <IndianRupee className="size-4 text-muted-foreground" />
            {totalCollected.toFixed(2)}
          </p>
        </div>
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
              {["Order", "Customer", "Amount", "Method", "Reference", "Date & Time", "Status"].map((h) => (
                <TableHead key={h} className="text-xs font-medium whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="py-16 text-center text-sm text-muted-foreground">Loading...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-16 text-center text-sm text-muted-foreground">No COD payments found for this period.</TableCell></TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/20">
                <TableCell className="text-sm font-medium">{row.order?.order_number ?? `Payment #${row.id}`}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.order?.customer?.name ?? row.customer?.name ?? "-"}</TableCell>
                <TableCell className="text-sm"><span className="flex items-center gap-0.5"><IndianRupee className="size-3 text-muted-foreground" />{Number(row.amount ?? 0).toFixed(2)}</span></TableCell>
                <TableCell className="text-sm capitalize">{row.method}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.reference ?? "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatReportDateTime(row.paid_at ?? row.created_at)}</TableCell>
                <TableCell>
                  <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium capitalize", STATUS_STYLES[row.status] ?? "bg-muted text-muted-foreground border-border")}>
                    {row.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
