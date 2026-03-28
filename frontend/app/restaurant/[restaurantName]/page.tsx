"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { X, ChevronRight, Search, ShoppingCart } from "lucide-react"
import { getRestaurantCurrencyLabel } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { MenuItemCard, type CartItem } from "@/components/restaurant/MenuItemCard"
import { CartCheckout } from "@/components/restaurant/CartCheckout"
import { PublicRatingsSection } from "@/components/restaurant/PublicRatingsSection"
import { usePublicMenu, usePublicRestaurant, useCreatePublicOrder, useRestaurantRatings } from "@/hooks/useApi"
import { useCustomerAuth } from "@/store/customerAuth"
import type { MenuItem } from "@/lib/types"

type OrderType = "dine-in" | "delivery" | "pickup"

type ActiveOrderSession = {
  orderId: number
  orderNumber: string
  trackingToken: string
  orderType: OrderType
  tableId?: number | null
  cart: CartItem[]
}

function OrderTypeModal({ onSelect, onSkip }: { onSelect: (type: OrderType) => void; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold">Select Order Type</h2>
          <p className="text-sm text-muted-foreground">Choose your order type to proceed</p>
        </div>
        <div className="grid gap-3">
          {([
            { type: "dine-in" as OrderType, label: "Dine In", desc: "Enjoy your meal at our restaurant", emoji: "🍽️" },
            { type: "delivery" as OrderType, label: "Delivery", desc: "Get it delivered to your doorstep", emoji: "🛵" },
            { type: "pickup" as OrderType, label: "Pickup", desc: "Order ahead and pick up later", emoji: "🛍️" },
          ]).map(({ type, label, desc, emoji }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="flex items-center gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
            >
              <span className="text-2xl">{emoji}</span>
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </button>
          ))}
        </div>
        <button onClick={onSkip} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
          Skip for now
        </button>
      </div>
    </div>
  )
}

