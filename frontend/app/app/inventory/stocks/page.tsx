"use client"

import { useState } from "react"
import { Plus, Search, ChevronLeft, ChevronRight, Download, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useInventoryStocks, useInventoryItems, useCreateInventoryMovement } from "@/hooks/useApi"
import type { InventoryStock } from "@/lib/types"

const STATUSES = ["All Status", "In Stock", "Low Stock", "Out of Stock"]
const PAGE_SIZE = 10

const STATUS_COLORS: Record<string, string> = {
  "In Stock":     "bg-green-100 text-green-700",
  "Low Stock":    "bg-amber-100 text-amber-700",
  "Out of Stock": "bg-red-100 text-red-700",
}

function getStatus(stock: InventoryStock): string {
  const qty = stock.quantity
  const threshold = stock.item?.reorder_level ?? 0
  if (qty <= 0) return "Out of Stock"
  if (qty <= threshold) return "Low Stock"
  return "In Stock"
}

function AddStockModal({ onClose }: { onClose: () => void }) {
  const { data: itemsData } = useInventoryItems()
  const createMovement = useCreateInventoryMovement()
  const items = itemsData?.data ?? []

  const [txType, setTxType] = useState<"purchase" | "sale" | "adjustment" | "waste">("purchase")
  const [form, setForm] = useState({ item_id: "", quantity: "", cost_price: "", notes: "" })
  const [error, setError] = useState("")

  function set(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.item_id || !form.quantity) return
    setError("")
    try {
      await createMovement.mutateAsync({
        item_id: Number(form.item_id),
        type: txType,
        quantity: Number(form.quantity),
        cost_price: form.cost_price ? Number(form.cost_price) : undefined,
        notes: form.notes || undefined,
      })
      onClose()
    } catch {
      setError("Failed to save.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">Add Stock Entry</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Enter the details to add new stock to inventory</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="space-y-4 px-5 py-5 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <Label>Transaction Type</Label>
            <div className="flex flex-wrap gap-2">
              {(["purchase", "sale", "adjustment", "waste"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTxType(t)}
                  className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                    txType === t ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted")}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Item Name</Label>
            <Select value={form.item_id || undefined} onValueChange={(v) => v && set("item_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select Item" /></SelectTrigger>
              <SelectContent>{items.map((i) => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input placeholder="0.000" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit Purchase Price</Label>
              <Input placeholder="0.00" value={form.cost_price} onChange={(e) => set("cost_price", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input placeholder="Optional notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!form.item_id || !form.quantity || createMovement.isPending}>
            {createMovement.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function StocksPage() {
  const { data: stocks = [], isLoading } = useInventoryStocks()

  const [query, setQuery]         = useState("")
  const [status, setStatus]       = useState("All Status")
  const [page, setPage]           = useState(1)
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = stocks.filter((i) => {
    const matchQ = (i.item?.name ?? "").toLowerCase().includes(query.toLowerCase())
    const matchS = status === "All Status" || getStatus(i) === status
    return matchQ && matchS
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const available  = stocks.filter((i) => getStatus(i) === "In Stock").length
  const lowStock   = stocks.filter((i) => getStatus(i) === "Low Stock").length
  const outOfStock = stocks.filter((i) => getStatus(i) === "Out of Stock").length

  return (
    <>
      {modalOpen && <AddStockModal onClose={() => setModalOpen(false)} />}

      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Stock Inventory</h1>
            <p className="text-sm text-muted-foreground">Manage and monitor your restaurant's inventory items</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 h-8"><Download className="size-3.5" /> Export to Excel</Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-8"><RefreshCw className="size-3.5" /> Sync Stock</Button>
            <Button size="sm" className="gap-1.5 h-8" onClick={() => setModalOpen(true)}><Plus className="size-3.5" /> Add Stock Entry</Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Available Items",  value: available,  color: "text-green-600" },
            { label: "Low Stock Items",  value: lowStock,   color: "text-amber-600" },
            { label: "Out of Stock",     value: outOfStock, color: "text-red-600"   },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn("text-2xl font-bold", color)}>{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search items..." className="pl-8 h-8 w-52"
              value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} />
          </div>
          <div className="flex gap-1.5">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => { setStatus(s); setPage(1) }}
                className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  status === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Item Name", "Category", "Current Stock", "Reorder Level", "Stock Status"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="py-16 text-center text-sm text-muted-foreground">Loading...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-sm text-muted-foreground">No items found.</td></tr>
              ) : paged.map((item) => {
                const st = getStatus(item)
                return (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{item.item?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.item?.category?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">{item.quantity} {item.item?.unit?.abbreviation ?? ""}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.item?.reorder_level ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[st])}>{st}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} To {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} results</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" className="size-7" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-3.5" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button key={p} variant={p === page ? "default" : "outline"} size="icon-sm" className="size-7 text-xs" onClick={() => setPage(p)}>{p}</Button>
            ))}
            <Button variant="outline" size="icon-sm" className="size-7" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
