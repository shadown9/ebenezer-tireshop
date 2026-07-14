"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, Search, Wrench, Calendar, MapPin } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useTranslations } from "@/lib/translations"
import { cn } from "@/lib/utils"
import Image from "next/image"
import LanguageToggle from "@/components/language-toggle"

export function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { t } = useTranslations()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()

    // If we're on the homepage (with or without hash), scroll to top
    if (pathname === "/" || pathname === "") {
      window.scrollTo({ top: 0, behavior: "smooth" })
      // Remove any hash from URL
      if (window.location.hash) {
        window.history.replaceState(null, "", "/")
      }
    } else {
      // Navigate to homepage from other pages
      router.push("/")
    }
  }

  return (
    <header
      className={cn(
        "border-b sticky top-0 z-50 transition-all duration-300",
        isScrolled ? "glass-effect shadow-lg border-border/50" : "bg-card/80 backdrop-blur-sm border-border",
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <a
            href="/"
            onClick={handleLogoClick}
            className="flex items-center gap-3 group cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 group-hover:scale-105 transition-all duration-300">
              <Image src="/logo.png" alt="Ebenezer Tireshop Logo" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gradient">Ebenezer Tireshop</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">{t("professionalAutoService")}</p>
            </div>
          </a>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/#search"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors relative group"
            >
              {t("findTires")}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/#services"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors relative group"
            >
              {t("services")}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/book"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors relative group"
            >
              {t("bookService")}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/track"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors relative group"
            >
              {t("track")}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageToggle />

            {/* Desktop CTA button */}
            <Button asChild className="hidden sm:flex shadow-lg hover:shadow-primary/50 transition-all">
              <Link href="/book">{t("bookNow")}</Link>
            </Button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[400px] p-0 border-l-2 border-primary/20">
                {/* Modern header with gradient */}
                <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-6 py-6 border-b border-primary-foreground/10">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12">
                      <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-primary-foreground">{t("menu")}</h2>
                      <p className="text-xs text-primary-foreground/80">Ebenezer Tireshop</p>
                    </div>
                  </div>
                </div>

                {/* Navigation items with icons */}
                <nav className="flex flex-col p-4 gap-2">
                  <Link
                    href="/#search"
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted transition-colors group"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Search className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{t("findTires")}</p>
                      <p className="text-xs text-muted-foreground">{t("searchInventoryDescription")}</p>
                    </div>
                  </Link>

                  <Link
                    href="/#services"
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted transition-colors group"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{t("services")}</p>
                      <p className="text-xs text-muted-foreground">{t("viewServicesDescription")}</p>
                    </div>
                  </Link>

                  <Link
                    href="/book"
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted transition-colors group"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{t("bookService")}</p>
                      <p className="text-xs text-muted-foreground">{t("scheduleAppointmentDescription")}</p>
                    </div>
                  </Link>

                  <Link
                    href="/track"
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted transition-colors group"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{t("track")}</p>
                      <p className="text-xs text-muted-foreground">{t("trackOrderDescription")}</p>
                    </div>
                  </Link>

                  {/* CTA Button */}
                  <div className="mt-6 px-4">
                    <Button asChild className="w-full h-14 text-base shadow-lg" size="lg">
                      <Link href="/book" onClick={() => setIsOpen(false)}>
                        <Calendar className="mr-2 h-5 w-5" />
                        {t("bookNow")}
                      </Link>
                    </Button>
                  </div>

                  {/* Contact info */}
                  <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold text-sm mb-3 text-foreground">{t("contactUs")}</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        507 Hawthone Ave, Newark, NJ
                      </p>
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
