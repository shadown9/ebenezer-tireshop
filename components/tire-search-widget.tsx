"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { tireWidths, tireRatios, tireDiameters, vehicleYears, vehicleMakes, getModelsForMake } from "@/lib/search-utils"
import { useTranslations } from "@/lib/translations"

interface TireSearchWidgetProps {
  onSearch: (searchType: "size" | "vehicle", params: any) => void
  onClear?: () => void
}

export function TireSearchWidget({ onSearch, onClear }: TireSearchWidgetProps) {
  const { t } = useTranslations()
  const [sizeSearch, setSizeSearch] = useState({
    width: "",
    ratio: "",
    diameter: "",
    condition: "",
  })

  const [vehicleSearch, setVehicleSearch] = useState({
    year: "",
    make: "",
    model: "",
    condition: "",
  })

  const availableModels = vehicleSearch.make ? getModelsForMake(vehicleSearch.make) : []

  const handleSizeSearch = () => {
    const searchParams = {
      width: sizeSearch.width ? Number.parseInt(sizeSearch.width) : undefined,
      ratio: sizeSearch.ratio ? Number.parseInt(sizeSearch.ratio) : undefined,
      diameter: sizeSearch.diameter ? Number.parseInt(sizeSearch.diameter) : undefined,
      condition: sizeSearch.condition || undefined,
    }
    onSearch("size", searchParams)
  }

  const handleVehicleSearch = () => {
    const searchParams = {
      year: vehicleSearch.year ? Number.parseInt(vehicleSearch.year) : undefined,
      make: vehicleSearch.make || undefined,
      model: vehicleSearch.model || undefined,
      condition: vehicleSearch.condition || undefined,
    }
    onSearch("vehicle", searchParams)
  }

  const handleMakeChange = (make: string) => {
    setVehicleSearch({ ...vehicleSearch, make, model: "" })
  }

  const clearSizeFilters = () => {
    setSizeSearch({
      width: "",
      ratio: "",
      diameter: "",
      condition: "",
    })
    onClear?.()
  }

  const clearVehicleFilters = () => {
    setVehicleSearch({
      year: "",
      make: "",
      model: "",
      condition: "",
    })
    onClear?.()
  }

  // Check if any size filters are active
  const hasSizeFilters = sizeSearch.width || sizeSearch.ratio || sizeSearch.diameter || sizeSearch.condition

  // Check if any vehicle filters are active
  const hasVehicleFilters = vehicleSearch.year || vehicleSearch.make || vehicleSearch.model || vehicleSearch.condition

  return (
    <Card className="p-6 bg-card">
      <Tabs defaultValue="size" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="size">{t("searchBySize")}</TabsTrigger>
          <TabsTrigger value="vehicle">{t("searchByVehicle")}</TabsTrigger>
        </TabsList>

        <TabsContent value="size" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("width")}</label>
              <Select value={sizeSearch.width} onValueChange={(val) => setSizeSearch({ ...sizeSearch, width: val })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectWidth")} />
                </SelectTrigger>
                <SelectContent>
                  {tireWidths.map((width) => (
                    <SelectItem key={width} value={width.toString()}>
                      {width}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("ratio")}</label>
              <Select value={sizeSearch.ratio} onValueChange={(val) => setSizeSearch({ ...sizeSearch, ratio: val })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectRatio")} />
                </SelectTrigger>
                <SelectContent>
                  {tireRatios.map((ratio) => (
                    <SelectItem key={ratio} value={ratio.toString()}>
                      {ratio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("diameter")}</label>
              <Select
                value={sizeSearch.diameter}
                onValueChange={(val) => setSizeSearch({ ...sizeSearch, diameter: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectDiameter")} />
                </SelectTrigger>
                <SelectContent>
                  {tireDiameters.map((diameter) => (
                    <SelectItem key={diameter} value={diameter.toString()}>
                      {diameter}"
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("condition")}</label>
              <Select
                value={sizeSearch.condition}
                onValueChange={(val) => setSizeSearch({ ...sizeSearch, condition: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("condition")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">{t("new")}</SelectItem>
                  <SelectItem value="Used">{t("used")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSizeSearch} className="flex-1" size="lg">
              <Search className="mr-2 h-5 w-5" />
              {t("searchTires")}
            </Button>
            {hasSizeFilters && (
              <Button onClick={clearSizeFilters} variant="outline" size="lg" className="px-6 bg-transparent">
                <X className="mr-2 h-5 w-5" />
                Clear
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="vehicle" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("year")}</label>
              <Select
                value={vehicleSearch.year}
                onValueChange={(val) => setVehicleSearch({ ...vehicleSearch, year: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectYear")} />
                </SelectTrigger>
                <SelectContent>
                  {vehicleYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("make")}</label>
              <Select value={vehicleSearch.make} onValueChange={handleMakeChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectMake")} />
                </SelectTrigger>
                <SelectContent>
                  {vehicleMakes.map((make) => (
                    <SelectItem key={make} value={make}>
                      {make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("model")}</label>
              <Select
                value={vehicleSearch.model}
                onValueChange={(val) => setVehicleSearch({ ...vehicleSearch, model: val })}
                disabled={!vehicleSearch.make}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectModel")} />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("condition")}</label>
              <Select
                value={vehicleSearch.condition}
                onValueChange={(val) => setVehicleSearch({ ...vehicleSearch, condition: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("condition")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">{t("new")}</SelectItem>
                  <SelectItem value="Used">{t("used")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleVehicleSearch} className="flex-1" size="lg">
              <Search className="mr-2 h-5 w-5" />
              {t("searchTires")}
            </Button>
            {hasVehicleFilters && (
              <Button onClick={clearVehicleFilters} variant="outline" size="lg" className="px-6 bg-transparent">
                <X className="mr-2 h-5 w-5" />
                Clear
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
