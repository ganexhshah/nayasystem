"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ShoppingBag, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, CalendarDays } from "lucide-react"
import { getRestaurantCurrencyLabel } from "@/lib/currency"
import { usePublicRestaurant } from "@/hooks/useApi"
import { useCustomerAuth } from "@/store/customerAuth"
import { cn } from "@/lib/utils"

interface OrderItem {
  id: number
  name: string
  quantity: number
  price: number
}

interface Order {
  id: number
  order_number: string
  order_type: string
  status: string
  payment_status: string
  total: number
  created_at: string
  items?: OrderItem[]
}

interface Reservation {
  id: number
  status: string
  party_size: number
  reserved_at: string
  created_at: string
  notes?: string
  special_package?: string
  package_price?: number
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-purple-100 text-purple-700",
  ready: "bg-cyan-100 text-cyan-700",
  served: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
}

const RESERVATION_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  seated: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-slate-200 text-slate-700",
}

function OrderCard({ order, currency }: { order: Order; currency: string }) {
  const [open, setOpen] = useState(false)
  const statusColor = STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{order.order_number}</p>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", statusColor)}>
              {order.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" - "}
            {order.order_type.replace("_", " ")}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <p className="text-sm font-bold">{currency}{Number(order.total).toFixed(2)}</p>
          {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </button>

      {open && order.items && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
              <span className="font-medium">{currency}{(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 pt-1">
            {order.payment_status === "paid" ? (
              <>
                <CheckCircle2 className="size-3.5 text-green-500" />
                <span className="text-xs text-green-600 font-medium">Paid</span>
              </>
            ) : (
              <>
                <Clock className="size-3.5 text-amber-500" />
                <span className="text-xs text-amber-600 font-medium">Payment Pending</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ReservationCard({ reservation, currency }: { reservation: Reservation; currency: string }) {
  const [open, setOpen] = useState(false)
  const statusColor = RESERVATION_STATUS_COLORS[reservation.status] ?? "bg-muted text-muted-foreground"

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5 text-muted-foreground" />
            <p className="text-sm font-semibold">Table Reservation</p>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", statusColor)}>
              {reservation.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(reservation.reserved_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" - "}
            {reservation.party_size} guests
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {reservation.package_price ? <p className="text-sm font-bold">{currency}{reservation.package_price}</p> : null}
          {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-4 py-3 space-y-1.5 text-sm">
          {reservation.special_package ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Package</span>
              <span className="font-medium">{reservation.special_package}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Guests</span>
            <span className="font-medium">{reservation.party_size}</span>
          </div>
          {reservation.notes ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Notes</span>
              <span className="font-medium text-right max-w-[60%]">{reservation.notes}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Booked on</span>
            <span className="font-medium">
              {new Date(reservation.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrderHistoryPage() {
  const { restaurantName } = useParams<{ restaurantName: string }>()
  const router = useRouter()
  const { customer, token, isAuthenticated } = useCustomerAuth()
  const { data: restaurant } = usePublicRestaurant(restaurantName)

  const [orders, setOrders] = useState<Order[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const currencyLabel = getRestaurantCurrencyLabel(restaurant?.currency)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/restaurant/${restaurantName}/auth/login?redirect=/restaurant/${restaurantName}/account/orders`)
      return
    }
    if (!token) return

    const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
    fetch(`${BASE}/restaurant/${restaurantName}/customer/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
      .then((r) => r.json())
      .then((d) => {
        setOrders(Array.isArray(d?.orders) ? d.orders : [])
        setReservations(Array.isArray(d?.reservations) ? d.reservations : [])
      })
      .catch(() => {
        setOrders([])
        setReservations([])
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated, token, restaurantName, router])

  const hasData = useMemo(() => orders.length > 0 || reservations.length > 0, [orders.length, reservations.length])

  if (!isAuthenticated) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShoppingBag className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Order History</h1>
          <p className="text-xs text-muted-foreground">{customer?.name}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <XCircle className="size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">No activity yet</p>
          <p className="text-xs text-muted-foreground">Your orders and reservations will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={`order-${order.id}`} order={order} currency={currencyLabel} />
          ))}
          {reservations.map((reservation) => (
            <ReservationCard key={`reservation-${reservation.id}`} reservation={reservation} currency={currencyLabel} />
          ))}
        </div>
      )}
    </div>
  )
}

