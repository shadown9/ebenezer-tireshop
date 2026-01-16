"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { mockTires, mockServices, mockCMSContent } from "@/lib/mock-data"

export function FirebaseInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initializeDatabase = async () => {
      // Check if already initialized (run only once)
      if (initialized || typeof window === "undefined") return

      try {
        // Check if data already exists
        const servicesSnapshot = await getDocs(collection(db, "services"))

        // If no services exist, seed the database
        if (servicesSnapshot.empty) {


          // Seed services
          for (const service of mockServices) {
            const { id, ...serviceData } = service
            await addDoc(collection(db, "services"), serviceData)
          }

          // Seed tires
          for (const tire of mockTires) {
            const { id, ...tireData } = tire
            await addDoc(collection(db, "tires"), tireData)
          }

          // Seed CMS content
          for (const content of mockCMSContent) {
            const { id, ...contentData } = content
            await addDoc(collection(db, "cms"), contentData)
          }


          setInitialized(true)

          // Store in localStorage to avoid re-initializing
          localStorage.setItem("firebase_initialized", "true")
        } else {

          setInitialized(true)
        }
      } catch (error) {

      }
    }

    // Only initialize if not already done
    const hasInitialized = localStorage.getItem("firebase_initialized")
    if (!hasInitialized) {
      initializeDatabase()
    } else {
      setInitialized(true)
    }
  }, [initialized])

  return null // This component doesn't render anything
}
