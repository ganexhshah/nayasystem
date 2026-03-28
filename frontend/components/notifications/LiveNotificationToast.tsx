"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { X, ShoppingBag, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { create } from "zustand"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth"

// ── Types ─────────────────────────────────────────────────────────────────────
export type NotifType = "new_order" | "waiter_call"

export interface LiveNotif {
  id: string
  type: NotifType
  title: string
  body: string
  link?: string
  at: number // timestamp
}

// ── Store ─────────────────────────────────────────────────────────────────────
interface NotifStore {
  toasts: LiveNotif[]
  seenOrderIds: Set<number>
  seenRequestIds: Set<number>
  push: (n: LiveNotif) => void
  dismiss: (id: string) => void
  markOrderSeen: (id: number) => void
  markRequestSeen: (id: number) => void
}

export const useNotifStore = create<NotifStore>((set) => ({
  toasts: [],
  seenOrderIds: new Set(),
  seenRequestIds: new Set(),
  push: (n) => set((s) => ({ toasts: [...s.toasts, n] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  markOrderSeen: (id) => set((s) => { s.seenOrderIds.add(id); return { seenOrderIds: new Set(s.seenOrderIds) } }),
  markRequestSeen: (id) => set((s) => { s.seenRequestIds.add(id); return { seenRequestIds: new Set(s.seenRequestIds) } }),
}))

// ── Sound ─────────────────────────────────────────────────────────────────────
function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    // Two-tone chime
    const times = [0, 0.18]
    const freqs = [880, 1100]
    times.forEach((t, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.value = freqs[i]
      gain.gain.setValueAtTime(0.35, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.35)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.35)
    })
  } catch { /* browser may block */ }
}

// ── Poller ────────────────────────────────────────────────────────────────────
export function LiveNotificationPoller() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { seenOrderIds, seenRequestIds, push, markOrderSeen, markRequestSeen } = useNotifStore()
  const initialised = useRef(false)

  const poll = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      // Poll recent orders (last 20, pending/confirmed)
      const ordersRes = await api.get<{ data: Array<{ id: number; order_number: string; status: string; table?: { name: string }; order_type: string; created_at: string }> }>(
        "/orders", { per_page: 20, status: "pending" } as Record<string, string | number>
      )
      const orders = ordersRes?.data ?? []
      for (const order of orders) {
        if (!seenOrderIds.has(order.id)) {
          markOrderSeen(order.id)
          if (!initialised.current) continue // skip on first load — just seed seen set
          const table = order.table?.name ? `Table: ${order.table.name}` : order.order_type.replace("_", " ")
          push({
            id: `order-${order.id}-${Date.now()}`,
            type: "new_order",
            title: "New Order Received",
            body: `${order.order_number} · ${table}`,
            link: `/app/orders/list/${order.id}`,
            at: Date.now(),
          })
          playNotifSound()
        }
      }
    } catch { /* silent */ }

    try {
      // Poll waiter requests (pending)
      const reqRes = await api.get<Array<{ id: number; type: string; table?: { name: string }; table_id: number; status: string; created_at: string }>>(
        "/waiter-requests"
      )
      const reqs = Array.isArray(reqRes) ? reqRes : []
      for (const req of reqs) {
        if (req.status !== "pending") continue
        if (!seenRequestIds.has(req.id)) {
          markRequestSeen(req.id)
          if (!initialised.current) continue
          const table = req.table?.name ?? `Table #${req.table_id}`
          const typeLabel = req.type === "bill" ? "Bill Request" : req.type === "water" ? "Water Request" : "Waiter Call"
          push({
            id: `req-${req.id}-${Date.now()}`,
            type: "waiter_call",
            title: typeLabel,
            body: `${table} is calling`,
            link: `/app/waiter-requests`,
            at: Date.now(),
          })
          playNotifSound()
        }
      }
    } catch { /* silent */ }

    initialised.current = true
  }, [isAuthenticated, seenOrderIds, seenRequestIds, push, markOrderSeen, markRequestSeen])

  useEffect(() => {
    if (!isAuthenticated) return
    poll()
    const id = setInterval(poll, 10_000)
    return () => clearInterval(id)
  }, [isAuthenticated, poll])

  return null
}

// ── Single Toast ──────────────────────────────────────────────────────────────
function NotifToast({ notif, onDismiss }: { notif: LiveNotif; onDismiss: () => void }) {
  const router = useRouter()
  const progressRef = useRef<HTMLDivElement>(null)

  // Auto-dismiss after 5s
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  // Animate progress bar
  useEffect(() => {
    const el = progressRef.current
    if (!el) return
    el.style.transition = "none"
    el.style.width = "100%"
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "width 5s linear"
        el.style.width = "0%"
      })
    })
  }, [])

  const isOrder = notif.type === "new_order"
  const Icon = isOrder ? ShoppingBag : Bell

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 w-80 rounded-xl border shadow-xl overflow-hidden",
        "bg-card text-foreground",
        "animate-in slide-in-from-right-5 fade-in duration-300",
        isOrder ? "border-primary/30" : "border-amber-400/40"
      )}
    >
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-primary/30 w-full">
        <div ref={progressRef} className="h-full bg-primary" style={{ width: "100%" }} />
      </div>

      {/* Icon */}
      <div className={cn(
        "shrink-0 size-9 rounded-lg flex items-center justify-center mt-3 ml-3",
        isOrder ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600"
      )}>
        <Icon className="size-4" />
      </div>

      {/* Content */}
      <div className="flex-1 py-3 pr-2 min-w-0">
        <p className="text-sm font-semibold leading-tight">{notif.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.body}</p>
        {notif.link && (
          <button
            onClick={() => { router.push(notif.link!); onDismiss() }}
            className="mt-1.5 text-xs text-primary hover:underline font-medium"
          >
            View Order →
          </button>
        )}
      </div>

      {/* Close */}
      <button
        onClick={onDismiss}
        className="shrink-0 mt-2.5 mr-2.5 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

// ── Toast Container ───────────────────────────────────────────────────────────
export function LiveNotificationContainer() {
  const { toasts, dismiss } = useNotifStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <NotifToast notif={n} onDismiss={() => dismiss(n.id)} />
        </div>
      ))}
    </div>
  )
}
