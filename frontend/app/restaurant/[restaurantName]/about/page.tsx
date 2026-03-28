"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import {
  MapPin, UtensilsCrossed, Award, Users, Clock, Globe, Phone, Mail,
  Instagram, Facebook, Twitter, Star, CalendarDays, ChevronRight,
} from "lucide-react"
import { usePublicRestaurant, usePublicMenu } from "@/hooks/useApi"
import { cn } from "@/lib/utils"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

type OpeningHours = Record<string, { open: string; close: string; closed?: boolean }>

export default function AboutPage() {
  const { restaurantName } = useParams<{ restaurantName: string }>()
  const { data: restaurant, isLoading } = usePublicRestaurant(restaurantName)
  const { data: items = [] } = usePublicMenu(restaurantName)

  const s = (restaurant?.settings ?? {}) as Record<string, unknown>

  const aboutContent  = (s.about_us_content as string) ?? ""
  const tagline       = (s.tagline as string) ?? ""
  const cuisine       = (s.cuisine_type as string) ?? ""
  const website       = (s.website as string) ?? ""
  const instagram     = (s.instagram as string) ?? ""
  const facebook      = (s.facebook as string) ?? ""
  const twitter       = (s.twitter as string) ?? ""
  const whatsapp      = (s.whatsapp as string) ?? ""
  const openingHours  = (s.opening_hours as OpeningHours) ?? null
  const established   = (s.established_year as string) ?? ""
  const avgRating     = (s.avg_rating as string) ?? "4.8"

  const STATS = [
    { icon: Star,            label: "Avg Rating",   value: avgRating },
    { icon: Users,           label: "Happy Guests", value: (s.happy_guests as string) ?? "—" },
    { icon: UtensilsCrossed, label: "Menu Items",   value: String(items.length || "—") },
    { icon: Award,           label: "Est.",         value: established || "—" },
  ]

  const hasSocial = instagram || facebook || twitter || whatsapp || website

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">

      {/* Hero */}
      <section className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <div className="px-8 py-12 text-center space-y-3">
          {restaurant?.logo ? (
            <img src={restaurant.logo} alt={restaurant.name}
              className="mx-auto size-20 rounded-2xl object-cover shadow-lg border-2 border-white/20" />
          ) : (
            <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-white/20 text-4xl font-bold">
              {restaurant?.name?.charAt(0) ?? "🍛"}
            </div>
          )}
          <h1 className="text-3xl font-bold">{restaurant?.name ?? "Restaurant"}</h1>
          {tagline && <p className="text-base opacity-90 font-medium">{tagline}</p>}
          {cuisine && (
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
              {cuisine}
            </span>
          )}
          {restaurant?.address && (
            <p className="flex items-center justify-center gap-1.5 text-sm opacity-80">
              <MapPin className="size-3.5" />
              {[restaurant.address, restaurant.city, restaurant.country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 text-center space-y-2">
            <Icon className="mx-auto size-5 text-primary" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      {/* About content */}
      {aboutContent && (
        <section className="rounded-xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-base font-semibold">About Us</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{aboutContent}</p>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact & Location */}
        {(restaurant?.address || restaurant?.phone || restaurant?.email) && (
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="size-4 text-primary" /> Contact & Location
            </h2>
            <div className="space-y-2.5">
              {restaurant?.address && (
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    {[restaurant.address, restaurant.city, restaurant.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {restaurant?.phone && (
                <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2.5 text-sm hover:text-primary transition-colors">
                  <Phone className="size-4 text-muted-foreground shrink-0" />
                  <span>{restaurant.phone}</span>
                </a>
              )}
              {restaurant?.email && (
                <a href={`mailto:${restaurant.email}`} className="flex items-center gap-2.5 text-sm hover:text-primary transition-colors">
                  <Mail className="size-4 text-muted-foreground shrink-0" />
                  <span>{restaurant.email}</span>
                </a>
              )}
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm hover:text-green-600 transition-colors">
                  <Phone className="size-4 text-muted-foreground shrink-0" />
                  <span>WhatsApp: {whatsapp}</span>
                </a>
              )}
            </div>
          </section>
        )}

        {/* Opening Hours */}
        {openingHours && (
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Clock className="size-4 text-primary" /> Opening Hours
            </h2>
            <div className="space-y-1.5">
              {DAYS.map(day => {
                const h = openingHours[day.toLowerCase()] ?? openingHours[day]
                const today = new Date().toLocaleDateString("en-US", { weekday: "long" }) === day
                return (
                  <div key={day} className={cn(
                    "flex items-center justify-between text-sm py-1 px-2 rounded-lg",
                    today ? "bg-primary/5 font-semibold" : ""
                  )}>
                    <span className={today ? "text-primary" : "text-muted-foreground"}>{day}</span>
                    {!h || h.closed
                      ? <span className="text-red-500 text-xs font-medium">Closed</span>
                      : <span className={today ? "text-primary" : ""}>{h.open} – {h.close}</span>
                    }
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Social & Web */}
      {hasSocial && (
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Globe className="size-4 text-primary" /> Find Us Online
          </h2>
          <div className="flex flex-wrap gap-3">
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:border-primary hover:bg-primary/5 transition-colors">
                <Globe className="size-4 text-muted-foreground" /> Website
              </a>
            )}
            {instagram && (
              <a href={`https://instagram.com/${instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:border-pink-400 hover:bg-pink-50 transition-colors">
                <Instagram className="size-4 text-pink-500" /> @{instagram.replace("@", "")}
              </a>
            )}
            {facebook && (
              <a href={`https://facebook.com/${facebook}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <Facebook className="size-4 text-blue-600" /> {facebook}
              </a>
            )}
            {twitter && (
              <a href={`https://twitter.com/${twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:border-sky-400 hover:bg-sky-50 transition-colors">
                <Twitter className="size-4 text-sky-500" /> @{twitter.replace("@", "")}
              </a>
            )}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="rounded-2xl bg-muted/50 border border-border px-6 py-8 text-center space-y-4">
        <h2 className="text-lg font-bold">Ready to visit us?</h2>
        <p className="text-sm text-muted-foreground">Book a table or order online — we'd love to have you.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href={`/restaurant/${restaurantName}/book-table`}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
            <CalendarDays className="size-4" /> Book a Table
          </Link>
          <Link href={`/restaurant/${restaurantName}`}
            className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
            View Menu <ChevronRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
