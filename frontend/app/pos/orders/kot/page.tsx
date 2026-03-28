"use client"

import { useRouter } from "next/navigation"
import { RefreshCw, ChevronRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useKots, useUpdateKotStatus } from "@/hooks/useApi"
import type { Kot } from "@/lib/types"

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  preparing: "bg-orange-100 text-orange-700",
  ready:     "bg-green-100 text-green-700",
  served:    "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
}

const NEXT_STATUS: Record<string, string> = {
  pending:   "preparing",
  preparing: "ready",
  ready:     "served",
}

export default function PosKotPage() {
  const router = useRouter()
  const { data, isLoading, refetch, isRefetching } = useKots()
  const kots: Kot[] = (data as { data?: Kot[] })?.data ?? []
  const updateStatus = useUpdateKotStatus()

  const active = kots.filter(k => k.status !== "cancelled" && k.status !== "served")

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div>
          <h1 className="text-sm font-bold">KOT Board</h1>
          <p className="text-xs text-muted-foreground">{active.length} active KOTs</p>
        </div>
        <button onClick={() => refetch()} disabled={isRefetching}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
          <RefreshCw className={cn("size-3.5", isRefetching && "animate-spin")} /> Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            <RefreshCw className="size-4 animate-spin mr-2" /> Loading…
          </div>
        ) : active.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No active KOTs</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {active.map(kot => (
              <div key={kot.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{kot.kot_number}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="size-3" />
                      {new Date(kot.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", STATUS_COLORS[kot.status] ?? "bg-muted text-muted-foreground")}>
                    {kot.status}
                  </span>
                </div>

                {kot.order && (
                  <p className="text-xs text-muted-foreground">
                    {kot.order.order_number}
                    {kot.order.table && ` · ${kot.order.table.name}`}
                  </p>
                )}

                <div className="space-y-1">
                  {(kot.order?.items ?? []).map(item => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span>{item.quantity}× {item.name}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  {NEXT_STATUS[kot.status] && (
                    <button
                      onClick={() => updateStatus.mutate({ id: kot.id, status: NEXT_STATUS[kot.status] })}
                      className="flex-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium py-1.5 hover:bg-primary/90 transition-colors">
                      Mark {NEXT_STATUS[kot.status]}
                    </button>
                  )}
                  <button onClick={() => router.push(`/pos/kot/${kot.order_id}`)}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">
                    Order <ChevronRight className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
