import { create } from "zustand"
import { persist } from "zustand/middleware"
import { api } from "@/lib/api"
import { signInWithPopup } from "firebase/auth"
import { firebaseAuth, googleProvider } from "@/lib/firebase"

export interface CustomerUser {
  id: number
  name: string
  email: string
  phone?: string
  avatar?: string
  address?: string
  saved_addresses?: string[]
  loyalty_points: number
  total_orders: number
  total_spent: number
}

interface CustomerAuthState {
  customer: CustomerUser | null
  token: string | null
  slug: string | null
  isAuthenticated: boolean

  login: (slug: string, email: string, password: string) => Promise<void>
  register: (slug: string, data: { name: string; email: string; phone?: string; password: string; password_confirmation: string }) => Promise<void>
  googleLogin: (slug: string) => Promise<void>
  logout: (slug: string) => Promise<void>
  updateProfile: (slug: string, data: Partial<CustomerUser>) => Promise<void>
  fetchMe: (slug: string) => Promise<void>
}

const STORAGE_KEY = "naya-customer-auth"

function getCookieValue(name: string): string | null {
  if (typeof window === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setCustomerCookie(token: string) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `customer_token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Strict${secure}`
}

// Override api token for customer calls
async function customerFetch<T>(path: string, token: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.message ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const useCustomerAuth = create<CustomerAuthState>()(
  persist(
    (set, get) => ({
      customer: null,
      token: getCookieValue("customer_token"),
      slug: null,
      isAuthenticated: !!getCookieValue("customer_token"),

      login: async (slug, email, password) => {
        const res = await api.post<{ customer: CustomerUser; token: string }>(
          `/restaurant/${slug}/customer/login`, { email, password }
        )
        setCustomerCookie(res.token)
        set({ customer: res.customer, token: res.token, slug, isAuthenticated: true })
      },

      register: async (slug, data) => {
        const res = await api.post<{ customer: CustomerUser; token: string }>(
          `/restaurant/${slug}/customer/register`, data
        )
        setCustomerCookie(res.token)
        set({ customer: res.customer, token: res.token, slug, isAuthenticated: true })
      },

      googleLogin: async (slug) => {
        const result = await signInWithPopup(firebaseAuth, googleProvider)
        const idToken = await result.user.getIdToken()
        const res = await api.post<{ customer: CustomerUser; token: string }>(
          `/restaurant/${slug}/customer/google`, { id_token: idToken }
        )
        setCustomerCookie(res.token)
        set({ customer: res.customer, token: res.token, slug, isAuthenticated: true })
      },

      logout: async (slug) => {
        const { token } = get()
        if (token) {
          try { await customerFetch(`/restaurant/${slug}/customer/logout`, token, { method: "POST" }) } catch { /* ignore */ }
        }
        document.cookie = "customer_token=; path=/; max-age=0; SameSite=Strict"
        set({ customer: null, token: null, slug: null, isAuthenticated: false })
      },

      updateProfile: async (slug, data) => {
        const { token } = get()
        if (!token) return
        const updated = await customerFetch<CustomerUser>(`/restaurant/${slug}/customer/me`, token, { method: "PUT", body: data })
        set({ customer: updated })
      },

      fetchMe: async (slug) => {
        const { token } = get()
        if (!token) return
        const customer = await customerFetch<CustomerUser>(`/restaurant/${slug}/customer/me`, token)
        set({ customer, isAuthenticated: true })
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({ customer: s.customer, slug: s.slug, isAuthenticated: s.isAuthenticated }),
    }
  )
)
