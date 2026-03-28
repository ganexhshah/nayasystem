"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChefHat, RefreshCw, Clock, CheckCheck, LogOut,
  Bell, Maximize2, Printer, History,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"
import { useKots, useUpdateKotStatus } from "@/hooks/useApi"
import type { Kot } from "@/lib/types"

type KotStatus = "pending" | "preparing" | "ready"

const COLUMNS: { status: KotStatus; label: string; color: string; headerBg: string; dot: string; mobileColor: string }[] = [
  { status: "pending",   label: "New Orders", color: "border-amber-300",   headerBg: "bg-amber-500",   dot: "bg-amber-400 animate-pulse", mobileColor: "border-amber-400 text-amber-700 bg-amber-50"   },
  { status: "preparing", label: "In Kitchen", color: "border-blue-300",    headerBg: "bg-blue-500",    dot: "bg-blue-400 animate-pulse",  mobileColor: "border-blue-400 text-blue-700 bg-blue-50"      },
  { status: "ready",     label: "Ready",      color: "border-emerald-300", headerBg: "bg-emerald-500", dot: "bg-emerald-400",             mobileColor: "border-emerald-400 text-emerald-700 bg-emerald-50" },
]

const NEXT: Partial<Record<KotStatus, string>> = {
  pending:   "preparing",
  preparing: "ready",
  ready:     "served",
}

const NEXT_LABEL: Partial<Record<KotStatus, string>> = {
  pending:   "Start Cooking",
  preparing: "Mark Ready",
  ready:     "Mark Served",
}

const NEXT_COLOR: Partial<Record<KotStatus, string>> = {
  pending:   "bg-blue-500 hover:bg-blue-600 text-white",
  preparing: "bg-emerald-500 hover:bg-emerald-600 text-white",
  ready:     "bg-gray-600 hover:bg-gray-700 text-white",
}

function elapsed(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60_000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function printKot(kot: Kot) {
  const win = window.open("", "_blank", "width=320,height=600")
  if (!win) return
  const items = (kot.items ?? []).map(i => `<tr><td>${i.name}</td><td style="text-align:right">×${i.quantity}</td></tr>`).join("")
  win.document.write(`
    <html><head><title>KOT ${kot.kot_number}</title>
    <style>
      body{font-family:monospace;font-size:13px;padding:12px}
      h2{margin:0 0 4px;font-size:16px}
      p{margin:2px 0;font-size:12px;color:#555}
      table{width:100%;border-collapse:collapse;margin-top:10px}
      td{padding:4px 2px;border-bottom:1px dashed #ccc}
      .footer{margin-top:12px;font-size:11px;color:#888;text-align:center}
    </style></head><body>
    <h2>${kot.kot_number}</h2>
    <p>${kot.order?.order_type?.replace("_"," ").toUpperCase()??""}${kot.order?.table?" · "+kot.order.table.name:""}</p>
    <p>Order: ${kot.order?.order_number??""}</p>
    <p>Time: ${new Date(kot.created_at).toLocaleTimeString()}</p>
    ${kot.notes?`<p>Note: ${kot.notes}</p>`:""}
    <table>${items}</table>
    <div class="footer">--- KOT ---</div>
    <script>window.onload=()=>{window.print();window.close()}<\/script>
    </body></html>`)
  win.document.close()
}

function KotCard({ kot, onAction }: { kot: Kot; onAction: (id: number, status: string) => void }) {
  const col = COLUMNS.find(c => c.status === kot.status) ?? COLUMNS[0]
  const next = NEXT[kot.status as KotStatus]
  const mins = Math.floor((Date.now() - new Date(kot.created_at).getTime()) / 60_000)
  const isUrgent = mins >= 15

  return (
    <div className={cn(
      "rounded-xl border-2 bg-card flex flex-col overflow-hidden transition-all",
      col.color,
      isUrgent && "ring-2 ring-red-400 ring-offset-1"
    )}>
      <div className={cn("flex items-center justify-between px-3 py-2 text-white", col.headerBg)}>
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full shrink-0", col.dot)} />
          <span className="text-sm font-bold">{kot.kot_number}</span>
        </div>
        <div className="flex items-center gap-2 text-xs opacity-90">
          {kot.order?.table && (
            <span className="bg-white/20 px-2 py-0.5 rounded-md font-semibold">{kot.order.table.name}</span>
          )}
          <span className="capitalize opacity-80">{kot.order?.order_type?.replace("_", " ")}</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <span className="text-xs text-muted-foreground font-medium truncate mr-2">
          {kot.order?.order_number ?? `Order #${kot.order_id}`}
        </span>
        <span className={cn("flex items-center gap-1 text-xs font-semibold shrink-0", isUrgent ? "text-red-500" : "text-muted-foreground")}>
          <Clock className="size-3" />{elapsed(kot.created_at)}
          {isUrgent && <Bell className="size-3 animate-bounce" />}
        </span>
      </div>

      <div className="flex-1 px-3 py-2.5 space-y-2">
        {(kot.items ?? []).map((item, i) => (
          <div key={i} className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{item.name}</p>
              {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
            </div>
            <span className="text-base font-bold text-primary shrink-0">×{item.quantity}</span>
          </div>
        ))}
        {kot.notes && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1.5 mt-1">📝 {kot.notes}</p>
        )}
      </div>

      <div className="px-3 pb-3 flex gap-2">
        <button
          onClick={() => printKot(kot)}
          className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted text-xs transition-all active:scale-95"
          title="Print KOT">
          <Printer className="size-3.5" />
        </button>
        {next && (
          <button
            onClick={() => onAction(kot.id, next)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all active:scale-95",
              NEXT_COLOR[kot.status as KotStatus]
            )}>
            <CheckCheck className="size-4" />
            {NEXT_LABEL[kot.status as KotStatus]}
          </button>
        )}
      </div>
    </div>
  )
}

