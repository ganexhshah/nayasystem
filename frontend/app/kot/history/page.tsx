"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChefHat, ArrowLeft, RefreshCw, Printer, Clock, CheckCircle2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"
import { useKots } from "@/hooks/useApi"
import type { Kot } from "@/lib/types"

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

function timeAgo(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60_000)
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ${mins % 60}m ago`
  return new Date(date).toLocaleDateString()
}

export default function KotHistoryPage() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const [search, setSearch] = useState("")

  const { data, isLoading, refetch, isFetching } = useKots({ status: "served" })
  const kots: Kot[] = data?.data ?? []

  const filtered = kots.filter(k =>
    !search ||
    k.kot_number.toLowerCase().includes(search.toLowerCase()) ||
    (k.order?.order_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (k.order?.table?.name ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-card shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => router.push("/kot")}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft className="size-4" />
          </button>
          <div className="bg-primary rounded-xl p-1.5 shrink-0">
            <ChefHat className="size-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight">KOT History</h1>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">{user?.name} · Completed orders</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2.5 border-b border-border bg-card shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search KOT, order number or table…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm gap-2">
            <RefreshCw className="size-4 animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
            <CheckCircle2 className="size-10 opacity-30" />
            <p className="text-sm">{search ? "No results found" : "No completed KOTs yet"}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(kot => (
              <div key={kot.id} className="rounded-xl border border-emerald-200 bg-card overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-500 text-white">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    <span className="text-sm font-bold">{kot.kot_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-90">
                    {kot.order?.table && (
                      <span className="bg-white/20 px-2 py-0.5 rounded-md font-semibold">{kot.order.table.name}</span>
                    )}
                    <span className="capitalize opacity-80">{kot.order?.order_type?.replace("_", " ")}</span>
                  </div>
                </div>

                {/* Order ref + time */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                  <span className="text-xs text-muted-foreground font-medium truncate mr-2">
                    {kot.order?.order_number ?? `Order #${kot.order_id}`}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="size-3" />{timeAgo(kot.created_at)}
                  </span>
                </div>

                {/* Items */}
                <div className="px-3 py-2.5 space-y-1.5">
                  {(kot.items ?? []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground truncate">{item.name}</p>
                      <span className="text-sm font-semibold shrink-0">×{item.quantity}</span>
                    </div>
                  ))}
                  {kot.notes && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 mt-1">📝 {kot.notes}</p>
                  )}
                </div>

                {/* Print */}
                <div className="px-3 pb-3">
                  <button
                    onClick={() => printKot(kot)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-all active:scale-95">
                    <Printer className="size-3.5" /> Print KOT
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isLoading && (
        <div className="px-4 py-2 border-t border-border bg-card shrink-0">
          <p className="text-xs text-muted-foreground">{filtered.length} completed KOT{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      )}
    </div>
  )
}
