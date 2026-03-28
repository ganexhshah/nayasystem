"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Plus, Minus, Trash2, X, ShoppingCart, StickyNote, Table2, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMenuItems, useMenuCategories, useTableAreas, useTables, useCreateOrder } from "@/hooks/useApi"
import type { MenuItem } from "@/lib/types"

interface CartItem { id: number; name: string; price: number; veg: boolean; qty: number; note: string }

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
  current: number | null; onSelect: (id: number, name: string) => void; onClose: () => void
}) {
  const { data: areas = [] } = useTableAreas()
  const { data: tables = [] } = useTables()
  const [selected, setSelected] = useState<number | null>(current)
  return (
    <Modal title="Assign Table" onClose={onClose}
      footer={<>
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        <Button size="sm" onClick={() => {
          if (selected) { const t = tables.find(x => x.id === selected); if (t) onSelect(t.id, t.name) }
          onClose()
        }}>Assign</Button>
      </>}>
      {areas.map(area => {
        const areaTables = tables.filter(t => t.area_id === area.id)
        return (
          <div key={area.id} className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">{area.name}</p>
            <div className="grid grid-cols-3 gap-2">
              {areaTables.map(t => (
                <button key={t.id} onClick={() => setSelected(t.id)}
                  className={cn("rounded-lg border-2 p-2.5 text-left transition-all",
                    selected === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                  <p className="text-xs font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.capacity} seats</p>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </Modal>
  )
}

export default function WaiterNewOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { data: menuItemsData } = useMenuItems()
  const { data: categories = [] } = useMenuCategories()
  const menuItems = menuItemsData?.data ?? []

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [vegOnly, setVegOnly] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [tableId, setTableId] = useState<number | null>(null)
  const [tableName, setTableName] = useState("")
  const [orderNote, setOrderNote] = useState("")
  const [showTable, setShowTable] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [noteItem, setNoteItem] = useState<CartItem | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const tid = searchParams.get("table_id")
    const tname = searchParams.get("table_name")
    if (tid) setTableId(Number(tid))
    if (tname) setTableName(tname)
  }, [searchParams])

  const createOrder = useCreateOrder()
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

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0)
  const taxAmt = subtotal * TAX_RATE
  const total = subtotal + taxAmt

  async function handleSendKot() {
    if (!cart.length) return
    setError("")
    try {
      const order = await createOrder.mutateAsync({
        order_type: "dine_in",
        table_id: tableId ?? undefined,
        notes: orderNote || undefined,
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.qty, notes: c.note || undefined })),
      })
      router.push(`/waiter/order/${order.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to place order")
    }
  }

  return (
    <div className="flex h-[calc(100vh-57px)] -m-5 overflow-hidden">
      {showTable && (
        <AssignTableModal current={tableId}
          onSelect={(id, name) => { setTableId(id); setTableName(name) }}
          onClose={() => setShowTable(false)} />
      )}
      {noteItem && (
        <Modal title="Item Note" onClose={() => setNoteItem(null)}
          footer={<Button size="sm" onClick={() => setNoteItem(null)}>Save</Button>}>
          <textarea rows={3} value={noteItem.note}
            onChange={e => { setCart(p => p.map(c => c.id === noteItem.id ? { ...c, note: e.target.value } : c)); setNoteItem({ ...noteItem, note: e.target.value }) }}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none" autoFocus />
        </Modal>
      )}
      {showNote && (
        <Modal title="Order Note" onClose={() => setShowNote(false)}
          footer={<Button size="sm" onClick={() => setShowNote(false)}>Save</Button>}>
          <textarea rows={3} value={orderNote} onChange={e => setOrderNote(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none" autoFocus />
        </Modal>
      )}

      {/* LEFT: Menu */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-border">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-card shrink-0">
          <button onClick={() => router.push("/waiter/tables")} className="text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input placeholder="Search items…" className="pl-8 h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {filtered.map(item => {
              const inCart = cart.find(c => c.id === item.id)
              return (
                <button key={item.id} onClick={() => addToCart(item)}
                  className={cn("relative flex flex-col items-start rounded-xl border overflow-hidden text-left transition-all hover:shadow-md",
                    inCart ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40")}>
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
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className={cn("size-2 rounded-sm border shrink-0",
                        item.is_veg ? "border-green-600 bg-green-600" : "border-red-500 bg-red-500")} />
                      <p className="text-xs font-semibold leading-tight line-clamp-2">{item.name}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">₹{Number(item.price).toFixed(0)}</p>
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
              <div className="col-span-full py-16 text-center text-sm text-muted-foreground">No items found</div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="flex flex-col w-72 xl:w-80 shrink-0 bg-card">
        <div className="px-3 py-2.5 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order</span>
            <span className="text-xs text-muted-foreground">{cart.length} item(s)</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => setShowTable(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs hover:bg-muted transition-colors">
              <Table2 className="size-3.5 text-muted-foreground" />
              <span className="truncate">{tableName || "Assign Table"}</span>
            </button>
            <button onClick={() => setShowNote(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs hover:bg-muted transition-colors">
              <StickyNote className="size-3.5 text-muted-foreground" />
              {orderNote ? "Edit Note" : "Add Note"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <ShoppingCart className="size-10 opacity-20" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="rounded-lg border border-border bg-background p-2 space-y-1.5">
              <div className="grid grid-cols-[1fr_56px_56px_24px] gap-1 items-center">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={cn("size-2 rounded-sm border shrink-0",
                    item.veg ? "border-green-600 bg-green-600" : "border-red-500 bg-red-500")} />
                  <span className="text-xs font-medium truncate">{item.name}</span>
                </div>
                <div className="flex items-center justify-center gap-0.5">
                  <button onClick={() => updateQty(item.id, -1)} className="size-5 rounded border border-border flex items-center justify-center hover:bg-muted">
                    <Minus className="size-2.5" />
                  </button>
                  <span className="w-4 text-center text-xs font-semibold">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="size-5 rounded border border-border flex items-center justify-center hover:bg-muted">
                    <Plus className="size-2.5" />
                  </button>
                </div>
                <span className="text-xs font-semibold text-right">₹{(item.price * item.qty).toFixed(0)}</span>
                <button onClick={() => setCart(p => p.filter(c => c.id !== item.id))} className="text-muted-foreground hover:text-destructive flex justify-center">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <button onClick={() => setNoteItem(item)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground pl-3.5">
                <StickyNote className="size-3" />
                {item.note ? <span className="truncate max-w-[140px] text-foreground">{item.note}</span> : "Add Note"}
              </button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-border px-3 py-2.5 space-y-2">
            {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-2 py-1.5">{error}</p>}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Tax (5%)</span><span>₹{taxAmt.toFixed(0)}</span></div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-border"><span>Total</span><span>₹{total.toFixed(0)}</span></div>
            </div>
            <Button className="w-full h-9 text-sm" onClick={handleSendKot} disabled={createOrder.isPending}>
              {createOrder.isPending ? "Sending…" : "Send KOT"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