export default function KotPage() {
  const router = useRouter()
  const logout = useAuthStore(s => s.logout)
  const user = useAuthStore(s => s.user)

  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [newAlert, setNewAlert] = useState(false)
  const [activeTab, setActiveTab] = useState<KotStatus>("pending")
  const prevCountRef = useRef(0)

  const { data, isLoading, refetch, isFetching } = useKots()
  const updateStatus = useUpdateKotStatus()

  const kots: Kot[] = data?.data ?? []
  const activeKots = kots.filter(k => k.status !== "served" && k.status !== "cancelled")

  useEffect(() => {
    if (!autoRefresh) return
    const t = setInterval(() => { refetch(); setLastRefresh(new Date()) }, 15_000)
    return () => clearInterval(t)
  }, [autoRefresh, refetch])

  useEffect(() => {
    const pending = activeKots.filter(k => k.status === "pending").length
    if (pending > prevCountRef.current) {
      setNewAlert(true)
      setTimeout(() => setNewAlert(false), 3000)
    }
    prevCountRef.current = pending
  }, [activeKots])

  function handleAction(id: number, status: string) {
    updateStatus.mutate({ id, status })
  }

  async function handleLogout() {
    await logout()
    router.replace("/kot/auth")
  }

  const byStatus = (status: KotStatus) => activeKots.filter(k => k.status === status)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top bar */}
      <div className={cn(
        "flex items-center justify-between px-3 py-2.5 border-b border-border bg-card shrink-0 transition-colors gap-2",
        newAlert && "bg-amber-50 border-amber-200"
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-primary rounded-xl p-1.5 shrink-0">
            <ChefHat className="size-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight">KOT Display</h1>
            <p className="text-xs text-muted-foreground truncate">{user?.name}</p>
          </div>
          {newAlert && (
            <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold animate-pulse shrink-0">
              <Bell className="size-3.5" /> New!
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Counts — hidden on mobile */}
          <div className="hidden md:flex items-center gap-1.5">
            {COLUMNS.map(col => (
              <span key={col.status} className={cn("text-xs px-2 py-1 rounded-lg font-semibold text-white", col.headerBg)}>
                {byStatus(col.status).length} {col.label}
              </span>
            ))}
          </div>

          <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>

          <button
            onClick={() => { refetch(); setLastRefresh(new Date()) }}
            disabled={isFetching}
            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
          </button>

          <button
            onClick={() => setAutoRefresh(p => !p)}
            className={cn(
              "text-xs px-2 py-1.5 rounded-lg border transition-colors",
              autoRefresh ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
            )}>
            Auto
          </button>

          <button
            onClick={() => router.push("/kot/history")}
            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <History className="size-3.5" />
            <span className="hidden sm:inline">History</span>
          </button>

          <button
            onClick={() => document.documentElement.requestFullscreen?.()}
            className="hidden sm:flex text-muted-foreground hover:text-foreground p-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
            <Maximize2 className="size-4" />
          </button>

          <button onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-border bg-card shrink-0">
        {COLUMNS.map(col => {
          const count = byStatus(col.status).length
          return (
            <button
              key={col.status}
              onClick={() => setActiveTab(col.status)}
              className={cn(
                "flex-1 flex flex-col items-center py-2 text-xs font-medium border-b-2 transition-colors gap-0.5",
                activeTab === col.status
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              )}>
              <span className={cn(
                "text-base font-bold leading-none",
                activeTab === col.status ? "text-foreground" : "text-muted-foreground"
              )}>{count}</span>
              <span>{col.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm gap-2">
          <RefreshCw className="size-4 animate-spin" /> Loading KOTs…
        </div>
      ) : (
        <>
          {/* Desktop: 3 columns */}
          <div className="hidden md:grid flex-1 overflow-hidden grid-cols-3 gap-0 divide-x divide-border">
            {COLUMNS.map(col => {
              const items = byStatus(col.status)
              return (
                <div key={col.status} className="flex flex-col overflow-hidden">
                  <div className={cn("flex items-center justify-between px-3 py-2.5 shrink-0 text-white", col.headerBg)}>
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", col.dot)} />
                      <span className="text-sm font-bold">{col.label}</span>
                    </div>
                    <span className="text-sm font-bold bg-white/20 px-2 py-0.5 rounded-lg">{items.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/40 gap-2">
                        <ChefHat className="size-8" />
                        <p className="text-xs">No orders</p>
                      </div>
                    ) : (
                      items.map(kot => <KotCard key={kot.id} kot={kot} onAction={handleAction} />)
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile: single tab view */}
          <div className="md:hidden flex-1 overflow-y-auto p-3 space-y-3">
            {byStatus(activeTab).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/40 gap-2">
                <ChefHat className="size-10" />
                <p className="text-sm">No orders</p>
              </div>
            ) : (
              byStatus(activeTab).map(kot => <KotCard key={kot.id} kot={kot} onAction={handleAction} />)
            )}
          </div>
        </>
      )}
    </div>
  )
}
