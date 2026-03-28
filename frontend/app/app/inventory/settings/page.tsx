"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

function ToggleRow({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export default function InventorySettingsPage() {
  const [autoPO, setAutoPO]         = useState(false)
  const [dailyEmail, setDailyEmail] = useState(false)

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-semibold">Purchase Order Settings</h1>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Purchase Order Settings</h2>
        <div className="space-y-5">
          <ToggleRow
            label="Allow auto Purchase Order"
            description="Allow purchase order to be created and sent to suppliers automatically."
            checked={autoPO}
            onChange={setAutoPO}
          />
          <ToggleRow
            label="Send daily stock summary email"
            description="Send a daily email with low-stock, out-of-stock, and expiring batch items for this restaurant."
            checked={dailyEmail}
            onChange={setDailyEmail}
          />
        </div>
        <Button size="sm">Save</Button>
      </section>
    </div>
  )
}
