import { create } from "zustand"
import { persist } from "zustand/middleware"
import { api } from "@/lib/api"
import type { User, Restaurant } from "@/lib/types"

interface AuthState {
  user: User | null
  token: string | null
  restaurant: Restaurant | null
  isAuthenticated: boolean

  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  googleLogin: (idToken: string) => Promise<{ isNewUser: boolean }>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (payload: { email: string; token: string; password: string; password_confirmation: string }) => Promise<void>
  setUser: (user: User) => void
  setRestaurant: (restaurant: Restaurant) => void
}

interface RegisterData {
  name: string
  email: string
  password: string
  password_confirmation: string
  restaurant_name: string
  phone?: string
}

function setAuthCookie(token: string) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Strict${secure}`
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      restaurant: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await api.post<{ user: User; token: string }>("/auth/login", { email, password })
        setAuthCookie(res.token)
        set({
          user: res.user,
          token: res.token,
          restaurant: res.user.restaurant ?? null,
          isAuthenticated: true,
        })
      },

      register: async (data) => {
        const res = await api.post<{ user: User; token: string }>("/auth/register", data)
        setAuthCookie(res.token)
        set({
          user: res.user,
          token: res.token,
          restaurant: res.user.restaurant ?? null,
          isAuthenticated: true,
        })
      },

      logout: async () => {
        try { await api.post("/auth/logout") } catch { /* ignore */ }
        document.cookie = "auth_token=; path=/; max-age=0; SameSite=Strict"
        set({ user: null, token: null, restaurant: null, isAuthenticated: false })
      },

      googleLogin: async (idToken: string) => {
        const res = await api.post<{ user: User; token: string; is_new_user: boolean }>("/auth/google", { id_token: idToken })
        setAuthCookie(res.token)
        set({
          user: res.user,
          token: res.token,
          restaurant: res.user.restaurant ?? null,
          isAuthenticated: true,
        })
        return { isNewUser: res.is_new_user }
      },

      forgotPassword: async (email: string) => {
        await api.post<{ message: string }>("/auth/forgot-password", { email })
      },

      resetPassword: async (payload) => {
        await api.post<{ message: string }>("/auth/reset-password", payload)
      },

      fetchMe: async () => {
        const res = await api.get<User>("/auth/me")
        set({ user: res, restaurant: res.restaurant ?? get().restaurant, isAuthenticated: true })
      },

      setUser: (user) => set({ user }),
      setRestaurant: (restaurant) => set({ restaurant }),
    }),
    {
      name: "naya-auth",
      partialize: (s) => ({ user: s.user, token: s.token, restaurant: s.restaurant, isAuthenticated: s.isAuthenticated }),
    }
  )
)
