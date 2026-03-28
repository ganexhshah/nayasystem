"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2, Phone, MapPin, Image, Users, UserCog,
  CheckCircle2, ChevronRight, ChevronLeft, Upload, X, Link2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth"

const TOTAL_STEPS = 5

function toSlug(str: string) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`h-2 rounded-full transition-all duration-300 ${
            i < current ? "bg-primary w-6" : i === current ? "bg-primary w-8" : "bg-muted w-6"
          }`} />
        </div>
      ))}
      <span className="text-xs text-muted-foreground ml-1">
        {current < total ? `${current + 1} of ${total}` : "Done"}
      </span>
    </div>
  )
}

type NameData = { name: string; slug: string; slugEdited: boolean }

function StepName({ data, onChange }: {
  data: NameData
  onChange: <K extends keyof NameData>(k: K, v: NameData[K]) => void
}) {
  function handleNameChange(val: string) {
    onChange("name", val)
    if (!data.slugEdited) onChange("slug", toSlug(val))
  }
  function handleSlugChange(val: string) {
    onChange("slug", toSlug(val))
    onChange("slugEdited", true)
  }
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="r-name">Restaurant Name *</Label>
        <div className="relative">
          <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input id="r-name" placeholder="e.g. The Golden Fork" className="pl-8"
            value={data.name} onChange={(e) => handleNameChange(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="r-slug">
          URL Slug <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <div className="relative">
          <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input id="r-slug" placeholder="the-golden-fork" className="pl-8"
            value={data.slug} onChange={(e) => handleSlugChange(e.target.value)} />
        </div>
        {data.slug && (
          <p className="text-xs text-muted-foreground">
            Menu URL: <span className="font-mono">/restaurant/{data.slug}</span>
          </p>
        )}
      </div>
    </div>
  )
}

type LogoData = { file: File | null; preview: string | null }

function StepLogo({ data, onChange }: {
  data: LogoData
  onChange: <K extends keyof LogoData>(k: K, v: LogoData[K]) => void
}) {
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onChange("file", file)
    onChange("preview", URL.createObjectURL(file))
  }
  function handleRemove() {
    onChange("file", null)
    onChange("preview", null)
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload your restaurant logo. You can skip and add it later from Settings.
      </p>
      {data.preview ? (
        <div className="relative w-32 h-32 mx-auto">
          <img src={data.preview} alt="Logo preview" className="w-full h-full object-cover rounded-xl border" />
          <button onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 hover:opacity-80"
            aria-label="Remove logo">
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <label htmlFor="logo-upload"
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl p-10 cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="bg-muted rounded-full p-3">
            <Upload className="size-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Click to upload logo</p>
            <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG up to 5MB</p>
          </div>
          <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      )}
    </div>
  )
}

type ContactData = { phone: string; email: string; address: string; city: string }

