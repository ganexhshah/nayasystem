"use client"

import { useState } from "react"
import { RefreshCw, Clock, CheckCheck, ChefHat, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useKots, useUpdateKotStatus } from "@/hooks/useApi"
import type { Kot } from "@/lib/types"

type KotStatus = "pending" | "preparing" | "ready" | "served" | "cancelled"

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30",
  preparing: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30",
  ready:     "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30",
  served:    "bg-gray-100 border-gray-200 text-gray-500",
  cancelled: "bg-red-50 border-red-200 text-red-500",
}

const NEXT_STATUS: Record<string, string | null> = {
  pending: "preparing", preparing: "ready", ready: "served", served: null, cancelled: null,
}

const DATE_FILTERS = [
  "Today", "Next Week", "Current Week", "Last Week",
  "Last 7 Days", "Current Month", "Last Month",
]

export default function KOTPage() {
  const [dateFilter, setDateFilter] = useState("Today")
  const [statusFilter, setStatusFilter] = useState<KotStatus | "all">("all")

  const { data, isLoading, refetch, isFetching } = useKots(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  )
  const kots: Kot[] = data?.data ?? []
  const updateStatus = useUpdateKotStatus()

  const filtered = kots
  const counts = (s: string) => kots.filter((k) => k.status === s).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">KOT</h1>
          <Badge variant="secondary" className="text-sm px-2.5">{filtered.length}</Badge>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} /> Refresh
        </Button>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {DATE_FILTERS.map((f) => (
          <button key={f} onClick={() => setDateFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-sm border transition-colors whitespace-nowrap",
              dateFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
            {f}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => setStatusFilter("all")}
          className={cn("px-3 py-1.5 rounded-lg text-sm border transition-colors",
            statusFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
          All ({kots.length})
        </button>
        {(["pending", "preparing", "ready", "served"] as KotStatus[]).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn("px-3 py-1.5 rounded-lg text-sm border transition-colors capitalize",
              statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
            {s} ({counts(s)})
          </button>
        ))}
      </div>

      <div className="border-t border-border" />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 border-2 border-dashed border-border rounded-2xl">
          <ChefHat className="size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No KOTs found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((kot) => (
            <div key={kot.id} className={cn("rounded-xl border-2 p-4 space-y-3 transition-all", STATUS_STYLES[kot.status] ?? STATUS_STYLES.pending)}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-sm">{kot.kot_number}</p>
                  <p className="text-xs opacity-70">{kot.order?.order_number ?? `Order #${kot.order_id}`}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {kot.order?.table && (
                    <span className="text-xs font-semibold bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-lg">
                      {kot.order.table.name}
                    </span>
                  )}
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium capitalize", STATUS_STYLES[kot.status])}>
                    {kot.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs opacity-70">
                <Clock className="size-3.5" />
                {new Date(kot.created_at).toLocaleString()}
              </div>

              {kot.items && kot.items.length > 0 && (
                <div className="space-y-1.5 bg-white/40 dark:bg-black/10 rounded-lg p-2.5">
                  {kot.items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 text-sm">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        {item.notes && <p className="text-xs opacity-70 mt-0.5">{item.notes}</p>}
                      </div>
                      <span className="font-bold shrink-0">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-1">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 bg-white/60 dark:bg-black/20">
                  <Printer className="size-3" /> Print
                </Button>
                {NEXT_STATUS[kot.status] && (
                  <Button size="sm" className="h-7 text-xs gap-1 flex-1"
                    onClick={() => updateStatus.mutate({ id: kot.id, status: NEXT_STATUS[kot.status]! })}>
                    <CheckCheck className="size-3.5" />
                    Mark {NEXT_STATUS[kot.status]}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
