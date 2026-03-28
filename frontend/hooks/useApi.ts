import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, apiUpload } from "@/lib/api"
import type {
  DashboardData, MenuCategory, MenuItem, ModifierGroup, Modifier, Menu,
  TableArea, Table, Order, Kot, Customer, Reservation, Payment,
  ExpenseCategory, Expense, Staff, InventoryCategory, InventoryUnit,
  InventoryItem, InventoryStock, InventoryMovement, Supplier, PurchaseOrder,
  Recipe, BatchInventory, Kitchen, WaiterRequest, Restaurant, Paginated,
  PublicRating, RestaurantRatingsResponse, PublicRestaurantDirectoryItem,
} from "@/lib/types"

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const useDashboard = (params?: { branch_id?: number }) =>
  useQuery({
    queryKey: ["dashboard", params],
    queryFn: () => api.get<DashboardData>("/dashboard", params as Record<string, string | number | undefined>),
    refetchInterval: 15_000, // refresh every 15s
    retry: 2, // Retry failed requests
    staleTime: 5_000, // Keep data fresh for 5 seconds
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
  })

// ── Restaurant Settings ───────────────────────────────────────────────────────
export const useSettings = () =>
  useQuery({ queryKey: ["settings"], queryFn: () => api.get<Restaurant>("/settings") })

export const usePOSConfig = () => {
  const { data: restaurant } = useSettings()
  const { data: staff } = useStaff()
  
  return {
    taxRate: restaurant?.tax_rate ?? 0,
    serviceCharge: restaurant?.service_charge ?? 0,
    waiters: staff?.filter((member) => member.roles?.some((role) => role.name === "waiter" || role.name === "staff")).map((member) => member.name) ?? [],
    paymentMethods: ["Cash", "Card", "UPI", "Bank Transfer", "Due"],
    quickAmounts: [50, 100, 500, 1000],
    isLoading: !restaurant || !staff,
  }
}

export const useUpdateSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Restaurant>) => api.put<Restaurant>("/settings", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  })
}

export const useUpdatePaymentMethod = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { method: string; enabled: boolean; account_name?: string; account_number?: string; instructions?: string }) =>
      api.post("/settings/payment-method", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  })
}

export const useUploadPaymentQr = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ method, file }: { method: string; file: File }) => {
      const fd = new FormData()
      fd.append("method", method)
      fd.append("qr_image", file)
      return apiUpload<{ url: string; method: string }>("/settings/payment-qr", fd)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  })
}

// ── Menu Categories ───────────────────────────────────────────────────────────
export const useMenuCategories = () =>
  useQuery({ queryKey: ["menu-categories"], queryFn: () => api.get<MenuCategory[]>("/menu-categories") })

export const useCreateMenuCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<MenuCategory>) => api.post<MenuCategory>("/menu-categories", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-categories"] }),
  })
}

export const useUpdateMenuCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<MenuCategory> & { id: number }) =>
      api.put<MenuCategory>(`/menu-categories/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-categories"] }),
  })
}

export const useDeleteMenuCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/menu-categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-categories"] }),
  })
}

// ── Menu Items ────────────────────────────────────────────────────────────────
export const useMenuItems = (params?: { category_id?: number; search?: string }) =>
  useQuery({
    queryKey: ["menu-items", params],
    queryFn: () => api.get<Paginated<MenuItem>>("/menu-items", params as Record<string, string | number | undefined>),
  })

export const useCreateMenuItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<MenuItem>) => api.post<MenuItem>("/menu-items", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  })
}

export const useUpdateMenuItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<MenuItem> & { id: number }) =>
      api.put<MenuItem>(`/menu-items/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  })
}

export const useDeleteMenuItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/menu-items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  })
}

// ── Modifier Groups ───────────────────────────────────────────────────────────
export const useModifierGroups = () =>
  useQuery({ queryKey: ["modifier-groups"], queryFn: () => api.get<ModifierGroup[]>("/modifier-groups") })

export const useCreateModifierGroup = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<ModifierGroup>) => api.post<ModifierGroup>("/modifier-groups", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modifier-groups"] }),
  })
}

