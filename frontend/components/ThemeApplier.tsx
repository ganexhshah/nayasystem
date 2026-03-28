"use client"

import { useEffect } from "react"
import { useThemeStore } from "@/store/theme"

export default function ThemeApplier() {
  const dark = useThemeStore((s) => s.dark)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return null
}
