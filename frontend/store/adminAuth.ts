import { create } from "zustand"
import { persist } from "zustand/middleware"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

interface AdminUser {
  id: number
  name: string
  email: string
  role: string
}

interface AdminAuthState {
  admin: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

function getCookieValue(name: string): string | null {
  if (typeof window === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setAdminCookie(token: string) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `admin_token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Strict${secure}`
}

async function adminFetch<T>(path: string, opts: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`${BASE}/admin${path}`, { ...opts, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message ?? res.statusText)
  return data as T
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      // Start with null/false — persist middleware rehydrates on client after mount
      admin: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await adminFetch<{ admin: AdminUser; token: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        })
        setAdminCookie(res.token)
        set({ admin: res.admin, token: res.token, isAuthenticated: true })
      },

      logout: async () => {
        try {
          await adminFetch("/auth/logout", { method: "POST" }, get().token)
        } catch { /* ignore */ }
        document.cookie = "admin_token=; path=/; max-age=0; SameSite=Strict"
        set({ admin: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: "naya-admin-auth",
      partialize: (s) => ({ admin: s.admin, token: s.token, isAuthenticated: s.isAuthenticated }),
      // After rehydration from localStorage, also sync token from cookie
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const cookieToken = getCookieValue("admin_token")
        if (cookieToken) {
          state.token = cookieToken
          state.isAuthenticated = true
        } else if (!cookieToken && state.isAuthenticated) {
          // Cookie expired/cleared — force logout state
          state.token = null
          state.isAuthenticated = false
          state.admin = null
        }
      },
    }
  )
)

// Helper for admin API calls from pages
export function adminApi(token: string | null) {
  return {
    get: <T>(path: string) => adminFetch<T>(path, {}, token),
    post: <T>(path: string, body?: unknown) =>
      adminFetch<T>(path, { method: "POST", body: JSON.stringify(body) }, token),
    put: <T>(path: string, body?: unknown) =>
      adminFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }, token),
    patch: <T>(path: string, body?: unknown) =>
      adminFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }, token),
    delete: <T>(path: string) => adminFetch<T>(path, { method: "DELETE" }, token),
  }
}