export const useUpdateModifierGroup = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ModifierGroup> & { id: number }) =>
      api.put<ModifierGroup>(`/modifier-groups/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modifier-groups"] }),
  })
}

export const useDeleteModifierGroup = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/modifier-groups/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modifier-groups"] }),
  })
}

// ── Modifiers ─────────────────────────────────────────────────────────────────
export const useModifiers = () =>
  useQuery({ queryKey: ["modifiers"], queryFn: () => api.get<Modifier[]>("/modifiers") })

export const useCreateModifier = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Modifier>) => api.post<Modifier>("/modifiers", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modifiers"] }),
  })
}

export const useUpdateModifier = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Modifier> & { id: number }) =>
      api.put<Modifier>(`/modifiers/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modifiers"] }),
  })
}

export const useDeleteModifier = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/modifiers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modifiers"] }),
  })
}

// ── Menus ─────────────────────────────────────────────────────────────────────
export const useMenus = () =>
  useQuery({ queryKey: ["menus"], queryFn: () => api.get<Menu[]>("/menus") })

export const useCreateMenu = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Menu>) => api.post<Menu>("/menus", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
  })
}

export const useUpdateMenu = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Menu> & { id: number }) => api.put<Menu>(`/menus/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
  })
}

export const useDeleteMenu = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/menus/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
  })
}

// ── Table Areas ───────────────────────────────────────────────────────────────
export const useTableAreas = () =>
  useQuery({ queryKey: ["table-areas"], queryFn: () => api.get<TableArea[]>("/table-areas") })

export const useCreateTableArea = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<TableArea>) => api.post<TableArea>("/table-areas", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["table-areas"] }),
  })
}

export const useUpdateTableArea = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<TableArea> & { id: number }) =>
      api.put<TableArea>(`/table-areas/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["table-areas"] }),
  })
}

export const useDeleteTableArea = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/table-areas/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["table-areas"] }),
  })
}

// ── Tables ────────────────────────────────────────────────────────────────────
export const useTables = () =>
  useQuery({ queryKey: ["tables"], queryFn: () => api.get<Table[]>("/tables") })

export const useCreateTable = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Table>) => api.post<Table>("/tables", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  })
}

export const useUpdateTable = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Table> & { id: number }) => api.put<Table>(`/tables/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  })
}

export const useDeleteTable = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/tables/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  })
}

export const useUploadTableImage = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const fd = new FormData()
      fd.append("image", file)
      return api.upload<{ image: string; image_url: string }>(`/tables/${id}/image`, fd)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  })
}

// ── Orders ────────────────────────────────────────────────────────────────────
export const useOrders = (params?: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: ["orders", params],
    queryFn: () => api.get<Paginated<Order>>("/orders", params),
    refetchInterval: 10_000, // auto-refresh every 10s for real-time status sync
    retry: 2, // Retry failed requests twice
    staleTime: 3_000, // Keep order data fresh for 3 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

export const useCreateOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => api.post<Order>("/pos/orders", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  })
}

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.post<Order>(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] })
      qc.invalidateQueries({ queryKey: ["kots"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

export const useAssignWaiter = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, user_id }: { id: number; user_id: number | null }) =>
      api.post<Order>(`/orders/${id}/assign-waiter`, { user_id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orders"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }) },
  })
}

export const useUpdateWaiterAcceptance = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, waiter_acceptance }: { id: number; waiter_acceptance: string }) =>
      api.post<Order>(`/orders/${id}/waiter-acceptance`, { waiter_acceptance }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orders"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }) },
  })
}

// ── KOTs ──────────────────────────────────────────────────────────────────────
export const useKots = (params?: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: ["kots", params],
    queryFn: () => api.get<Paginated<Kot>>("/kots", params),
    refetchInterval: 10_000, // auto-refresh every 10s for real-time kitchen sync
  })

export const useUpdateKotStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.post<Kot>(`/kots/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kots"] })
      qc.invalidateQueries({ queryKey: ["orders"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

// ── Customers ─────────────────────────────────────────────────────────────────
export const useCustomers = (params?: { search?: string }) =>
  useQuery({
    queryKey: ["customers", params],
    queryFn: () => api.get<Paginated<Customer>>("/customers", params as Record<string, string | undefined>),
  })

export const useCustomer = (id: number | null) =>
  useQuery({
    queryKey: ["customer", id],
    queryFn: () => api.get<Customer & { orders: import("@/lib/types").Order[] }>(`/customers/${id}`),
    enabled: !!id,
  })

export const useCreateCustomer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Customer>) => api.post<Customer>("/customers", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  })
}

export const useUpdateCustomer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Customer> & { id: number }) =>
      api.put<Customer>(`/customers/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  })
}

export const useDeleteCustomer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  })
}

// ── Reservations ──────────────────────────────────────────────────────────────
export const useReservations = (params?: Record<string, string | undefined>) =>
  useQuery({
    queryKey: ["reservations", params],
    queryFn: () => api.get<Paginated<Reservation>>("/reservations", params),
  })

export const useCreateReservation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Reservation>) => api.post<Reservation>("/reservations", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  })
}

export const useUpdateReservation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Reservation> & { id: number }) =>
      api.put<Reservation>(`/reservations/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  })
}

