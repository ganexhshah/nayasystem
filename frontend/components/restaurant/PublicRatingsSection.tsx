"use client"

import Link from "next/link"
import { MessageSquareQuote, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PublicRating } from "@/lib/types"

type Props = {
  title: string
  subtitle?: string
  ratings: PublicRating[]
  averageRating?: number | null
  totalRatings?: number | null
  showRestaurant?: boolean
  emptyMessage?: string
  variant?: "default" | "dark"
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn(
            "size-4",
            value <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
          )}
        />
      ))}
    </div>
  )
}

function formatDate(value?: string) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return date.toLocaleDateString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function PublicRatingsSection({
  title,
  subtitle,
  ratings,
  averageRating,
  totalRatings,
  showRestaurant = false,
  emptyMessage = "No ratings yet.",
  variant = "default",
}: Props) {
  const isDark = variant === "dark"

  return (
    <section className="space-y-5">
      <div
        className={cn(
          "flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-end sm:justify-between",
          isDark
            ? "border border-slate-800 bg-slate-900"
            : "border border-border bg-card/80 shadow-sm"
        )}
      >
        <div className="space-y-2">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
              isDark ? "bg-indigo-600/10 text-indigo-400" : "bg-primary/10 text-primary"
            )}
          >
            <MessageSquareQuote className="size-3.5" />
            Real Guest Feedback
          </div>
          <div className="space-y-1">
            <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-foreground")}>{title}</h2>
            {subtitle && (
              <p className={cn("text-sm", isDark ? "text-slate-400" : "text-muted-foreground")}>{subtitle}</p>
            )}
          </div>
        </div>

        {typeof averageRating === "number" && totalRatings !== undefined && totalRatings !== null && (
          <div className={cn("rounded-2xl px-4 py-3 text-sm", isDark ? "bg-slate-950/70" : "bg-muted/60")}>
            <p className={cn("text-xs uppercase tracking-wide", isDark ? "text-slate-500" : "text-muted-foreground")}>
              Average Rating
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className={cn("text-2xl font-bold", isDark ? "text-white" : "text-foreground")}>
                {averageRating.toFixed(1)}
              </span>
              <Star className="size-5 fill-amber-400 text-amber-400" />
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-muted-foreground")}>
              {totalRatings} review{totalRatings === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </div>

      {ratings.length === 0 ? (
        <div
          className={cn(
            "rounded-2xl border border-dashed px-6 py-12 text-center",
            isDark ? "border-slate-700 bg-slate-900/60" : "border-border bg-muted/30"
          )}
        >
          <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-foreground")}>{emptyMessage}</p>
          <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-muted-foreground")}>
            Served orders with ratings will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ratings.map((rating) => (
            <article
              key={rating.id}
              className={cn(
                "rounded-2xl border p-5",
                isDark ? "border-slate-800 bg-slate-900 shadow-none" : "border-border bg-card shadow-sm"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn("truncate text-sm font-semibold", isDark ? "text-white" : "text-foreground")}>
                    {rating.reviewer_name}
                  </p>
                  <div className={cn("mt-1 flex flex-wrap items-center gap-2 text-xs", isDark ? "text-slate-400" : "text-muted-foreground")}>
                    <span className={cn("rounded-full px-2 py-0.5 font-medium capitalize", isDark ? "bg-slate-800" : "bg-muted")}>
                      {rating.reviewer_type === "guest" ? "Guest" : "Customer"}
                    </span>
                    {formatDate(rating.created_at) && <span>{formatDate(rating.created_at)}</span>}
                  </div>
                </div>
                <StarRow rating={rating.rating} />
              </div>

              {rating.review ? (
                <p className={cn("mt-4 text-sm leading-6", isDark ? "text-slate-300" : "text-muted-foreground")}>
                  {rating.review}
                </p>
              ) : (
                <p className={cn("mt-4 text-sm italic", isDark ? "text-slate-400" : "text-muted-foreground")}>
                  Rated {rating.rating} stars.
                </p>
              )}

              <div
                className={cn(
                  "mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs",
                  isDark ? "border-slate-800 text-slate-500" : "border-border text-muted-foreground"
                )}
              >
                <span>{rating.order_number}</span>
                {showRestaurant && rating.restaurant?.slug ? (
                  <Link
                    href={`/restaurant/${rating.restaurant.slug}`}
                    className={cn("font-medium hover:underline", isDark ? "text-indigo-400" : "text-primary")}
                  >
                    {rating.restaurant.name ?? "View Restaurant"}
                  </Link>
                ) : (
                  <span className="font-medium">{rating.restaurant?.name ?? ""}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
