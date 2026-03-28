// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: number
  name: string
  email: string
  phone?: string
  avatar?: string
  restaurant_id: number
  restaurant?: Restaurant
  roles?: { name: string }[]
  is_active: boolean
}

export interface AuthResponse {
  user: User
  token: string
}

// ── Restaurant ────────────────────────────────────────────────────────────────
export interface Restaurant {
  id: number
  name: string
  slug: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  logo?: string
  currency: string
  timezone: string
  tax_rate: number
  service_charge: number
  is_active: boolean
  settings?: Record<string, unknown>
}

export interface PublicRestaurantDirectoryItem extends Restaurant {
  tagline?: string | null
  cuisine_type?: string | null
  avg_rating?: number | null
  total_ratings?: number
  menu_items_count?: number
}

export interface PublicRating {
  id: number
  order_number: string
  rating: number
  review?: string | null
  created_at: string
  reviewer_name: string
  reviewer_type: "customer" | "guest"
  restaurant: {
    id?: number
    name?: string
    slug?: string
    logo?: string
  }
}

export interface RestaurantRatingsResponse {
  ratings: PublicRating[]
  summary: {
    average_rating: number
    total_ratings: number
  }
}

// ── Menu ──────────────────────────────────────────────────────────────────────
export interface MenuCategory {
  id: number
  restaurant_id: number
  name: string
  description?: string
  image?: string
  sort_order: number
  is_active: boolean
}

export interface MenuItem {
  id: number
  restaurant_id: number
  category_id: number
  category?: MenuCategory
  name: string
  description?: string
  price: number
  image?: string
  sku?: string
  is_veg: boolean
  item_type?: "Veg" | "Non Veg" | "Egg" | "Drink" | "Halal" | "Other"
  is_available: boolean
  is_instant: boolean   // no kitchen prep needed — served immediately
  sort_order: number
  tax_rate: number
  preparation_time?: number
  tags?: string[]
}

export interface ModifierGroup {
  id: number
  restaurant_id: number
  name: string
  min_select: number
  max_select: number
  is_required: boolean
  is_active: boolean
  modifiers?: Modifier[]
}

export interface Modifier {
  id: number
  modifier_group_id: number
  group?: ModifierGroup
  name: string
  price: number
  is_active: boolean
}

export interface Menu {
  id: number
  restaurant_id: number
  name: string
  description?: string
  is_active: boolean
  items?: MenuItem[]
}

// ── Tables ────────────────────────────────────────────────────────────────────
export interface TableArea {
  id: number
  restaurant_id: number
  name: string
  description?: string
  is_active: boolean
  tables?: Table[]
}

export interface Table {
  id: number
  restaurant_id: number
  area_id?: number
  area?: TableArea
  name: string
  type: "table" | "cabin"
  capacity: number
  status: "available" | "occupied" | "reserved" | "cleaning"
  qr_code?: string
  is_active: boolean
  image?: string
  image_url?: string
  description?: string
  special_features?: string[]
}

// ── Orders ────────────────────────────────────────────────────────────────────
export interface OrderItem {
  id: number
  order_id: number
  menu_item_id?: number
  kot_id?: number
  name: string
  price: number
  quantity: number
  modifiers?: { name: string; price: number }[]
  notes?: string
  status: string
}

export interface Order {
  id: number
  restaurant_id: number
  table_id?: number
  customer_id?: number
  user_id?: number
  order_number: string
  order_type: "dine_in" | "takeaway" | "delivery" | "online"
  status: "pending" | "confirmed" | "preparing" | "ready" | "served" | "completed" | "cancelled"
  payment_status: "unpaid" | "partial" | "paid" | "refunded"
  waiter_acceptance: "pending" | "accepted" | "declined"
  subtotal: number
  tax: number
  service_charge: number
  discount: number
  total: number
  delivery_fee: number
  notes?: string
  delivery_address?: string
  table?: Table
  customer?: Customer
  user?: User
  items?: OrderItem[]
  kots?: Kot[]
  payments?: Payment[]
  created_at: string
}

export interface Kot {
  id: number
  restaurant_id: number
  order_id: number
  kitchen_id?: number
  kot_number: string
  status: "pending" | "preparing" | "ready" | "served" | "cancelled"
  notes?: string
  printed_at?: string
  order?: Order
  items?: OrderItem[]
  created_at: string
}

// ── Customers ─────────────────────────────────────────────────────────────────
export interface Customer {
  id: number
  restaurant_id: number
  name: string
  email?: string
  phone?: string
  address?: string
  loyalty_points: number
  total_orders: number
  total_spent: number
  notes?: string
}

