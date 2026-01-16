"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"

interface Banner {
  id: string
  title: string
  description: string
  imageUrl: string
  active: boolean
  updatedAt: string
}

export function HeroSection() {
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBanners() {
      try {
        const response = await fetch("/api/cms/banners")
        if (!response.ok) throw new Error("Failed to fetch banners")
        const banners = await response.json()
        const active = banners.find((item: Banner) => item.active)
        setActiveBanner(active || null)
      } catch (error) {

      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [])

  return (
    <section className="bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0f1e35] text-secondary-foreground">
      {activeBanner?.imageUrl && (
        <div className="w-full">
          <img
            src={activeBanner.imageUrl || "/placeholder.svg"}
            alt={activeBanner.title || "Banner"}
            className="w-full h-auto object-contain max-h-[300px] sm:max-h-[400px] md:max-h-none"
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto text-center">
          {!activeBanner?.imageUrl && (
            <>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 text-balance leading-tight">
                {activeBanner?.title || "Welcome to Ebenezer Tireshop"}
              </h1>
              <p className="text-base sm:text-xl md:text-2xl mb-6 sm:mb-10 text-secondary-foreground/90 leading-relaxed px-4">
                {activeBanner?.description ||
                  "Professional tire and auto service you can trust. Expert care for your vehicle."}
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Button asChild size="lg" className="text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 group w-full sm:w-auto">
              <Link href="/#search">
                Find Tires
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 bg-white hover:bg-white/90 text-secondary border-white/20 font-semibold w-full sm:w-auto"
            >
              <Link href="/book">Book Service</Link>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-8 mt-6 sm:mt-8 text-xs sm:text-sm text-secondary-foreground/80">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Real-time Availability</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span>Same-day Service</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Expert Technicians</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
