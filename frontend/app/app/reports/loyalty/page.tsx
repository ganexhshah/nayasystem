"use client"

import { useMemo } from "react"
import { Download, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLoyaltyReport } from "@/hooks/useApi"
import { buildReportFilename, downloadCsv } from "@/lib/reporting"

interface LoyaltyRow {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  loyalty_points: number
  total_orders: number
  total_spent: number
}

export default function LoyaltyReportsPage() {
  const params = useMemo(() => ({ from: "", to: "" }), [])
  const { data: rows = [], isLoading } = useLoyaltyReport(params) as { data: LoyaltyRow[]; isLoading: boolean }

  const totalPoints = rows.reduce((sum, row) => sum + Number(row.loyalty_points ?? 0), 0)
  const totalSpend = rows.reduce((sum, row) => sum + Number(row.total_spent ?? 0), 0)

  function handleExport() {
    downloadCsv(
      buildReportFilename("loyalty-balances", "current", "current"),
      ["Customer", "Points Balance", "Orders", "Total Spent", "Contact"],
      rows.map((row) => [
        row.name,
        row.loyalty_points,
        row.total_orders,
        Number(row.total_spent ?? 0).toFixed(2),
        row.phone ?? row.email ?? "-",
      ])
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Loyalty Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Current loyalty balances and customer engagement summary</p>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-lg">
        {[{ label: "Customers with Points", value: rows.length }, { label: "Total Points Balance", value: totalPoints }, { label: "Total Spend", value: totalSpend.toFixed(2), rs: true }].map(({ label, value, rs }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold flex items-center gap-0.5 mt-1">
              {rs && <IndianRupee className="size-4 text-muted-foreground" />}{value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleExport} disabled={isLoading || rows.length === 0}>
          <Download className="size-3.5" /> Export
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {["Customer", "Points Balance", "Orders", "Total Spent", "Contact"].map((h) => (
                <TableHead key={h} className="text-xs font-medium whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-16 text-sm">Loading...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-16 text-sm">No loyalty balances found.</TableCell></TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/20">
                <TableCell className="text-sm font-medium">{row.name}</TableCell>
                <TableCell className="text-sm">{row.loyalty_points}</TableCell>
                <TableCell className="text-sm">{row.total_orders}</TableCell>
                <TableCell className="text-sm"><span className="flex items-center gap-0.5"><IndianRupee className="size-3 text-muted-foreground" />{Number(row.total_spent ?? 0).toFixed(2)}</span></TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.phone ?? row.email ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