// ── Reservations ──────────────────────────────────────────────────────────────
export interface Reservation {
  id: number
  restaurant_id: number
  table_id?: number
  customer_id?: number
  guest_name: string
  guest_phone: string
  guest_email?: string
  party_size: number
  reserved_at: string
  status: "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show"
  notes?: string
  special_package?: string
  pre_order_items?: { name: string; price: number; qty: number }[]
  package_price?: number
  table?: Table
  customer?: Customer
}

// ── Payments ──────────────────────────────────────────────────────────────────
export interface Payment {
  id: number
  restaurant_id: number
  order_id: number
  customer_id?: number
  amount: number
  method: "cash" | "card" | "upi" | "online" | "due"
  status: "pending" | "completed" | "failed" | "refunded"
  reference?: string
  notes?: string
  paid_at?: string
  order?: Order
  customer?: Customer
}

// ── Expenses ──────────────────────────────────────────────────────────────────
export interface ExpenseCategory {
  id: number
  restaurant_id: number
  name: string
  description?: string
  is_active: boolean
}

export interface Expense {
  id: number
  restaurant_id: number
  category_id: number
  user_id?: number
  title: string
  amount: number
  date: string
  notes?: string
  receipt?: string
  category?: ExpenseCategory
}

// ── Staff ─────────────────────────────────────────────────────────────────────
export interface Staff extends User {
  roles: { name: string }[]
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export interface InventoryCategory {
  id: number
  restaurant_id: number
  name: string
  description?: string
  is_active: boolean
}

export interface InventoryUnit {
  id: number
  restaurant_id: number
  name: string
  abbreviation: string
}

export interface InventoryItem {
  id: number
  restaurant_id: number
  category_id?: number
  unit_id?: number
  name: string
  sku?: string
  cost_price: number
  reorder_level: number
  is_active: boolean
  category?: InventoryCategory
  unit?: InventoryUnit
  stock?: InventoryStock
}

export interface InventoryStock {
  id: number
  item_id: number
  quantity: number
  last_updated_at?: string
  item?: InventoryItem
}

export interface InventoryMovement {
  id: number
  restaurant_id: number
  item_id: number
  user_id?: number
  type: "purchase" | "sale" | "adjustment" | "waste" | "transfer"
  quantity: number
  cost_price?: number
  notes?: string
  item?: InventoryItem
  created_at: string
}

export interface Supplier {
  id: number
  restaurant_id: number
  name: string
  email?: string
  phone?: string
  address?: string
  contact_person?: string
  notes?: string
  is_active: boolean
}

export interface PurchaseOrder {
  id: number
  restaurant_id: number
  supplier_id: number
  po_number: string
  status: "draft" | "ordered" | "partial" | "received" | "cancelled"
  total: number
  notes?: string
  expected_at?: string
  received_at?: string
  supplier?: Supplier
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: number
  purchase_order_id: number
  item_id: number
  quantity: number
  received_quantity: number
  unit_price: number
  item?: InventoryItem
}

export interface Recipe {
  id: number
  restaurant_id: number
  menu_item_id?: number
  name: string
  yield_quantity?: number
  notes?: string
  menu_item?: MenuItem
  ingredients?: RecipeIngredient[]
}

export interface RecipeIngredient {
  id: number
  recipe_id: number
  item_id: number
  quantity: number
  unit_id?: number
  item?: InventoryItem
  unit?: InventoryUnit
}

export interface BatchInventory {
  id: number
  restaurant_id: number
  user_id?: number
  batch_number: string
  type: "production" | "waste" | "adjustment"
  status: "draft" | "completed"
  notes?: string
  processed_at?: string
  items?: BatchInventoryItem[]
}

export interface BatchInventoryItem {
  id: number
  batch_inventory_id: number
  item_id: number
  quantity: number
  notes?: string
  item?: InventoryItem
}

// ── Kitchen ───────────────────────────────────────────────────────────────────
export interface Kitchen {
  id: number
  restaurant_id: number
  name: string
  type: "default" | "veg" | "non_veg"
  is_active: boolean
}

// ── Waiter Requests ───────────────────────────────────────────────────────────
export interface WaiterRequest {
  id: number
  restaurant_id: number
  table_id: number
  order_id?: number
  type: "waiter" | "bill" | "water" | "other"
  status: "pending" | "acknowledged" | "completed"
  notes?: string
  table?: Table
  order?: Order
  created_at: string
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardData {
  today_sales: number
  today_orders: number
  month_sales: number
  total_customers: number
  pending_orders: number
  recent_orders: Order[]
  sales_by_day: { date: string; total: number }[]
  today_orders_detail: Order[]
  payment_methods_today: { method: string; count: number; total: number }[]
  top_selling_dishes: { name: string; qty: number; revenue: number }[]
  top_selling_tables: { table_name: string; order_count: number; revenue: number }[]
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}
