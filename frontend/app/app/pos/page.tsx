"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bike, UtensilsCrossed, ShoppingBag, LayoutDashboard, ClipboardList, Star, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

type OrderType = "delivery" | "dine-in" | "pickup"

const ORDER_TYPES: { type: OrderType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: "delivery", label: "Delivery",  icon: Bike,            desc: "Order delivered to customer's address" },
  { type: "dine-in",  label: "Dine In",   icon: UtensilsCrossed, desc: "Customer dining at the restaurant"    },
  { type: "pickup",   label: "Pickup",    icon: ShoppingBag,     desc: "Customer picks up from the counter"   },
]

const STORAGE_KEY = "pos_default_order_type"

export default function PosPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<OrderType | null>(null)
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as OrderType | null
    if (saved && ORDER_TYPES.some((o) => o.type === saved)) {
      setRedirected(true)
      router.replace(`/app/pos/${saved}`)
    }
  }, [router])

  function proceed() {
    if (!selected) return
    if (setAsDefault) {
      localStorage.setItem(STORAGE_KEY, selected)
    }
    router.push(`/app/pos/${selected}`)
  }

  function clearDefault() {
    localStorage.removeItem(STORAGE_KEY)
  }

  // Don't flash the selection screen if we're about to redirect
  if (redirected) return null

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Select Order Type</h1>
          <p className="text-sm text-muted-foreground">Choose your order type to proceed</p>
        </div>

        <div className="flex gap-2 justify-center">
          <Link href="/app/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
            <LayoutDashboard className="size-3.5" /> Dashboard
          </Link>
          <Link href="/app/orders/list" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
            <ClipboardList className="size-3.5" /> Orders
          </Link>
        </div>

        <div className="grid gap-3">
          {ORDER_TYPES.map(({ type, label, icon: Icon, desc }) => (
            <button key={type} onClick={() => setSelected(type)}
              className={cn(
                "flex items-center gap-4 w-full rounded-xl border-2 px-5 py-4 text-left transition-all",
                selected === type
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
              )}>
              <div className={cn("rounded-xl p-3 shrink-0",
                selected === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                <Icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-sm", selected === type && "text-primary")}>{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              {selected === type && (
                <div className="size-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <div className="size-2 rounded-full bg-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer px-1">
          <input type="checkbox" checked={setAsDefault} onChange={(e) => setSetAsDefault(e.target.checked)} className="rounded border-input size-4" />
          <div className="flex items-center gap-1.5">
            <Star className="size-3.5 text-amber-500" />
            <span className="text-sm">Set as default — skip this screen next time</span>
          </div>
        </label>

        <button onClick={proceed} disabled={!selected}
          className={cn("w-full py-3 rounded-xl font-semibold text-sm transition-all",
            selected ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed")}>
          {selected ? `Continue with ${ORDER_TYPES.find(o => o.type === selected)?.label}` : "Select an order type"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Have a default set?{" "}
          <button onClick={clearDefault} className="underline hover:text-foreground transition-colors">
            Clear it
          </button>
        </p>
      </div>
    </div>
  )
}
