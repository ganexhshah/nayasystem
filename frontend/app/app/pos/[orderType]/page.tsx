"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Search, Plus, Minus, Trash2, X, ShoppingCart, StickyNote,
  Table2, CreditCard, Banknote, Smartphone, Wallet,
  ArrowLeftRight, AlertCircle, CheckCircle2, Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useMenuItems, useMenuCategories, useTables, useTableAreas,
  useCreateOrder, useCreatePayment, useCustomers, usePOSConfig,
} from "@/hooks/useApi"
import type { MenuItem, Customer } from "@/lib/types"

interface CartItem { id: number; name: string; price: number; veg: boolean; qty: number; note: string }

const PAY_METHODS = [
  { key: "cash",  label: "Cash",          icon: Banknote       },
  { key: "card",  label: "Card",          icon: CreditCard     },
  { key: "upi",   label: "UPI",           icon: Smartphone     },
  { key: "online",label: "Bank Transfer", icon: ArrowLeftRight },
  { key: "due",   label: "Due",           icon: AlertCircle    },
]

// ── Modal wrapper ─────────────────────────────────────────────────────────────
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

// ── Assign Table Modal ────────────────────────────────────────────────────────
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
            {areaTables.length === 0
              ? <p className="text-xs text-muted-foreground pl-2">No tables</p>
              : <div className="grid grid-cols-3 gap-2">
                  {areaTables.map(t => (
                    <button key={t.id} onClick={() => setSelected(t.id)}
                      className={cn("rounded-lg border-2 p-2.5 text-left transition-all",
                        selected === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                      <p className="text-xs font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.capacity} Seat(s)</p>
                    </button>
                  ))}
                </div>
            }
          </div>
        )
      })}
    </Modal>
  )
}

