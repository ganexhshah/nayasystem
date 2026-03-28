const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  
  try {
    // First try reading from httpOnly cookie
    const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/)
    if (match) {
      try {
        return decodeURIComponent(match[1])
      } catch (e) {
        console.warn('Failed to decode token from cookie:', e)
      }
    }
    
    // Fallback to localStorage for development/mobile
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token) {
      try {
        return JSON.parse(token)
      } catch {
        return token // Return raw token if not JSON encoded
      }
    }
    
    return null
  } catch (error) {
    console.error('Critical: Failed to read authentication token:', error)
    // Return null instead of throwing - don't break the app
    return null
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
  params?: Record<string, string | number | undefined>
  cache?: RequestCache
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message)
  }
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params, cache = method === "GET" ? "no-store" : "default" } = opts

  let url = `${BASE}${path}`
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString()
    if (qs) url += `?${qs}`
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  const token = getToken()
  if (token) headers["Authorization"] = `Bearer ${token}`

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache,
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const message = data?.message || data?.error || res.statusText || 'Unknown error'
      throw new ApiError(res.status, message, data)
    }

    // 204 No Content
    if (res.status === 204) return undefined as T

    return res.json() as Promise<T>
  } catch (error) {
    if (error instanceof ApiError) throw error
    
    // Network errors
    if (error instanceof TypeError) {
      throw new ApiError(0, 'Network error. Please check your connection.', { originalError: error })
    }
    
    throw new ApiError(500, 'An unexpected error occurred', { originalError: error })
  }
}

// Multipart form upload (images, files)
export async function apiUpload<T>(path: string, formData: FormData, method = "POST"): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { Accept: "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { method, headers, body: formData })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(res.status, data?.message ?? res.statusText, data)
  }

  return res.json() as Promise<T>
}

// Download a file (blob response) — used for PDF invoices etc.
export async function apiDownload(path: string, filename: string): Promise<void> {
  const token = getToken()
  const headers: Record<string, string> = { Accept: "application/pdf" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { method: "POST", headers })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(res.status, data?.message ?? res.statusText, data)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function apiDownloadFile(
  path: string,
  filename: string,
  options: { method?: string; accept?: string } = {}
): Promise<void> {
  const token = getToken()
  const headers: Record<string, string> = { Accept: options.accept ?? "*/*" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(res.status, data?.message ?? res.statusText, data)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Convenience helpers
export const api = {
  get: <T>(path: string, params?: RequestOptions["params"]) =>
    apiFetch<T>(path, { params }),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),
  upload: apiUpload,
  download: apiDownload,
  downloadFile: apiDownloadFile,
}