export const useDeleteReservation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/reservations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  })
}

export const useUpdateReservationStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.post<Reservation>(`/reservations/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  })
}

// ── Payments ──────────────────────────────────────────────────────────────────
export const usePayments = (params?: Record<string, string | undefined>) =>
  useQuery({
    queryKey: ["payments", params],
    queryFn: () => api.get<Paginated<Payment>>("/payments", params),
  })

export const useCreatePayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Payment>) => api.post<Payment>("/payments", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payments"] }); qc.invalidateQueries({ queryKey: ["orders"] }) },
  })
}

export const useDuePayments = () =>
  useQuery({ queryKey: ["due-payments"], queryFn: () => api.get<Order[]>("/due-payments") })

// ── Expenses ──────────────────────────────────────────────────────────────────
export const useExpenseCategories = () =>
  useQuery({ queryKey: ["expense-categories"], queryFn: () => api.get<ExpenseCategory[]>("/expense-categories") })

export const useCreateExpenseCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<ExpenseCategory>) => api.post<ExpenseCategory>("/expense-categories", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expense-categories"] }),
  })
}

export const useUpdateExpenseCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ExpenseCategory> & { id: number }) =>
      api.put<ExpenseCategory>(`/expense-categories/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expense-categories"] }),
  })
}

export const useDeleteExpenseCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/expense-categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expense-categories"] }),
  })
}

export const useExpenses = (params?: Record<string, string | undefined>) =>
  useQuery({
    queryKey: ["expenses", params],
    queryFn: () => api.get<Paginated<Expense>>("/expenses", params),
  })

export const useCreateExpense = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Expense>) => api.post<Expense>("/expenses", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  })
}

export const useUpdateExpense = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Expense> & { id: number }) =>
      api.put<Expense>(`/expenses/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  })
}

export const useDeleteExpense = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/expenses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  })
}

// ── Staff ─────────────────────────────────────────────────────────────────────
export const useStaff = () =>
  useQuery({ queryKey: ["staff"], queryFn: () => api.get<Staff[]>("/staff") })

export const useCreateStaff = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => api.post<Staff>("/staff", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  })
}

export const useUpdateStaff = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) =>
      api.put<Staff>(`/staff/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  })
}

export const useDeleteStaff = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/staff/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  })
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export const useInventoryCategories = () =>
  useQuery({ queryKey: ["inventory-categories"], queryFn: () => api.get<InventoryCategory[]>("/inventory/categories") })

export const useCreateInventoryCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<InventoryCategory>) => api.post<InventoryCategory>("/inventory/categories", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory-categories"] }),
  })
}

export const useUpdateInventoryCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<InventoryCategory> & { id: number }) =>
      api.put<InventoryCategory>(`/inventory/categories/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory-categories"] }),
  })
}

export const useDeleteInventoryCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/inventory/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory-categories"] }),
  })
}

export const useInventoryUnits = () =>
  useQuery({ queryKey: ["inventory-units"], queryFn: () => api.get<InventoryUnit[]>("/inventory/units") })

export const useCreateInventoryUnit = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<InventoryUnit>) => api.post<InventoryUnit>("/inventory/units", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory-units"] }),
  })
}

export const useUpdateInventoryUnit = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<InventoryUnit> & { id: number }) =>
      api.put<InventoryUnit>(`/inventory/units/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory-units"] }),
  })
}

export const useDeleteInventoryUnit = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/inventory/units/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory-units"] }),
  })
}

export const useInventoryItems = () =>
  useQuery({ queryKey: ["inventory-items"], queryFn: () => api.get<Paginated<InventoryItem>>("/inventory/items") })

export const useCreateInventoryItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<InventoryItem>) => api.post<InventoryItem>("/inventory/items", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory-items"] }),
  })
}

