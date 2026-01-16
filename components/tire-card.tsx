import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Tire } from "@/lib/types"
import Link from "next/link"
import { Package, Calendar } from "lucide-react"

interface TireCardProps {
  tire: Tire
}

export function TireCard({ tire }: TireCardProps) {
  const isLowStock = tire.quantity < 4

  return (
    <Card className="overflow-hidden h-full flex flex-col group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50">
      <div className="relative h-40 overflow-hidden">
        {tire.image ? (
          <Image
            src={tire.image}
            alt={tire.brand}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${['#f97316', '#8b5cf6', '#06b6d4', '#10b981', '#f43f5e', '#3b82f6', '#eab308'][
                tire.brand.charCodeAt(0) % 7
                ]
                } 0%, ${['#ea580c', '#7c3aed', '#0891b2', '#059669', '#e11d48', '#2563eb', '#ca8a04'][
                tire.brand.charCodeAt(0) % 7
                ]
                } 100%)`
            }}
          >
            <span className="text-6xl font-bold text-white/90 drop-shadow-lg">
              {tire.brand.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Modern badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          {isLowStock && (
            <Badge className="bg-destructive/90 backdrop-blur-sm text-destructive-foreground shadow-lg text-xs">
              <Package className="h-3 w-3 mr-1" />
              Low Stock
            </Badge>
          )}
          {tire.condition === "used" && (
            <Badge className="bg-accent/90 backdrop-blur-sm text-accent-foreground shadow-lg text-xs">Used</Badge>
          )}
        </div>

        {tire.condition === "new" && (
          <Badge className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm text-primary-foreground shadow-lg text-xs">
            New
          </Badge>
        )}
      </div>

      <CardContent className="flex-1 p-3">
        {/* Brand name with modern typography */}
        <h3 className="font-bold text-base text-foreground mb-2.5 group-hover:text-primary transition-colors">
          {tire.brand}
        </h3>

        {/* Specs grid */}
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between py-1 border-b border-border/50">
            <span className="text-muted-foreground text-xs">Size</span>
            <span className="font-bold text-foreground text-sm">{`${tire.width}/${tire.ratio}R${tire.diameter}`}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/50">
            <span className="text-muted-foreground text-xs">Condition</span>
            <Badge variant="outline" className="capitalize text-xs h-5">
              {tire.condition}
            </Badge>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Package className="h-3 w-3" />
              Stock
            </span>
            <span className={`font-semibold text-xs ${isLowStock ? "text-destructive" : "text-accent"}`}>
              {tire.quantity} available
            </span>
          </div>
        </div>

        {/* Modern price display */}
        <div className="mt-3 pt-2 border-t border-border/50">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-gradient">${tire.price}</span>
            <span className="text-xs text-muted-foreground">per tire</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <Button asChild className="w-full h-9 shadow-lg hover:shadow-primary/50 transition-all group text-xs">
          <Link href={`/book?tireId=${tire.id}`}>
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Book Installation
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
