"use client"

import { useState, useCallback } from "react"

export type ToastType = "success" | "error" | "info"

export interface Toast {
  id: number
  message: string
  type: ToastType
}

let _id = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, type: ToastType = "success") => {
    const id = ++_id
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts(p => p.filter(t => t.id !== id))
  }, [])

  return { toasts, show, dismiss }
}
