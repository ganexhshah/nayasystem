"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useKots, useUpdateKotStatus, useKitchens } from "@/hooks/useApi"
import type { Kot } from "@/lib/types"

const TIME_PERIODS = [
  "Today", "Current Week", "Last Week", "Last 7 Days",
  "Current Month", "Last Month", "Current Year", "Last Year",
]

// Map UI tab labels to backend status values
type UiStatus = "Pending" | "In Kitchen" | "Food is Ready" | "Cancelled"
const UI_TO_API: Record<UiStatus, string> = {
  "Pending":       "pending",
  "In Kitchen":    "preparing",
  "Food is Ready": "ready",
  "Cancelled":     "cancelled",
}
const STATUS_TABS: UiStatus[] = ["Pending", "In Kitchen", "Food is Ready", "Cancelled"]

const STATUS_BADGE: Record<UiStatus, string> = {
  "Pending":        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "In Kitchen":     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Food is Ready":  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Cancelled":      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

interface KotBoardProps {
  title: string
  printerLabel?: string
  kitchenId?: number   // filter by specific kitchen ID
  kitchenType?: string // filter by kitchen type (default, veg, non_veg)
}

function apiStatusToUi(status: string): UiStatus {
  const map: Record<string, UiStatus> = {
    pending:   "Pending",
    preparing: "In Kitchen",
    ready:     "Food is Ready",
    cancelled: "Cancelled",
    served:    "Food is Ready",
  }
  return map[status] ?? "Pending"
}

export default function KotBoard({ title, printerLabel, kitchenId, kitchenType }: KotBoardProps) {
  const [period, setPeriod] = useState("Today")
  const [activeTab, setTab] = useState<UiStatus>("Pending")

  // Resolve kitchenId from type if not provided directly
  const { data: kitchens = [] } = useKitchens()
  const resolvedKitchenId = kitchenId ?? (kitchenType ? kitchens.find((k) => k.type === kitchenType)?.id : undefined)

  const params = resolvedKitchenId ? { kitchen_id: resolvedKitchenId } : undefined
  const { data, isLoading, refetch } = useKots(params)
  const updateStatus = useUpdateKotStatus()

  const kots: Kot[] = data?.data ?? []

  const filtered = kots.filter((k) => apiStatusToUi(k.status) === activeTab)

  const counts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = kots.filter((k) => apiStatusToUi(k.status) === s).length
    return acc
  }, {} as Record<UiStatus, number>)

  function moveStatus(kotId: number, status: string) {
    updateStatus.mutate({ id: kotId, status })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {printerLabel && <p className="text-sm text-muted-foreground">{printerLabel}</p>}
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Time period chips */}
      <div className="flex flex-wrap gap-1.5">
        {TIME_PERIODS.map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              period === p
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            )}>
            {p}
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-border">
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === s
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {/* KOT cards */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading KOTs…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">No KOTs found</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((kot) => {
            const uiStatus = apiStatusToUi(kot.status)
            return (
              <div key={kot.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* KOT header */}
                <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">KOT #{kot.kot_number}</span>
                    <span className="text-xs text-muted-foreground">{kot.items?.length ?? 0} Item(s)</span>
                  </div>
                  {kot.order?.order_type && (
                    <Badge className="text-xs border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                      {kot.order.order_type.replace("_", " ")}
                    </Badge>
                  )}
                </div>

                {/* Order info */}
                <div className="px-3 py-2 border-b border-border space-y-0.5">
                  <p className="text-xs font-medium">
                    Order #{kot.order?.order_number}
                    {kot.order?.table ? ` (${kot.order.table.name})` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(kot.created_at).toLocaleString()}</p>
                  {kot.notes && <p className="text-xs text-muted-foreground">{kot.notes}</p>}
                  <Badge className={cn("text-xs border-0 mt-1", STATUS_BADGE[uiStatus])}>
                    {uiStatus === "Pending" ? "Pending Confirmation" : uiStatus}
                  </Badge>
                </div>

                {/* Items */}
                <div className="px-3 py-2 space-y-1.5">
                  <div className="grid grid-cols-[1fr_auto] text-xs font-medium text-muted-foreground mb-1">
                    <span>Item Name</span>
                  </div>
                  {(kot.items ?? []).map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_auto] items-center gap-2">
                      <span className="text-xs">{item.quantity} x {item.name}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 px-3 py-2 border-t border-border">
                  {uiStatus === "Pending" && (
                    <Button size="sm" className="flex-1 h-7 text-xs"
                      onClick={() => moveStatus(kot.id, "preparing")}
                      disabled={updateStatus.isPending}>
                      Start Cooking
                    </Button>
                  )}
                  {uiStatus === "In Kitchen" && (
                    <Button size="sm" className="flex-1 h-7 text-xs"
                      onClick={() => moveStatus(kot.id, "ready")}
                      disabled={updateStatus.isPending}>
                      Mark Ready
                    </Button>
                  )}
                  {uiStatus === "Food is Ready" && (
                    <Button size="sm" className="flex-1 h-7 text-xs"
                      onClick={() => moveStatus(kot.id, "served")}
                      disabled={updateStatus.isPending}>
                      Mark Served
                    </Button>
                  )}
                  {uiStatus !== "Cancelled" && (
                    <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => moveStatus(kot.id, "cancelled")}
                      disabled={updateStatus.isPending}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
