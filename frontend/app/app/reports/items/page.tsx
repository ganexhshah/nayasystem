"use client"

import { useState, useMemo } from "react"
import { Download, IndianRupee, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useItemsReport } from "@/hooks/useApi"
import { buildReportFilename, dateRangeForFilter, downloadCsv, REPORT_DATE_FILTERS } from "@/lib/reporting"


interface ItemRow { name: string; quantity: number; total: number }

export default function ItemReportPage() {
  const [dateFilter, setDateFilter] = useState("Current Week")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  const { from, to } = useMemo(() => dateRangeForFilter(dateFilter), [dateFilter])
  const params = useMemo(() => ({ from, to }), [from, to])
  const { data: items = [], isLoading } = useItemsReport(params) as { data: ItemRow[]; isLoading: boolean }

  const totalRevenue = items.reduce((s, i) => s + Number(i.total), 0)
  const totalQty = items.reduce((s, i) => s + Number(i.quantity), 0)

  function handleExport() {
    downloadCsv(
      buildReportFilename("items-report", from, to),
      ["Item Name", "Quantity Sold", "Total Revenue"],
      items.map((item) => [item.name, item.quantity, Number(item.total).toFixed(2)])
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Item Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View detailed sales and performance of items
          <span className="ml-1 text-xs">({from} to {to})</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-sm">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-lg font-bold flex items-center gap-0.5 mt-1">
            <IndianRupee className="size-4 text-muted-foreground" />{totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total Quantity Sold</p>
          <p className="text-lg font-bold mt-1">{totalQty}</p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Top Items by Quantity Sold</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={items.slice(0, 8)} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Qty Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {REPORT_DATE_FILTERS.map((f) => (
          <button key={f} onClick={() => setDateFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-xs border transition-colors whitespace-nowrap",
              dateFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
            )}>
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Start Time:</span>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-8 text-xs w-28" />
          <span>To End Time:</span>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-8 text-xs w-28" />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 ml-auto" onClick={handleExport} disabled={isLoading || items.length === 0}>
          <Download className="size-3.5" /> Export
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {["Item Name", "Quantity Sold", "Total Revenue"].map((h) => (
                <TableHead key={h} className="text-xs font-medium whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-16 text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-16 text-sm text-muted-foreground">No data for this period</TableCell></TableRow>
            ) : items.map((item) => (
              <TableRow key={item.name} className="hover:bg-muted/20">
                <TableCell className="text-sm font-medium">{item.name}</TableCell>
                <TableCell className="text-sm">{item.quantity}</TableCell>
                <TableCell className="text-sm font-medium">
                  <span className="flex items-center gap-0.5"><IndianRupee className="size-3 text-muted-foreground" />{Number(item.total).toFixed(2)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {items.length > 0 && <p className="text-xs text-muted-foreground">{items.length} items</p>}
    </div>
  )
}
