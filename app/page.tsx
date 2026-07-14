"use client"

import { useState, useEffect } from "react"
import { PublicHeader } from "@/components/public-header"
import { HeroSection } from "@/components/hero-section"
import { TireSearchWidget } from "@/components/tire-search-widget"
import { TireCard } from "@/components/tire-card"
import { useTires } from "@/lib/firebase-hooks"
import { searchTiresBySize, searchTiresByVehicle } from "@/lib/search-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Wrench, Clock, Shield, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Tire } from "@/lib/types"
import { useTranslations } from "@/lib/translations"

interface BusinessInfo {
  business_name: string
  tagline: string
  address: string
  city: string
  state: string
  zip_code: string
  phone: string
  email: string
  hours: Record<string, string>
  social_media: {
    facebook: string
    instagram: string
    twitter: string
    website: string
  }
}

export default function HomePage() {
  const { tires, loading } = useTires()
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)
  const [businessInfoLoading, setBusinessInfoLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<Tire[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const { t } = useTranslations()

  useEffect(() => {
    const loadBusinessInfo = async () => {
      try {
        const response = await fetch("/api/settings/public")
        if (response.ok) {
          const data = await response.json()
          setBusinessInfo(data)
        }
      } catch (error) {
        console.error("Error loading business info:", error)
      } finally {
        setBusinessInfoLoading(false)
      }
    }

    loadBusinessInfo()
  }, [])

  useEffect(() => {
    if (!hasSearched && !loading && tires.length > 0) {
      setSearchResults(tires.slice(0, 6))
    }
  }, [tires, hasSearched, loading])

  const handleSearch = (searchType: "size" | "vehicle", params: any) => {
    let results: Tire[] = []

    if (searchType === "size") {
      results = searchTiresBySize(tires, params)
    } else {
      results = searchTiresByVehicle(tires, params)
    }

    setSearchResults(results)
    setHasSearched(true)
  }

  if (loading || businessInfoLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <HeroSection />

      {/* Tire Search Section */}
      <section id="search" className="py-20 bg-background relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
                {t("findPerfectTires")}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
                {t("searchTiresDescription")}
              </p>
            </div>

            <TireSearchWidget onSearch={handleSearch} />
          </div>
        </div>
      </section>

      {/* Featured Tires Section */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {hasSearched ? t("searchResults") : t("featuredTires")}
            </h2>
            <p className="text-muted-foreground text-lg">
              {hasSearched
                ? t("foundTires").replace("{count}", searchResults.length.toString())
                : t("popularTires")}
            </p>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((tire) => (
                <TireCard key={tire.id} tire={tire} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <CardContent>
                <p className="text-muted-foreground text-lg">{t("noTiresFound")}</p>
                <Button onClick={() => setSearchResults(tires.slice(0, 6))} className="mt-4">
                  {t("viewAllTires")}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Services Preview Section */}
      <section
        id="services"
        className="py-24 bg-gradient-to-b from-muted/20 to-background relative overflow-hidden scroll-mt-32"
      >
        {/* Modern decorative background elements */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block bg-primary/10 px-4 py-2 rounded-full mb-4">
              <span className="text-primary font-semibold text-sm uppercase">{t("whatWeOffer")}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">{t("ourServices")}</h2>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
              {t("professionalAuto")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <Card className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:shadow-primary/50 group-hover:scale-110 transition-all duration-300">
                  <Wrench className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{t("tireServices")}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("tireServicesDescription")}
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:shadow-primary/50 group-hover:scale-110 transition-all duration-300">
                  <Shield className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{t("brakeService")}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("brakeServiceDescription")}
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:shadow-primary/50 group-hover:scale-110 transition-all duration-300">
                  <CheckCircle className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{t("oilChange")}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("oilChangeDescription")}
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:shadow-primary/50 group-hover:scale-110 transition-all duration-300">
                  <Clock className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{t("quickService")}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("quickServiceDescription")}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-16">
            <Button
              asChild
              size="lg"
              className="h-16 px-10 text-lg shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
            >
              <Link href="/book">{t("bookService")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-gradient-modern text-secondary-foreground py-16 border-t border-secondary-foreground/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-12 h-12">
                  <Image src="/logo.png" alt="Ebenezer Tireshop Logo" fill className="object-contain" />
                </div>
                <span className="text-2xl font-bold">{businessInfo?.business_name || "Ebenezer Tireshop"}</span>
              </div>
              <p className="text-sm text-secondary-foreground/80 mb-4">
                {businessInfo?.tagline || t("professionalAutoService")}
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">{t("contactUs")}</h3>
              <div className="space-y-2 text-sm text-secondary-foreground/80">
                <p>{businessInfo?.address || "507 Hawthone Ave"}</p>
                <p>
                  {businessInfo?.city || "Newark"}, {businessInfo?.state || "New Jersey"}{" "}
                  {businessInfo?.zip_code || "01772"}
                </p>
                {businessInfo?.phone && <p>{businessInfo.phone}</p>}
                {businessInfo?.email && <p>{businessInfo.email}</p>}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">{t("quickLinks")}</h3>
              <div className="space-y-2 text-sm">
                <Link
                  href="/#search"
                  className="block text-secondary-foreground/80 hover:text-primary transition-colors"
                >
                  {t("findTires")}
                </Link>
                <Link
                  href="/#services"
                  className="block text-secondary-foreground/80 hover:text-primary transition-colors"
                >
                  {t("services")}
                </Link>
                <Link href="/book" className="block text-secondary-foreground/80 hover:text-primary transition-colors">
                  {t("bookService")}
                </Link>
                <Link href="/track" className="block text-secondary-foreground/80 hover:text-primary transition-colors">
                  {t("track")}
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-secondary-foreground/10 mt-12 pt-8 text-center">
            <p className="text-sm text-secondary-foreground/80">
              © 2025 {businessInfo?.business_name || "Ebenezer Tireshop"}. {t("allRightsReserved")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
