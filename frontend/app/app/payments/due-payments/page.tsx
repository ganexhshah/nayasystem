"use client"

import { useState } from "react"
import { Search, Download, SlidersHorizontal, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDuePayments } from "@/hooks/useApi"

export default function DuePaymentsPage() {
  const [query, setQuery] = useState("")
  const { data: orders = [], isLoading } = useDuePayments()

  const totalDue = orders.reduce((sum, o) => sum + o.total, 0)

  const filtered = orders.filter((o) =>
    (o.customer?.name ?? "").toLowerCase().includes(query.toLowerCase()) ||
    o.order_number.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Due Payments</h1>
          <span className="flex items-center gap-0.5 text-sm font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
            <IndianRupee className="size-3.5" />{totalDue.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8 h-8 w-48" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-8">
            <SlidersHorizontal className="size-3.5" /> Show All
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8">
            Customer Name
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8">
            <Download className="size-3.5" /> Export
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {["Customer Name", "Amount", "Payment Method", "Order", "Date & Time", "Action"].map((h) => (
                <TableHead key={h} className="text-xs uppercase tracking-wide font-medium whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-20 text-sm">Loading…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-20 text-sm">No Payment Found</TableCell>
              </TableRow>
            ) : filtered.map((o) => (
              <TableRow key={o.id} className="hover:bg-muted/20">
                <TableCell className="font-medium text-sm">{o.customer?.name ?? "—"}</TableCell>
                <TableCell className="text-sm font-semibold">
                  <span className="flex items-center gap-0.5">
                    <IndianRupee className="size-3.5 text-muted-foreground" />{o.total.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">Due</TableCell>
                <TableCell className="text-sm text-muted-foreground">Order #{o.order_number}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(o.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="h-7 text-xs">Collect</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
