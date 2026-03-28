"use client"

import Link from "next/link"
import {
  UtensilsCrossed, ArrowRight, Star, MessageSquareQuote, Shield, Globe, Zap,
} from "lucide-react"
import PricingSection from "@/components/landing/PricingSection"
import { PublicRatingsSection } from "@/components/restaurant/PublicRatingsSection"
import { usePublicRatings } from "@/hooks/useApi"

const TRUST_POINTS = [
  { icon: Shield, text: "Only served orders can submit ratings" },
  { icon: Globe, text: "Guest and customer reviews are both visible" },
  { icon: Zap, text: "New feedback appears automatically" },
]

export default function RatePage() {
  const { data: ratings = [], isLoading } = usePublicRatings(30)

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
    : null

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
            <a href="#reviews" className="hover:text-white transition-colors">Reviews</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
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
            <MessageSquareQuote className="size-3" /> Public ratings and guest feedback
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Real restaurant reviews,
            <br />
            <span className="text-indigo-400">all in one place.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Every review here comes from a completed order. Guests and signed-in customers can both rate their experience, and restaurants can build trust with live public feedback.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            <a
              href="#reviews"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              View ratings <ArrowRight className="size-4" />
            </a>
            <Link
              href="/"
              className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Back to homepage
            </Link>
          </div>
          {averageRating !== null && (
            <p className="text-xs text-slate-500">
              Current public average: {averageRating.toFixed(1)} stars from {ratings.length} recent review{ratings.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </section>

      <section className="py-12 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-6 grid gap-4 sm:grid-cols-3 text-center">
          {TRUST_POINTS.map(({ icon: Icon, text }) => (
            <div key={text} className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-6">
              <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-indigo-600/10">
                <Icon className="size-5 text-indigo-400" />
              </div>
              <p className="text-sm text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="reviews" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-2xl bg-slate-900 border border-slate-800" />
              ))}
            </div>
          ) : (
            <PublicRatingsSection
              title="Customer Ratings"
              subtitle="See what guests and signed-in customers are saying across restaurants."
              ratings={ratings}
              averageRating={averageRating}
              totalRatings={ratings.length}
              showRestaurant
              emptyMessage="No public ratings have been posted yet."
              variant="dark"
            />
          )}
        </div>
      </section>

      <div id="pricing">
        <PricingSection />
      </div>

      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-600/10 px-3 py-1 text-xs font-medium text-indigo-400">
            <Star className="size-3" />
            Powered by live order feedback
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">Want reviews like these for your restaurant?</h2>
          <p className="text-slate-400">
            Let customers scan, order, track status, and rate the experience after service. NayaSystem handles the full journey.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/auth/signup"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Get started free <ArrowRight className="size-4" />
            </Link>
          </div>
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
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
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
