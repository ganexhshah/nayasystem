"use client"

import { useState } from "react"
import { BellRing, RefreshCw, CheckCheck, Clock, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useWaiterRequests, useUpdateWaiterRequestStatus } from "@/hooks/useApi"
import type { WaiterRequest } from "@/lib/types"

type StatusFilter = "pending" | "acknowledged" | "completed" | "all"

const STATUS_STYLES: Record<string, string> = {
  pending:      "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800",
  acknowledged: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800",
  completed:    "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800",
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", acknowledged: "Acknowledged", completed: "Completed",
}

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

export default function WaiterRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const { data: requests = [], isLoading, refetch, isFetching } = useWaiterRequests(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  )
  const updateStatus = useUpdateWaiterRequestStatus()

  const pending = requests.filter((r) => r.status === "pending").length

  const grouped = (["pending", "acknowledged", "completed"] as const).map((s) => ({
    status: s,
    items: requests.filter((r) => r.status === s),
  })).filter((g) => statusFilter === "all" || g.status === statusFilter)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Waiter Requests</h1>
          <Badge variant={pending > 0 ? "default" : "secondary"} className="text-sm px-2.5">
            {requests.length}
          </Badge>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} /> Refresh
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">Auto-refreshing every 15s</p>

      {/* Status filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(["all", "pending", "acknowledged", "completed"] as StatusFilter[]).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn("px-3 py-1.5 rounded-lg text-sm border transition-colors capitalize",
              statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
            {s === "all" ? "All" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 border-2 border-dashed border-border rounded-2xl">
          <div className="bg-muted rounded-full p-5">
            <BellRing className="size-10 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <p className="font-medium text-muted-foreground">No waiter requests</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Requests from tables will appear here in real-time.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ status, items }) => {
            if (items.length === 0) return null
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", STATUS_STYLES[status])}>
                    {STATUS_LABEL[status]}
                  </span>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                {items.map((req) => (
                  <div key={req.id} className={cn("flex items-center gap-4 p-4 rounded-xl border-2 transition-all", STATUS_STYLES[req.status])}>
                    <div className="bg-white/60 dark:bg-black/20 rounded-lg p-2.5 shrink-0">
                      <Table2 className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{req.table?.name ?? `Table #${req.table_id}`}</p>
                      <p className="text-xs mt-0.5 opacity-80 capitalize">{req.type}</p>
                      {req.notes && <p className="text-xs mt-0.5 opacity-70">{req.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs opacity-70 shrink-0">
                      <Clock className="size-3.5" />
                      {timeAgo(req.created_at)}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {req.status === "pending" && (
                        <Button size="sm" className="h-7 text-xs"
                          onClick={() => updateStatus.mutate({ id: req.id, status: "acknowledged" })}>
                          Accept
                        </Button>
                      )}
                      {req.status === "acknowledged" && (
                        <Button size="sm" className="h-7 text-xs gap-1"
                          onClick={() => updateStatus.mutate({ id: req.id, status: "completed" })}>
                          <CheckCheck className="size-3.5" /> Done
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
