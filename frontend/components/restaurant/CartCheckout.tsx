"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Plus, Minus, Check, Clock, FileText, ChevronRight, RefreshCw, Star, User, LogIn, UtensilsCrossed } from "lucide-react"
import { getRestaurantCurrencyLabel } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { getMenuItemTypeMeta, type MenuItem, type CartItem } from "./MenuItemCard"
import { usePublicRestaurant, usePublicTables } from "@/hooks/useApi"
import { useCustomerAuth } from "@/store/customerAuth"
import { ApiError, api } from "@/lib/api"
import { useRouter } from "next/navigation"

// -- Types ---------------------------------------------------------------------

type Screen = "cart" | "table" | "order"
type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "served"
type ActiveOrderSession = {
  orderId: number
  orderNumber: string
  trackingToken: string
  tableId?: number | null
}

const ORDER_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending",   label: "Order Placed"    },
  { key: "confirmed", label: "Order Confirmed" },
  { key: "preparing", label: "Order Preparing" },
  { key: "ready",     label: "Food is Ready"   },
  { key: "served",    label: "Order Served"    },
]

const VAT = 0.13  // Nepal VAT 13%

// -- Auth Gate Modal -----------------------------------------------------------

function AuthGateModal({ slug, orderType, onGuest, onClose }: {
  slug: string; orderType: string
  onGuest: () => void; onClose: () => void
}) {
  const router = useRouter()
  const isDineIn = orderType === "dine-in"
  const redirectUrl = encodeURIComponent(`/restaurant/${slug}`)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold">Sign in to place order</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="px-5 py-5 space-y-3">
          <p className="text-xs text-muted-foreground">
            {isDineIn
              ? "Sign in to track your order history, or continue as a guest."
              : "Sign in or create an account to place your order."}
          </p>

          <button
            onClick={() => router.push(`/restaurant/${slug}/auth/login?redirect=${redirectUrl}`)}
            className="w-full flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            <LogIn className="size-4 text-primary shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-sm">Sign In</p>
              <p className="text-xs text-muted-foreground">Use your existing account</p>
            </div>
          </button>

          <button
            onClick={() => router.push(`/restaurant/${slug}/auth/signup?redirect=${redirectUrl}`)}
            className="w-full flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            <User className="size-4 text-primary shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-sm">Create Account</p>
              <p className="text-xs text-muted-foreground">New here? Sign up for free</p>
            </div>
          </button>

          {isDineIn && (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <button
                onClick={onGuest}
                className="w-full rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Continue as Guest
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// -- Tip Modal -----------------------------------------------------------------

function TipModal({ subtotal, currentTip, currency, onSave, onClose }: {
  subtotal: number; currentTip: number; currency: string
  onSave: (tip: number) => void; onClose: () => void
}) {
  const [selected, setSelected] = useState<number | "custom">(currentTip === 0 ? 0 : "custom")
  const [custom, setCustom] = useState(currentTip > 0 ? String(currentTip) : "")
  const TIPS = [5, 10, 15, 20]
  const tipAmount = selected === "custom" ? parseFloat(custom) || 0 : (subtotal * selected) / 100
  const newTotal  = subtotal * (1 + VAT) + tipAmount

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4">
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-background shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">Add Tip</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="rounded-xl bg-muted/40 px-4 py-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Current Total</span><span>{currency}{(subtotal * (1 + VAT)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tip Amount</span><span>+ {currency}{tipAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
              <span>New Total</span><span>{currency}{newTotal.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Suggested Tip</p>
            <div className="grid grid-cols-4 gap-2">
              {TIPS.map(pct => (
                <button key={pct} onClick={() => { setSelected(pct); setCustom("") }}
                  className={cn("rounded-xl border py-2.5 text-center transition-colors",
                    selected === pct ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50")}>
                  <p className="text-xs font-semibold">{pct}%</p>
                  <p className="text-[10px] opacity-70">{currency}{((subtotal * pct) / 100).toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Custom Amount</p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <span className="text-sm text-muted-foreground">{currency}</span>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={custom}
                onChange={e => { setCustom(e.target.value); setSelected("custom") }}
                className="flex-1 bg-transparent text-sm outline-none" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className="rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={() => { onSave(tipAmount); onClose() }} className="rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">Save</button>
        </div>
      </div>
    </div>
  )
}

// -- Order Tracker -------------------------------------------------------------

function RatingSection({ orderId, trackingToken, onDone }: { orderId: number; trackingToken: string; onDone: () => void }) {
  const [hovered, setHovered]   = useState(0)
  const [selected, setSelected] = useState(0)
  const [review, setReview]     = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  async function submit() {
    if (!selected) {
      setError("Please select a star rating first.")
      return
    }

    setLoading(true)
    setError("")

    try {
      await api.post(`/public-orders/${orderId}/rate`, {
        token: trackingToken,
        rating: selected,
        review: review.trim() || undefined,
      })
      setSubmitted(true)
      setTimeout(onDone, 1800)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Unable to submit your review right now.")
      } else {
        setError("Unable to submit your review right now.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-border bg-green-50 px-4 py-4 text-center space-y-1">
        <p className="text-lg">??</p>
        <p className="text-sm font-semibold text-green-700">Thanks for your feedback!</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border px-4 py-4 space-y-3">
      <p className="text-xs font-semibold">Rate Your Experience</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => {
              setSelected(star)
              setError("")
            }}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star className={cn("size-7", (hovered || selected) >= star
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/40")} />
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {selected > 0 ? `${selected} star${selected > 1 ? "s" : ""} selected.` : "Tap the stars above to choose your rating."}
      </p>
      <textarea
        rows={3}
        placeholder="Share your experience (optional)..."
        value={review}
        onChange={e => setReview(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary resize-none"
      />
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  )
}

function OrderTracker({ cart, subtotal, orderId, orderNumber, trackingToken, orderType, currency, paymentMethods, onNewOrder }: {
  cart: CartItem[]; subtotal: number; orderId: number; orderNumber: string; trackingToken: string
  orderType: string; currency: string
  paymentMethods: Array<{ key: string; label: string; qr_image?: string; account_name?: string; account_number?: string; instructions?: string }>
  onNewOrder: () => void
}) {
  const [status, setStatus]           = useState<OrderStatus>("pending")
  const [paymentStatus, setPaymentStatus] = useState<string>("unpaid")
  const [tipOpen, setTipOpen]         = useState(false)
  const [currentTip, setCurrentTip]   = useState(0)
  const [refreshing, setRefreshing]   = useState(false)
  const [ratingDone, setRatingDone]   = useState(false)
  const [selectedPayMethod, setSelectedPayMethod] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const tax        = subtotal * VAT
  const grandTotal = subtotal + tax + currentTip
  const currentIdx = ORDER_STEPS.findIndex(s => s.key === status)
  const isServed   = status === "served"

  const fetchStatus = useCallback(async (manual = false) => {
    if (!orderId) return
    if (manual) setRefreshing(true)
    try {
      const order = await api.get<{ status: string; payment_status: string; rating?: number | null }>(
        `/public-orders/${orderId}/status`,
        { token: trackingToken, t: Date.now() }
      )
      const mapped: Record<string, OrderStatus> = {
        pending: "pending", confirmed: "confirmed", preparing: "preparing",
        ready: "ready", served: "served", completed: "served",
      }
      if (order.status && mapped[order.status]) setStatus(mapped[order.status])
      if (order.payment_status) setPaymentStatus(order.payment_status)
      if (order.rating) setRatingDone(true)
      setLastUpdated(new Date())
    } catch { /* silent */ } finally {
      if (manual) setRefreshing(false)
    }
  }, [orderId, trackingToken])

  // Poll every 5s and refresh again when the tab comes back into focus.
  useEffect(() => {
    fetchStatus()

    const refetchOnFocus = () => {
      if (document.visibilityState === "visible") {
        void fetchStatus()
      }
    }

    window.addEventListener("focus", refetchOnFocus)
    window.addEventListener("online", refetchOnFocus)
    document.addEventListener("visibilitychange", refetchOnFocus)

    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchStatus()
      }
    }, 5_000)

    return () => {
      clearInterval(id)
      window.removeEventListener("focus", refetchOnFocus)
      window.removeEventListener("online", refetchOnFocus)
      document.removeEventListener("visibilitychange", refetchOnFocus)
    }
  }, [fetchStatus])

  return (
    <>
      {tipOpen && (
        <TipModal subtotal={subtotal} currentTip={currentTip} currency={currency}
          onSave={setCurrentTip} onClose={() => setTipOpen(false)} />
      )}
      <div className="flex flex-col h-full">
        {/* Status stepper */}
        <div className="px-5 py-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order Status</p>
            <p className="text-[11px] text-muted-foreground">
              {lastUpdated ? `Live sync ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Connecting..."}
            </p>
          </div>
          <div className="space-y-0">
            {ORDER_STEPS.map((step, idx) => {
              const done   = idx < currentIdx
              const active = idx === currentIdx
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500",
                      done   ? "border-primary bg-primary text-primary-foreground"
                             : active ? "border-primary bg-primary/10 text-primary animate-pulse"
                             : "border-border bg-background text-muted-foreground"
                    )}>
                      {done ? <Check className="size-3" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                    </div>
                    {idx < ORDER_STEPS.length - 1 && (
                      <div className={cn("w-0.5 h-6 transition-all duration-700", done ? "bg-primary" : "bg-border")} />
                    )}
                  </div>
                  <p className={cn("pt-0.5 text-sm transition-colors duration-300",
                    active ? "font-semibold text-foreground" : done ? "font-medium text-primary" : "text-muted-foreground")}>
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order details */}
        <div className="flex-1 overflow-y-auto border-t border-border px-5 py-4 space-y-4">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">Order Details</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
              <span>{orderNumber}</span>
              <span className="capitalize">{orderType.replace("-", " ")}</span>
              <span>{cart.reduce((s, i) => s + i.qty, 0)} Item(s)</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">{currency}{grandTotal.toFixed(2)} � Includes Taxes</p>
            {cart.some(i => i.preparation_time) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>Prep: {Math.max(...cart.map(i => i.preparation_time ?? 0))} min (Approx)</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {cart.map(item => (
              <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
                </div>
                <div className="text-right shrink-0 text-xs text-muted-foreground">
                  <p>�{item.qty}</p>
                  <p className="font-medium text-foreground">{currency}{(Number(item.price) * item.qty).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Sub Total</span><span>{currency}{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>VAT (13%)</span><span>{currency}{(subtotal * VAT).toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tip</span>
              <button onClick={() => setTipOpen(true)} className="text-primary hover:underline text-xs font-medium">
                {currentTip > 0 ? `${currency}${currentTip.toFixed(2)}` : "Add Tip"}
              </button>
            </div>
            <div className="flex justify-between font-semibold border-t border-border pt-1.5 mt-1">
              <span>Total</span><span>{currency}{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Information with refresh */}
          <div className="rounded-xl border border-border px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Payment Information</p>
              <button
                onClick={() => fetchStatus(true)}
                disabled={refreshing}
                className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                title="Refresh payment status"
              >
                <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
              </button>
            </div>
            {paymentStatus === "paid" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                <span className="size-1.5 rounded-full bg-green-500" />
                Payment Received
              </span>
            ) : (
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  Payment Pending
                </span>
                {paymentMethods.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Pay using any of the methods below:</p>
                    <div className="flex gap-2 flex-wrap">
                      {paymentMethods.map(m => (
                        <button
                          key={m.key}
                          onClick={() => setSelectedPayMethod(prev => prev === m.key ? null : m.key)}
                          className={cn(
                            "text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors capitalize",
                            selectedPayMethod === m.key
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          )}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    {selectedPayMethod && (() => {
                      const m = paymentMethods.find(x => x.key === selectedPayMethod)!
                      return (
                        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                          {m.qr_image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.qr_image} alt={`${m.label} QR`} className="w-36 h-36 object-contain mx-auto rounded-lg border border-border bg-white" />
                          )}
                          {m.account_name && (
                            <p className="text-xs text-center font-medium">{m.account_name}</p>
                          )}
                          {m.account_number && (
                            <p className="text-xs text-center text-muted-foreground font-mono">{m.account_number}</p>
                          )}
                          {m.instructions && (
                            <p className="text-xs text-center text-muted-foreground">{m.instructions}</p>
                          )}
                          {!m.qr_image && !m.account_name && !m.account_number && (
                            <p className="text-xs text-center text-muted-foreground">Pay via {m.label}</p>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rating � shown once order is served */}
          {isServed && !ratingDone && (
            <RatingSection orderId={orderId} trackingToken={trackingToken} onDone={() => setRatingDone(true)} />
          )}
        </div>

        <div className="border-t border-border px-5 py-4">
          <button onClick={onNewOrder}
            className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            New Order
          </button>
        </div>
      </div>
    </>
  )
}

// -- Table Screen --------------------------------------------------------------

function TableScreen({ slug, selectedTableId, errorMessage, onSelect, onConfirm, onBack }: {
  slug: string
  selectedTableId: number | null
  errorMessage?: string
  onSelect: (id: number) => void
  onConfirm: () => void
  onBack: () => void
}) {
  const { data: tables, isLoading } = usePublicTables(slug)
  const availableTables = tables?.filter(t => t.is_active) ?? []

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ChevronRight className="size-5 rotate-180" />
          </button>
          <h2 className="text-base font-semibold">Select Table</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Loading tables...
          </div>
        ) : availableTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
            <p className="text-sm font-medium">No tables available</p>
            <p className="text-xs text-muted-foreground">Please ask staff for assistance.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {availableTables.map(table => (
              <button
                key={table.id}
                onClick={() => onSelect(table.id)}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition-colors",
                  selectedTableId === table.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <p className="text-sm font-semibold">{table.name}</p>
                {table.area && (
                  <p className="text-xs text-muted-foreground mt-0.5">{table.area.name}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Seats {table.capacity}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border px-5 py-4 shrink-0">
        {errorMessage && (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            {errorMessage}
          </p>
        )}
        <button
          onClick={onConfirm}
          disabled={selectedTableId === null}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Confirm Table ?
        </button>
      </div>
    </div>
  )
}

// -- Cart Screen ---------------------------------------------------------------

function CartScreen({ cart, currency, orderType, errorMessage, onRequestOrderType, onAdd, onRemove, onUpdateNote, onPlaceOrder, onClose }: {
  cart: CartItem[]; currency: string
  orderType: string | null
  errorMessage?: string
  onRequestOrderType: () => void
  onAdd: (item: MenuItem) => void; onRemove: (id: number) => void
  onUpdateNote: (id: number, note: string) => void
  onPlaceOrder: () => Promise<void>; onClose: () => void
}) {
  const [noteOpen, setNoteOpen] = useState<number | null>(null)
  const [tipOpen, setTipOpen]   = useState(false)
  const [tip, setTip]           = useState(0)
  const [loading, setLoading]   = useState(false)

  const subtotal = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0)
  const tax      = subtotal * VAT
  const total    = subtotal + tax + tip

  async function handlePlace() {
    setLoading(true)
    try { await onPlaceOrder() } finally { setLoading(false) }
  }

  return (
    <>
      {tipOpen && (
        <TipModal subtotal={subtotal} currentTip={tip} currency={currency}
          onSave={setTip} onClose={() => setTipOpen(false)} />
      )}
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="space-y-2">
            <h2 className="text-base font-semibold">Your Cart</h2>
            <button
              type="button"
              onClick={onRequestOrderType}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                orderType
                  ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                  : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
              )}
            >
              <UtensilsCrossed className="size-3.5" />
              {orderType ? `Order Type: ${orderType.replace("-", " ")}` : "Select Order Type"}
            </button>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-6">
            <span className="text-5xl">??</span>
            <p className="text-sm font-medium">Your cart is empty</p>
            <p className="text-xs text-muted-foreground">Add items from the menu to get started.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {cart.map(item => (
                <div key={item.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
                      {getMenuItemTypeMeta(item).emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{currency}{Number(item.price).toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="text-sm font-semibold">{currency}{(Number(item.price) * item.qty).toFixed(2)}</p>
                      <div className="flex items-center rounded-lg border border-primary overflow-hidden">
                        <button onClick={() => onRemove(item.id)} className="px-2 py-1 text-primary hover:bg-primary/10"><Minus className="size-3" /></button>
                        <span className="min-w-[1.25rem] text-center text-xs font-semibold text-primary">{item.qty}</span>
                        <button onClick={() => onAdd(item)} className="px-2 py-1 text-primary hover:bg-primary/10"><Plus className="size-3" /></button>
                      </div>
                    </div>
                  </div>
                  {noteOpen === item.id ? (
                    <div className="flex gap-2">
                      <input autoFocus placeholder="Add a note for this item..." defaultValue={item.note ?? ""}
                        onBlur={e => { onUpdateNote(item.id, e.target.value); setNoteOpen(null) }}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary" />
                    </div>
                  ) : (
                    <button onClick={() => setNoteOpen(item.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <FileText className="size-3" />
                      {item.note ? item.note : "Add Note"}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-border px-5 py-4 space-y-3 bg-card shrink-0">
              {errorMessage && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 space-y-2">
                  <p>{errorMessage}</p>
                  {!orderType && (
                    <button
                      type="button"
                      onClick={onRequestOrderType}
                      className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
                    >
                      <UtensilsCrossed className="size-3.5" />
                      Select Order Type
                    </button>
                  )}
                </div>
              )}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Sub Total</span><span>{currency}{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>VAT (13%)</span><span>{currency}{(subtotal * VAT).toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tip</span>
                  <button onClick={() => setTipOpen(true)} className="text-primary hover:underline text-xs font-medium">
                    {tip > 0 ? `${currency}${tip.toFixed(2)}` : "Add Tip"}
                  </button>
                </div>
                <div className="flex justify-between font-bold border-t border-border pt-2">
                  <span>Total</span><span>{currency}{total.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={handlePlace} disabled={loading}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60">
                {loading ? "Placing..." : `Place Order ${currency}${total.toFixed(2)} ?`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// -- Main Export ---------------------------------------------------------------

export function CartCheckout({ cart, orderType, slug, initialOrderSession, onAdd, onRemove, onUpdateNote, onClose, onReset, onPlaceOrder, onRequestOrderType }: {
  cart: CartItem[]; orderType: string | null; slug: string
  initialOrderSession?: ActiveOrderSession | null
  onAdd: (item: MenuItem) => void; onRemove: (id: number) => void
  onUpdateNote: (id: number, note: string) => void
  onClose: () => void; onReset: () => void
  onPlaceOrder?: (tableId?: number) => Promise<{ id: number; order_number: string; tracking_token: string }>
  onRequestOrderType: () => void
}) {
  const [screen, setScreen]           = useState<Screen>(initialOrderSession ? "order" : "cart")
  const [orderId, setOrderId]         = useState(initialOrderSession?.orderId ?? 0)
  const [orderNumber, setOrderNumber] = useState(initialOrderSession?.orderNumber ?? "")
  const [trackingToken, setTrackingToken] = useState(initialOrderSession?.trackingToken ?? "")
  const [tableId, setTableId]         = useState<number | null>(initialOrderSession?.tableId ?? null)
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [placeOrderError, setPlaceOrderError] = useState("")
  const { data: restaurant }          = usePublicRestaurant(slug)
  const currency                      = getRestaurantCurrencyLabel(restaurant?.currency)
  const { isAuthenticated }           = useCustomerAuth()
  const resolvedOrderType             = orderType ?? "dine-in"

  useEffect(() => {
    if (!initialOrderSession) return

    setScreen("order")
    setOrderId(initialOrderSession.orderId)
    setOrderNumber(initialOrderSession.orderNumber)
    setTrackingToken(initialOrderSession.trackingToken)
    setTableId(initialOrderSession.tableId ?? null)
  }, [initialOrderSession])

  // Extract enabled payment methods from restaurant settings
  const paymentMethods = (() => {
    const methods = (restaurant?.settings as Record<string, unknown> | undefined)?.payment_methods as Record<string, { enabled?: boolean; qr_image?: string; account_name?: string; account_number?: string; instructions?: string }> | undefined
    if (!methods) return []
    const LABELS: Record<string, string> = { esewa: "eSewa", khalti: "Khalti", bank: "Bank Transfer", fonepay: "FonePay" }
    return Object.entries(methods)
      .filter(([, v]) => v?.enabled)
      .map(([key, v]) => ({ key, label: LABELS[key] ?? key, ...v }))
  })()

  const subtotal = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0)

  async function handlePlaceOrder() {
    if (!orderType) {
      setPlaceOrderError("Please select order type first.")
      onRequestOrderType()
      setScreen("cart")
      return
    }

    if (orderType === "dine-in" && tableId === null) {
      setPlaceOrderError("Please select a table first.")
      setScreen("table")
      return
    }

    setPlaceOrderError("")

    try {
      const order = await onPlaceOrder?.(tableId ?? undefined)
      if (order) {
        setOrderId(order.id)
        setOrderNumber(order.order_number)
        setTrackingToken(order.tracking_token)
      }
      setScreen("order")
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.message.includes("table id field is required")) {
          setPlaceOrderError("Please select a table first.")
          setScreen("table")
          return
        }

        setPlaceOrderError(error.message || "Unable to place your order right now.")
      } else {
        setPlaceOrderError("Unable to place your order right now.")
      }

      setScreen(orderType === "dine-in" ? "table" : "cart")
    }
  }

  // Called when user clicks "Place Order" in CartScreen
  function handleCheckoutAttempt() {
    setPlaceOrderError("")

    if (!orderType) {
      setPlaceOrderError("Please select order type first.")
      onRequestOrderType()
      return
    }

    if (isAuthenticated) {
      if (orderType === "dine-in") {
        setScreen("table")
      } else {
        void handlePlaceOrder()
      }
    } else {
      setShowAuthGate(true)
    }
  }

  // Guest path (dine-in only)
  function handleGuestContinue() {
    setShowAuthGate(false)
    setScreen("table")
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-sm flex-col bg-background shadow-2xl animate-in slide-in-from-right-4 duration-300">
        {showAuthGate && (
          <AuthGateModal
            slug={slug}
            orderType={resolvedOrderType}
            onGuest={handleGuestContinue}
            onClose={() => setShowAuthGate(false)}
          />
        )}
        {screen === "cart" ? (
          <CartScreen
            cart={cart} currency={currency} orderType={orderType}
            errorMessage={placeOrderError}
            onRequestOrderType={onRequestOrderType}
            onAdd={onAdd} onRemove={onRemove} onUpdateNote={onUpdateNote}
            onPlaceOrder={async () => handleCheckoutAttempt()}
            onClose={onClose}
          />
        ) : screen === "table" ? (
          <TableScreen
            slug={slug}
            selectedTableId={tableId}
            errorMessage={placeOrderError}
            onSelect={setTableId}
            onConfirm={handlePlaceOrder}
            onBack={() => setScreen("cart")}
          />
        ) : (
          <OrderTracker
            cart={cart} subtotal={subtotal} orderId={orderId}
            orderNumber={orderNumber || "New Order"} trackingToken={trackingToken} orderType={resolvedOrderType}
            currency={currency} paymentMethods={paymentMethods}
            onNewOrder={() => { onReset(); onClose() }}
          />
        )}
      </div>
    </div>
  )
}

