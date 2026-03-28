"use client"

import { useMemo, useState } from "react"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Search, Plus, Minus, Trash2, X, ShoppingCart, StickyNote,
  Table2, CreditCard, Banknote, Smartphone,
  ArrowLeftRight, AlertCircle, Users, Loader2, Tag, Printer, Receipt, FileText, GitMerge
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useMenuItems, useMenuCategories, useTables, useTableAreas,
  useCreateOrder, useCreatePayment, useCustomers, useCreateCustomer,
  useSettings,
} from "@/hooks/useApi"
import type { MenuItem } from "@/lib/types"
import { printKot } from "@/lib/printKot"
import { printReceipt } from "@/lib/printReceipt"

interface CartItem { id: number; name: string; price: number; veg: boolean; qty: number; note: string }

const PAY_METHODS = [
  { key: "cash",   label: "Cash",          icon: Banknote       },
  { key: "card",   label: "Card",          icon: CreditCard     },
  { key: "upi",    label: "UPI",           icon: Smartphone     },
  { key: "online", label: "Bank Transfer", icon: ArrowLeftRight },
  { key: "due",    label: "Due",           icon: AlertCircle    },
]

const TAX_RATE = 0.05

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

function MergeTableModal({ primaryId, primaryName, merged, onSave, onClose }: {
  primaryId: number | null
  primaryName: string
  merged: { id: number; name: string }[]
  onSave: (tables: { id: number; name: string }[]) => void
  onClose: () => void
}) {
  const { data: areas = [] } = useTableAreas()
  const { data: tables = [] } = useTables()
  const [selected, setSelected] = useState<{ id: number; name: string }[]>(merged)

  function toggle(t: { id: number; name: string }) {
    setSelected(prev =>
      prev.find(x => x.id === t.id)
        ? prev.filter(x => x.id !== t.id)
        : [...prev, t]
    )
  }

  return (
    <Modal title="Merge Tables" onClose={onClose}
      footer={<>
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={() => { onSave(selected); onClose() }}>
          Merge {selected.length > 0 ? `(${selected.length} table${selected.length > 1 ? "s" : ""})` : ""}
        </Button>
      </>}>
      <p className="text-xs text-muted-foreground mb-3">
        Select additional tables to merge with <span className="font-semibold text-foreground">{primaryName || "primary table"}</span>. The order will cover all selected tables.
      </p>
      {areas.map(area => {
        const areaTables = tables.filter(t => t.area_id === area.id && t.id !== primaryId)
        if (areaTables.length === 0) return null
        return (
          <div key={area.id} className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">{area.name}</p>
            <div className="grid grid-cols-3 gap-2">
              {areaTables.map(t => {
                const isSelected = !!selected.find(x => x.id === t.id)
                return (
                  <button key={t.id} onClick={() => toggle({ id: t.id, name: t.name })}
                    className={cn("rounded-lg border-2 p-2.5 text-left transition-all",
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                    <p className="text-xs font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.capacity} Seat(s)</p>
                    {isSelected && <p className="text-xs text-primary font-medium mt-0.5">✓ Merged</p>}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      {selected.length > 0 && (
        <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs">
          <span className="font-medium text-primary">Merged: </span>
          {[primaryName, ...selected.map(t => t.name)].filter(Boolean).join(" + ")}
        </div>
      )}
    </Modal>
  )
}

function CustomerModal({ onSelect, onClose }: {
  onSelect: (id: number, name: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState("")
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const [addError, setAddError] = useState("")

  const { data } = useCustomers(search ? { search } : undefined)
  const customers = data?.data ?? []
  const createCustomer = useCreateCustomer()

  async function handleAddCustomer() {
    if (!newName.trim()) { setAddError("Name is required"); return }
    setSaving(true); setAddError("")
    try {
      const c = await createCustomer.mutateAsync({
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
      } as Parameters<typeof createCustomer.mutateAsync>[0])
      onSelect(c.id, c.name)
      onClose()
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : "Failed to add customer")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Select Customer" onClose={onClose}>
      <div className="space-y-3">
        {!adding ? (
          <>
            <div className="flex gap-2">
              <Input placeholder="Search by name or phone..." value={search}
                onChange={e => setSearch(e.target.value)} className="h-8 text-sm flex-1" autoFocus />
              <Button size="sm" variant="outline" className="h-8 shrink-0 gap-1.5"
                onClick={() => { setAdding(true); setSearch("") }}>
                <Plus className="size-3.5" /> New
              </Button>
            </div>
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
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs text-muted-foreground">No customers found for "{search}"</p>
                  <Button size="sm" variant="outline" className="gap-1.5"
                    onClick={() => { setAdding(true); setNewName(search); setSearch("") }}>
                    <Plus className="size-3.5" /> Add "{search}" as new customer
                  </Button>
                </div>
              )}
              {customers.length === 0 && !search && (
                <p className="text-xs text-muted-foreground text-center py-4">No customers yet</p>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Add New Customer</p>
              <button onClick={() => { setAdding(false); setAddError("") }}
                className="text-xs text-muted-foreground hover:text-foreground">← Back</button>
            </div>
            {addError && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-2 py-1.5">{addError}</p>}
            <div className="space-y-2">
              <Input placeholder="Name *" value={newName} onChange={e => setNewName(e.target.value)}
                className="h-8 text-sm" autoFocus />
              <Input placeholder="Phone" value={newPhone} onChange={e => setNewPhone(e.target.value)}
                className="h-8 text-sm" type="tel" />
              <Input placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                className="h-8 text-sm" type="email" />
            </div>
            <Button className="w-full h-8 text-sm gap-1.5" onClick={handleAddCustomer} disabled={saving}>
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              {saving ? "Adding..." : "Add & Select"}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

function PaymentModal({ total, loading, onClose, onComplete }: {
  total: number; loading: boolean; onClose: () => void; onComplete: (method: string, paid: number) => void
}) {
  const [method, setMethod] = useState("cash")
  const [amount, setAmount] = useState(Number(total).toFixed(2))
  const paid = parseFloat(amount) || 0
  const change = Math.max(0, paid - Number(total))

  return (
    <Modal title={`Payment · ₹${Number(total).toFixed(2)}`} onClose={onClose}
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
          <div className="flex justify-between text-muted-foreground"><span>Bill Total</span><span>₹{Number(total).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Amount Given</span><span>₹{paid.toFixed(2)}</span></div>
          <div className={cn(
            "flex justify-between font-bold text-base pt-1.5 border-t border-border",
            change > 0 ? "text-green-600" : "text-muted-foreground"
          )}>
            <span>Return to Customer</span>
            <span>₹{change.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

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

export default function PosTerminalPage() {
  const { orderType: paramOrderType } = useParams<{ orderType?: string }>()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const orderType =
    paramOrderType ??
    (pathname.includes("/pos/dine-in")
      ? "dine-in"
      : pathname.includes("/pos/delivery")
      ? "delivery"
      : "takeaway")

  const isDineIn     = orderType === "dine-in"
  const orderLabel   = orderType === "dine-in" ? "Dine In" : orderType === "delivery" ? "Delivery" : "Takeaway"
  const apiOrderType = orderType === "dine-in" ? "dine_in" : orderType === "delivery" ? "delivery" : "takeaway"

  const { data: menuItemsData } = useMenuItems()
  const { data: categories = [] } = useMenuCategories()
  const menuItems = menuItemsData?.data ?? []

  const [search, setSearch]   = useState("")
  const [category, setCategory] = useState("All")
  const [vegOnly, setVegOnly] = useState(false)

  const [cart, setCart]                     = useState<CartItem[]>([])
  const initialTableId =
    orderType === "dine-in"
      ? (() => {
          const rawTableId = searchParams.get("table_id")
          if (!rawTableId) return null
          const parsedTableId = Number.parseInt(rawTableId, 10)
          return Number.isNaN(parsedTableId) ? null : parsedTableId
        })()
      : null
  const initialTableName =
    orderType === "dine-in" ? searchParams.get("table_name") ?? "" : ""

  const [tableId, setTableId]               = useState<number | null>(initialTableId)
  const [tableName, setTableName]           = useState(initialTableName)
  const [customerId, setCustomerId]         = useState<number | null>(null)
  const [customerName, setCustomerName]     = useState("")
  const [discount, setDiscount]             = useState("")
  const [orderNote, setOrderNote]           = useState("")

  const [showAssignTable, setShowAssignTable] = useState(false)
  const [showCustomer, setShowCustomer]       = useState(false)
  const [showPayment, setShowPayment]         = useState(false)
  const [showBillPayment, setShowBillPayment] = useState(false)
  const [showMergeTables, setShowMergeTables] = useState(false)
  const [mergedTables, setMergedTables]       = useState<{ id: number; name: string }[]>([])
  const [noteItem, setNoteItem]               = useState<CartItem | null>(null)
  const [showOrderNote, setShowOrderNote]     = useState(false)
  const [error, setError] = useState("")

  const createOrder   = useCreateOrder()
  const createPayment = useCreatePayment()
  const isProcessing  = createOrder.isPending || createPayment.isPending
  const { data: restaurant } = useSettings()

  const [showDiscount, setShowDiscount] = useState(false)

  const categoryNames = ["All", ...categories.map(c => c.name)]

  const filtered = useMemo(() => menuItems.filter(item => {
    if (vegOnly && !item.is_veg) return false
    if (category !== "All" && item.category?.name !== category) return false
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [menuItems, search, category, vegOnly])

  function addToCart(item: MenuItem) {
    // Play a short click beep via Web Audio API
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.08)
      osc.onended = () => ctx.close()
    } catch { /* ignore if audio not available */ }

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
  const taxAmt      = (subtotal - discountAmt) * TAX_RATE
  const total       = subtotal - discountAmt + taxAmt

  async function buildOrderPayload() {
    const mergeNote = mergedTables.length > 0
      ? `Merged tables: ${[tableName, ...mergedTables.map(t => t.name)].filter(Boolean).join(" + ")}`
      : undefined
    const notes = [orderNote, mergeNote].filter(Boolean).join(" | ") || undefined
    return {
      order_type:  apiOrderType,
      table_id:    tableId    ?? undefined,
      customer_id: customerId ?? undefined,
      notes,
      discount:    discountAmt || undefined,
      items: cart.map(c => ({ menu_item_id: c.id, quantity: c.qty, notes: c.note || undefined })),
    }
  }

  async function handleSendKot() {
    setError("")
    try {
      const order = await createOrder.mutateAsync(await buildOrderPayload())
      router.push(`/pos/kot/${order.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to place order")
    }
  }

  async function handleSendKotAndPrint() {
    setError("")
    try {
      const order = await createOrder.mutateAsync(await buildOrderPayload())
      if (order.kots?.length) {
        printKot(order.kots[0], order)
      }
      router.push(`/pos/kot/${order.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to place order")
    }
  }

  async function handlePlaceOrder(payMethod: string, paidAmt?: number) {
    setError("")
    try {
      const order = await createOrder.mutateAsync(await buildOrderPayload())
      await createPayment.mutateAsync({
        order_id: order.id,
        amount:   order.total,
        method:   payMethod as "cash" | "card" | "upi" | "online" | "due",
      })
      setShowPayment(false)
      const paid = paidAmt ?? Number(order.total)
      const change = Math.max(0, paid - Number(order.total))
      await printReceipt(order, restaurant, paid, change)
      router.push(`/pos/kot/${order.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to place order")
    }
  }

  async function handleBill() {
    setError("")
    try {
      const order = await createOrder.mutateAsync(await buildOrderPayload())
      router.push(`/pos/kot/${order.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create bill")
    }
  }

  async function handleBillAndPrint() {
    setError("")
    try {
      const order = await createOrder.mutateAsync(await buildOrderPayload())
      await printReceipt(order, restaurant)
      router.push(`/pos/kot/${order.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create bill")
    }
  }

  async function handleBillAndPayment(payMethod: string, paidAmt?: number) {
    setError("")
    try {
      const order = await createOrder.mutateAsync(await buildOrderPayload())
      await createPayment.mutateAsync({
        order_id: order.id,
        amount:   order.total,
        method:   payMethod as "cash" | "card" | "upi" | "online" | "due",
      })
      setShowBillPayment(false)
      const paid = paidAmt ?? Number(order.total)
      const change = Math.max(0, paid - Number(order.total))
      await printReceipt(order, restaurant, paid, change)
      router.push(`/pos/kot/${order.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to process")
    }
  }

  function resetOrder() {
    setCart([]); setTableId(null); setTableName(""); setCustomerId(null)
    setCustomerName(""); setDiscount(""); setOrderNote(""); setMergedTables([])
  }

  return (
    <div className="flex h-full overflow-hidden">
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
      {showBillPayment && (
        <PaymentModal total={total} loading={isProcessing}
          onClose={() => setShowBillPayment(false)}
          onComplete={handleBillAndPayment} />
      )}
      {showMergeTables && isDineIn && (
        <MergeTableModal
          primaryId={tableId}
          primaryName={tableName}
          merged={mergedTables}
          onSave={setMergedTables}
          onClose={() => setShowMergeTables(false)} />
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
        {/* Search + filters */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-card shrink-0">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input placeholder="Search menu items…" className="pl-8 h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setVegOnly(v => !v)}
            className={cn("shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              vegOnly ? "bg-green-600 text-white border-green-600" : "border-border text-muted-foreground hover:bg-muted")}>
            🌿 Veg
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-border bg-card shrink-0">
          {categoryNames.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={cn("shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                category === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
              {cat}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {filtered.map(item => {
              const inCart = cart.find(c => c.id === item.id)
              return (
                <button key={item.id} onClick={() => addToCart(item)}
                  className={cn("relative flex flex-col items-start rounded-xl border overflow-hidden text-left transition-all hover:shadow-md",
                    inCart ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40")}>
                  {/* Image */}
                  {item.image ? (
                    <div className="w-full h-24 bg-muted overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-muted/50 flex items-center justify-center shrink-0">
                      <span className="text-2xl opacity-30">🍽️</span>
                    </div>
                  )}
                  <div className="p-2.5 w-full">
                    <div className="flex items-center gap-1 mb-1">
                      <span className={cn("size-2.5 rounded-sm border-2 shrink-0",
                        item.is_veg ? "border-green-600 bg-green-600" : "border-red-500 bg-red-500")} />
                      <p className="text-xs font-semibold leading-tight line-clamp-2">{item.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.category?.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-bold text-primary">₹{Number(item.price).toFixed(2)}</p>
                      {item.is_instant && (
                        <span className="text-xs px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium">⚡</span>
                      )}
                    </div>
                  </div>
                  {inCart && (
                    <span className="absolute top-2 right-2 size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shadow">
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

      {/* RIGHT: Order panel */}
      <div className="flex flex-col w-80 xl:w-96 shrink-0 bg-card">
        {/* Order meta */}
        <div className="px-3 py-2.5 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{orderLabel}</span>
            <span className="text-xs text-muted-foreground">{cart.length} item(s)</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {isDineIn && (
              <button onClick={() => setShowAssignTable(true)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs hover:bg-muted transition-colors">
                <Table2 className="size-3.5 text-muted-foreground" />
                <span className="truncate">
                  {mergedTables.length > 0 && tableName
                    ? `${tableName} +${mergedTables.length}`
                    : tableName || "Assign Table"}
                </span>
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
            {isDineIn && (
              <button onClick={() => setShowMergeTables(true)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition-colors",
                  mergedTables.length > 0
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted text-muted-foreground"
                )}>
                <GitMerge className="size-3.5 shrink-0" />
                <span className="truncate">
                  {mergedTables.length > 0
                    ? `+${mergedTables.length} merged`
                    : "Merge Tables"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <ShoppingCart className="size-10 opacity-20" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs">Tap items from the menu to add</p>
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

        {/* Totals + actions */}
        {cart.length > 0 && (
          <div className="border-t border-border px-3 py-2.5 space-y-2">
            {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-2 py-1.5">{error}</p>}

            {/* Add Discount toggle */}
            <button
              onClick={() => { setShowDiscount(v => !v); if (showDiscount) setDiscount("") }}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors w-full",
                showDiscount
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}>
              <Tag className="size-3.5" />
              {showDiscount ? "Remove Discount" : "Add Discount"}
            </button>

            {showDiscount && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground flex-1">Discount (₹)</span>
                <Input className="h-7 w-20 text-xs text-right" placeholder="0.00" value={discount} onChange={e => setDiscount(e.target.value)} />
              </div>
            )}

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              {discountAmt > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{discountAmt.toFixed(2)}</span></div>}
              <div className="flex justify-between text-muted-foreground"><span>Tax (5%)</span><span>₹{taxAmt.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-border"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
            </div>

            {/* Row 1: Clear | KOT | Pay */}
            <div className="grid grid-cols-3 gap-1.5">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={resetOrder}>
                Clear
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                onClick={handleSendKot} disabled={isProcessing}>
                {createOrder.isPending && !createPayment.isPending ? <Loader2 className="size-3 animate-spin" /> : "KOT"}
              </Button>
              <Button size="sm" className="h-8 text-xs" onClick={() => setShowPayment(true)} disabled={isProcessing}>
                Pay
              </Button>
            </div>

            {/* Row 2: KOT & Print KOT | Bill & Print | Payment */}
            <div className="grid grid-cols-3 gap-1.5">
              <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                onClick={handleSendKotAndPrint} disabled={isProcessing}>
                <Printer className="size-3 shrink-0" />
                KOT &amp; Print
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1"
                onClick={handleBillAndPrint} disabled={isProcessing}>
                <FileText className="size-3 shrink-0" />
                Bill &amp; Print
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1 border-green-300 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                onClick={() => setShowBillPayment(true)} disabled={isProcessing}>
                <CreditCard className="size-3 shrink-0" />
                Payment
              </Button>
            </div>

            {/* Row 3: Bill | Bill & Payment | Bill & Print */}
            <div className="grid grid-cols-3 gap-1.5">
              <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1"
                onClick={handleBill} disabled={isProcessing}>
                <Receipt className="size-3 shrink-0" />
                Bill
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1 border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                onClick={() => setShowBillPayment(true)} disabled={isProcessing}>
                <CreditCard className="size-3 shrink-0" />
                Bill &amp; Pay
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1"
                onClick={handleBillAndPrint} disabled={isProcessing}>
                <Printer className="size-3 shrink-0" />
                Bill &amp; Print
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
