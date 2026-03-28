"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, Table2, Users, ChevronRight, Plus, Minus, Trash2,
  StickyNote, Percent, Printer, CreditCard, Banknote,
  Smartphone, ArrowLeftRight, AlertCircle, X, CheckCircle2,
  ClipboardList, Send, FileText, RefreshCw, Search, ShoppingBag, Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import {
  useTableAreas, useTables, useStaff, useCreatePayment,
  useUpdateOrderStatus, useMenuItems, useMenuCategories,
} from "@/hooks/useApi"
import { useAuthStore } from "@/store/auth"
import { printReceipt } from "@/lib/printReceipt"
import { printKot } from "@/lib/printKot"
import { useToast } from "@/hooks/useToast"
import Toaster from "@/components/ui/Toaster"
import type { Order, Kot, MenuItem, OrderItem } from "@/lib/types"

const ORDER_STATUSES = [
  { key: "pending",   label: "Order Placed"     },
  { key: "confirmed", label: "Order Confirmed"  },
  { key: "preparing", label: "Order Preparing"  },
  { key: "ready",     label: "Food is Ready"    },
  { key: "served",    label: "Order Served"     },
]

const PAY_METHODS = [
  { key: "cash",   label: "Cash",          icon: Banknote       },
  { key: "card",   label: "Card",          icon: CreditCard     },
  { key: "upi",    label: "UPI",           icon: Smartphone     },
  { key: "online", label: "Bank Transfer", icon: ArrowLeftRight },
  { key: "due",    label: "Due",           icon: AlertCircle    },
]

function Modal({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">{footer}</div>}
      </div>
    </div>
  )
}