export default function RestaurantPage() {
  const { restaurantName } = useParams<{ restaurantName: string }>()
  const { data: restaurant } = usePublicRestaurant(restaurantName)
  const { data: items = [], isLoading } = usePublicMenu(restaurantName)
  const { data: ratingsData } = useRestaurantRatings(restaurantName, 6)
  const { token: customerToken } = useCustomerAuth()
  const createOrder = useCreatePublicOrder(restaurantName, customerToken)

  const [orderType, setOrderType] = useState<OrderType | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(true)
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [activeOrder, setActiveOrder] = useState<ActiveOrderSession | null>(null)

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const currencyLabel = getRestaurantCurrencyLabel(restaurant?.currency)
  const orderStorageKey = `restaurant-active-order:${restaurantName}`

  const categories = Array.from(
    new Map(items.filter((item) => item.category).map((item) => [item.category_id, item.category!])).values()
  )

  useEffect(() => {
    if (!restaurantName || typeof window === "undefined") return

    try {
      const saved = window.localStorage.getItem(orderStorageKey)
      if (!saved) return

      const parsed = JSON.parse(saved) as ActiveOrderSession
      if (!parsed?.orderId || !parsed?.trackingToken || !parsed?.orderNumber) return

      setActiveOrder(parsed)
      setCart(parsed.cart ?? [])
      setOrderType(parsed.orderType ?? "dine-in")
      setShowOrderModal(false)
    } catch {
      window.localStorage.removeItem(orderStorageKey)
    }
  }, [orderStorageKey, restaurantName])

  function persistActiveOrder(order: ActiveOrderSession) {
    setActiveOrder(order)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(orderStorageKey, JSON.stringify(order))
    }
  }

  function clearActiveOrder() {
    setActiveOrder(null)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(orderStorageKey)
    }
  }

  function addToCart(item: MenuItem) {
    setCart((previous) => {
      const existing = previous.find((cartItem) => cartItem.id === item.id)
      if (existing) {
        return previous.map((cartItem) => cartItem.id === item.id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem)
      }
      return [...previous, { ...item, qty: 1 }]
    })
  }

  function removeFromCart(id: number) {
    setCart((previous) => {
      const existing = previous.find((cartItem) => cartItem.id === id)
      if (!existing) return previous
      if (existing.qty === 1) return previous.filter((cartItem) => cartItem.id !== id)
      return previous.map((cartItem) => cartItem.id === id ? { ...cartItem, qty: cartItem.qty - 1 } : cartItem)
    })
  }

  function updateCartNote(id: number, note: string) {
    setCart((previous) => previous.map((cartItem) => cartItem.id === id ? { ...cartItem, note } : cartItem))
  }

  async function placeOrder(tableId?: number): Promise<{ id: number; order_number: string; tracking_token: string }> {
    const orderTypeMap: Record<OrderType, string> = {
      "dine-in": "dine_in",
      delivery: "delivery",
      pickup: "takeaway",
    }

    const order = await createOrder.mutateAsync({
      order_type: orderTypeMap[orderType ?? "dine-in"],
      items: cart.map((item) => ({ menu_item_id: item.id, quantity: item.qty, notes: item.note })),
      ...(orderType === "dine-in" && tableId !== undefined ? { table_id: tableId } : {}),
    }) as { id: number; order_number: string; tracking_token: string }

    persistActiveOrder({
      orderId: order.id,
      orderNumber: order.order_number,
      trackingToken: order.tracking_token,
      orderType: orderType ?? "dine-in",
      tableId: tableId ?? null,
      cart,
    })

    return { id: order.id, order_number: order.order_number, tracking_token: order.tracking_token }
  }

  const filteredItems = items.filter((item) => {
    const matchesCategory = !activeCategory || item.category_id === activeCategory
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const grouped = categories
    .map((category) => ({
      ...category,
      items: filteredItems.filter((item) => item.category_id === category.id),
    }))
    .filter((category) => category.items.length > 0)

  return (
    <>
      {showOrderModal && (
        <OrderTypeModal
          onSelect={(type) => {
            setOrderType(type)
            setShowOrderModal(false)
          }}
          onSkip={() => setShowOrderModal(false)}
        />
      )}

      {cartOpen && (
        <CartCheckout
          cart={cart}
          orderType={orderType}
          slug={restaurantName}
          initialOrderSession={activeOrder}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onUpdateNote={updateCartNote}
          onClose={() => setCartOpen(false)}
          onReset={() => {
            clearActiveOrder()
            setCart([])
            setOrderType(null)
            setShowOrderModal(true)
            setCartOpen(false)
          }}
          onPlaceOrder={placeOrder}
          onRequestOrderType={() => setShowOrderModal(true)}
        />
      )}

      {!cartOpen && activeOrder && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90 transition-all"
        >
          <ShoppingCart className="size-4" />
          Track Order · {activeOrder.orderNumber}
        </button>
      )}

      {!cartOpen && !activeOrder && cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90 transition-all"
        >
          <ShoppingCart className="size-4" />
          {cartCount} item{cartCount > 1 ? "s" : ""} · {currencyLabel}{cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0).toFixed(2)}
        </button>
      )}

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-10">
        <section className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 px-6 py-10 text-center text-primary-foreground">
          <h1 className="text-2xl font-bold sm:text-3xl">{restaurant?.name ?? "Welcome"}</h1>
          <p className="mt-2 text-sm opacity-80">Place Your Order Now!</p>
          {orderType && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-medium capitalize">
              {orderType === "dine-in" ? "🍽️" : orderType === "delivery" ? "🛵" : "🛍️"}
              {orderType.replace("-", " ")}
              <button onClick={() => setOrderType(null)} className="ml-1 opacity-70 hover:opacity-100">
                <X className="size-3" />
              </button>
            </div>
          )}
        </section>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {categories.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Categories</h2>
              <button onClick={() => setActiveCategory(null)} className="text-xs font-medium text-primary hover:underline">
                Show All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    activeCategory === category.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {category.name}
                  <span className="ml-1.5 text-xs opacity-60">{items.filter((item) => item.category_id === category.id).length}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-8">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-64 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No items found.</p>
          ) : (
            grouped.map((category) => (
              <div key={category.id}>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">{category.name}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {category.items.map((item) => (
                    <MenuItemCard key={item.id} item={item} cart={cart} onAdd={addToCart} onRemove={removeFromCart} />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        <PublicRatingsSection
          title="Ratings From This Restaurant"
          subtitle="Every served order can leave feedback. Guest and signed-in customer reviews both appear here."
          ratings={ratingsData?.ratings ?? []}
          averageRating={ratingsData?.summary.average_rating ?? null}
          totalRatings={ratingsData?.summary.total_ratings ?? 0}
          emptyMessage="This restaurant has not received any ratings yet."
        />
      </div>
    </>
  )
}
