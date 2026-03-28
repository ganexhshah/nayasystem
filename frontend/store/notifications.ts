"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type NotifCategory = "order" | "payment" | "reservation" | "inventory" | "waiter"

export interface AppNotif {
  id: string
  category: NotifCategory
  title: string
  body: string
  link?: string
  read: boolean
  at: number
}

interface NotifState {
  notifs: AppNotif[]
  seenIds: Set<string>
  add: (n: Omit<AppNotif, "read">) => void
  markRead: (id: string) => void
  markAllRead: () => void
  dismiss: (id: string) => void
  isSeen: (id: string) => boolean
  setSeen: (id: string) => void
}

export const useNotifStore = create<NotifState>()(
  persist(
    (set, get) => ({
      notifs: [],
      seenIds: new Set<string>(),

      add: (n) => {
        if (get().seenIds.has(n.id)) return
        set((s) => ({
          notifs: [{ ...n, read: false }, ...s.notifs].slice(0, 50),
          seenIds: new Set([...s.seenIds, n.id]),
        }))
      },

      markRead: (id) =>
        set((s) => ({ notifs: s.notifs.map((n) => n.id === id ? { ...n, read: true } : n) })),

      markAllRead: () =>
        set((s) => ({ notifs: s.notifs.map((n) => ({ ...n, read: true })) })),

      dismiss: (id) =>
        set((s) => ({ notifs: s.notifs.filter((n) => n.id !== id) })),

      isSeen: (id) => get().seenIds.has(id),
      setSeen: (id) => set((s) => ({ seenIds: new Set([...s.seenIds, id]) })),
    }),
    {
      name: "app-notifications",
      // Don't persist seenIds as a Set — convert to array
      partialize: (s) => ({
        notifs: s.notifs,
        seenIds: [...s.seenIds],
      }),
      merge: (persisted, current) => {
        const p = persisted as { notifs: AppNotif[]; seenIds: string[] }
        return {
          ...current,
          notifs: p.notifs ?? [],
          seenIds: new Set<string>(p.seenIds ?? []),
        }
      },
    }
  )
)
