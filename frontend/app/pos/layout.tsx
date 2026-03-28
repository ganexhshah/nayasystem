"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/store/auth"
import PosSidebar from "@/components/pos/PosSidebar"
import PosHeader from "@/components/pos/PosHeader"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const isAuthPage = pathname === "/pos/auth"
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Wait for zustand to rehydrate from localStorage before checking auth
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated && !isAuthPage) {
      router.replace("/pos/auth")
    }
  }, [hydrated, isAuthenticated, isAuthPage, router])

  // Auth page — no sidebar/header
  if (isAuthPage) {
    return <TooltipProvider>{children}</TooltipProvider>
  }

  // Still rehydrating — show nothing to avoid flash redirect
  if (!hydrated) return null

  if (!isAuthenticated) return null

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <PosSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <PosHeader />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
