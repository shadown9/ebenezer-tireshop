"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminAuthGuard } from "@/components/admin-auth-guard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isLoginPage = pathname === "/admin/login"

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen bg-background overflow-x-hidden">
        <AdminSidebar />
        <main className="flex-1 w-full pb-safe overflow-x-hidden pt-16 lg:pt-0">{children}</main>
      </div>
    </AdminAuthGuard>
  )
}
