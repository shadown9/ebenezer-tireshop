"use client"

import { useState } from "react"
import { collection, addDoc, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { mockTires, mockServices, mockCMSContent } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Check, AlertCircle } from "lucide-react"

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const seedDatabase = async () => {
    setLoading(true)
    setStatus("idle")
    setMessage("")

    try {
      // Check if data already exists
      const tiresSnapshot = await getDocs(collection(db, "tires"))
      if (!tiresSnapshot.empty) {
        setStatus("error")
        setMessage("Database already has data. Clear it first if you want to re-seed.")
        setLoading(false)
        return
      }

      // Seed tires
      setMessage("Seeding tires...")
      for (const tire of mockTires) {
        const { id, ...tireData } = tire
        await addDoc(collection(db, "tires"), tireData)
      }

      // Seed services
      setMessage("Seeding services...")
      for (const service of mockServices) {
        const { id, ...serviceData } = service
        await addDoc(collection(db, "services"), serviceData)
      }

      // Seed CMS content
      setMessage("Seeding CMS content...")
      for (const content of mockCMSContent) {
        const { id, ...contentData } = content
        await addDoc(collection(db, "cms"), contentData)
      }

      setStatus("success")
      setMessage("Database seeded successfully! You can now use the app.")
    } catch (error) {
      console.error("Error seeding database:", error)
      setStatus("error")
      setMessage("Failed to seed database. Make sure Firestore security rules allow writes.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="max-w-md w-full p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Database Setup</h1>
          <p className="text-muted-foreground text-sm">Initialize your Firebase database with sample data</p>
        </div>

        <div className="space-y-4">
          <Button onClick={seedDatabase} disabled={loading || status === "success"} className="w-full" size="lg">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {status === "success" && <Check className="mr-2 h-4 w-4" />}
            {loading ? "Seeding Database..." : status === "success" ? "Database Seeded" : "Seed Database"}
          </Button>

          {message && (
            <div
              className={`flex items-start gap-2 p-4 rounded-lg ${
                status === "success"
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : status === "error"
                    ? "bg-red-500/10 text-red-700 dark:text-red-400"
                    : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
              }`}
            >
              {status === "success" && <Check className="h-5 w-5 shrink-0 mt-0.5" />}
              {status === "error" && <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />}
              <p className="text-sm">{message}</p>
            </div>
          )}

          {status === "success" && (
            <Button asChild variant="outline" className="w-full bg-transparent">
              <a href="/admin">Go to Dashboard</a>
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">What will be added:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{mockTires.length} tire products</li>
            <li>{mockServices.length} services</li>
            <li>{mockCMSContent.length} CMS content items</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
