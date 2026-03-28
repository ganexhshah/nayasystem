"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, RefreshCw, ChevronRight, CheckCircle2, StickyNote, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useUpdateOrderStatus } from "@/hooks/useApi"
import type { Order, Kot } from "@/lib/types"

const ORDER_STATUSES = [
  { key: "pending",   label: "Placed"     },
  { key: "confirmed", label: "Confirmed"  },
  { key: "preparing", label: "Preparing"  },
  { key: "ready",     label: "Ready"      },
  { key: "served",    label: "Served"     },
]

function Modal({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">{footer}</div>}
      </div>
    </div>
  )
}

export default function WaiterOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [note, setNote] = useState("")
  const [showNote, setShowNote] = useState(false)
  const updateStatus = useUpdateOrderStatus()

  async function loadOrder() {
    setLoading(true)
    try {
      const data = await api.get<Order>(`/orders/${id}`)
      setOrder(data)
      setNote(data.notes ?? "")
    } catch { setError("Failed to load order") }
    finally { setLoading(false) }
  }

  useEffect(() => { loadOrder() }, [id])

  async function handleStatusChange(status: string) {
    if (!order) return
    setSaving(true)
    try {
      await updateStatus.mutateAsync({ id: order.id, status })
      setOrder(prev => prev ? { ...prev, status: status as Order["status"] } : prev)
    } finally { setSaving(false) }
  }

  async function handleSaveNote() {
    if (!order) return
    setSaving(true)
    try {
      await api.put(`/orders/${order.id}`, { notes: note })
      setOrder(prev => prev ? { ...prev, notes: note } : prev)
      setShowNote(false)
    } finally { setSaving(false) }
  }

  const statusIdx = ORDER_STATUSES.findIndex(s => s.key === order?.status)

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
      <RefreshCw className="size-4 animate-spin mr-2" /> Loading…
    </div>
  )
  if (!order) return <div className="text-destructive text-sm">{error || "Order not found"}</div>

  return (
    <div className="max-w-xl space-y-4">
      {showNote && (
        <Modal title="Order Note" onClose={() => setShowNote(false)}
          footer={<>
            <Button variant="outline" size="sm" onClick={() => setShowNote(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveNote} disabled={saving}>Save</Button>
          </>}>
          <textarea rows={4} value={note} onChange={e => setNote(e.target.value)} autoFocus
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus-visible:border-ring" />
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/waiter/tables")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold">{order.order_number}</h2>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
              order.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
              {order.payment_status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {order.table?.name && `${order.table.name} · `}
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <button onClick={loadOrder} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      {/* Status stepper */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Order Status</p>
        <div className="flex flex-wrap gap-1.5">
          {ORDER_STATUSES.map((s, i) => {
            const isActive = s.key === order.status
            const isPast = i < statusIdx
            return (
              <button key={s.key} onClick={() => handleStatusChange(s.key)} disabled={saving}
                className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-all",
                  isActive ? "bg-primary text-primary-foreground border-primary" :
                  isPast ? "bg-green-100 text-green-700 border-green-200" :
                  "border-border text-muted-foreground hover:border-primary/40")}>
                {isPast && <CheckCircle2 className="size-3" />}
                {s.label}
              </button>
            )
          })}
        </div>
        {statusIdx < ORDER_STATUSES.length - 1 && (
          <button onClick={() => handleStatusChange(ORDER_STATUSES[statusIdx + 1].key)} disabled={saving}
            className="mt-3 w-full rounded-lg border border-primary/30 bg-primary/5 text-primary text-xs font-medium py-2 hover:bg-primary/10 transition-colors flex items-center justify-center gap-1">
            Move to {ORDER_STATUSES[statusIdx + 1].label} <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>

      {/* Note */}
      <button onClick={() => setShowNote(true)}
        className="w-full flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm hover:bg-muted transition-colors text-left">
        <StickyNote className="size-4 text-muted-foreground shrink-0" />
        <span className={order.notes ? "text-foreground" : "text-muted-foreground"}>
          {order.notes || "Add order note…"}
        </span>
      </button>

      {/* KOTs */}
      {(order.kots ?? []).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">KOTs</p>
          {order.kots!.map((kot: Kot) => (
            <div key={kot.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{kot.kot_number}</p>
                <p className="text-xs text-muted-foreground">{new Date(kot.created_at).toLocaleString()}</p>
              </div>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                kot.status === "ready" ? "bg-green-100 text-green-700" :
                kot.status === "preparing" ? "bg-amber-100 text-amber-700" :
                "bg-muted text-muted-foreground")}>
                {kot.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Items */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Items</p>
        {(order.items ?? []).map(item => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.quantity}× {item.name}</span>
            <span className="font-semibold">₹{(Number(item.price) * item.quantity).toFixed(0)}</span>
          </div>
        ))}
        <div className="pt-2 border-t border-border space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between"><span>Subtotal</span><span>₹{Number(order.subtotal).toFixed(0)}</span></div>
          {Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{Number(order.discount).toFixed(0)}</span></div>}
          <div className="flex justify-between"><span>Tax</span><span>₹{Number(order.tax).toFixed(0)}</span></div>
          <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t border-border">
            <span>Total</span><span>₹{Number(order.total).toFixed(0)}</span>
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
