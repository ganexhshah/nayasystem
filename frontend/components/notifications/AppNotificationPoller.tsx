"use client"

import { useEffect, useRef, useCallback } from "react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { useNotifStore } from "@/store/notifications"

export function AppNotificationPoller() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { add, isSeen } = useNotifStore()
  const initialised = useRef(false)

  const poll = useCallback(async () => {
    if (!isAuthenticated) return

    // Low Stock
    try {
      const stocks = await api.get<Array<{ id: number; quantity: number; reorder_level: number; inventory_item?: { name: string } }>>(
        "/inventory/stocks"
      )
      const arr = Array.isArray(stocks) ? stocks : (stocks as { data?: unknown[] })?.data ?? []
      for (const s of arr as Array<{ id: number; quantity: number; reorder_level: number; inventory_item?: { name: string } }>) {
        if (s.reorder_level != null && s.quantity <= s.reorder_level) {
          const id = `low-stock-${s.id}`
          if (!isSeen(id)) {
            if (initialised.current) {
              add({
                id,
                category: "inventory",
                title: "Low Stock Alert",
                body: `${s.inventory_item?.name ?? "Item"} is below threshold`,
                link: "/app/inventory/stocks",
                at: Date.now(),
              })
            }
          }
        }
      }
    } catch { /* silent */ }

    // New Payments
    try {
      const res = await api.get<{ data: Array<{ id: number; order?: { order_number: string }; payment_method: string; amount: number; created_at: string }> }>(
        "/payments", { per_page: 20 } as Record<string, string | number>
      )
      const payments = res?.data ?? []
      for (const p of payments) {
        const id = `payment-${p.id}`
        if (!isSeen(id)) {
          if (initialised.current) {
            add({
              id,
              category: "payment",
              title: "Payment Received",
              body: `${p.order?.order_number ?? `Order #${p.id}`} paid via ${p.payment_method} — ₹${p.amount}`,
              link: "/app/payments/payments",
              at: Date.now(),
            })
          }
        }
      }
    } catch { /* silent */ }

    // New Reservations
    try {
      const res = await api.get<{ data: Array<{ id: number; table?: { name: string }; reservation_time: string; status: string }> }>(
        "/reservations", { per_page: 20, status: "pending" } as Record<string, string | number>
      )
      const reservations = res?.data ?? []
      for (const r of reservations) {
        const id = `reservation-${r.id}`
        if (!isSeen(id)) {
          if (initialised.current) {
            const time = r.reservation_time ? new Date(r.reservation_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""
            add({
              id,
              category: "reservation",
              title: "New Reservation",
              body: `${r.table?.name ?? "Table"} reserved${time ? ` for ${time}` : ""}`,
              link: "/app/reservations",
              at: Date.now(),
            })
          }
        }
      }
    } catch { /* silent */ }

    // New Purchase Orders
    try {
      const res = await api.get<{ data: Array<{ id: number; po_number: string; supplier?: { name: string }; status: string }> }>(
        "/inventory/purchase-orders", { per_page: 20 } as Record<string, string | number>
      )
      const pos = res?.data ?? []
      for (const po of pos) {
        const id = `po-${po.id}`
        if (!isSeen(id)) {
          if (initialised.current) {
            add({
              id,
              category: "inventory",
              title: "Purchase Order Sent",
              body: `${po.po_number} sent to ${po.supplier?.name ?? "Supplier"}`,
              link: "/app/inventory/purchase-orders",
              at: Date.now(),
            })
          }
        }
      }
    } catch { /* silent */ }

    initialised.current = true
  }, [isAuthenticated, add, isSeen])

  useEffect(() => {
    if (!isAuthenticated) return
    poll()
    const id = setInterval(poll, 30_000)
    return () => clearInterval(id)
  }, [isAuthenticated, poll])

  return null
}
