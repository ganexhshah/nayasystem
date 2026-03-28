"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PosHomePage() {
  const router = useRouter()
  useEffect(() => { router.replace("/pos/dine-in") }, [router])
  return null
}
