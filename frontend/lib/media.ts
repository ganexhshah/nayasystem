export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined

  const value = url.trim()
  if (!value) return undefined

  if (/^(https?:\/\/|data:|blob:)/i.test(value)) return value
  if (value.startsWith("//")) return `https:${value}`

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
  const origin = apiBase.replace(/\/api\/?$/, "")

  if (value.startsWith("/")) return `${origin}${value}`
  return `${origin}/${value}`
}