export const useUpdateInventoryItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<InventoryItem> & { id: number }) =>
      api.put<InventoryItem>(`/inventory/items/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory-items"] }),
  })
}

export const useDeleteInventoryItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/inventory/items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory-items"] }),
  })
}

export const useInventoryStocks = () =>
  useQuery({ queryKey: ["inventory-stocks"], queryFn: () => api.get<InventoryStock[]>("/inventory/stocks") })

export const useInventoryMovements = (params?: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: ["inventory-movements", params],
    queryFn: () => api.get<Paginated<InventoryMovement>>("/inventory/movements", params),
  })

export const useCreateInventoryMovement = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<InventoryMovement>) => api.post<InventoryMovement>("/inventory/movements", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-movements"] })
      qc.invalidateQueries({ queryKey: ["inventory-stocks"] })
    },
  })
}

export const useSuppliers = () =>
  useQuery({ queryKey: ["suppliers"], queryFn: () => api.get<Supplier[]>("/inventory/suppliers") })

export const useCreateSupplier = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Supplier>) => api.post<Supplier>("/inventory/suppliers", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  })
}

export const useUpdateSupplier = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Supplier> & { id: number }) =>
      api.put<Supplier>(`/inventory/suppliers/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  })
}

export const useDeleteSupplier = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/inventory/suppliers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  })
}

export const usePurchaseOrders = () =>
  useQuery({ queryKey: ["purchase-orders"], queryFn: () => api.get<Paginated<PurchaseOrder>>("/inventory/purchase-orders") })

export const useCreatePurchaseOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => api.post<PurchaseOrder>("/inventory/purchase-orders", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] }),
  })
}

export const useUpdatePurchaseOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) =>
      api.put<PurchaseOrder>(`/inventory/purchase-orders/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] }),
  })
}

export const useRecipes = () =>
  useQuery({ queryKey: ["recipes"], queryFn: () => api.get<Recipe[]>("/inventory/recipes") })

export const useCreateRecipe = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => api.post<Recipe>("/inventory/recipes", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  })
}

export const useDeleteRecipe = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/inventory/recipes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  })
}

export const useBatchInventories = () =>
  useQuery({ queryKey: ["batch-inventories"], queryFn: () => api.get<Paginated<BatchInventory>>("/inventory/batch-inventory") })

export const useCreateBatchInventory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => api.post<BatchInventory>("/inventory/batch-inventory", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["batch-inventories"] }),
  })
}

export const useUpdateBatchInventory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) =>
      api.put<BatchInventory>(`/inventory/batch-inventory/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batch-inventories"] })
      qc.invalidateQueries({ queryKey: ["inventory-stocks"] })
    },
  })
}

export const useInventoryDashboard = () =>
  useQuery({ queryKey: ["inventory-dashboard"], queryFn: () => api.get("/inventory/dashboard") })

// ── Kitchens ──────────────────────────────────────────────────────────────────
export const useKitchens = () =>
  useQuery({ queryKey: ["kitchens"], queryFn: () => api.get<Kitchen[]>("/kitchens") })

export const useCreateKitchen = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Kitchen>) => api.post<Kitchen>("/kitchens", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kitchens"] }),
  })
}

export const useUpdateKitchen = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Kitchen> & { id: number }) =>
      api.put<Kitchen>(`/kitchens/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kitchens"] }),
  })
}

export const useDeleteKitchen = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/kitchens/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kitchens"] }),
  })
}

// ── Waiter Requests ───────────────────────────────────────────────────────────
export const useWaiterRequests = (params?: Record<string, string | undefined>) =>
  useQuery({
    queryKey: ["waiter-requests", params],
    queryFn: () => api.get<WaiterRequest[]>("/waiter-requests", params),
    refetchInterval: 15_000, // poll every 15s
  })

export const useUpdateWaiterRequestStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.post(`/waiter-requests/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["waiter-requests"] }),
  })
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const useSalesReport = (params: Record<string, string>) =>
  useQuery({ queryKey: ["report-sales", params], queryFn: () => api.get("/reports/sales", params) })

export const useItemsReport = (params: Record<string, string>) =>
  useQuery({ queryKey: ["report-items", params], queryFn: () => api.get("/reports/items", params) })

export const useCategoriesReport = (params: Record<string, string>) =>
  useQuery({ queryKey: ["report-categories", params], queryFn: () => api.get("/reports/categories", params) })

export const useTaxReport = (params: Record<string, string>) =>
  useQuery({ queryKey: ["report-tax", params], queryFn: () => api.get("/reports/tax", params) })

