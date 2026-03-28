"use client"

import { useState } from "react"
import { Download, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

const DATE_FILTERS = ["Today", "Current Week", "Last Week", "Last 7 Days", "Current Month", "Last Month", "Current Year", "Last Year"]

export default function RemovedKOTReportPage() {
  const [dateFilter, setDateFilter] = useState("Current Week")
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Removed KOT Item Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track items removed from KOT after placement</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {DATE_FILTERS.map((f) => (
          <button key={f} onClick={() => setDateFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-xs border transition-colors whitespace-nowrap",
              dateFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
            {f}
          </button>
        ))}
        <Button variant="outline" size="sm" className="gap-1.5 h-8 ml-auto"><Download className="size-3.5" /> Export</Button>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {["Order", "Item Name", "Quantity", "Price", "Removed By", "Reason", "Date & Time"].map((h) => (
                <TableHead key={h} className="text-xs font-medium whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-16 text-sm">No removed KOT items found.</TableCell></TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
