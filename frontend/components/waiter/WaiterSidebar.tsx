"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { UtensilsCrossed, Table2, BellRing, ClipboardList, User, LogOut, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"
import { useWaiterRequests } from "@/hooks/useApi"

const NAV = [
  { label: "Tables",   href: "/waiter/tables",  icon: Table2         },
  { label: "Orders",   href: "/waiter/orders",  icon: ClipboardList  },
  { label: "Alerts",   href: "/waiter/alerts",  icon: BellRing       },
  { label: "Profile",  href: "/waiter/profile", icon: User           },
]

export default function WaiterSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { restaurant, user, logout } = useAuthStore()
  const { data: alerts = [] } = useWaiterRequests({ status: "pending" })
  const pendingCount = Array.isArray(alerts) ? alerts.filter((r) => r.status === "pending").length : 0

  async function handleLogout() {
    await logout()
    router.push("/waiter/auth")
  }

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-card border-r border-border shrink-0">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary rounded-lg p-2 shrink-0">
            <UtensilsCrossed className="size-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{restaurant?.name ?? "Waiter"}</p>
            <p className="text-xs text-muted-foreground">Waiter App</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href)
          const badge = label === "Alerts" && pendingCount > 0 ? pendingCount : null
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="size-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                  {badge}
                </span>
              )}
              {active && !badge && <ChevronRight className="size-3.5 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-border space-y-1">
        <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user?.name ?? "Staff"}</div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
          <LogOut className="size-4 shrink-0" /> Sign Out
        </button>
      </div>
    </aside>
  )
}
