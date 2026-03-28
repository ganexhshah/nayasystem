import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  change: number
  changeLabel: string
  prefix?: string
}

export default function StatCard({ title, value, change, changeLabel, prefix }: StatCardProps) {
  const isPositive = change > 0
  const isNeutral = change === 0

  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-semibold mt-1">
          {prefix && <span className="text-base font-normal text-muted-foreground mr-0.5">{prefix}</span>}
          {value}
        </p>
        <div className="flex items-center gap-1 mt-2">
          {isNeutral ? (
            <Minus className="size-3.5 text-muted-foreground" />
          ) : isPositive ? (
            <TrendingUp className="size-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="size-3.5 text-red-500" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              isNeutral ? "text-muted-foreground" : isPositive ? "text-emerald-500" : "text-red-500"
            )}
          >
            {change}%
          </span>
          <span className="text-xs text-muted-foreground">{changeLabel}</span>
        </div>
      </CardContent>
    </Card>
  )
}
