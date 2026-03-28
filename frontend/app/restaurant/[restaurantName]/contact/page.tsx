"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Phone, Mail, MapPin, MessageSquare, CheckCircle } from "lucide-react"
import { usePublicRestaurant } from "@/hooks/useApi"

export default function ContactPage() {
  const { restaurantName } = useParams<{ restaurantName: string }>()
  const { data: restaurant } = usePublicRestaurant(restaurantName)

  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" })
  const [sent, setSent] = useState(false)

  function set(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setSent(true)
  }

  const contactItems = [
    restaurant?.phone  && { icon: Phone,  label: "Phone",   value: restaurant.phone,   href: `tel:${restaurant.phone}` },
    restaurant?.email  && { icon: Mail,   label: "Email",   value: restaurant.email,   href: `mailto:${restaurant.email}` },
    restaurant?.address && { icon: MapPin, label: "Address", value: restaurant.address, href: "#" },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string; href: string }[]

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
      <div className="text-center space-y-1">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageSquare className="size-6" />
        </div>
        <h1 className="text-2xl font-bold">Get in Touch</h1>
        <p className="text-sm text-muted-foreground">We'd love to hear from you.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          {contactItems.map(({ icon: Icon, label, value, href }) => (
            <a key={label} href={href}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted/30">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center py-10">
              <CheckCircle className="size-12 text-green-500" />
              <h3 className="text-base font-semibold">Message Sent!</h3>
              <p className="text-sm text-muted-foreground">Thanks for reaching out. We'll get back to you within 24 hours.</p>
              <button onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }) }}
                className="mt-2 rounded-xl border border-border px-5 py-2 text-sm font-medium hover:bg-muted transition-colors">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm font-semibold">Send us a Message</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Name *</label>
                  <input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your name"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email *</label>
                  <input required type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="your@email.com"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Phone (optional)</label>
                  <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 234 567 8900"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Subject</label>
                  <select value={form.subject} onChange={e => set("subject", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                    <option value="">Select a topic</option>
                    <option value="reservation">Reservation</option>
                    <option value="feedback">Feedback</option>
                    <option value="catering">Catering Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Message *</label>
                <textarea required value={form.message} onChange={e => set("message", e.target.value)} rows={5}
                  placeholder="Tell us how we can help..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none" />
              </div>
              <button type="submit"
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
