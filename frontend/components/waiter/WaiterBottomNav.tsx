"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Table2, ClipboardList, BellRing, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWaiterRequests } from "@/hooks/useApi"

const NAV = [
  { label: "Tables",  href: "/waiter/tables",  icon: Table2        },
  { label: "Orders",  href: "/waiter/orders",  icon: ClipboardList },
  { label: "Alerts",  href: "/waiter/alerts",  icon: BellRing      },
  { label: "Profile", href: "/waiter/profile", icon: User          },
]

export default function WaiterBottomNav() {
  const pathname = usePathname()
  const { data: alerts = [] } = useWaiterRequests({ status: "pending" })
  const pendingCount = Array.isArray(alerts) ? alerts.filter((r) => r.status === "pending").length : 0

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex md:hidden">
      {NAV.map(({ label, href, icon: Icon }) => {
        const active = pathname.startsWith(href)
        const badge = label === "Alerts" && pendingCount > 0 ? pendingCount : null
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors relative",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div className="relative">
              <Icon className="size-5" />
              {badge && (
                <span className="absolute -top-1.5 -right-2 size-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                  {badge}
                </span>
              )}
            </div>
            <span>{label}</span>
            {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />}
          </Link>
        )
      })}
    </nav>
  )
}
