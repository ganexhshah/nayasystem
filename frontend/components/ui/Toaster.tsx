"use client"

import { CheckCircle2, XCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Toast } from "@/hooks/useToast"

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  info:    Info,
}

const STYLES = {
  success: "bg-emerald-600 text-white",
  error:   "bg-destructive text-white",
  info:    "bg-primary text-primary-foreground",
}

export default function Toaster({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const Icon = ICONS[t.type]
        return (
          <div key={t.id}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium pointer-events-auto",
              "animate-in slide-in-from-bottom-2 fade-in duration-200",
              STYLES[t.type]
            )}>
            <Icon className="size-4 shrink-0" />
            <span>{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="ml-1 opacity-70 hover:opacity-100">
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
