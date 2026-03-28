"use client"

import type { ReactNode } from "react"
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js"
import { Bar, Doughnut, Line } from "react-chartjs-2"
import { CreditCard, LayoutGrid, TrendingUp, Utensils } from "lucide-react"

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip
)

type Props = {
  salesByDay: { date: string; total: number }[]
  paymentMethods: { method: string; count: number; total: number }[]
  topDishes: { name: string; qty: number; revenue: number }[]
  topTables: { table_name: string; order_count: number; revenue: number }[]
  currency: string
}

const PIE_COLORS = ["#4f46e5", "#14b8a6", "#f59e0b", "#ec4899", "#22c55e", "#8b5cf6"]
const GRID_COLOR = "rgba(148, 163, 184, 0.16)"
const TICK_COLOR = "#64748b"

export default function DashboardCharts({ salesByDay, paymentMethods, topDishes, topTables, currency }: Props) {
  const normalizedSales = buildLastSevenDays(salesByDay)

  const salesData = {
    labels: normalizedSales.map((entry) => entry.label),
    datasets: [
      {
        label: "Sales",
        data: normalizedSales.map((entry) => entry.total),
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79, 70, 229, 0.18)",
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 5,
        pointBackgroundColor: "#4f46e5",
      },
    ],
  }

  const paymentData = {
    labels: paymentMethods.map((method) => titleCase(method.method)),
    datasets: [
      {
        label: "Payments",
        data: paymentMethods.map((method) => Number(method.total)),
        backgroundColor: paymentMethods.map((_, index) => PIE_COLORS[index % PIE_COLORS.length]),
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  }

  const topDishesData = {
    labels: topDishes.map((dish) => truncate(dish.name, 18)),
    datasets: [
      {
        label: "Revenue",
        data: topDishes.map((dish) => Number(dish.revenue)),
        backgroundColor: "#4f46e5",
        borderRadius: 8,
        maxBarThickness: 28,
      },
    ],
  }

  const topTablesData = {
    labels: topTables.map((table) => table.table_name),
    datasets: [
      {
        label: "Revenue",
        data: topTables.map((table) => Number(table.revenue)),
        backgroundColor: "#10b981",
        borderRadius: 8,
        maxBarThickness: 28,
      },
    ],
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ChartCard
        title="Sales Trend"
        subtitle="Completed sales for the last 7 days"
        icon={<TrendingUp className="size-4 text-muted-foreground" />}
      >
        <Line
          data={salesData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => `${currency}${Number(context.parsed.y ?? 0).toLocaleString()}`,
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: TICK_COLOR, font: { size: 11 } },
              },
              y: {
                beginAtZero: true,
                grid: { color: GRID_COLOR },
                ticks: {
                  color: TICK_COLOR,
                  font: { size: 11 },
                  callback: (value) => `${currency}${Number(value).toLocaleString()}`,
                },
              },
            },
          }}
        />
      </ChartCard>

      <ChartCard
        title="Payment Methods"
        subtitle="Today’s payment method split"
        icon={<CreditCard className="size-4 text-muted-foreground" />}
      >
        {paymentMethods.length === 0 ? (
          <EmptyChart message="No payment data available today." />
        ) : (
          <Doughnut
            data={paymentData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "62%",
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    color: TICK_COLOR,
                    boxWidth: 10,
                    boxHeight: 10,
                    padding: 16,
                    font: { size: 11 },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (context) => `${context.label}: ${currency}${Number(context.parsed ?? 0).toLocaleString()}`,
                  },
                },
              },
            }}
          />
        )}
      </ChartCard>

      <ChartCard
        title="Top Dishes"
        subtitle="Today’s best performing dishes by revenue"
        icon={<Utensils className="size-4 text-muted-foreground" />}
      >
        {topDishes.length === 0 ? (
          <EmptyChart message="No dish sales data yet." />
        ) : (
          <Bar
            data={topDishesData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: "y",
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) => `${currency}${Number(context.parsed.x ?? 0).toLocaleString()}`,
                  },
                },
              },
              scales: {
                x: {
                  beginAtZero: true,
                  grid: { color: GRID_COLOR },
                  ticks: {
                    color: TICK_COLOR,
                    font: { size: 11 },
                    callback: (value) => `${currency}${Number(value).toLocaleString()}`,
                  },
                },
                y: {
                  grid: { display: false },
                  ticks: { color: TICK_COLOR, font: { size: 11 } },
                },
              },
            }}
          />
        )}
      </ChartCard>

      <ChartCard
        title="Top Tables"
        subtitle="Today’s highest earning tables"
        icon={<LayoutGrid className="size-4 text-muted-foreground" />}
      >
        {topTables.length === 0 ? (
          <EmptyChart message="No table revenue data yet." />
        ) : (
          <Bar
            data={topTablesData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) => `${currency}${Number(context.parsed.y ?? 0).toLocaleString()}`,
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: TICK_COLOR, font: { size: 11 } },
                },
                y: {
                  beginAtZero: true,
                  grid: { color: GRID_COLOR },
                  ticks: {
                    color: TICK_COLOR,
                    font: { size: 11 },
                    callback: (value) => `${currency}${Number(value).toLocaleString()}`,
                  },
                },
              },
            }}
          />
        )}
      </ChartCard>
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string
  subtitle: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {icon}
      </div>
      <div className="h-[280px]">{children}</div>
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function buildLastSevenDays(salesByDay: { date: string; total: number }[]) {
  const salesMap = new Map(salesByDay.map((entry) => [entry.date, Number(entry.total)]))

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)

    return {
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      total: salesMap.get(key) ?? 0,
    }
  })
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value
}
