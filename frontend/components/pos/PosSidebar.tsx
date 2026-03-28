"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Store, LayoutDashboard, ShoppingBag, Bike, UtensilsCrossed, ClipboardList, Receipt, LogOut, ChevronRight, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"

const NAV = [
  { label: "Dine In",        href: "/pos/dine-in",        icon: UtensilsCrossed },
  { label: "Takeaway",       href: "/pos/pickup",          icon: ShoppingBag    },
  { label: "Delivery",       href: "/pos/delivery",        icon: Bike           },
  { label: "Waiter Orders",  href: "/pos/waiter-orders",   icon: Users          },
  { label: "KOT",            href: "/pos/orders/kot",      icon: ClipboardList  },
  { label: "Orders",         href: "/pos/orders",          icon: Receipt        },
]

export default function PosSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { restaurant, user, logout } = useAuthStore()

  async function handleLogout() {
    await logout()
    router.push("/pos/auth")
  }

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-card border-r border-border shrink-0">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary rounded-lg p-2 shrink-0">
            <Store className="size-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{restaurant?.name ?? "POS"}</p>
            <p className="text-xs text-muted-foreground">POS Terminal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="size-3.5 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-3 border-t border-border space-y-1">
        <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user?.name ?? "Staff"}</div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
          <LogOut className="size-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
