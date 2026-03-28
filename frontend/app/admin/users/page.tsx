"use client"

import { Search, Trash2, RefreshCw } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useAdminAuthStore, adminApi } from "@/store/adminAuth"

interface UserRow {
  id: number
  name: string
  email: string
  role: string
  restaurant: { id: number; name: string } | null
  created_at: string
}

export default function UsersPage() {
  const token = useAdminAuthStore((s) => s.token)
  const api = adminApi(token)

  const [users, setUsers] = useState<UserRow[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: UserRow[] }>(`/users${query ? `?search=${encodeURIComponent(query)}` : ""}`)
      setUsers(res.data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token, query]) // eslint-disable-line

  useEffect(() => { load() }, [load])

  async function handleDelete(id: number) {
    if (!confirm("Delete this user?")) return
    await api.delete(`/users/${id}`)
    setUsers((u) => u.filter((x) => x.id !== id))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Users</h1>
          <p className="text-sm text-slate-400 mt-0.5">All restaurant owners and staff</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <RefreshCw className="size-4" /> Refresh
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">Loading...</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">No users found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["User", "Email", "Restaurant", "Role", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{u.restaurant?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-700 text-slate-300 border-slate-600 capitalize">{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(u.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
