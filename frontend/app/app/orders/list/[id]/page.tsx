"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Printer, IndianRupee, Clock, User, MapPin,
  UtensilsCrossed, CheckCircle2, XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useOrders, useUpdateOrderStatus } from "@/hooks/useApi"
import { useAuthStore } from "@/store/auth"
import { printReceipt } from "@/lib/printReceipt"
import type { Order } from "@/lib/types"

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-purple-100 text-purple-700 border-purple-200",
  preparing: "bg-amber-100 text-amber-700 border-amber-200",
  ready:     "bg-teal-100 text-teal-700 border-teal-200",
  served:    "bg-green-100 text-green-700 border-green-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
}

const PAYMENT_COLORS: Record<string, string> = {
  unpaid:  "bg-amber-100 text-amber-700 border-amber-200",
  partial: "bg-orange-100 text-orange-700 border-orange-200",
  paid:    "bg-green-100 text-green-700 border-green-200",
  refunded:"bg-gray-100 text-gray-700 border-gray-200",
}

const STATUS_FLOW = ["pending", "confirmed", "preparing", "ready", "served", "completed"]

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [printing, setPrinting] = useState(false)

  // Fetch all orders and find the one we need (avoids a separate endpoint)
  const { data, isLoading, refetch } = useOrders()
  const updateStatus = useUpdateOrderStatus()
  const { restaurant } = useAuthStore()

  const order: Order | undefined = data?.data?.find(o => o.id === Number(id))

  async function handlePrint() {
    if (!order) return
    setPrinting(true)
    try {
      await printReceipt(order, restaurant)
    } finally {
      setPrinting(false)
    }
  }

  function nextStatus(current: string): string | null {
    const idx = STATUS_FLOW.indexOf(current)
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <XCircle className="size-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const next = nextStatus(order.status)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{order.order_number}</h1>
            <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={handlePrint} disabled={printing}>
          <Printer className="size-4" />
          {printing ? "Generating..." : "Print Receipt"}
        </Button>
      </div>

      {/* Status + type badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("text-xs px-2.5 py-1 rounded-full border font-medium capitalize", STATUS_COLORS[order.status])}>
          {order.status}
        </span>
        <span className={cn("text-xs px-2.5 py-1 rounded-full border font-medium capitalize", PAYMENT_COLORS[order.payment_status])}>
          {order.payment_status}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground capitalize">
          {order.order_type.replace("_", " ")}
        </span>
        {order.table && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary text-primary-foreground font-medium">
            {order.table.name}
          </span>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {order.customer && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <User className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Customer</p>
              <p className="text-sm font-medium truncate">{order.customer.name}</p>
              {order.customer.phone && <p className="text-xs text-muted-foreground">{order.customer.phone}</p>}
            </div>
          </div>
        )}
        {order.delivery_address && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <MapPin className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Delivery Address</p>
              <p className="text-sm font-medium truncate">{order.delivery_address}</p>
            </div>
          </div>
        )}
        {order.notes && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:col-span-2">
            <UtensilsCrossed className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="text-sm">{order.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold">Order Items</p>
        </div>
        <div className="divide-y divide-border">
          {(order.items ?? []).map(item => (
            <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.name}</p>
                {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                <p className="text-sm font-semibold flex items-center gap-0.5 justify-end">
                  <IndianRupee className="size-3 text-muted-foreground" />
                  {(Number(item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="rounded-2xl border border-border bg-card px-4 py-4 space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="flex items-center gap-0.5"><IndianRupee className="size-3" />{Number(order.subtotal).toFixed(2)}</span>
        </div>
        {Number(order.tax) > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span className="flex items-center gap-0.5"><IndianRupee className="size-3" />{Number(order.tax).toFixed(2)}</span>
          </div>
        )}
        {Number(order.service_charge) > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Service Charge</span>
            <span className="flex items-center gap-0.5"><IndianRupee className="size-3" />{Number(order.service_charge).toFixed(2)}</span>
          </div>
        )}
        {Number(order.discount) > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Discount</span>
            <span className="flex items-center gap-0.5 text-green-600">- <IndianRupee className="size-3" />{Number(order.discount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold border-t border-border pt-2 text-base">
          <span>Total</span>
          <span className="flex items-center gap-0.5"><IndianRupee className="size-3.5" />{Number(order.total).toFixed(2)}</span>
        </div>
      </div>

      {/* Payments */}
      {(order.payments ?? []).length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Payments</p>
          </div>
          <div className="divide-y divide-border">
            {order.payments!.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium capitalize">{p.method}</p>
                  {p.paid_at && <p className="text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleString()}</p>}
                </div>
                <p className="text-sm font-semibold flex items-center gap-0.5">
                  <IndianRupee className="size-3 text-muted-foreground" />
                  {Number(p.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status actions */}
      {order.status !== "cancelled" && order.status !== "completed" && (
        <div className="flex items-center gap-2 flex-wrap pb-4">
          {next && (
            <Button
              className="gap-1.5"
              onClick={() => updateStatus.mutate({ id: order.id, status: next }, { onSuccess: () => refetch() })}
              disabled={updateStatus.isPending}
            >
              <CheckCircle2 className="size-4" />
              Mark as {next.charAt(0).toUpperCase() + next.slice(1)}
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => updateStatus.mutate({ id: order.id, status: "cancelled" }, { onSuccess: () => refetch() })}
            disabled={updateStatus.isPending}
          >
            <XCircle className="size-4" />
            Cancel Order
          </Button>
        </div>
      )}
    </div>
  )
}
