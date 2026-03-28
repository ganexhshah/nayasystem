"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/store/auth"

export default function KotLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const isAuthPage = pathname === "/kot/auth"

  useEffect(() => {
    if (!isAuthenticated && !isAuthPage) {
      router.replace("/kot/auth")
    }
  }, [isAuthenticated, isAuthPage, router])

  if (isAuthPage) return <>{children}</>
  if (!isAuthenticated) return null

  return <div className="min-h-screen bg-background">{children}</div>
}
