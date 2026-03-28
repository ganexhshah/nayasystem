"use client"

import { useMemo, useState } from "react"
import { Download, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDuePaymentsReport } from "@/hooks/useApi"
import { buildReportFilename, dateRangeForFilter, downloadCsv, formatReportDateTime, REPORT_DATE_FILTERS } from "@/lib/reporting"
import { cn } from "@/lib/utils"

interface DuePaymentOrderRow {
  id: number
  order_number: string
  total: number
  created_at: string
  customer?: {
    name?: string | null
    phone?: string | null
  } | null
  payments?: {
    id: number
    amount: number
  }[]
}

export default function DuePaymentsReceivedReportPage() {
  const [dateFilter, setDateFilter] = useState("Current Week")
  const { from, to } = useMemo(() => dateRangeForFilter(dateFilter), [dateFilter])
  const params = useMemo(() => ({ from, to }), [from, to])
  const { data: rows = [], isLoading } = useDuePaymentsReport(params) as { data: DuePaymentOrderRow[]; isLoading: boolean }

  const totalOutstanding = rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0)
  const totalLoggedPayments = rows.reduce(
    (sum, row) => sum + (row.payments ?? []).reduce((inner, payment) => inner + Number(payment.amount ?? 0), 0),
    0
  )

  function handleExport() {
    downloadCsv(
      buildReportFilename("due-payments", from, to),
      ["Customer", "Order", "Amount Due", "Contact", "Payments Logged", "Date & Time"],
      rows.map((row) => [
        row.customer?.name ?? "-",
        row.order_number,
        Number(row.total ?? 0).toFixed(2),
        row.customer?.phone ?? "-",
        (row.payments ?? []).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0).toFixed(2),
        formatReportDateTime(row.created_at),
      ])
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Outstanding Due Payments Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review completed orders that are still unpaid
          <span className="ml-1 text-xs">({from} to {to})</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-sm">
        {[{ label: "Outstanding Due", value: totalOutstanding.toFixed(2) }, { label: "Payments Logged", value: totalLoggedPayments.toFixed(2) }].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold flex items-center gap-0.5 mt-1"><IndianRupee className="size-4 text-muted-foreground" />{value}</p>
          </div>
        ))}
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
              {["Customer", "Order", "Amount Due", "Contact", "Payments Logged", "Date & Time"].map((h) => (
                <TableHead key={h} className="text-xs font-medium whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-16 text-sm">Loading...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-16 text-sm">No unpaid completed orders found for this period.</TableCell></TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/20">
                <TableCell className="text-sm font-medium">{row.customer?.name ?? "-"}</TableCell>
                <TableCell className="text-sm">{row.order_number}</TableCell>
                <TableCell className="text-sm"><span className="flex items-center gap-0.5"><IndianRupee className="size-3 text-muted-foreground" />{Number(row.total ?? 0).toFixed(2)}</span></TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.customer?.phone ?? "-"}</TableCell>
                <TableCell className="text-sm">{(row.payments ?? []).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0).toFixed(2)}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatReportDateTime(row.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
