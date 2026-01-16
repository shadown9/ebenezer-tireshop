import type { Notification, NotificationType, NotificationPriority, UserRole } from "./types"

export class NotificationSystem {
  private static instance: NotificationSystem
  private notifications: Notification[] = []
  private listeners: Set<(notifications: Notification[]) => void> = new Set()
  private preferencesListeners: Set<
    (prefs: { soundEnabled: boolean; pushEnabled: boolean; browserPushEnabled: boolean }) => void
  > = new Set()
  private soundEnabled = true
  private pushEnabled = true
  private browserPushEnabled = false
  private checkInterval: NodeJS.Timeout | null = null

  private constructor() {

    this.loadFromStorage()
    this.loadPreferences()
    this.startProactiveChecks()

  }

  static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem()
    }
    return NotificationSystem.instance
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return
    try {
      const userId = this.getCurrentUserId()
      const stored = localStorage.getItem(`notifications_${userId}`)
      if (stored) {
        this.notifications = JSON.parse(stored)
        // Filter out expired notifications
        const now = new Date().toISOString()
        this.notifications = this.notifications.filter((n) => !n.expiresAt || n.expiresAt > now)
      }
    } catch (error) {
      console.error("Failed to load notifications from storage:", error)
    }
  }

  private loadPreferences() {
    if (typeof window === "undefined") return
    try {
      const userId = this.getCurrentUserId()
      const prefKey = `notification_prefs_${userId}`
      const prefs = localStorage.getItem(prefKey)
      if (prefs) {
        const parsed = JSON.parse(prefs)
        this.soundEnabled = parsed.soundEnabled ?? true
        this.pushEnabled = parsed.pushEnabled ?? true
        this.browserPushEnabled = parsed.browserPushEnabled ?? false
      }
    } catch (error) {
      console.error("Failed to load notification preferences:", error)
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return
    try {
      const userId = this.getCurrentUserId()
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(this.notifications))
    } catch (error) {
      console.error("Failed to save notifications to storage:", error)
    }
  }

  private getCurrentUserId(): string {
    if (typeof window === "undefined") return "system"
    try {
      const stackUser = localStorage.getItem("stack-user")
      if (stackUser) {
        const parsed = JSON.parse(stackUser)
        return parsed.id || "system"
      }
      const user = JSON.parse(localStorage.getItem("admin_user") || "{}")
      return user.id || "system"
    } catch {
      return "system"
    }
  }

  private getCurrentUserRole(): UserRole | null {
    if (typeof window === "undefined") return null
    try {
      const stackUser = localStorage.getItem("stack-user")
      if (stackUser) {
        const parsed = JSON.parse(stackUser)
        // If user is authenticated via Stack, default to admin role
        return "admin"
      }
      const user = JSON.parse(localStorage.getItem("admin_user") || "{}")
      return user.role || "admin" // Default to admin if logged in
    } catch {
      return null
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.notifications]))
  }

  private notifyPreferencesListeners() {
    const prefs = {
      soundEnabled: this.soundEnabled,
      pushEnabled: this.pushEnabled,
      browserPushEnabled: this.browserPushEnabled,
    }
    this.preferencesListeners.forEach((listener) => listener(prefs))
  }

  private async playSound(priority: NotificationPriority = "medium") {
    if (!this.soundEnabled || !this.pushEnabled) return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      const frequencies: Record<NotificationPriority, number> = {
        low: 400,
        medium: 600,
        high: 800,
        urgent: 1000,
      }

      oscillator.frequency.value = frequencies[priority]
      gainNode.gain.value = 0.3

      oscillator.start(audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.error("Failed to play notification sound:", error)
    }
  }

  private async showBrowserNotification(title: string, message: string, priority: NotificationPriority) {
    if (!this.browserPushEnabled || !this.pushEnabled) return
    if (typeof window === "undefined" || !("Notification" in window)) return

    try {
      if (Notification.permission === "granted") {
        const notification = new Notification(title, {
          body: message,
          icon: "/icon.png",
          badge: "/badge.png",
          tag: `notification-${Date.now()}`,
          requireInteraction: priority === "urgent",
        })

        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      }
    } catch (error) {
      console.error("Failed to show browser notification:", error)
    }
  }

  async requestBrowserPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) return false

    try {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    } catch (error) {
      console.error("Failed to request notification permission:", error)
      return false
    }
  }

  getBrowserPermissionStatus(): NotificationPermission | null {
    if (typeof window === "undefined" || !("Notification" in window)) return null
    return Notification.permission
  }

  private startProactiveChecks() {
    if (typeof window === "undefined") return

    // Check every 5 minutes
    this.checkInterval = setInterval(
      () => {
        this.checkInventoryLevels()
        this.checkUpcomingAppointments()
      },
      5 * 60 * 1000,
    )

    // Initial check
    setTimeout(() => {
      this.checkInventoryLevels()
      this.checkUpcomingAppointments()
    }, 5000)
  }

  private checkInventoryLevels() {
    try {
      const inventory = JSON.parse(localStorage.getItem("tire_inventory") || "[]")
      const userRole = this.getCurrentUserRole()

      if (!userRole || !["admin", "manager"].includes(userRole)) return

      inventory.forEach((tire: any) => {
        const existingNotification = this.notifications.find(
          (n) =>
            n.type === "inventory" && n.metadata?.tireId === tire.id && n.metadata?.quantity === tire.stock && !n.read,
        )

        if (tire.stock <= 3 && !existingNotification) {
          this.create(
            "inventory",
            "Inventario Bajo",
            `${tire.brand} ${tire.size} tiene solo ${tire.stock} unidades en stock`,
            tire.stock < 2 ? "urgent" : "high",
            {
              link: "/admin/inventory",
              metadata: { tireId: tire.id, tireBrand: tire.brand, quantity: tire.stock },
            },
          )
        }
      })
    } catch (error) {
      console.error("Failed to check inventory levels:", error)
    }
  }

  private checkUpcomingAppointments() {
    try {
      const appointments = JSON.parse(localStorage.getItem("appointments") || "[]")
      const userRole = this.getCurrentUserRole()
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // All roles can see appointment notifications
      if (!userRole) return

      appointments.forEach((apt: any) => {
        const aptDate = new Date(apt.date + " " + apt.time)

        // Notify about appointments in the next 24 hours that are still pending
        if (apt.status === "pending" && aptDate > now && aptDate < tomorrow) {
          const existingNotification = this.notifications.find(
            (n) => n.type === "appointment" && n.metadata?.appointmentId === apt.id && !n.read,
          )

          if (!existingNotification) {
            this.create(
              "appointment",
              "Cita Pendiente de Confirmación",
              `Cita de ${apt.customerName} para ${apt.date} a las ${apt.time} requiere confirmación`,
              "high",
              {
                link: "/admin/agenda",
                metadata: { appointmentId: apt.id, customerName: apt.customerName },
              },
            )
          }
        }
      })
    } catch (error) {
      console.error("Failed to check upcoming appointments:", error)
    }
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.add(listener)
    listener([...this.notifications])
    return () => this.listeners.delete(listener)
  }

  subscribeToPreferences(
    listener: (prefs: { soundEnabled: boolean; pushEnabled: boolean; browserPushEnabled: boolean }) => void,
  ) {
    this.preferencesListeners.add(listener)
    listener({
      soundEnabled: this.soundEnabled,
      pushEnabled: this.pushEnabled,
      browserPushEnabled: this.browserPushEnabled,
    })
    return () => this.preferencesListeners.delete(listener)
  }

  private isNotificationRelevantForRole(type: NotificationType): boolean {
    const role = this.getCurrentUserRole()
    if (!role) return false

    const rolePermissions: Record<UserRole, NotificationType[]> = {
      admin: ["appointment", "inventory", "system", "service"],
      manager: ["appointment", "inventory", "service"],
      employee: ["appointment", "service"],
    }

    return rolePermissions[role]?.includes(type) ?? false
  }

  create(
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = "medium",
    options?: {
      link?: string
      metadata?: Record<string, any>
      expiresAt?: string
    },
  ): Notification {


    if (!this.isNotificationRelevantForRole(type)) {

      return {} as Notification
    }

    if (type === "inventory" && options?.metadata) {
      const metadata = options.metadata
      const duplicate = this.notifications.find(
        (n) =>
          n.type === "inventory" &&
          n.metadata?.tireId === metadata.tireId &&
          n.metadata?.quantity === metadata.quantity &&
          !n.read,
      )
      if (duplicate) {
        return duplicate
      }
    }

    const userId = this.getCurrentUserId()


    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      priority,
      title,
      message,
      link: options?.link,
      metadata: options?.metadata,
      read: false,
      createdAt: new Date().toISOString(),
      expiresAt: options?.expiresAt,
    }

    this.notifications.unshift(notification)
    this.saveToStorage()
    this.notifyListeners()


    if (this.pushEnabled) {

      this.playSound(priority)
      this.showBrowserNotification(title, message, priority)
    } else {

    }

    return notification
  }

  getAll(): Notification[] {
    return [...this.notifications]
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length
  }

  markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id)
    if (notification && !notification.read) {
      notification.read = true
      this.saveToStorage()
      this.notifyListeners()
    }
  }

  markAllAsRead() {

    let updatedCount = 0
    this.notifications.forEach((n) => {
      if (!n.read) {
        n.read = true
        updatedCount++
      }
    })

    this.saveToStorage()
    this.notifyListeners()
  }

  delete(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id)
    this.saveToStorage()
    this.notifyListeners()
  }

  deleteAll() {
    this.notifications = []
    this.saveToStorage()
    this.notifyListeners()
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled
    this.savePreferences()
    this.notifyPreferencesListeners()
  }

  setPushEnabled(enabled: boolean) {
    this.pushEnabled = enabled
    this.savePreferences()
    this.notifyPreferencesListeners()
  }

  async setBrowserPushEnabled(enabled: boolean): Promise<boolean> {


    if (enabled) {
      if (typeof window === "undefined" || !("Notification" in window)) {

        return false
      }



      if (Notification.permission === "granted") {

        this.browserPushEnabled = true
        this.savePreferences()
        this.notifyPreferencesListeners()
        return true
      }

      if (Notification.permission === "default") {

        const granted = await this.requestBrowserPermission()


        if (!granted) {

          this.browserPushEnabled = false
          this.savePreferences()
          this.notifyPreferencesListeners()
          return false
        }

        this.browserPushEnabled = true
        this.savePreferences()
        this.notifyPreferencesListeners()
        return true
      }

      if (Notification.permission === "denied") {

        this.browserPushEnabled = false
        this.savePreferences()
        this.notifyPreferencesListeners()
        return false
      }
    }


    this.browserPushEnabled = enabled
    this.savePreferences()
    this.notifyPreferencesListeners()
    return true
  }

  private savePreferences() {
    if (typeof window === "undefined") return
    try {
      const userId = this.getCurrentUserId()
      const prefKey = `notification_prefs_${userId}`
      localStorage.setItem(
        prefKey,
        JSON.stringify({
          soundEnabled: this.soundEnabled,
          pushEnabled: this.pushEnabled,
          browserPushEnabled: this.browserPushEnabled,
        }),
      )
    } catch (error) {
      console.error("Failed to save notification preferences:", error)
    }
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled
  }

  isPushEnabled(): boolean {
    return this.pushEnabled
  }

  isBrowserPushEnabled(): boolean {
    return this.browserPushEnabled
  }

  cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}

