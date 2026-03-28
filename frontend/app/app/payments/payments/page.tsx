"use client"

import { useState } from "react"
import { Search, Download, IndianRupee, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { usePayments } from "@/hooks/useApi"

const METHOD_STYLES: Record<string, string> = {
  cash:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  card:   "bg-blue-100 text-blue-700 border-blue-200",
  upi:    "bg-purple-100 text-purple-700 border-purple-200",
  online: "bg-orange-100 text-orange-700 border-orange-200",
  due:    "bg-gray-100 text-gray-600 border-gray-200",
}

const PAGE_SIZE = 15

export default function PaymentsPage() {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading } = usePayments()
  const payments = data?.data ?? []

  const filtered = payments.filter((p) =>
    p.order?.order_number?.toLowerCase().includes(query.toLowerCase()) ||
    p.method.toLowerCase().includes(query.toLowerCase()) ||
    (p.reference ?? "").toLowerCase().includes(query.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Payments</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8 h-8 w-48" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-8">
            <Download className="size-3.5" /> Export
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {["ID", "Amount", "Payment Method", "Transaction ID", "Order", "Date & Time", "Action"].map((h) => (
                <TableHead key={h} className="text-xs uppercase tracking-wide font-medium whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-20 text-sm">Loading…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-20 text-sm">No payments found</TableCell>
              </TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/20">
                <TableCell className="text-sm font-medium text-muted-foreground">{p.id}</TableCell>
                <TableCell className="text-sm font-semibold">
                  <span className="flex items-center gap-0.5">
                    <IndianRupee className="size-3.5 text-muted-foreground" />{p.amount.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium capitalize", METHOD_STYLES[p.method] ?? "bg-muted text-muted-foreground")}>
                    {p.method}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.reference ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.order ? `Order #${p.order.order_number}` : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {p.paid_at ? new Date(p.paid_at).toLocaleString() : "—"}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <RotateCcw className="size-3" /> Refund
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>Showing {filtered.length} of {data?.total ?? 0} results</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" className="h-7 w-7" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="size-3.5" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)}
              className={cn("h-7 w-7 rounded-lg text-xs font-medium transition-colors",
                page === n ? "bg-primary text-primary-foreground" : "hover:bg-muted border border-border")}>
              {n}
            </button>
          ))}
          <Button variant="outline" size="icon-sm" className="h-7 w-7" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
