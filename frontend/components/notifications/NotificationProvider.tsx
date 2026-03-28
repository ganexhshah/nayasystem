"use client"

import { usePathname } from "next/navigation"
import { LiveNotificationPoller, LiveNotificationContainer } from "./LiveNotificationToast"
import { AppNotificationPoller } from "./AppNotificationPoller"

export default function NotificationProvider() {
  const pathname = usePathname()
  const shouldShowNotifications =
    pathname.startsWith("/app") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/pos") ||
    pathname.startsWith("/kot") ||
    pathname.startsWith("/waiter")

  if (!shouldShowNotifications) {
    return null
  }

  return (
    <>
      <LiveNotificationPoller />
      <AppNotificationPoller />
      <LiveNotificationContainer />
    </>
  )
}