export const notificationHelpers = {
  newAppointment: (customerName: string, date: string, time: string) => {
    const system = NotificationSystem.getInstance()
    return system.create(
      "appointment",
      "Nueva Cita Reservada",
      `${customerName} ha reservado una cita para ${date} a las ${time}`,
      "high",
      {
        link: "/admin/agenda",
        metadata: { customerName, date, time },
      },
    )
  },

  appointmentStatusChange: (trackingNumber: string, status: string) => {
    const system = NotificationSystem.getInstance()
    const statusMessages: Record<string, string> = {
      confirmed: "confirmada",
      "in-progress": "en progreso",
      completed: "completada",
      cancelled: "cancelada",
    }
    return system.create(
      "appointment",
      "Estado de Cita Actualizado",
      `La cita ${trackingNumber} ha sido ${statusMessages[status] || status}`,
      "medium",
      {
        link: "/admin/agenda",
        metadata: { trackingNumber, status },
      },
    )
  },

  lowInventory: (tireId: string, tireBrand: string, quantity: number) => {
    const system = NotificationSystem.getInstance()
    return system.create(
      "inventory",
      "Inventario Bajo",
      `${tireBrand} tiene solo ${quantity} unidades en stock`,
      quantity < 2 ? "urgent" : "high",
      {
        link: "/admin/inventory",
        metadata: { tireId, tireBrand, quantity },
      },
    )
  },

  systemAlert: (title: string, message: string, priority: NotificationPriority = "medium") => {
    const system = NotificationSystem.getInstance()
    return system.create("system", title, message, priority)
  },

  serviceCompleted: (customerName: string, serviceName: string) => {
    const system = NotificationSystem.getInstance()
    return system.create(
      "service",
      "Servicio Completado",
      `${serviceName} para ${customerName} ha sido completado`,
      "low",
      {
        link: "/admin/agenda",
        metadata: { customerName, serviceName },
      },
    )
  },
}
