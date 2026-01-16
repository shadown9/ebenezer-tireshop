"use client"

import { useState, useEffect } from "react"
import { NotificationSystem } from "@/lib/notification-system"
import type { Notification } from "@/lib/types"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [soundEnabled, setSoundEnabledState] = useState(false)
  const [pushEnabled, setPushEnabledState] = useState(false)
  const [browserPushEnabled, setBrowserPushEnabledState] = useState(false)
  const system = NotificationSystem.getInstance()

  useEffect(() => {


    const unsubscribe = system.subscribe((updatedNotifications) => {

      const newUnreadCount = system.getUnreadCount()

      setNotifications(updatedNotifications)
      setUnreadCount(newUnreadCount)
    })

    const unsubscribePreferences = system.subscribeToPreferences((prefs) => {

      setSoundEnabledState(prefs.soundEnabled)
      setPushEnabledState(prefs.pushEnabled)
      setBrowserPushEnabledState(prefs.browserPushEnabled)
    })

    return () => {
      unsubscribe()
      unsubscribePreferences()
    }
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead: (id: string) => {

      system.markAsRead(id)
    },
    markAllAsRead: () => {

      system.markAllAsRead()
    },
    deleteNotification: (id: string) => {

      system.delete(id)
    },
    deleteAll: () => {

      system.deleteAll()
    },
    soundEnabled,
    pushEnabled,
    browserPushEnabled,
    setSoundEnabled: (enabled: boolean) => {

      system.setSoundEnabled(enabled)
    },
    setPushEnabled: (enabled: boolean) => {

      system.setPushEnabled(enabled)
    },
    setBrowserPushEnabled: async (enabled: boolean) => {

      const success = await system.setBrowserPushEnabled(enabled)

      return success
    },
    getBrowserPermissionStatus: () => system.getBrowserPermissionStatus(),
  }
}