// ── Customer Search Modal ─────────────────────────────────────────────────────
function CustomerModal({ onSelect, onClose }: {
  onSelect: (id: number, name: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState("")
  const { data } = useCustomers(search ? { search } : undefined)
  const customers = data?.data ?? []

  return (
    <Modal title="Select Customer" onClose={onClose}>
      <div className="space-y-3">
        <Input placeholder="Search by name or phone..." value={search}
          onChange={e => setSearch(e.target.value)} className="h-8 text-sm" autoFocus />
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {customers.map(c => (
            <button key={c.id} onClick={() => { onSelect(c.id, c.name); onClose() }}
              className="w-full flex items-center gap-3 rounded-lg border border-border p-2.5 text-left hover:bg-muted transition-colors">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {c.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
              </div>
            </button>
          ))}
          {customers.length === 0 && search && (
            <p className="text-xs text-muted-foreground text-center py-4">No customers found</p>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ total, loading, onClose, onComplete }: {
  total: number
  loading: boolean
  onClose: () => void
  onComplete: (method: string) => void
}) {
  const [method, setMethod] = useState("cash")
  const [amount, setAmount] = useState(total.toFixed(2))
  const paid = parseFloat(amount) || 0
  const change = Math.max(0, paid - total)

  return (
    <Modal title={`Payment · ₹${total.toFixed(2)}`} onClose={onClose}
      footer={<>
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={() => onComplete(method)} disabled={loading}>
          {loading ? "Processing..." : "Complete Payment"}
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
          {["1","2","3","4","5","6","7","8","9",".","0","⌫"].map(k => (
            <button key={k} onClick={() => {
              if (k === "⌫") setAmount(p => p.slice(0, -1))
              else setAmount(p => p + k)
            }} className="rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted">{k}</button>
          ))}
        </div>
        <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span>₹{total.toFixed(2)}</span></div>
          <div className="flex justify-between font-semibold"><span>Paid</span><span>₹{paid.toFixed(2)}</span></div>
          {change > 0 && <div className="flex justify-between text-green-600"><span>Change</span><span>₹{change.toFixed(2)}</span></div>}
        </div>
      </div>
    </Modal>
  )
}

// ── Note Modal ────────────────────────────────────────────────────────────────
function NoteModal({ item, onSave, onClose }: {
  item: CartItem; onSave: (note: string) => void; onClose: () => void
}) {
  const [note, setNote] = useState(item.note)
  return (
    <Modal title="Add Note" onClose={onClose}
      footer={<>
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={() => { onSave(note); onClose() }}>Save</Button>
      </>}>
      <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} autoFocus
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus-visible:border-ring" />
    </Modal>
  )
}

// ── Main POS Page ─────────────────────────────────────────────────────────────
export default function PosMainPage() {
  const { orderType } = useParams<{ orderType: string }>()
  const router = useRouter()

  const isDineIn   = orderType === "dine-in"
  const orderLabel = orderType === "dine-in" ? "Dine In" : orderType === "delivery" ? "Delivery" : "Pickup"
  const apiOrderType = orderType === "dine-in" ? "dine_in" : orderType === "delivery" ? "delivery" : "takeaway"

  const { data: menuItemsData } = useMenuItems()
  const { data: categories = [] } = useMenuCategories()
  const { taxRate, serviceCharge } = usePOSConfig()
  const menuItems = menuItemsData?.data ?? []

  const [search, setSearch]     = useState("")
  const [category, setCategory] = useState("All")
  const [vegOnly, setVegOnly]   = useState(false)

  const [cart, setCart]             = useState<CartItem[]>([])
  const [tableId, setTableId]       = useState<number | null>(null)
  const [tableName, setTableName]   = useState("")
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [discount, setDiscount]     = useState("")
  const [orderNote, setOrderNote]   = useState("")

  const [showAssignTable, setShowAssignTable] = useState(false)
  const [showCustomer, setShowCustomer]       = useState(false)
  const [showPayment, setShowPayment]         = useState(false)
  const [noteItem, setNoteItem]               = useState<CartItem | null>(null)
  const [showOrderNote, setShowOrderNote]     = useState(false)

  const [placedOrderNumber, setPlacedOrderNumber] = useState("")
  const [error, setError] = useState("")

  const createOrder   = useCreateOrder()
  const createPayment = useCreatePayment()
  const isProcessing  = createOrder.isPending || createPayment.isPending

  const categoryNames = ["All", ...categories.map(c => c.name)]

  const filtered = useMemo(() => menuItems.filter(item => {
    if (vegOnly && !item.is_veg) return false
    if (category !== "All" && item.category?.name !== category) return false
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [menuItems, search, category, vegOnly])

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id)
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { id: item.id, name: item.name, price: Number(item.price), veg: item.is_veg, qty: 1, note: "" }]
    })
  }

  function updateQty(id: number, delta: number) {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0))
  }

  function saveNote(id: number, note: string) {
    setCart(prev => prev.map(c => c.id === id ? { ...c, note } : c))
  }

  const subtotal    = cart.reduce((s, c) => s + c.price * c.qty, 0)
  const discountAmt = parseFloat(discount) || 0
  const taxAmt      = (subtotal - discountAmt) * (taxRate / 100)
  const total       = subtotal - discountAmt + taxAmt

  async function handlePlaceOrder(payMethod: string) {
    setError("")
    try {
      const order = await createOrder.mutateAsync({
        order_type:  apiOrderType,
        table_id:    tableId    ?? undefined,
        customer_id: customerId ?? undefined,
        notes:       orderNote  || undefined,
        discount:    discountAmt || undefined,
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.qty, notes: c.note || undefined })),
      })

      // Create payment record
      await createPayment.mutateAsync({
        order_id: order.id,
        amount:   order.total,
        method:   payMethod as "cash" | "card" | "upi" | "online" | "due",
      })

      setPlacedOrderNumber(order.order_number)
      setShowPayment(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to place order")
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (placedOrderNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-5">
          <CheckCircle2 className="size-16 text-green-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold">Order Placed!</h2>
            <p className="text-muted-foreground text-sm mt-1">{placedOrderNumber} created successfully</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => window.print()}>Print Receipt</Button>
            <Button className="flex-1" onClick={() => {
              setCart([]); setTableId(null); setTableName(""); setCustomerId(null); setCustomerName("")
              setDiscount(""); setOrderNote(""); setPlacedOrderNumber("")
            }}>New Order</Button>
          </div>
          <button onClick={() => router.push("/app/orders/list")} className="text-xs text-muted-foreground hover:text-foreground underline">
            View all orders
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {showAssignTable && (
        <AssignTableModal current={tableId}
          onSelect={(id, name) => { setTableId(id); setTableName(name) }}
          onClose={() => setShowAssignTable(false)} />
      )}
      {showCustomer && (
        <CustomerModal
          onSelect={(id, name) => { setCustomerId(id); setCustomerName(name) }}
          onClose={() => setShowCustomer(false)} />
      )}
      {showPayment && (
        <PaymentModal total={total} loading={isProcessing}
          onClose={() => setShowPayment(false)}
          onComplete={handlePlaceOrder} />
      )}
      {noteItem && (
        <NoteModal item={noteItem} onSave={n => saveNote(noteItem.id, n)} onClose={() => setNoteItem(null)} />
      )}
      {showOrderNote && (
        <Modal title="Order Note" onClose={() => setShowOrderNote(false)}
          footer={<Button size="sm" onClick={() => setShowOrderNote(false)}>Save</Button>}>
          <textarea rows={3} value={orderNote} onChange={e => setOrderNote(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none" />
        </Modal>
      )}

      {/* LEFT: Menu */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-border">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-card">
          <button onClick={() => router.push("/app/pos")} className="text-xs text-muted-foreground hover:text-foreground shrink-0">
            ← {orderLabel}
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input placeholder="Search menu items..." className="pl-8 h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setVegOnly(v => !v)}
            className={cn("shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              vegOnly ? "bg-green-600 text-white border-green-600" : "border-border text-muted-foreground hover:bg-muted")}>
            🌿 Veg
          </button>
        </div>

        <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-border bg-card shrink-0">
          {categoryNames.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={cn("shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                category === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {filtered.map(item => {
              const inCart = cart.find(c => c.id === item.id)
              return (
                <button key={item.id} onClick={() => addToCart(item)}
                  className={cn("relative flex flex-col items-start rounded-xl border p-3 text-left transition-all hover:shadow-md",
                    inCart ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40")}>
                  <span className={cn("size-3 rounded-sm border-2 mb-2",
                    item.is_veg ? "border-green-600 bg-green-600" : "border-red-500 bg-red-500")} />
                  <p className="text-xs font-semibold leading-tight line-clamp-2">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.category?.name}</p>
                  <p className="text-sm font-bold mt-1.5 text-primary">₹{Number(item.price).toFixed(2)}</p>
                  {inCart && (
                    <span className="absolute top-2 right-2 size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      {inCart.qty}
                    </span>
                  )}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center text-sm text-muted-foreground">No items found</div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Order Panel */}
      <div className="flex flex-col w-80 xl:w-96 shrink-0 bg-card border-l border-border">
        <div className="px-3 py-2.5 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Order Type: {orderLabel}</span>
            <button onClick={() => router.push("/app/pos")} className="text-xs text-primary hover:underline">Change</button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {isDineIn && (
              <button onClick={() => setShowAssignTable(true)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs hover:bg-muted transition-colors">
                <Table2 className="size-3.5 text-muted-foreground" />
                <span className="truncate">{tableName || "Assign Table"}</span>
              </button>
            )}
            <button onClick={() => setShowCustomer(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs hover:bg-muted transition-colors">
              <Users className="size-3.5 text-muted-foreground" />
              <span className="truncate">{customerName || "Customer"}</span>
            </button>
            <button onClick={() => setShowOrderNote(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs hover:bg-muted transition-colors">
              <StickyNote className="size-3.5 text-muted-foreground" />
              {orderNote ? "Edit Note" : "Add Note"}
            </button>
          </div>
        </div>

        {/* Cart */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <ShoppingCart className="size-10 opacity-20" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_60px_60px_28px] gap-1 text-xs text-muted-foreground font-medium px-1 pb-1 border-b border-border">
                <span>Item</span><span className="text-center">Qty</span><span className="text-right">Price</span><span />
              </div>
              {cart.map(item => (
                <div key={item.id} className="rounded-lg border border-border bg-background p-2 space-y-1.5">
                  <div className="grid grid-cols-[1fr_60px_60px_28px] gap-1 items-center">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={cn("size-2 rounded-sm border shrink-0",
                        item.veg ? "border-green-600 bg-green-600" : "border-red-500 bg-red-500")} />
                      <span className="text-xs font-medium truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center justify-center gap-0.5">
                      <button onClick={() => updateQty(item.id, -1)} className="size-5 rounded border border-border flex items-center justify-center hover:bg-muted">
                        <Minus className="size-2.5" />
                      </button>
                      <span className="w-5 text-center text-xs font-semibold">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="size-5 rounded border border-border flex items-center justify-center hover:bg-muted">
                        <Plus className="size-2.5" />
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-right">₹{(item.price * item.qty).toFixed(2)}</span>
                    <button onClick={() => setCart(p => p.filter(c => c.id !== item.id))} className="text-muted-foreground hover:text-destructive flex justify-center">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <button onClick={() => setNoteItem(item)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground pl-3.5">
                    <StickyNote className="size-3" />
                    {item.note ? <span className="truncate max-w-[160px] text-foreground">{item.note}</span> : "Add Note"}
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Totals */}
        {cart.length > 0 && (
          <div className="border-t border-border px-3 py-2.5 space-y-2">
            {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-2 py-1.5">{error}</p>}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground flex-1">Discount (₹)</span>
              <Input className="h-7 w-20 text-xs text-right" placeholder="0.00" value={discount} onChange={e => setDiscount(e.target.value)} />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              {discountAmt > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{discountAmt.toFixed(2)}</span></div>}
              <div className="flex justify-between text-muted-foreground"><span>Tax (5%)</span><span>₹{taxAmt.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-border"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCart([])}>Clear</Button>
              <Button size="sm" className="h-8 text-xs" onClick={() => setShowPayment(true)} disabled={isProcessing}>
                {isProcessing ? "Placing..." : `Pay ₹${total.toFixed(2)}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
