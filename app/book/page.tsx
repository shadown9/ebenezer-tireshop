"use client"
import { PublicHeader } from "@/components/public-header"
import { BookingWizard } from "@/components/booking-wizard"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function BookingPageContent() {
  const searchParams = useSearchParams()
  const tireId = searchParams.get("tireId")

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Book Your Service</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Schedule your appointment in just a few simple steps
            </p>
          </div>

          <BookingWizard preselectedTireId={tireId} />
        </div>
      </div>

      <footer className="bg-secondary text-secondary-foreground py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">© 2025 Ebenezer Tireshop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingPageContent />
    </Suspense>
  )
}
