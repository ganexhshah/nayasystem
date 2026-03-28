import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = ["/auth/login", "/auth/signup", "/auth/forgot-password", "/restaurant", "/admin/auth", "/pos/auth", "/waiter/auth"]

function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/app") || pathname === "/onboard" || pathname.startsWith("/pos") || pathname.startsWith("/waiter")) {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      const target = pathname.startsWith("/pos") ? "/pos/auth" : pathname.startsWith("/waiter") ? "/waiter/auth" : "/auth/login"
      return NextResponse.redirect(new URL(target, request.url))
    }
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/auth")) {
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.redirect(new URL("/admin/auth/login", request.url))
    }
  }

  return NextResponse.next()
}

export { proxy }
export default proxy

export const config = {
  matcher: ["/app/:path*", "/onboard", "/pos/:path*", "/waiter/:path*", "/admin/:path*"],
}