function StepContact({ data, onChange }: {
  data: ContactData
  onChange: <K extends keyof ContactData>(k: K, v: ContactData[K]) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="phone">Contact Number</Label>
        <div className="relative">
          <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" className="pl-8"
            value={data.phone} onChange={(e) => onChange("phone", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-email">Business Email</Label>
        <Input id="c-email" type="email" placeholder="contact@restaurant.com"
          value={data.email} onChange={(e) => onChange("email", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <div className="relative">
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input id="address" placeholder="123 Main St" className="pl-8"
            value={data.address} onChange={(e) => onChange("address", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="city">City</Label>
        <Input id="city" placeholder="e.g. Kathmandu"
          value={data.city} onChange={(e) => onChange("city", e.target.value)} />
      </div>
    </div>
  )
}

type CapacityData = { indoor: string; tables: string; hours: string; cuisine: string; totalStaff: string }

function StepCapacity({ data, onChange }: {
  data: CapacityData
  onChange: <K extends keyof CapacityData>(k: K, v: CapacityData[K]) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="indoor">Indoor Seats</Label>
          <Input id="indoor" type="number" min="0" placeholder="e.g. 50"
            value={data.indoor} onChange={(e) => onChange("indoor", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tables">Number of Tables</Label>
          <Input id="tables" type="number" min="1" placeholder="e.g. 15"
            value={data.tables} onChange={(e) => onChange("tables", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cuisine">Cuisine Type</Label>
        <Input id="cuisine" placeholder="e.g. Italian, Indian, Fast Food"
          value={data.cuisine} onChange={(e) => onChange("cuisine", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hours">Operating Hours</Label>
        <Input id="hours" placeholder="e.g. Mon-Fri 9am-10pm"
          value={data.hours} onChange={(e) => onChange("hours", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="total-staff">Total Staff</Label>
        <div className="relative">
          <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input id="total-staff" type="number" min="1" placeholder="e.g. 20" className="pl-8"
            value={data.totalStaff} onChange={(e) => onChange("totalStaff", e.target.value)} />
        </div>
      </div>
    </div>
  )
}

function StepSuccess({ name }: { name: string }) {
  const router = useRouter()
  useEffect(() => {
    const t = window.setTimeout(() => router.push("/app/dashboard"), 2000)
    return () => window.clearTimeout(t)
  }, [router])
  return (
    <div className="flex flex-col items-center text-center gap-4 py-6">
      <div className="bg-primary/10 rounded-full p-5">
        <CheckCircle2 className="size-12 text-primary" />
      </div>
      <div>
        <h3 className="text-xl font-semibold">{"You're all set!"}</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {name ? `${name} has` : "Your restaurant has"} been successfully set up.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">Redirecting to dashboard...</p>
      <Button className="mt-2 w-full" onClick={() => router.push("/app/dashboard")}>
        Open Dashboard Now
      </Button>
    </div>
  )
}

const STEPS = [
  { title: "Restaurant Name", description: "What's your restaurant called?", icon: Building2 },
  { title: "Logo", description: "Add your brand logo", icon: Image },
  { title: "Contact & Location", description: "How can customers reach you?", icon: Phone },
  { title: "Capacity & Staff", description: "Set up seating and team size", icon: UserCog },
  { title: "All Done", description: "Setup complete", icon: CheckCircle2 },
]

export default function OnboardPage() {
  const setRestaurant = useAuthStore((s) => s.setRestaurant)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [nameData, setNameData] = useState<NameData>({ name: "", slug: "", slugEdited: false })
  const [logoData, setLogoData] = useState<LogoData>({ file: null, preview: null })
  const [contactData, setContactData] = useState<ContactData>({ phone: "", email: "", address: "", city: "" })
  const [capacityData, setCapacityData] = useState<CapacityData>({ indoor: "", tables: "", hours: "", cuisine: "", totalStaff: "" })

  function updateName<K extends keyof NameData>(k: K, v: NameData[K]) { setNameData((p) => ({ ...p, [k]: v })) }
  function updateLogo(k: "file", v: File | null): void
  function updateLogo(k: "preview", v: string | null): void
  function updateLogo(k: keyof LogoData, v: File | string | null) { setLogoData((p) => ({ ...p, [k]: v })) }
  function updateContact<K extends keyof ContactData>(k: K, v: ContactData[K]) { setContactData((p) => ({ ...p, [k]: v })) }
  function updateCapacity<K extends keyof CapacityData>(k: K, v: CapacityData[K]) { setCapacityData((p) => ({ ...p, [k]: v })) }

  function canNext() {
    if (step === 0) return nameData.name.trim().length >= 2
    return true
  }

  async function handleFinish() {
    setSaving(true)
    setSaveError(null)
    try {
      const payload: Record<string, unknown> = { name: nameData.name }
      if (nameData.slug) payload.slug = nameData.slug
      if (contactData.phone) payload.phone = contactData.phone
      if (contactData.email) payload.email = contactData.email
      if (contactData.address) payload.address = contactData.address
      if (contactData.city) payload.city = contactData.city

      const settings: Record<string, string> = {}
      if (capacityData.indoor) settings.indoor_seats = capacityData.indoor
      if (capacityData.tables) settings.tables = capacityData.tables
      if (capacityData.hours) settings.operating_hours = capacityData.hours
      if (capacityData.cuisine) settings.cuisine = capacityData.cuisine
      if (capacityData.totalStaff) settings.total_staff = capacityData.totalStaff
      if (Object.keys(settings).length) payload.settings = settings

      const updated = await api.patch<{ id: number; name: string; slug: string }>("/settings", payload)
      setRestaurant(updated as never)

      if (logoData.file) {
        const fd = new FormData()
        fd.append("logo", logoData.file)
        await api.upload("/settings/logo", fd)
      }

      setStep(4)
    } catch {
      setSaveError("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const StepIcon = STEPS[step].icon

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">Setup</p>
          <h1 className="text-3xl font-semibold">Restaurant Onboarding</h1>
        </div>

        <StepIndicator current={step} total={TOTAL_STEPS} />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <StepIcon className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle>{STEPS[step].title}</CardTitle>
                <CardDescription>{STEPS[step].description}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {step === 0 && <StepName data={nameData} onChange={updateName} />}
            {step === 1 && <StepLogo data={logoData} onChange={updateLogo} />}
            {step === 2 && <StepContact data={contactData} onChange={updateContact} />}
            {step === 3 && <StepCapacity data={capacityData} onChange={updateCapacity} />}
            {step === 4 && <StepSuccess name={nameData.name} />}

            {saveError && <p className="mt-3 text-sm text-destructive">{saveError}</p>}

            {step < TOTAL_STEPS - 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="gap-1.5">
                  <ChevronLeft className="size-4" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  {(step === 1 || step === 2 || step === 3) && (
                    <Button variant="outline" disabled={saving}
                      onClick={step === 3 ? handleFinish : () => setStep((s) => s + 1)}>
                      Skip
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="gap-1.5">
                      Next <ChevronRight className="size-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleFinish} disabled={saving} className="gap-1.5">
                      {saving ? "Saving..." : "Finish"} <ChevronRight className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
