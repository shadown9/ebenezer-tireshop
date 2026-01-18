import { useEffect, useState } from "react"
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Notification } from "@/lib/types"

export function useFirestoreNotifications(userId: string = "system") {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // In a real app we'd filter by userId or role
        // For this simple app, we'll fetch all non-expired notifications
        const q = query(
            collection(db, "notifications"),
            orderBy("createdAt", "desc")
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Notification[]

            setNotifications(notifs)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [userId])

    const unreadCount = notifications.filter(n => !n.read).length

    const markAsRead = async (id: string) => {
        const ref = doc(db, "notifications", id)
        await updateDoc(ref, { read: true })
    }

    const markAllAsRead = async () => {
        const batch = writeBatch(db)
        notifications.forEach(n => {
            if (!n.read) {
                const ref = doc(db, "notifications", n.id)
                batch.update(ref, { read: true })
            }
        })
        await batch.commit()
    }

    const deleteNotification = async (id: string) => {
        await deleteDoc(doc(db, "notifications", id))
    }

    const deleteAll = async () => {
        const batch = writeBatch(db)
        notifications.forEach(n => {
            const ref = doc(db, "notifications", n.id)
            batch.delete(ref)
        })
        await batch.commit()
    }

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAll
    }
}
