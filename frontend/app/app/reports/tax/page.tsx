"use client"

import { useState, useMemo } from "react"
import { Download, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useTaxReport, useSalesReport } from "@/hooks/useApi"
import { buildReportFilename, dateRangeForFilter, downloadCsv, REPORT_DATE_FILTERS } from "@/lib/reporting"


interface TaxSummary { total_tax: number; total_sales: number }
interface SalesRow { date: string; orders: number; tax: number }

export default function TaxReportPage() {
  const [dateFilter, setDateFilter] = useState("Current Week")

  const { from, to } = useMemo(() => dateRangeForFilter(dateFilter), [dateFilter])
  const params = useMemo(() => ({ from, to }), [from, to])

  // Summary from tax endpoint
  const { data: summary } = useTaxReport(params) as { data: TaxSummary | null }
  // Per-day breakdown from sales endpoint
  const { data: rows = [], isLoading } = useSalesReport(params) as { data: SalesRow[]; isLoading: boolean }

  const totalTax = Number(summary?.total_tax ?? 0)
  const sgst = totalTax / 2
  const cgst = totalTax / 2

  function handleExport() {
    downloadCsv(
      buildReportFilename("tax-report", from, to),
      ["Date", "Orders", "SGST (50%)", "CGST (50%)", "Total Tax"],
      rows.map((row) => {
        const rowTax = Number(row.tax)
        return [row.date, row.orders, (rowTax / 2).toFixed(2), (rowTax / 2).toFixed(2), rowTax.toFixed(2)]
      })
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Tax Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Breakdown of taxes collected across all orders</p>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-lg">
        {[
          { label: "Total Tax Collected", value: totalTax.toFixed(2) },
          { label: "SGST (50%)", value: sgst.toFixed(2) },
          { label: "CGST (50%)", value: cgst.toFixed(2) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold flex items-center gap-0.5 mt-1">
              <IndianRupee className="size-4 text-muted-foreground" />{value}
            </p>
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
              {["Date", "Orders", "SGST (50%)", "CGST (50%)", "Total Tax"].map((h) => (
                <TableHead key={h} className="text-xs font-medium whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-sm text-muted-foreground">No data for this period</TableCell></TableRow>
            ) : rows.map((r) => {
              const rowTax = Number(r.tax)
              return (
                <TableRow key={r.date} className="hover:bg-muted/20">
                  <TableCell className="text-sm font-medium">{r.date}</TableCell>
                  <TableCell className="text-sm">{r.orders}</TableCell>
                  <TableCell className="text-sm">
                    <span className="flex items-center gap-0.5"><IndianRupee className="size-3 text-muted-foreground" />{(rowTax/2).toFixed(2)}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="flex items-center gap-0.5"><IndianRupee className="size-3 text-muted-foreground" />{(rowTax/2).toFixed(2)}</span>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    <span className="flex items-center gap-0.5"><IndianRupee className="size-3 text-muted-foreground" />{rowTax.toFixed(2)}</span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
