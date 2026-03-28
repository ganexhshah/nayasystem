export type KotStatus = "Pending" | "In Kitchen" | "Food is Ready" | "Cancelled"

export interface KotItem {
  name: string
  qty: number
}

export interface Kot {
  id: number
  orderRef: string
  table: string
  orderType: string
  kitchen: string
  customer: string
  time: string
  status: KotStatus
  items: KotItem[]
}

export const ALL_KOTS: Kot[] = [
  {
    id: 19, orderRef: "Order #10", table: "T-10", orderType: "Dine In",
    kitchen: "Non-Veg Kitchen", customer: "John Doe", time: "21/03/2026 04:18 AM",
    status: "Pending",
    items: [{ name: "Chicken Manchurian", qty: 1 }, { name: "Naan", qty: 2 }],
  },
  {
    id: 10, orderRef: "Order #1", table: "T-9", orderType: "Dine In",
    kitchen: "Veg Kitchen", customer: "Jaquelyn Battle", time: "21/03/2026 04:02 AM",
    status: "Pending",
    items: [{ name: "Tandoori Roti", qty: 2 }],
  },
  {
    id: 5, orderRef: "Order #5", table: "T-1", orderType: "Dine In",
    kitchen: "Veg Kitchen", customer: "Jaquelyn Battle", time: "21/03/2026 04:02 AM",
    status: "Pending",
    items: [{ name: "Dal Makhani", qty: 1 }, { name: "Idli Sambar", qty: 1 }],
  },
  {
    id: 4, orderRef: "Order #4", table: "T-9", orderType: "Dine In",
    kitchen: "Veg Kitchen", customer: "Jaquelyn Battle", time: "21/03/2026 04:02 AM",
    status: "Pending",
    items: [{ name: "Naan", qty: 1 }, { name: "Spring Rolls", qty: 1 }],
  },
  {
    id: 3, orderRef: "Order #3", table: "T-5", orderType: "Dine In",
    kitchen: "Non-Veg Kitchen", customer: "Jaquelyn Battle", time: "21/03/2026 04:02 AM",
    status: "Pending",
    items: [{ name: "Chicken Manchurian", qty: 1 }],
  },
  {
    id: 2, orderRef: "Order #2", table: "T-8", orderType: "Dine In",
    kitchen: "Veg Kitchen", customer: "Jaquelyn Battle", time: "21/03/2026 04:02 AM",
    status: "In Kitchen",
    items: [{ name: "Spring Rolls", qty: 3 }, { name: "Dal Makhani", qty: 3 }, { name: "Tandoori Roti", qty: 1 }],
  },
  {
    id: 1, orderRef: "Order #1", table: "T-9", orderType: "Dine In",
    kitchen: "Non-Veg Kitchen", customer: "Jaquelyn Battle", time: "21/03/2026 04:02 AM",
    status: "In Kitchen",
    items: [{ name: "Butter Chicken", qty: 3 }],
  },
]

export const TIME_PERIODS = [
  "Today", "Current Week", "Last Week", "Last 7 Days",
  "Current Month", "Last Month", "Current Year", "Last Year",
]
