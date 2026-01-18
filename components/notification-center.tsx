"use client"

import { Bell, Check, CheckCheck, Trash2, Volume2, VolumeX, MonitorSmartphone, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useFirestoreNotifications } from "@/hooks/use-firestore-notifications"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function NotificationCenter() {
  // Basic implementation for now - sound/push settings can be re-added later if needed
  // tied to user profiles
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll
  } = useFirestoreNotifications()

  // Stub settings for now to keep UI working without errors
  const pushEnabled = true
  const soundEnabled = true
  const browserPushEnabled = false
  const setPushEnabled = () => { }
  const setSoundEnabled = () => { }
  const setBrowserPushEnabled = () => { }
  const getBrowserPermissionStatus = () => "default" as NotificationPermission
  const handleBrowserPushToggle = async () => { }
  const router = useRouter()
  const { toast } = useToast()

  const handleNotificationClick = (notification: (typeof notifications)[0]) => {
    markAsRead(notification.id)
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-blue-500"
      case "low":
        return "bg-gray-400"
      default:
        return "bg-blue-500"
    }
  }

  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes("chrome")) {
      return "Chrome: Haz clic en el icono del candado en la barra de direcciones → Configuración del sitio → Notificaciones → Permitir"
    } else if (userAgent.includes("firefox")) {
      return "Firefox: Haz clic en el icono del candado → Permisos → Notificaciones → Permitir"
    } else if (userAgent.includes("safari")) {
      return "Safari: Safari → Configuración → Sitios web → Notificaciones → Permitir"
    } else if (userAgent.includes("edge")) {
      return "Edge: Haz clic en el icono del candado → Permisos del sitio → Notificaciones → Permitir"
    }
    return "Haz clic en el icono del candado en la barra de direcciones y permite las notificaciones"
  }

  const permissionStatus = getBrowserPermissionStatus()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10">
          <Bell className="h-5 w-5 text-foreground" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-1rem)] sm:w-96 max-w-[420px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-sm sm:text-base">Notificaciones</span>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs px-2">
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Marcar todas</span>
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={deleteAll} className="h-8 text-xs text-destructive px-2">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <div className="px-3 py-2.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="push-notifications" className="text-xs sm:text-sm flex items-center gap-2 cursor-pointer">
              <Bell className="h-4 w-4 flex-shrink-0" />
              <span>Activar notificaciones</span>
            </Label>
            <Switch
              id="push-notifications"
              checked={pushEnabled}
              onCheckedChange={setPushEnabled}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="sound-notifications" className="text-xs sm:text-sm flex items-center gap-2 cursor-pointer">
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 flex-shrink-0" />
              ) : (
                <VolumeX className="h-4 w-4 flex-shrink-0" />
              )}
              <span>Sonido</span>
            </Label>
            <Switch
              id="sound-notifications"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
              disabled={!pushEnabled}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label
              htmlFor="browser-notifications"
              className="text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <MonitorSmartphone className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">Notificaciones del navegador</span>
            </Label>
            <Switch
              id="browser-notifications"
              checked={browserPushEnabled}
              onCheckedChange={handleBrowserPushToggle}
              disabled={!pushEnabled}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {!pushEnabled && (
            <Alert className="py-2 px-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <AlertDescription className="text-xs ml-2">
                Activa las notificaciones primero para usar las notificaciones del navegador.
              </AlertDescription>
            </Alert>
          )}

          {pushEnabled && permissionStatus === "denied" && (
            <Alert variant="destructive" className="py-2 px-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <AlertDescription className="text-xs ml-2">
                <p className="font-semibold mb-1">Notificaciones bloqueadas</p>
                <p className="mb-1">Para activarlas:</p>
                <p className="italic text-[11px]">{getBrowserInstructions()}</p>
              </AlertDescription>
            </Alert>
          )}

          {pushEnabled && permissionStatus === "default" && !browserPushEnabled && (
            <Alert className="py-2 px-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <AlertDescription className="text-xs ml-2">
                Haz clic en el interruptor para activar las notificaciones del navegador.
              </AlertDescription>
            </Alert>
          )}

          {pushEnabled && permissionStatus === "granted" && browserPushEnabled && (
            <Alert className="py-2 px-3 bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              <AlertDescription className="text-xs ml-2 text-green-700">
                Las notificaciones del navegador están activas y funcionando.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DropdownMenuSeparator />

        <ScrollArea className="h-[50vh] sm:h-[400px] max-h-[60vh]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No hay notificaciones</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "group relative flex flex-col gap-2 rounded-lg p-3 text-sm transition-colors hover:bg-accent cursor-pointer active:scale-[0.98]",
                    !notification.read && "bg-accent/50",
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                          getPriorityColor(notification.priority),
                        )}
                      />
                      <div className="flex-1 space-y-1 min-w-0">
                        <p className="font-medium leading-snug text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString("es-ES", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
