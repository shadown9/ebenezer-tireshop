"use client"

import { useState, useEffect } from "react"
import { PublicHeader } from "@/components/public-header"
import { TireSearchWidget } from "@/components/tire-search-widget"
import { TireCard } from "@/components/tire-card"
import { useTires } from "@/lib/firebase-hooks"
import { searchTiresBySize, searchTiresByVehicle } from "@/lib/search-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Filter } from "lucide-react"
import type { Tire } from "@/lib/types"
import { useTranslations } from "@/lib/translations"

export default function SearchPage() {
  const { tires, loading } = useTires()
  const [searchResults, setSearchResults] = useState<Tire[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const { t } = useTranslations()

  useEffect(() => {
    if (!hasSearched && !loading && tires.length > 0) {
      setSearchResults(tires.slice(0, 6))
    }
  }, [tires, hasSearched, loading])

  const handleSearch = (searchType: "size" | "vehicle", params: any) => {
    console.log("[v0] Search triggered:", searchType, params)
    let results: Tire[] = []

    if (searchType === "size") {
      results = searchTiresBySize(tires, params)
    } else {
      results = searchTiresByVehicle(tires, params)
    }

    console.log("[v0] Search results:", results.length, "tires found")
    setSearchResults(results)
    setHasSearched(true)
  }

  const handleClearFilters = () => {
    console.log("[v0] Clearing all filters and resetting results")
    setSearchResults(tires.slice(0, 6))
    setHasSearched(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tire inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Section with Gradient Background */}
      <section className="relative py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
        {/* Futuristic animated background elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-primary font-semibold text-sm">ADVANCED TIRE SEARCH</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              {t("findPerfectTires")}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Search by tire size or vehicle to find the best match for your needs
            </p>
          </div>
        </div>
      </section>

      {/* Search Widget Section */}
      <section className="py-8 bg-background relative -mt-12">
        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-5xl mx-auto">
            <TireSearchWidget onSearch={handleSearch} onClear={handleClearFilters} />
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {hasSearched ? "Search Results" : "Featured Tires"}
              </h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {hasSearched
                  ? `Found ${searchResults.length} tire${searchResults.length !== 1 ? "s" : ""} matching your criteria`
                  : "Our most popular tires in stock now"}
              </p>
            </div>
            {hasSearched && searchResults.length > 0 && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((tire) => (
                <TireCard key={tire.id} tire={tire} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center border-2 border-dashed">
              <CardContent>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No tires found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any tires matching your search criteria. Try adjusting your filters.
                </p>
                <Button onClick={handleClearFilters}>View All Tires</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-modern text-secondary-foreground py-12 border-t border-secondary-foreground/10 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-secondary-foreground/80">© 2025 Ebenezer Tireshop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
