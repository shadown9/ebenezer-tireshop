"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { hasPermission } from "@/lib/permissions"
import type { Permission } from "@/lib/permissions"
import type { User } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PermissionGuardProps {
  children: React.ReactNode
  permission: Permission
  fallback?: React.ReactNode
}

export function PermissionGuard({ children, permission, fallback }: PermissionGuardProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userStr = localStorage.getItem("admin_user")
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr))
      } catch (error) {
        console.error("Error parsing user:", error)
      }
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  if (!currentUser || !hasPermission(currentUser.role, permission)) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="p-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            No tienes permisos para acceder a esta sección. Por favor contacta a un administrador si necesitas acceso.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} className="mt-4">
          Volver
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
