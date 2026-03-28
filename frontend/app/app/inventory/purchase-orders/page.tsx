"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { usePurchaseOrders, useCreatePurchaseOrder, useSuppliers, useInventoryItems } from "@/hooks/useApi"
import type { PurchaseOrder } from "@/lib/types"

const STATUS_FILTERS = ["All Status", "draft", "ordered", "partial", "received", "cancelled"]

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  ordered:   "bg-blue-100 text-blue-700",
  received:  "bg-green-100 text-green-700",
  partial:   "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
}

interface POItem { item_id: string; quantity: string; unit_price: string }

function CreatePOModal({ onClose }: { onClose: () => void }) {
  const { data: suppliers = [] } = useSuppliers()
  const { data: itemsData } = useInventoryItems()
  const createPO = useCreatePurchaseOrder()
  const items = itemsData?.data ?? []

  const [supplier_id, setSupplier] = useState("")
  const [expected_at, setExpected] = useState("")
  const [notes, setNotes]          = useState("")
  const [poItems, setPoItems]      = useState<POItem[]>([{ item_id: "", quantity: "", unit_price: "" }])
  const [error, setError]          = useState("")

  function setItem(i: number, k: keyof POItem, v: string) { setPoItems((p) => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r)) }
  function addItem()    { setPoItems((p) => [...p, { item_id: "", quantity: "", unit_price: "" }]) }
  function removeItem(i: number) { setPoItems((p) => p.filter((_, idx) => idx !== i)) }

  async function handleSave() {
    if (!supplier_id) return
    setError("")
    try {
      await createPO.mutateAsync({
        supplier_id: Number(supplier_id),
        expected_at: expected_at || undefined,
        notes: notes || undefined,
        items: poItems.filter((i) => i.item_id && i.quantity).map((i) => ({
          item_id: Number(i.item_id),
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price) || 0,
        })),
      })
      onClose()
    } catch {
      setError("Failed to create purchase order.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">Create Purchase Order</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="space-y-4 px-5 py-5 max-h-[75vh] overflow-y-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Supplier</Label>
              <Select value={supplier_id || undefined} onValueChange={(v) => v && setSupplier(v)}>
                <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Expected Delivery Date</Label>
              <Input type="date" value={expected_at} onChange={(e) => setExpected(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addItem}>
                <Plus className="size-3" /> Add Item
              </Button>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Item Name", "Quantity", "Unit Price", "Action"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {poItems.map((row, i) => (
                    <tr key={i}>
                      <td className="px-2 py-2">
                        <Select value={row.item_id || undefined} onValueChange={(v) => v && setItem(i, "item_id", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select an item..." /></SelectTrigger>
                          <SelectContent>{items.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-2"><Input className="h-8 text-xs" placeholder="0" value={row.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} /></td>
                      <td className="px-2 py-2"><Input className="h-8 text-xs" placeholder="0.00" value={row.unit_price} onChange={(e) => setItem(i, "unit_price", e.target.value)} /></td>
                      <td className="px-2 py-2">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={() => removeItem(i)}>Remove</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <textarea rows={3} placeholder="Optional notes..." value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          <Button size="sm" onClick={handleSave} disabled={!supplier_id || createPO.isPending}>
            {createPO.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function PurchaseOrdersPage() {
  const { data: ordersData, isLoading } = usePurchaseOrders()
  const orders = ordersData?.data ?? []

  const [supplierFilter, setSupF] = useState("All Suppliers")
  const [statusFilter, setStatF]  = useState("All Status")
  const [open, setOpen]           = useState(false)

  const { data: suppliers = [] } = useSuppliers()

  const filtered = orders.filter((o) => {
    const matchSup = supplierFilter === "All Suppliers" || String(o.supplier_id) === supplierFilter
    const matchSt  = statusFilter   === "All Status"   || o.status === statusFilter
    return matchSup && matchSt
  })

  const total     = orders.length
  const pending   = orders.filter((o) => o.status === "draft" || o.status === "ordered").length
  const completed = orders.filter((o) => o.status === "received").length

  return (
    <>
      {open && <CreatePOModal onClose={() => setOpen(false)} />}
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-semibold">Purchase Orders</h1>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Total Orders",     value: total     },
            { label: "Pending Orders",   value: pending   },
            { label: "Completed Orders", value: completed },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["All Suppliers", ...suppliers.map((s) => s.name)].map((s) => (
            <button key={s} onClick={() => setSupF(s)}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                supplierFilter === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
              {s}
            </button>
          ))}
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatF(s)}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize",
                statusFilter === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
              {s}
            </button>
          ))}
          <button onClick={() => { setSupF("All Suppliers"); setStatF("All Status") }}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted">
            Clear Filters
          </button>
          <Button size="sm" className="gap-1.5 h-8 ml-auto" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> Create Purchase Order
          </Button>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {["PO Number", "Supplier", "Expected Delivery", "Status", "Total", "Actions"].map((h) => (
                  <TableHead key={h} className="text-xs uppercase tracking-wide font-medium">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="py-16 text-center text-sm text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-16 text-center text-sm text-muted-foreground">No purchase orders found</TableCell></TableRow>
              ) : filtered.map((o) => (
                <TableRow key={o.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium text-sm">{o.po_number}</TableCell>
                  <TableCell>{o.supplier?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{o.expected_at || "—"}</TableCell>
                  <TableCell>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", STATUS_COLORS[o.status] ?? "bg-muted text-muted-foreground")}>{o.status}</span>
                  </TableCell>
                  <TableCell>{o.total}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="h-7 text-xs">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}