function AssignTableModal({ current, onSelect, onClose }: {
  current: number | null
  onSelect: (id: number, name: string) => void
  onClose: () => void
}) {
  const { data: areas = [] } = useTableAreas()
  const { data: tables = [] } = useTables()
  const [selected, setSelected] = useState<number | null>(current)

  return (
    <Modal title="Assign Table" onClose={onClose}
      footer={<>
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        <Button size="sm" onClick={() => {
          if (selected) {
            const t = tables.find(x => x.id === selected)
            if (t) onSelect(t.id, t.name)
          }
          onClose()
        }}>Assign</Button>
      </>}>
      {areas.map(area => {
        const areaTables = tables.filter(t => t.area_id === area.id)
        return (
          <div key={area.id} className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">{area.name} · {areaTables.length} Table(s)</p>
            <div className="grid grid-cols-3 gap-2">
              {areaTables.map(t => (
                <button key={t.id} onClick={() => setSelected(t.id)}
                  className={cn("rounded-lg border-2 p-2.5 text-left transition-all",
                    selected === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                  <p className="text-xs font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.capacity} Seat(s)</p>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </Modal>
  )
}

function DiscountModal({ current, total, onSave, onClose }: {
  current: { type: "percent" | "fixed"; value: number }
  total: number
  onSave: (type: "percent" | "fixed", value: number) => void
  onClose: () => void
}) {
  const [type, setType] = useState<"percent" | "fixed">(current.type)
  const [value, setValue] = useState(current.value > 0 ? String(current.value) : "")
  const num = parseFloat(value) || 0
  const discountAmt = type === "percent" ? (total * num / 100) : num

  return (
    <Modal title="Add Discount" onClose={onClose}
      footer={<>
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={() => { onSave(type, num); onClose() }}>Apply</Button>
      </>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setType("percent")}
            className={cn("flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-medium transition-all",
              type === "percent" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40")}>
            <Percent className="size-4" /> Percent
          </button>
          <button onClick={() => setType("fixed")}
            className={cn("flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-medium transition-all",
              type === "fixed" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40")}>
            ₹ Fixed
          </button>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{type === "percent" ? "Discount %" : "Discount Amount (₹)"}</Label>
          <Input className="h-9 text-sm mt-1.5" type="number" min="0"
            placeholder={type === "percent" ? "e.g. 10" : "e.g. 50"}
            value={value} onChange={e => setValue(e.target.value)} autoFocus />
        </div>
        {num > 0 && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm flex justify-between">
            <span className="text-muted-foreground">Discount amount</span>
            <span className="font-semibold text-green-600">-₹{discountAmt.toFixed(2)}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}

function PaymentModal({ order, loading, onClose, onComplete }: {
  order: Order; loading: boolean; onClose: () => void; onComplete: (method: string, paid: number) => void
}) {
  const [method, setMethod] = useState("cash")
  const [amount, setAmount] = useState(Number(order.total).toFixed(2))
  const paid = parseFloat(amount) || 0
  const change = Math.max(0, paid - Number(order.total))

  return (
    <Modal title={`Bill & Pay · ₹${Number(order.total).toFixed(2)}`} onClose={onClose}
      footer={<>
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={() => onComplete(method, paid)} disabled={loading}>
          {loading ? "Processing…" : "Complete Payment"}
        </Button>
      </>}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {PAY_METHODS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setMethod(key)}
              className={cn("flex flex-col items-center gap-1 rounded-lg border-2 py-2.5 text-xs font-medium transition-all",
                method === key ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40")}>
              <Icon className="size-4" />{label}
            </button>
          ))}
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Amount Received</Label>
          <Input className="h-8 text-sm mt-1.5" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {["1","2","3","4","5","6","7","8","9",".","0","CE"].map(k => (
            <button key={k} onClick={() => {
              if (k === "CE") setAmount("")
              else setAmount(p => p + k)
            }} className={cn(
              "rounded-lg border py-2.5 text-sm font-medium hover:bg-muted",
              k === "CE" ? "border-destructive/40 text-destructive hover:bg-destructive/10" : "border-border"
            )}>{k}</button>
          ))}
        </div>
        <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{Number(order.subtotal).toFixed(2)}</span></div>
          {Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{Number(order.discount).toFixed(2)}</span></div>}
          <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>₹{Number(order.tax).toFixed(2)}</span></div>
          <div className="flex justify-between font-bold border-t border-border pt-1"><span>Total</span><span>₹{Number(order.total).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Amount Given</span><span>₹{paid.toFixed(2)}</span></div>
          <div className={cn("flex justify-between font-bold text-base pt-1 border-t border-border",
            change > 0 ? "text-green-600" : "text-muted-foreground")}>
            <span>Return to Customer</span><span>₹{change.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── Add Items Panel ───────────────────────────────────────────────────────────
interface AddCartItem { id: number; name: string; price: number; qty: number }

function AddItemsPanel({ orderId, onDone, onClose }: {
  orderId: number
  onDone: () => void
  onClose: () => void
}) {
  const { data: menuItemsData } = useMenuItems()
  const { data: categories = [] } = useMenuCategories()
  const menuItems = menuItemsData?.data ?? []

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [cart, setCart] = useState<AddCartItem[]>([])
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const categoryNames = ["All", ...categories.map(c => c.name)]

  const filtered = useMemo(() => menuItems.filter(item => {
    if (category !== "All" && item.category?.name !== category) return false
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [menuItems, search, category])

  function addItem(item: MenuItem) {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id)
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { id: item.id, name: item.name, price: Number(item.price), qty: 1 }]
    })
  }

  function updateQty(id: number, delta: number) {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0))
  }

  async function handleSendKot() {
    if (!cart.length) return
    setSaving(true); setError("")
    try {
      await api.post(`/orders/${orderId}/add-items`, {
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.qty })),
        notes: note || undefined,
      })
      onDone()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add items")
    } finally {
      setSaving(false)
    }
  }

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0)

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-card border-l border-border flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div>
            <h3 className="text-sm font-semibold">Add More Items</h3>
            <p className="text-xs text-muted-foreground">New KOT will be created for these items</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>

        {/* Search + categories */}
        <div className="px-3 pt-2.5 pb-1 border-b border-border shrink-0 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input placeholder="Search items…" className="pl-8 h-8 text-xs" value={search}
              onChange={e => setSearch(e.target.value)} autoFocus />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {categoryNames.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={cn("shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  category === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filtered.map(item => {
              const inCart = cart.find(c => c.id === item.id)
              return (
                <button key={item.id} onClick={() => addItem(item)}
                  className={cn("relative flex flex-col items-start rounded-xl border overflow-hidden text-left transition-all hover:shadow-md",
                    inCart ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40")}>
                  {item.image ? (
                    <div className="w-full h-20 bg-muted overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-20 bg-muted/50 flex items-center justify-center shrink-0">
                      <span className="text-xl opacity-30">🍽️</span>
                    </div>
                  )}
                  <div className="p-2 w-full">
                    <p className="text-xs font-semibold leading-tight line-clamp-2">{item.name}</p>
                    <p className="text-xs font-bold mt-1 text-primary">₹{Number(item.price).toFixed(2)}</p>
                  </div>
                  {inCart && (
                    <span className="absolute top-1.5 right-1.5 size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shadow">
                      {inCart.qty}
                    </span>
                  )}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-full py-10 text-center text-xs text-muted-foreground">No items found</div>
            )}
          </div>
        </div>

        {/* Cart summary + send */}
        {cart.length > 0 && (
          <div className="border-t border-border p-3 space-y-2 shrink-0">
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-xs">
                  <span className="flex-1 truncate font-medium">{item.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, -1)}
                      className="size-5 rounded border border-border flex items-center justify-center hover:bg-muted">
                      <Minus className="size-2.5" />
                    </button>
                    <span className="w-5 text-center font-semibold">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)}
                      className="size-5 rounded border border-border flex items-center justify-center hover:bg-muted">
                      <Plus className="size-2.5" />
                    </button>
                  </div>
                  <span className="w-16 text-right font-semibold">₹{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Input placeholder="Note for kitchen (optional)" value={note}
              onChange={e => setNote(e.target.value)} className="h-7 text-xs" />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">₹{total.toFixed(2)}</span>
              <Button size="sm" className="gap-1.5 h-8" onClick={handleSendKot} disabled={saving}>
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                {saving ? "Sending…" : `Send KOT (${cart.length} item${cart.length > 1 ? "s" : ""})`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PosOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const [pax, setPax] = useState(1)
  const [waiterId, setWaiterId] = useState<number | null>(null)
  const [note, setNote] = useState("")
  const [showNote, setShowNote] = useState(false)
  const [showAssignTable, setShowAssignTable] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showAddItems, setShowAddItems] = useState(false)
  const [discount, setDiscount] = useState<{ type: "percent" | "fixed"; value: number }>({ type: "percent", value: 0 })
  const [paid, setPaid] = useState(false)

  const { data: staffList = [] } = useStaff()
  const { restaurant } = useAuthStore()
  const { toasts, show: toast, dismiss } = useToast()
  const waiters = staffList.filter(s => s.roles?.some(r => ["waiter", "manager", "admin"].includes(r.name)))
  const updateStatus = useUpdateOrderStatus()
  const createPayment = useCreatePayment()

  async function loadOrder() {
    setLoading(true)
    try {
      const data = await api.get<Order>(`/orders/${id}`)
      setOrder(data)
      setNote(data.notes ?? "")
      setPax((data as Order & { pax?: number }).pax ?? 1)
      // Pre-select waiter if the order was created by a waiter-role user
      if (data.user_id) setWaiterId(data.user_id)
    } catch {
      setError("Failed to load order")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrder() }, [id])

  async function handleStatusChange(status: string) {
    if (!order) return
    setSaving(true)
    try {
      await updateStatus.mutateAsync({ id: order.id, status })
      setOrder(prev => prev ? { ...prev, status: status as Order["status"] } : prev)
      toast(`Status updated to "${status.replace("_", " ")}"`)
    } catch {
      toast("Failed to update status", "error")
    } finally {
      setSaving(false)
    }
  }

  async function handleAssignTable(tableId: number, tableName: string) {
    if (!order) return
    setSaving(true)
    try {
      const updated = await api.put<Order>(`/orders/${order.id}`, { table_id: tableId })
      setOrder({ ...order, ...updated, table: { ...order.table, id: tableId, name: tableName } as Order["table"] })
      toast(`Table assigned: ${tableName}`)
    } catch {
      toast("Failed to assign table", "error")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveNote() {
    if (!order) return
    setSaving(true)
    try {
      await api.put(`/orders/${order.id}`, { notes: note })
      setOrder(prev => prev ? { ...prev, notes: note } : prev)
      setShowNote(false)
      toast("Note saved")
    } catch {
      toast("Failed to save note", "error")
    } finally {
      setSaving(false)
    }
  }

  async function handleApplyDiscount(type: "percent" | "fixed", value: number) {
    if (!order) return
    setDiscount({ type, value })
    const discountAmt = type === "percent" ? (Number(order.subtotal) * value / 100) : value
    setSaving(true)
    try {
      const updated = await api.put<Order>(`/orders/${order.id}`, { discount: discountAmt })
      setOrder(prev => prev ? { ...prev, ...updated } : prev)
      toast(`Discount applied: ₹${discountAmt.toFixed(2)}`)
    } catch {
      toast("Failed to apply discount", "error")
    } finally {
      setSaving(false)
    }
  }

  async function handleSendKot() {
    if (!order) return
    setSaving(true)
    try {
      await api.post("/kots", {
        order_id: order.id,
        items: order.items?.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })) ?? [],
        notes: note || undefined,
      })
      await loadOrder()
      toast("KOT sent to kitchen")
    } catch {
      toast("Failed to send KOT", "error")
      setError("Failed to send KOT")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveDraft() {
    if (!order) return
    setSaving(true)
    try {
      await api.put(`/orders/${order.id}`, { notes: note })
      setOrder(prev => prev ? { ...prev, notes: note } : prev)
      toast("Draft saved")
    } catch {
      toast("Failed to save draft", "error")
    } finally {
      setSaving(false)
    }
  }

  async function handlePayment(method: string, paidAmt: number) {
    if (!order) return
    // Open print window FIRST (before any awaits) to avoid popup blocker
    const win = window.open("", "_blank", "width=360,height=640,toolbar=0,menubar=0,scrollbars=1,resizable=1")
    setSaving(true)
    try {
      await createPayment.mutateAsync({
        order_id: order.id,
        amount: Number(order.total),
        method: method as "cash" | "card" | "upi" | "online" | "due",
      })
      setShowPayment(false)
      setPaid(true)
      // Update order state immediately before re-fetching
      setOrder(prev => prev ? { ...prev, payment_status: "paid" } : prev)
      await loadOrder()
      toast(`Payment recorded — ₹${Number(order.total).toFixed(2)} via ${method.toUpperCase()}`)
      // Print receipt into the already-opened window
      const change = Math.max(0, paidAmt - Number(order.total))
      if (win) {
        await printReceipt(order, restaurant, paidAmt, change, win)
      }
    } catch {
      toast("Payment failed", "error")
      setError("Payment failed")
      win?.close()
    } finally {
      setSaving(false)
    }
  }

  async function handlePrint() {
    if (!order) return
    await printReceipt(order, restaurant)
    toast("Receipt sent to printer", "info")
  }

  async function handleDelete() {
    if (!order || !confirm("Cancel this order?")) return
    setSaving(true)
    try {
      await api.delete(`/orders/${order.id}`)
      toast("Order deleted", "info")
      router.push("/pos/dine-in")
    } catch {
      toast("Failed to delete order", "error")
    } finally {
      setSaving(false)
    }
  }

  const statusIdx = ORDER_STATUSES.findIndex(s => s.key === order?.status)

  if (loading) return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      <RefreshCw className="size-4 animate-spin mr-2" /> Loading order…
    </div>
  )

  if (error && !order) return (
    <div className="flex items-center justify-center h-full text-destructive text-sm">{error}</div>
  )

  if (!order) return null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Toaster toasts={toasts} dismiss={dismiss} />
      {/* Modals */}
      {showAddItems && order && (
        <AddItemsPanel
          orderId={order.id}
          onDone={() => { setShowAddItems(false); loadOrder() }}
          onClose={() => setShowAddItems(false)}
        />
      )}
      {showAssignTable && (
        <AssignTableModal current={order.table_id ?? null}
          onSelect={handleAssignTable}
          onClose={() => setShowAssignTable(false)} />
      )}
      {showDiscount && (
        <DiscountModal current={discount} total={Number(order.subtotal)}
          onSave={handleApplyDiscount}
          onClose={() => setShowDiscount(false)} />
      )}
      {showPayment && (
        <PaymentModal order={order} loading={saving}
          onClose={() => setShowPayment(false)}
          onComplete={handlePayment} />
      )}
      {showNote && (
        <Modal title="Add Note" onClose={() => setShowNote(false)}
          footer={<>
            <Button variant="outline" size="sm" onClick={() => setShowNote(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveNote} disabled={saving}>Save</Button>
          </>}>
          <textarea rows={4} value={note} onChange={e => setNote(e.target.value)} autoFocus
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus-visible:border-ring" />
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold">Order #{order.order_number}</h1>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
              order.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
              {order.payment_status}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium capitalize">
              {order.order_type.replace("_", " ")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <button onClick={loadOrder} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className="size-4" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Order details */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Quick actions row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button onClick={() => setShowAssignTable(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted transition-colors">
              <Table2 className="size-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{order.table?.name ?? "Assign Table"}</span>
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
              <Users className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground mr-1">Pax</span>
              <button onClick={() => setPax(p => Math.max(1, p - 1))} className="size-4 rounded border border-border flex items-center justify-center hover:bg-muted text-xs">-</button>
              <span className="w-5 text-center font-semibold">{pax}</span>
              <button onClick={() => setPax(p => p + 1)} className="size-4 rounded border border-border flex items-center justify-center hover:bg-muted text-xs">+</button>
            </div>
            <select value={waiterId ?? ""} onChange={e => setWaiterId(e.target.value ? Number(e.target.value) : null)}
              className="rounded-lg border border-border px-3 py-2 text-xs bg-background hover:bg-muted transition-colors outline-none">
              <option value="">Select Waiter</option>
              {waiters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <button onClick={() => setShowNote(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted transition-colors">
              <StickyNote className="size-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{note || "Add Note"}</span>
            </button>
          </div>

          {/* Order creator info */}
          {order.user && (
            <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {order.user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{order.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{order.user.email}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium capitalize">
                  {order.user.roles?.[0]?.name ?? "staff"}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">Order Creator</p>
              </div>
            </div>
          )}

          {/* Status stepper */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Set Order Status</p>

            {/* Instant-ready notice */}
            {(() => {
              const items = order.items ?? []
              const allInstant = items.length > 0 && items.every(i => (i as OrderItem & { is_instant?: boolean }).is_instant)
              const someInstant = items.some(i => (i as OrderItem & { is_instant?: boolean }).is_instant)
              const hasKitchenItems = items.some(i => !(i as OrderItem & { is_instant?: boolean }).is_instant)

              if (allInstant) return (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                  <span className="text-base">⚡</span>
                  <span>All items are instantly ready — no kitchen prep needed. You can serve immediately.</span>
                </div>
              )
              if (someInstant && hasKitchenItems) return (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  <span className="text-base">⚡</span>
                  <span>Some items are instantly ready. Kitchen items are still being prepared.</span>
                </div>
              )
              return null
            })()}

            {/* Dynamic status steps — skip preparing/ready if all items are instant */}
            {(() => {
              const items = order.items ?? []
              const allInstant = items.length > 0 && items.every(i => (i as OrderItem & { is_instant?: boolean }).is_instant)
              const visibleStatuses = allInstant
                ? ORDER_STATUSES.filter(s => !["preparing", "ready"].includes(s.key))
                : ORDER_STATUSES
              const visibleIdx = visibleStatuses.findIndex(s => s.key === order.status)

              return (
                <>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {visibleStatuses.map((s, i) => {
                      const isActive = s.key === order.status
                      const isPast = i < visibleIdx
                      return (
                        <button key={s.key} onClick={() => handleStatusChange(s.key)} disabled={saving}
                          className="flex items-center gap-1 shrink-0 transition-all">
                          <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-all",
                            isActive ? "bg-primary text-primary-foreground border-primary" :
                            isPast ? "bg-green-100 text-green-700 border-green-200" :
                            "border-border text-muted-foreground hover:border-primary/40")}>
                            {isPast && <CheckCircle2 className="size-3" />}
                            {s.label}
                          </span>
                          {i < visibleStatuses.length - 1 && <ChevronRight className="size-3 text-muted-foreground shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                  {visibleIdx < visibleStatuses.length - 1 && (
                    <button onClick={() => handleStatusChange(visibleStatuses[visibleIdx + 1].key)} disabled={saving}
                      className="mt-3 w-full rounded-lg border border-primary/30 bg-primary/5 text-primary text-xs font-medium py-2 hover:bg-primary/10 transition-colors">
                      Move to {visibleStatuses[visibleIdx + 1]?.label}
                    </button>
                  )}
                </>
              )
            })()}
          </div>

          {/* KOTs */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">KOTs</p>
            {(order.kots ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No KOTs yet</p>
            ) : (
              order.kots!.map((kot: Kot) => (
                <div key={kot.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold">{kot.kot_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(kot.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                        kot.status === "ready" ? "bg-green-100 text-green-700" :
                        kot.status === "preparing" ? "bg-amber-100 text-amber-700" :
                        "bg-muted text-muted-foreground")}>
                        {kot.status}
                      </span>
                      <button
                        onClick={() => printKot(kot, order)}
                        title="Print KOT"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Printer className="size-3" /> Print
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {(order.items ?? []).map(item => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span>{item.quantity}× {item.name}</span>
                        <span className="text-muted-foreground">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order items */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Items</p>
            <div className="space-y-2">
              {(order.items ?? []).map(item => (
                <div key={item.id} className="flex justify-between text-sm items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium">{item.quantity}× {item.name}</span>
                      {(item as OrderItem & { is_instant?: boolean }).is_instant && (
                        <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-medium">
                          ⚡ Instant
                        </span>
                      )}
                    </div>
                    {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                  </div>
                  <span className="text-sm font-semibold ml-3">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
        </div>

        {/* RIGHT: Bill summary + actions */}
        <div className="w-72 xl:w-80 shrink-0 border-l border-border bg-card flex flex-col">
          {/* Bill summary */}
          <div className="p-4 border-b border-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Bill Summary</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{Number(order.subtotal).toFixed(2)}</span></div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{Number(order.discount).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>₹{Number(order.tax).toFixed(2)}</span></div>
              {Number(order.service_charge) > 0 && (
                <div className="flex justify-between text-muted-foreground"><span>Service Charge</span><span>₹{Number(order.service_charge).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between font-bold text-base pt-1.5 border-t border-border">
                <span>Total</span><span>₹{Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-4 space-y-2 flex-1">
            <button onClick={() => setShowDiscount(true)}
              className="w-full flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted transition-colors">
              <Percent className="size-4 text-muted-foreground" /> Add Discount
              {Number(order.discount) > 0 && <span className="ml-auto text-xs text-green-600 font-medium">-₹{Number(order.discount).toFixed(2)}</span>}
            </button>

            <button onClick={handleSaveDraft} disabled={saving}
              className="w-full flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted transition-colors">
              <FileText className="size-4 text-muted-foreground" /> Save as Draft
            </button>

            <button onClick={handleSendKot} disabled={saving}
              className="w-full flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 px-3 py-2.5 text-sm hover:bg-amber-100 transition-colors">
              <Send className="size-4" /> Send KOT
            </button>

            <button
              onClick={() => {
                const kots = order.kots ?? []
                if (kots.length === 0) return
                printKot(kots[kots.length - 1], order)
                toast("KOT sent to printer", "info")
              }}
              disabled={(order.kots ?? []).length === 0}
              className="w-full flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted transition-colors disabled:opacity-40">
              <Printer className="size-4 text-muted-foreground" /> Print KOT
            </button>

            <button onClick={() => setShowPayment(true)} disabled={saving || order.payment_status === "paid"}
              className="w-full flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 text-green-700 px-3 py-2.5 text-sm hover:bg-green-100 transition-colors disabled:opacity-50">
              <CreditCard className="size-4" /> Bill &amp; Pay
            </button>

            <button onClick={handlePrint}
              className="w-full flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted transition-colors">
              <Printer className="size-4 text-muted-foreground" /> Bill &amp; Print
            </button>

            <button onClick={() => setShowAddItems(true)} disabled={order.payment_status === "paid"}
              className="w-full flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 text-primary px-3 py-2.5 text-sm hover:bg-primary/10 transition-colors disabled:opacity-50">
              <Plus className="size-4" /> Add More Items
            </button>

            <div className="pt-2 border-t border-border">
              <button onClick={handleDelete} disabled={saving}
                className="w-full flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive px-3 py-2.5 text-sm hover:bg-destructive/10 transition-colors">
                <Trash2 className="size-4" /> Delete Order
              </button>
            </div>
          </div>

          {paid && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="size-4" /> Payment recorded
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
