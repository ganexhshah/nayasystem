"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, Printer, ArrowLeft, CreditCard, Banknote, Smartphone, Wallet, QrCode } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CartItem, PAYMENT_METHODS } from "../../data"
import { useSettings } from "@/hooks/useApi"

const PAYMENT_ICONS: Record<string, React.ElementType> = {
  Cash: Banknote, Card: CreditCard, UPI: Smartphone, Wallet: Wallet,
}

// QR-based payment method keys
const QR_METHOD_KEYS = ["esewa", "khalti", "bank", "fonepay"] as const
type QrMethodKey = typeof QR_METHOD_KEYS[number]

const QR_METHOD_LABELS: Record<QrMethodKey, string> = {
  esewa: "eSewa", khalti: "Khalti", bank: "Bank Transfer", fonepay: "FonePay",
}

const QR_METHOD_COLORS: Record<QrMethodKey, string> = {
  esewa: "bg-green-500", khalti: "bg-purple-500", bank: "bg-blue-500", fonepay: "bg-orange-500",
}

export default function CheckoutPage() {
  const { orderType } = useParams<{ orderType: string }>()
  const router        = useRouter()
  const params        = useSearchParams()

  const cart: CartItem[]  = JSON.parse(params.get("cart") ?? "[]")
  const subtotal          = parseFloat(params.get("subtotal") ?? "0")
  const discount          = parseFloat(params.get("discount") ?? "0")
  const tax               = parseFloat(params.get("tax") ?? "0")
  const total             = parseFloat(params.get("total") ?? "0")
  const table             = params.get("table") ?? ""
  const customer          = params.get("customer") ?? ""
  const orderLabel        = params.get("orderType") ?? ""

  const { data: settings } = useSettings()
  const s = (settings?.settings ?? {}) as Record<string, unknown>
  const paymentMethods = (s.payment_methods ?? {}) as Record<QrMethodKey, { enabled: boolean; qr_image?: string; account_name?: string; account_number?: string; instructions?: string }>

  // Build dynamic payment method list: standard + enabled QR methods
  const enabledQrMethods = QR_METHOD_KEYS.filter(k => paymentMethods[k]?.enabled)
  const allMethods = [...PAYMENT_METHODS, ...enabledQrMethods.map(k => QR_METHOD_LABELS[k])]

  const [payMethod, setPayMethod]   = useState("Cash")
  const [amountPaid, setAmountPaid] = useState(total.toFixed(2))
  const [placed, setPlaced]         = useState(false)
  const [orderId]                   = useState(() => Math.floor(Math.random() * 9000) + 1000)

  useEffect(() => { setAmountPaid(total.toFixed(2)) }, [total])

  const change = Math.max(0, parseFloat(amountPaid) - total)

  // Find QR config for selected method
  const selectedQrKey = QR_METHOD_KEYS.find(k => QR_METHOD_LABELS[k] === payMethod)
  const selectedQrConfig = selectedQrKey ? paymentMethods[selectedQrKey] : null

  function placeOrder() { setPlaced(true) }

  if (placed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="flex justify-center">
            <CheckCircle2 className="size-16 text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Order Placed!</h2>
            <p className="text-muted-foreground text-sm mt-1">Order #{orderId} has been created successfully</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Order Type</span><span>{orderLabel}</span></div>
            {table && <div className="flex justify-between"><span className="text-muted-foreground">Table</span><span>{table}</span></div>}
            {customer && <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{customer}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{payMethod}</span></div>
            <div className="flex justify-between font-bold border-t border-border pt-2">
              <span>Total Paid</span><span>₹{total.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={() => window.print()}>
              <Printer className="size-4" /> Print Receipt
            </Button>
            <Button className="flex-1" onClick={() => router.push("/app/pos")}>
              New Order
            </Button>
          </div>
          <button onClick={() => router.push("/app/orders/list")}
            className="text-xs text-muted-foreground hover:text-foreground underline">
            View all orders
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold">Checkout</h1>
          <p className="text-sm text-muted-foreground">{orderLabel}{table ? ` · ${table}` : ""}{customer ? ` · ${customer}` : ""}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: order summary */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <p className="text-sm font-semibold">Order Summary</p>
            </div>
            <div className="divide-y divide-border">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={cn("size-2.5 rounded-sm border shrink-0",
                    item.veg ? "border-green-600 bg-green-600" : "border-red-500 bg-red-500")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.note && <p className="text-xs text-muted-foreground">Note: {item.note}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">x{item.qty}</span>
                  <span className="text-sm font-semibold w-20 text-right">₹{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span><span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (5%)</span><span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>Total</span><span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: payment */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <p className="text-sm font-semibold">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              {allMethods.map((method) => {
                const Icon = PAYMENT_ICONS[method] ?? QrCode
                const qrKey = QR_METHOD_KEYS.find(k => QR_METHOD_LABELS[k] === method)
                return (
                  <button key={method} onClick={() => setPayMethod(method)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all",
                      payMethod === method
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40 hover:bg-muted/40"
                    )}>
                    {qrKey ? (
                      <span className={cn("size-3 rounded-full shrink-0", QR_METHOD_COLORS[qrKey])} />
                    ) : (
                      <Icon className="size-4" />
                    )}
                    {method}
                  </button>
                )
              })}
            </div>

            {payMethod === "Cash" && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Amount Received (₹)</label>
                  <Input className="h-9 text-sm" value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)} />
                </div>
                {change > 0 && (
                  <div className="flex justify-between rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm">
                    <span className="text-green-700 dark:text-green-400 font-medium">Change</span>
                    <span className="text-green-700 dark:text-green-400 font-bold">₹{change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {payMethod === "UPI" && (
              <div className="rounded-lg border border-border p-4 text-center space-y-2">
                <div className="size-24 mx-auto bg-muted rounded-lg flex items-center justify-center">
                  <Smartphone className="size-8 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Scan QR code to pay ₹{total.toFixed(2)}</p>
              </div>
            )}

            {selectedQrConfig && (
              <div className="rounded-lg border border-border p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scan to Pay</p>
                {selectedQrConfig.qr_image ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={selectedQrConfig.qr_image}
                      alt={`${payMethod} QR`}
                      className="max-h-48 rounded-xl border border-border object-contain bg-white p-2"
                    />
                    <div className="text-center space-y-0.5">
                      {selectedQrConfig.account_name && (
                        <p className="text-sm font-semibold">{selectedQrConfig.account_name}</p>
                      )}
                      {selectedQrConfig.account_number && (
                        <p className="text-xs text-muted-foreground">{selectedQrConfig.account_number}</p>
                      )}
                      {selectedQrConfig.instructions && (
                        <p className="text-xs text-muted-foreground italic">{selectedQrConfig.instructions}</p>
                      )}
                    </div>
                    <div className="w-full rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-center">
                      <p className="text-sm font-bold text-primary">Pay ₹{total.toFixed(2)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <QrCode className="size-10 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">QR code not configured yet</p>
                    <p className="text-xs text-muted-foreground/60">Go to Settings → Payment to add QR</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Order Type</span><Badge variant="outline">{orderLabel}</Badge></div>
            {table    && <div className="flex justify-between text-muted-foreground"><span>Table</span><span>{table}</span></div>}
            {customer && <div className="flex justify-between text-muted-foreground"><span>Customer</span><span>{customer}</span></div>}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
              <span>Amount Due</span><span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <Button className="w-full h-11 text-sm font-semibold" onClick={placeOrder}>
            Place Order · ₹{total.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  )
}
