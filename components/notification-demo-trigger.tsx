"use client"

import { Button } from "@/components/ui/button"
import { notificationHelpers } from "@/lib/notification-system"
import { Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

export function NotificationDemoTrigger() {
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)

  const triggerTestNotifications = () => {

    setIsCreating(true)

    toast({
      title: "Generando notificaciones de prueba",
      description: "Se crearán 4 notificaciones en los próximos segundos...",
    })

    // Test different types of notifications
    notificationHelpers.newAppointment("Juan Pérez", "2025-01-15", "10:00 AM")


    setTimeout(() => {
      notificationHelpers.lowInventory("tire_001", "Michelin Defender 205/55R16", 1)

    }, 2000)

    setTimeout(() => {
      notificationHelpers.appointmentStatusChange("GP-123456", "confirmed")

    }, 4000)

    setTimeout(() => {
      notificationHelpers.systemAlert("Sistema actualizado", "El sistema ha sido actualizado exitosamente", "low")


      toast({
        title: "Notificaciones de prueba creadas",
        description: "Se han creado 4 notificaciones de prueba. Revisa el ícono de campana.",
      })
      setIsCreating(false)
    }, 6000)
  }

  return (
    <Button
      onClick={triggerTestNotifications}
      variant="outline"
      size="sm"
      className="gap-2 bg-transparent"
      disabled={isCreating}
    >
      <Bell className="h-4 w-4" />
      {isCreating ? "Generando..." : "Probar Notificaciones"}
    </Button>
  )
}
