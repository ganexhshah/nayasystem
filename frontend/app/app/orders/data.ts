export type OrderStatus = "Draft" | "KOT" | "Billed" | "Paid" | "Canceled" | "Out For Delivery" | "Payment Due" | "Delivered"
export type OrderType = "Dine In" | "Delivery" | "Pickup"
export type WaiterAcceptance = "Pending" | "Accepted" | "Declined"

export interface Order {
  id: number
  orderNo: string
  type: OrderType
  status: OrderStatus
  source: "POS" | "Shop"
  date: string
  items: number
  amount: string
  customerName: string
  waiter: string
  waiterAcceptance: WaiterAcceptance
  table?: string
  isKOT?: boolean
  kotCount?: number
  note?: string
}

export const ORDERS: Order[] = [
  { id: 12, orderNo: "Order #12", type: "Dine In", status: "Billed", source: "POS", date: "20/03/2026 10:56 PM", items: 1, amount: "336.00", customerName: "John Doe", waiter: "Garret Hill", waiterAcceptance: "Pending", table: "T-2" },
  { id: 11, orderNo: "Order #11", type: "Dine In", status: "Paid", source: "Shop", date: "20/03/2026 10:22 PM", items: 4, amount: "283.50", customerName: "John Doe", waiter: "Garret Hill", waiterAcceptance: "Pending", table: undefined },
  { id: 10, orderNo: "Order #10", type: "Dine In", status: "KOT", source: "Shop", date: "20/03/2026 10:21 PM", items: 0, amount: "896.96", customerName: "", waiter: "Garret Hill", waiterAcceptance: "Pending", table: "T-9", isKOT: true, kotCount: 1 },
  { id: 5, orderNo: "Order #5", type: "Dine In", status: "Paid", source: "POS", date: "20/03/2026 10:02 PM", items: 5, amount: "1,775.00", customerName: "Celestino Ledner", waiter: "Jaquelyn Battle", waiterAcceptance: "Pending", table: "T-6" },
  { id: 4, orderNo: "Order #4", type: "Dine In", status: "Paid", source: "POS", date: "20/03/2026 10:02 PM", items: 2, amount: "525.00", customerName: "Darwin Wilderman", waiter: "Jaquelyn Battle", waiterAcceptance: "Pending", table: "T-3" },
  { id: 3, orderNo: "Order #3", type: "Dine In", status: "Paid", source: "POS", date: "20/03/2026 10:02 PM", items: 4, amount: "2,688.00", customerName: "Nina Beier", waiter: "Jaquelyn Battle", waiterAcceptance: "Pending", table: "T-9" },
  { id: 2, orderNo: "Order #2", type: "Dine In", status: "Paid", source: "POS", date: "20/03/2026 10:02 PM", items: 1, amount: "567.00", customerName: "Fae Rodriguez", waiter: "Jaquelyn Battle", waiterAcceptance: "Pending", table: "T-7" },
  { id: 1, orderNo: "Order #1", type: "Dine In", status: "Paid", source: "POS", date: "20/03/2026 10:02 PM", items: 3, amount: "819.00", customerName: "Jaquelyn Battle", waiter: "Jaquelyn Battle", waiterAcceptance: "Pending", table: undefined },
]

export const STATUS_COLORS: Record<OrderStatus, string> = {
  Draft: "bg-gray-100 text-gray-600 border-gray-200",
  KOT: "bg-purple-100 text-purple-700 border-purple-200",
  Billed: "bg-blue-100 text-blue-700 border-blue-200",
  Paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Canceled: "bg-red-100 text-red-700 border-red-200",
  "Out For Delivery": "bg-orange-100 text-orange-700 border-orange-200",
  "Payment Due": "bg-amber-100 text-amber-700 border-amber-200",
  Delivered: "bg-teal-100 text-teal-700 border-teal-200",
}

export const ALL_STATUSES: OrderStatus[] = ["Draft", "KOT", "Billed", "Paid", "Canceled", "Out For Delivery", "Payment Due", "Delivered"]
export const DATE_FILTERS = ["Today", "Current Week", "Last Week", "Last 7 Days", "Current Month", "Last Month", "Current Year", "Last Year"]
export const REFRESH_OPTIONS = ["5 Seconds", "10 Seconds", "15 Seconds", "30 Seconds", "1 Minute"]
export const WAITERS = ["All", "Jaquelyn Battle", "Garret Hill"]
