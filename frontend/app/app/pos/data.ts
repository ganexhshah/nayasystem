export type OrderType = "delivery" | "dine-in" | "pickup"
export type OrderStatus = "Order Confirmed" | "Order Preparing" | "Ready" | "Billed" | "Paid"

export interface MenuItem {
  id: number
  name: string
  category: string
  price: number
  veg: boolean
  description: string
}

export interface CartItem {
  id: number
  name: string
  price: number
  veg: boolean
  qty: number
  note: string
}

export interface Area {
  name: string
  tables: { id: string; seats: number }[]
}

export const CATEGORIES = [
  "All", "Starters", "Main Course", "Breads", "Rice & Noodles", "Soups", "Desserts", "Beverages",
]

export const MENU_ITEMS: MenuItem[] = [
  { id: 1,  name: "Paneer Tikka",               category: "Starters",       price: 240, veg: true,  description: "Grilled cottage cheese with spices" },
  { id: 2,  name: "Spring Rolls",               category: "Starters",       price: 150, veg: true,  description: "Crispy vegetable spring rolls" },
  { id: 3,  name: "Medu Vada",                  category: "Starters",       price: 80,  veg: true,  description: "Crispy lentil doughnuts" },
  { id: 4,  name: "Chilli Paneer",              category: "Starters",       price: 240, veg: true,  description: "Spicy cottage cheese with peppers" },
  { id: 5,  name: "Veg Manchow Soup",           category: "Soups",          price: 120, veg: true,  description: "Spicy manchow soup with vegetables" },
  { id: 6,  name: "Butter Chicken",             category: "Main Course",    price: 320, veg: false, description: "Creamy tomato-based chicken curry" },
  { id: 7,  name: "Dal Makhani",                category: "Main Course",    price: 180, veg: true,  description: "Slow-cooked black lentils in butter" },
  { id: 8,  name: "Masala Dosa",                category: "Main Course",    price: 120, veg: true,  description: "Crispy rice crepe with potato filling" },
  { id: 9,  name: "Idli Sambar",                category: "Main Course",    price: 90,  veg: true,  description: "Steamed rice cakes with lentil soup" },
  { id: 10, name: "Uttapam",                    category: "Main Course",    price: 130, veg: true,  description: "Thick rice pancake with toppings" },
  { id: 11, name: "Chicken Manchurian",         category: "Main Course",    price: 260, veg: false, description: "Crispy chicken in manchurian sauce" },
  { id: 12, name: "Hyderabadi Chicken Biryani", category: "Rice & Noodles", price: 300, veg: false, description: "Aromatic basmati rice with chicken" },
  { id: 13, name: "Vegetable Hakka Noodles",    category: "Rice & Noodles", price: 180, veg: true,  description: "Stir-fried noodles with vegetables" },
  { id: 14, name: "Tandoori Roti",              category: "Breads",         price: 25,  veg: true,  description: "Whole wheat bread from tandoor" },
  { id: 15, name: "Naan",                       category: "Breads",         price: 40,  veg: true,  description: "Soft leavened bread from tandoor" },
  { id: 16, name: "Gulab Jamun",                category: "Desserts",       price: 80,  veg: true,  description: "Soft milk dumplings in sugar syrup" },
  { id: 17, name: "Mango Lassi",                category: "Beverages",      price: 90,  veg: true,  description: "Chilled mango yogurt drink" },
  { id: 18, name: "Masala Chai",                category: "Beverages",      price: 40,  veg: true,  description: "Spiced Indian tea with milk" },
]

export const AREAS: Area[] = [
  {
    name: "Lounge",
    tables: [
      { id: "T-1", seats: 8 }, { id: "T-4", seats: 4 }, { id: "T-5", seats: 7 },
      { id: "T-7", seats: 5 }, { id: "T-8", seats: 7 }, { id: "T-9", seats: 2 },
    ],
  },
  { name: "Roof Top", tables: [] },
  {
    name: "Garden",
    tables: [
      { id: "T-2", seats: 6 }, { id: "T-3", seats: 4 }, { id: "T-6", seats: 3 },
    ],
  },
]

export const PAYMENT_METHODS = ["Cash", "Card", "UPI", "Bank Transfer", "Due"]

export const QUICK_AMOUNTS = [50, 100, 500, 1000]

// NOTE: TAX_RATE and WAITERS are now fetched from API via usePOSConfig hook
// This ensures data is always in sync with restaurant configuration
