import type { Restaurant } from "@/lib/types"

export interface BranchInfo {
  id: number
  name: string
  address?: string
  phone?: string
  manager?: string
  is_active?: boolean
}

function normalizeBranch(raw: unknown): BranchInfo | null {
  if (!raw || typeof raw !== "object") return null
  const b = raw as Record<string, unknown>
  const id = Number(b.id)
  const name = typeof b.name === "string" ? b.name.trim() : ""
  if (!Number.isFinite(id) || !name) return null

  return {
    id,
    name,
    address: typeof b.address === "string" ? b.address : undefined,
    phone: typeof b.phone === "string" ? b.phone : undefined,
    manager: typeof b.manager === "string" ? b.manager : undefined,
    is_active: typeof b.is_active === "boolean" ? b.is_active : true,
  }
}

export function getBranchConfig(restaurant?: Restaurant | null): {
  branches: BranchInfo[]
  defaultBranchId: number | null
} {
  const settings = (restaurant?.settings ?? {}) as Record<string, unknown>
  const rawBranches = Array.isArray(settings.branches) ? settings.branches : []
  const branches = rawBranches
    .map(normalizeBranch)
    .filter((b): b is BranchInfo => Boolean(b))

  if (branches.length === 0) {
    branches.push({
      id: 1,
      name: restaurant?.name ?? "Main Branch",
      address: restaurant?.address ?? undefined,
      phone: restaurant?.phone ?? undefined,
      is_active: true,
    })
  }

  const configuredDefault = Number(settings.default_branch_id)
  const defaultBranchId = branches.some((b) => b.id === configuredDefault)
    ? configuredDefault
    : branches[0]?.id ?? null

  return { branches, defaultBranchId }
}

