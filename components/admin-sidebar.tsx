"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Package,
  ImageIcon,
  Wrench,
  Home,
  Menu,
  Settings,
  Shield,
  FileText,
  User,
  LogOut,
  ShoppingCart,
  Monitor,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { hasPermission, ROLE_NAMES } from "@/lib/permissions"

const navItems = [
  {
    title: "Punto de Venta (POS)",
    href: "/admin/pos",
    icon: Monitor,
    description: "Launch POS System",
    permission: "viewInventory" as const, // Using inventory permission as a proxy for POS access for now
  },
  {
    title: "Agenda",
    href: "/admin/agenda",
    icon: Calendar,
    description: "Appointments & Schedule",
    permission: "viewAppointments" as const,
  },
  {
    title: "Inventario",
    href: "/admin/inventory",
    icon: Package,
    description: "Tire Inventory Management",
    permission: "viewInventory" as const,
  },
  {
    title: "Servicios",
    href: "/admin/services",
    icon: Wrench,
    description: "Service Management",
    permission: "viewServices" as const,
  },
  {
    title: "CMS",
    href: "/admin/cms",
    icon: ImageIcon,
    description: "Content Management",
    permission: "viewCMS" as const,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Business Information",
    permission: "viewSettings" as const,
  },
  {
    title: "Usuarios",
    href: "/admin/users",
    icon: Shield,
    description: "User Management",
    permission: "viewUsers" as const,
  },
  {
    title: "Auditoría",
    href: "/admin/audit",
    icon: FileText,
    description: "Activity Logs",
    permission: "viewAudit" as const,
  },
  {
    title: "Mi Perfil",
    href: "/admin/profile",
    icon: User,
    description: "Account Settings",
    permission: "viewProfile" as const,
  },
]

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any | null>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("admin_user")
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr))
      } catch (error) {
        console.error("Error parsing user:", error)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_user")
    if (onNavigate) onNavigate()
    router.push("/admin/login")
  }

  const visibleNavItems = navItems.filter((item) => {
    if (!currentUser) return false
    return hasPermission(currentUser.role, item.permission)
  })

  return (
    <>
      <div className="p-6 bg-gradient-to-br from-orange-600 to-orange-500 border-b border-orange-400">
        <Link href="/admin" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="relative w-10 h-10 bg-white rounded-lg p-1.5">
            <Image src="/logo.png" alt="Ebenezer Tireshop Logo" fill className="object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Ebenezer Tireshop</h1>
            <p className="text-xs text-white/90">Admin Dashboard</p>
          </div>
        </Link>
        {currentUser && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/90">{currentUser.name}</span>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {ROLE_NAMES[currentUser.role]}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <Button
          variant="ghost"
          asChild
          className={cn(
            "w-full justify-start text-gray-700 hover:bg-orange-50 hover:text-orange-600 h-auto py-3 transition-colors",
            pathname === "/admin" && "bg-orange-600 text-white hover:bg-orange-700 hover:text-white",
          )}
        >
          <Link href="/admin" onClick={onNavigate}>
            <Home className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="font-medium">Dashboard</span>
          </Link>
        </Button>

        {visibleNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Button
              key={item.href}
              variant="ghost"
              asChild
              className={cn(
                "w-full justify-start text-gray-700 hover:bg-orange-50 hover:text-orange-600 h-auto py-3 transition-colors",
                isActive && "bg-orange-600 text-white hover:bg-orange-700 hover:text-white",
              )}
            >
              <Link href={item.href} onClick={onNavigate}>
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">{item.title}</span>
                  <span className={cn("text-xs", isActive ? "text-white/80" : "text-gray-500")}>
                    {item.description}
                  </span>
                </div>
              </Link>
            </Button>
          )
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-gray-200 space-y-2">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 h-auto py-3 bg-transparent"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>

        <Button
          variant="outline"
          asChild
          className="w-full text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 h-auto py-3 bg-transparent"
        >
          <Link href="/" onClick={onNavigate}>
            <Home className="mr-2 h-4 w-4" />
            Back to Website
          </Link>
        </Button>
      </div>
    </>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="lg:hidden print:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-3">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="border-gray-300 bg-transparent">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-white">
              <SidebarContent pathname={pathname} onNavigate={() => setIsOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6">
              <Image src="/logo.png" alt="Ebenezer Tireshop Logo" fill className="object-contain" />
            </div>
            <span className="font-bold text-gray-900">Ebenezer Tireshop</span>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <aside className="hidden lg:flex print:hidden w-64 bg-white border-r border-gray-200 h-screen flex-col fixed top-0 left-0 bottom-0 pb-6">
        <SidebarContent pathname={pathname} />
      </aside>

      <div className="hidden lg:block print:hidden w-64 flex-shrink-0" />
    </>
  )
}
