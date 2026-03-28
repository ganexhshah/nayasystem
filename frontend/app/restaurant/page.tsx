"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  UtensilsCrossed, ArrowRight, Star, Zap, Shield, Globe, Search, MapPin,
} from "lucide-react"
import PricingSection from "@/components/landing/PricingSection"
import { usePublicRestaurants } from "@/hooks/useApi"

export default function RestaurantDirectoryPage() {
  const { data: restaurants = [], isLoading } = usePublicRestaurants()
  const [search, setSearch] = useState("")

  const filteredRestaurants = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return restaurants

    return restaurants.filter((restaurant) =>
      [
        restaurant.name,
        restaurant.city,
        restaurant.country,
        restaurant.address,
        restaurant.tagline,
        restaurant.cuisine_type,
      ].some((value) => String(value ?? "").toLowerCase().includes(query))
    )
  }, [restaurants, search])

  const ratedRestaurants = filteredRestaurants.filter((restaurant) => (restaurant.total_ratings ?? 0) > 0)
  const avgRating = ratedRestaurants.length > 0
    ? ratedRestaurants.reduce((sum, restaurant) => sum + Number(restaurant.avg_rating ?? 0), 0) / ratedRestaurants.length
    : 0

  const stats = [
    { value: String(restaurants.length), label: "Registered Restaurants" },
    { value: String(filteredRestaurants.length), label: "Visible Results" },
    { value: String(ratedRestaurants.length), label: "Rated Restaurants" },
    { value: ratedRestaurants.length > 0 ? avgRating.toFixed(1) : "0.0", label: "Avg Rating" },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <UtensilsCrossed className="size-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">NayaSystem</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <Link href="/restaurant" className="hover:text-white transition-colors">Restaurants</Link>
            <Link href="/rate" className="hover:text-white transition-colors">Ratings</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <a href="#directory" className="hover:text-white transition-colors">Directory</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/restaurant" className="hidden lg:inline-flex text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">
              Browse Restaurants
            </Link>
            <Link href="/auth/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link href="/auth/signup" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium px-3 py-1.5 rounded-full">
            <Zap className="size-3" /> Discover live restaurants on NayaSystem
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Explore every restaurant
            <br />
            <span className="text-indigo-400">registered in your system.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Browse active restaurant storefronts, search by city or cuisine, and jump directly into each public menu and ordering experience.
          </p>
          <div className="relative max-w-2xl mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search restaurants, cities, cuisine, or tagline..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 py-4 pl-11 pr-4 text-sm text-slate-200 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            <a
              href="#directory"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Browse Restaurants <ArrowRight className="size-4" />
            </a>
            <Link
              href="/"
              className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Back to Home
            </Link>
          </div>
          <p className="text-xs text-slate-500">Live public restaurant directory powered by your registered data</p>
        </div>
      </section>

      <section className="py-12 border-y border-slate-800">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map((item) => (
            <div key={item.label}>
              <p className="text-3xl font-extrabold text-white">{item.value}</p>
              <p className="text-sm text-slate-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="directory" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <p className="text-indigo-400 text-sm font-medium uppercase tracking-widest">Restaurant Directory</p>
            <h2 className="text-3xl sm:text-4xl font-bold">All active restaurants in one place</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Open any restaurant storefront directly from here and explore its live menu, ratings, and ordering flow.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-72 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-16 text-center">
              <p className="text-lg font-semibold text-white">No restaurants matched your search.</p>
              <p className="mt-2 text-sm text-slate-400">Try another name, city, or cuisine keyword.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRestaurants.map((restaurant) => {
                const location = [restaurant.city, restaurant.country].filter(Boolean).join(", ")

                return (
                  <div
                    key={restaurant.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      {restaurant.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={restaurant.logo}
                          alt={restaurant.name}
                          className="size-16 rounded-2xl object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="size-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-xl font-bold text-indigo-400">
                          {restaurant.name.charAt(0)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-white mb-1.5 line-clamp-1">{restaurant.name}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                              {restaurant.tagline || "Public ordering, ratings, and restaurant profile available."}
                            </p>
                          </div>
                          {(restaurant.avg_rating ?? 0) > 0 && (
                            <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
                              <Star className="size-3.5 fill-amber-400 text-amber-400" />
                              {Number(restaurant.avg_rating).toFixed(1)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {restaurant.cuisine_type && (
                        <span className="rounded-full bg-indigo-600/10 px-3 py-1 text-xs font-medium text-indigo-300">
                          {restaurant.cuisine_type}
                        </span>
                      )}
                      {(restaurant.menu_items_count ?? 0) > 0 && (
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                          {restaurant.menu_items_count} menu items
                        </span>
                      )}
                      {(restaurant.total_ratings ?? 0) > 0 && (
                        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                          {restaurant.total_ratings} reviews
                        </span>
                      )}
                    </div>

                    <div className="mt-5 space-y-2 text-sm text-slate-400">
                      {location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-indigo-400" />
                          <span className="line-clamp-1">{location}</span>
                        </div>
                      )}
                      {restaurant.address && (
                        <p className="line-clamp-2 text-sm text-slate-500">{restaurant.address}</p>
                      )}
                    </div>

                    <div className="mt-6">
                      <Link
                        href={`/restaurant/${restaurant.slug}`}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-3 rounded-xl transition-colors text-sm"
                      >
                        Open Restaurant <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section id="about" className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <p className="text-indigo-400 text-sm font-medium uppercase tracking-widest">Why This Directory</p>
            <h2 className="text-3xl font-bold leading-snug">A single public place for every restaurant storefront</h2>
            <p className="text-slate-400 leading-relaxed">
              This page helps guests discover all restaurants registered in your system, compare locations and ratings, and enter each live ordering experience without needing direct links.
            </p>
            <ul className="space-y-3">
              {[
                { icon: Shield, text: "Shows only active restaurants" },
                { icon: Globe, text: "Direct links to public ordering pages" },
                { icon: Zap, text: "Live search across name, city, and cuisine" },
                { icon: Star, text: "Public rating summary on each card" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="size-6 rounded-lg bg-indigo-600/10 flex items-center justify-center shrink-0">
                    <Icon className="size-3.5 text-indigo-400" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Restaurants live", value: String(restaurants.length), color: "text-emerald-400" },
              { label: "Visible now", value: String(filteredRestaurants.length), color: "text-indigo-400" },
              { label: "Reviewed", value: String(ratedRestaurants.length), color: "text-amber-400" },
              { label: "Search ready", value: "Instant", color: "text-red-400" },
            ].map((card) => (
              <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div id="pricing">
        <PricingSection />
      </div>

      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">Want your restaurant listed here too?</h2>
          <p className="text-slate-400">
            Create your restaurant, publish your public menu, and let guests discover and order directly through NayaSystem.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/auth/signup"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Get started free <ArrowRight className="size-4" />
            </Link>
          </div>
          <p className="text-xs text-slate-500">No credit card required · Cancel anytime</p>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <UtensilsCrossed className="size-3 text-white" />
            </div>
            <span className="font-semibold text-slate-300">NayaSystem</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/auth/signup" className="hover:text-white transition-colors">Sign up</Link>
            <Link href="/admin/auth/login" className="hover:text-white transition-colors">Admin</Link>
          </div>
          <p>© {new Date().getFullYear()} NayaSystem. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
