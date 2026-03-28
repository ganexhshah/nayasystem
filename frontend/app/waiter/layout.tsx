"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/store/auth"
import WaiterSidebar from "@/components/waiter/WaiterSidebar"
import WaiterHeader from "@/components/waiter/WaiterHeader"
import WaiterBottomNav from "@/components/waiter/WaiterBottomNav"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function WaiterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const isAuthPage = pathname === "/waiter/auth"

  useEffect(() => {
    if (!isAuthenticated && !isAuthPage) {
      router.replace("/waiter/auth")
    }
  }, [isAuthenticated, isAuthPage, router])

  if (isAuthPage) return <TooltipProvider>{children}</TooltipProvider>
  if (!isAuthenticated) return null

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="hidden md:flex">
          <WaiterSidebar />
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <WaiterHeader />
          <main className="flex-1 overflow-auto p-4 md:p-5 pb-20 md:pb-5">
            {children}
          </main>
        </div>
        <WaiterBottomNav />
      </div>
    </TooltipProvider>
  )
}
