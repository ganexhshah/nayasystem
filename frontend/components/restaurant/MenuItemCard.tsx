"use client"

import { useState } from "react"
import Image from "next/image"
import { Clock, Plus, Minus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MenuItem } from "@/lib/types"

export type { MenuItem }
export type CartItem = MenuItem & { qty: number; note?: string }

export function getMenuItemTypeMeta(item: MenuItem) {
  const itemType = item.item_type ?? (item.is_veg ? "Veg" : "Non Veg")

  switch (itemType) {
    case "Veg":
      return {
        label: "Veg",
        emoji: "🥗",
        badgeClass: "border-green-600 bg-green-50 text-green-700",
        dotClass: "border-green-600 bg-green-600",
      }
    case "Non Veg":
      return {
        label: "Non Veg",
        emoji: "🍗",
        badgeClass: "border-red-600 bg-red-50 text-red-700",
        dotClass: "border-red-600 bg-red-600",
      }
    case "Egg":
      return {
        label: "Egg",
        emoji: "🥚",
        badgeClass: "border-amber-500 bg-amber-50 text-amber-700",
        dotClass: "border-amber-500 bg-amber-500",
      }
    case "Drink":
      return {
        label: "Drink",
        emoji: "🥤",
        badgeClass: "border-sky-500 bg-sky-50 text-sky-700",
        dotClass: "border-sky-500 bg-sky-500",
      }
    case "Halal":
      return {
        label: "Halal",
        emoji: "🥘",
        badgeClass: "border-emerald-700 bg-emerald-50 text-emerald-800",
        dotClass: "border-emerald-700 bg-emerald-700",
      }
    default:
      return {
        label: "Other",
        emoji: "🍽️",
        badgeClass: "border-slate-400 bg-slate-50 text-slate-700",
        dotClass: "border-slate-400 bg-slate-400",
      }
  }
}

function ItemTypeBadge({ item }: { item: MenuItem }) {
  const meta = getMenuItemTypeMeta(item)

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold shadow-sm", meta.badgeClass)}>
      <span className={cn("inline-flex size-3 shrink-0 items-center justify-center rounded-sm border", meta.dotClass)}>
        <span className="size-1.5 rounded-full bg-white" />
      </span>
      <span>{meta.label}</span>
    </span>
  )
}

function QtyControl({ qty, onAdd, onRemove }: { qty: number; onAdd: () => void; onRemove: () => void }) {
  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-primary">
      <button onClick={onRemove} className="px-2 py-1.5 text-primary transition-colors hover:bg-primary/10"><Minus className="size-3" /></button>
      <span className="min-w-[1.25rem] text-center text-xs font-semibold text-primary">{qty}</span>
      <button onClick={onAdd} className="px-2 py-1.5 text-primary transition-colors hover:bg-primary/10"><Plus className="size-3" /></button>
    </div>
  )
}

export function MenuItemCard({ item, cart, onAdd, onRemove }: { item: MenuItem; cart: CartItem[]; onAdd: (item: MenuItem) => void; onRemove: (id: number) => void }) {
  const cartItem = cart.find((cartEntry) => cartEntry.id === item.id)
  const meta = getMenuItemTypeMeta(item)
  const [showDetails, setShowDetails] = useState(false)

  return (
    <>
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-0 backdrop-blur-sm sm:items-center sm:px-4">
          <div className="relative w-full overflow-hidden rounded-t-3xl bg-background shadow-2xl sm:max-w-lg sm:rounded-3xl">
            <button
              onClick={() => setShowDetails(false)}
              className="absolute right-3 top-3 z-10 rounded-full border border-border bg-background/90 p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close details"
            >
              <X className="size-4" />
            </button>

            <div className="relative h-56 w-full bg-muted">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 40rem" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-6xl select-none">
                  {meta.emoji}
                </div>
              )}
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <ItemTypeBadge item={item} />
                  <h3 className="text-xl font-semibold leading-tight">{item.name}</h3>
                </div>
                <p className="shrink-0 text-lg font-bold">Rs. {Number(item.price).toFixed(2)}</p>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                {item.description || "No additional details available for this item yet."}
              </p>

              <div className="grid gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Item Type</p>
                  <p className="mt-1 text-sm font-medium">{meta.label}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preparation</p>
                  <p className="mt-1 text-sm font-medium">{item.preparation_time ? `${item.preparation_time} min` : "Quick serve"}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                {cartItem ? (
                  <QtyControl qty={cartItem.qty} onAdd={() => onAdd(item)} onRemove={() => onRemove(item.id)} />
                ) : (
                  <button
                    onClick={() => onAdd(item)}
                    className="rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    Add To Cart
                  </button>
                )}
                <button
                  onClick={() => setShowDetails(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        onClick={() => setShowDetails(true)}
        className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
      >
        <div className="relative h-40 w-full overflow-hidden bg-muted">
          {item.image ? (
            <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl select-none">
              {meta.emoji}
            </div>
          )}
          <div className="absolute left-2 top-2">
            <ItemTypeBadge item={item} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold leading-tight">{item.name}</p>
            <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
              {meta.label}
            </span>
          </div>
          <p className="flex-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
          {item.preparation_time && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3 shrink-0" />
              <span>Prep: {item.preparation_time} min</span>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm font-bold">Rs. {Number(item.price).toFixed(2)}</p>
            {cartItem ? (
              <div onClick={(event) => event.stopPropagation()}>
                <QtyControl qty={cartItem.qty} onAdd={() => onAdd(item)} onRemove={() => onRemove(item.id)} />
              </div>
            ) : (
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  onAdd(item)
                }}
                className="rounded-lg border border-primary px-4 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
