"use client"

import { useMemo, useState } from "react"
import { Download, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDeliveryReport } from "@/hooks/useApi"
import { buildReportFilename, dateRangeForFilter, downloadCsv, formatReportDateTime, REPORT_DATE_FILTERS } from "@/lib/reporting"
import { cn } from "@/lib/utils"

interface DeliveryOrderRow {
  id: number
  order_number: string
  status: string
  payment_status: string
  total: number
  delivery_address?: string | null
  created_at: string
  customer?: {
    name?: string | null
  } | null
}

export default function DeliveryAppReportPage() {
  const [dateFilter, setDateFilter] = useState("Current Week")
  const { from, to } = useMemo(() => dateRangeForFilter(dateFilter), [dateFilter])
  const params = useMemo(() => ({ from, to }), [from, to])
  const { data: rows = [], isLoading } = useDeliveryReport(params) as { data: DeliveryOrderRow[]; isLoading: boolean }
  const totalRevenue = rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0)

  function handleExport() {
    downloadCsv(
      buildReportFilename("delivery-orders", from, to),
      ["Order", "Customer", "Status", "Payment", "Amount", "Delivery Address", "Date & Time"],
      rows.map((row) => [
        row.order_number,
        row.customer?.name ?? "-",
        row.status,
        row.payment_status,
        Number(row.total ?? 0).toFixed(2),
        row.delivery_address ?? "-",
        formatReportDateTime(row.created_at),
      ])
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Delivery Orders Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track delivery orders and revenue
          <span className="ml-1 text-xs">({from} to {to})</span>
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Delivery Orders</p>
          <p className="mt-1 text-lg font-bold">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Delivery Revenue</p>
          <p className="mt-1 flex items-center gap-0.5 text-lg font-bold"><IndianRupee className="size-4 text-muted-foreground" />{totalRevenue.toFixed(2)}</p>
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
              {["Order", "Customer", "Status", "Payment", "Amount", "Delivery Address", "Date & Time"].map((h) => (
                <TableHead key={h} className="text-xs font-medium whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-16 text-sm">Loading...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-16 text-sm">No delivery orders found for this period.</TableCell></TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/20">
                <TableCell className="text-sm font-medium">{row.order_number}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.customer?.name ?? "-"}</TableCell>
                <TableCell className="text-sm capitalize">{row.status}</TableCell>
                <TableCell className="text-sm capitalize">{row.payment_status}</TableCell>
                <TableCell className="text-sm"><span className="flex items-center gap-0.5"><IndianRupee className="size-3 text-muted-foreground" />{Number(row.total ?? 0).toFixed(2)}</span></TableCell>
                <TableCell className="max-w-64 text-sm text-muted-foreground">{row.delivery_address ?? "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatReportDateTime(row.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