export const useExpensesReport = (params: Record<string, string>) =>
  useQuery({ queryKey: ["report-expenses", params], queryFn: () => api.get("/reports/expenses", params) })

export const useDuePaymentsReport = (params: Record<string, string>) =>
  useQuery({ queryKey: ["report-due-payments", params], queryFn: () => api.get("/reports/due-payments", params) })

export const useCancelledReport = (params: Record<string, string>) =>
  useQuery({ queryKey: ["report-cancelled", params], queryFn: () => api.get("/reports/cancelled", params) })

export const useRefundReport = (params: Record<string, string>) =>
  useQuery({ queryKey: ["report-refund", params], queryFn: () => api.get("/reports/refund", params) })

export const useDeliveryReport = (params: Record<string, string>) =>
  useQuery({ queryKey: ["report-delivery", params], queryFn: () => api.get("/reports/delivery", params) })

export const useCodReport = (params: Record<string, string>) =>
  useQuery({ queryKey: ["report-cod", params], queryFn: () => api.get("/reports/cod", params) })

export const useLoyaltyReport = (params: Record<string, string>) =>
  useQuery({ queryKey: ["report-loyalty", params], queryFn: () => api.get("/reports/loyalty", params) })

// ── Public Restaurant (no auth) ───────────────────────────────────────────────
export const usePublicRestaurant = (slug: string) =>
  useQuery({
    queryKey: ["public-restaurant", slug],
    queryFn: () => api.get<Restaurant>(`/restaurant/${slug}`),
    enabled: !!slug,
  })

export const usePublicRestaurants = () =>
  useQuery({
    queryKey: ["public-restaurants"],
    queryFn: () => api.get<PublicRestaurantDirectoryItem[]>("/restaurants"),
  })

export const usePublicMenu = (slug: string) =>
  useQuery({
    queryKey: ["public-menu", slug],
    queryFn: () => api.get<import("@/lib/types").MenuItem[]>(`/restaurant/${slug}/menu`),
    enabled: !!slug,
  })

export const useCreatePublicReservation = (slug: string, customerToken?: string | null) => {
  return useMutation({
    mutationFn: (data: {
      guest_name: string
      guest_phone: string
      guest_email?: string
      party_size: number
      reserved_at: string
      notes?: string
      table_id?: number
      special_package?: string
      pre_order_items?: { name: string; price: number; qty: number }[]
      package_price?: number
    }) => {
      if (customerToken) {
        const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
        return fetch(`${BASE}/restaurant/${slug}/reservations`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${customerToken}` },
          body: JSON.stringify(data),
        }).then(r => r.json())
      }
      return api.post(`/restaurant/${slug}/reservations`, data)
    },
  })
}

export const usePublicTables = (slug: string) =>
  useQuery({
    queryKey: ["public-tables", slug],
    queryFn: () => api.get<import("@/lib/types").Table[]>(`/restaurant/${slug}/tables`),
    enabled: !!slug,
  })

export const useCreatePublicWaiterRequest = (slug: string) =>
  useMutation({
    mutationFn: (data: { table_id: number; type: string; notes?: string }) =>
      api.post(`/restaurant/${slug}/waiter-requests`, data),
  })

export const useCreatePublicOrder = (slug: string, customerToken?: string | null) => {
  return useMutation({
    mutationFn: (data: {
      order_type: string
      items: { menu_item_id: number; quantity: number; notes?: string }[]
      notes?: string
      table_id?: number
    }) => {
      if (customerToken) {
        const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
        return fetch(`${BASE}/restaurant/${slug}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify(data),
        }).then(r => r.json())
      }
      return api.post(`/restaurant/${slug}/orders`, data)
    },
  })
}

export const usePublicRatings = (limit = 24) =>
  useQuery({
    queryKey: ["public-ratings", limit],
    queryFn: () => api.get<PublicRating[]>("/public-ratings", { limit }),
  })

export const useRestaurantRatings = (slug: string, limit = 12) =>
  useQuery({
    queryKey: ["restaurant-ratings", slug, limit],
    queryFn: () => api.get<RestaurantRatingsResponse>(`/restaurant/${slug}/ratings`, { limit }),
    enabled: !!slug,
  })

// ── Website Analytics ─────────────────────────────────────────────────────────
export const useWebsiteAnalytics = () =>
  useQuery({ queryKey: ["website-analytics"], queryFn: () => api.get("/analytics/website") })
