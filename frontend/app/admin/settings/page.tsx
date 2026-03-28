"use client"

import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import { useAdminAuthStore, adminApi } from "@/store/adminAuth"

interface PlatformSettings {
  platform_name: string
  support_email: string
  trial_days: number | string
  currency: string
  admin_email: string
}

const DEFAULTS: PlatformSettings = {
  platform_name: "NayaSystem",
  support_email: "support@nayasystem.com",
  trial_days: 14,
  currency: "NPR",
  admin_email: "admin@nayasystem.com",
}

export default function AdminSettingsPage() {
  const token = useAdminAuthStore((s) => s.token)
  const api = adminApi(token)

  const [form, setForm] = useState<PlatformSettings>(DEFAULTS)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  useEffect(() => {
    api.get<PlatformSettings>("/settings")
      .then((data) => setForm(data))
      .catch(() => {})
  }, []) // eslint-disable-line

  async function handleSave() {
    setStatus("saving")
    try {
      const updated = await api.put<PlatformSettings>("/settings", form)
      setForm(updated)
      setStatus("saved")
      setTimeout(() => setStatus("idle"), 2500)
    } catch {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 2500)
    }
  }

  const fields: { label: string; key: keyof PlatformSettings; type?: string }[] = [
    { label: "Platform Name", key: "platform_name" },
    { label: "Support Email", key: "support_email", type: "email" },
    { label: "Default Trial Days", key: "trial_days", type: "number" },
    { label: "Default Currency", key: "currency" },
    { label: "Admin Email", key: "admin_email", type: "email" },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">Platform configuration</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white text-sm border-b border-slate-800 pb-3">General</h2>
        {fields.map(({ label, key, type }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-sm text-slate-300">{label}</label>
            <input
              type={type ?? "text"}
              value={String(form[key])}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={status === "saving"}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Save className="size-4" />
            {status === "saving" ? "Saving..." : "Save Settings"}
          </button>
          {status === "saved" && <span className="text-sm text-emerald-400">Saved successfully</span>}
          {status === "error" && <span className="text-sm text-red-400">Failed to save</span>}
        </div>
      </div>
    </div>
  )
}
