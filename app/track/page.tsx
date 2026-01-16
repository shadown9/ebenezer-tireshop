"use client"

import { useState, useEffect } from "react"
import { getAppointmentByTrackingNumber } from "@/lib/firebase-hooks"
import { PublicHeader } from "@/components/public-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, Clock, DollarSign, Car, User, Phone, Mail, CheckCircle2 } from "lucide-react"
import { useTranslations } from "@/lib/translations"

export default function TrackPage() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [searchedAppointment, setSearchedAppointment] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const { t } = useTranslations()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tracking = params.get("tracking")
    if (tracking) {
      setTrackingNumber(tracking)
      handleSearch(tracking)
    }
  }, [])

  const handleSearch = async (trackingNum?: string) => {
    const searchNum = trackingNum || trackingNumber
    if (!searchNum.trim()) return

    setLoading(true)
    try {
      const found = await getAppointmentByTrackingNumber(searchNum.trim().toUpperCase())

      if (found) {
        setSearchedAppointment(found)
        setNotFound(false)
      } else {
        setSearchedAppointment(null)
        setNotFound(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = {
    pending: { label: t("pending"), color: "bg-yellow-500", icon: Clock },
    confirmed: { label: t("confirmed"), color: "bg-blue-500", icon: CheckCircle2 },
    "in-progress": { label: t("inProgress"), color: "bg-purple-500", icon: Clock },
    completed: { label: t("completed"), color: "bg-green-500", icon: CheckCircle2 },
    cancelled: { label: t("cancelled"), color: "bg-red-500", icon: Clock },
  }

  const StatusIcon = searchedAppointment
    ? statusConfig[searchedAppointment.status as keyof typeof statusConfig].icon
    : Clock

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">{t("trackYourService")}</h1>
            <p className="text-muted-foreground">{t("enterTrackingNumber")}</p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder={t("trackingNumberPlaceholder")}
                  value={trackingNumber}
                  onChange={(e) => {
                    setTrackingNumber(e.target.value)
                    setNotFound(false)
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 text-center sm:text-left uppercase"
                  disabled={loading}
                />
                <Button onClick={() => handleSearch()} className="w-full sm:w-auto" disabled={loading}>
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {t("search")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {notFound && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <p className="text-red-600 font-medium">{t("notFound")}</p>
                <p className="text-sm text-red-500 mt-2">{t("invalidTracking")}</p>
              </CardContent>
            </Card>
          )}

          {searchedAppointment && (
            <div className="space-y-6">
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{t("currentStatus")}</CardTitle>
                    <Badge
                      className={`${statusConfig[searchedAppointment.status as keyof typeof statusConfig].color} text-white`}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[searchedAppointment.status as keyof typeof statusConfig].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("trackingNumber")}:</span>
                      <span className="font-mono font-semibold">{searchedAppointment.trackingNumber}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("statusTimeline")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {["pending", "confirmed", "in-progress", "completed"].map((status, index) => {
                      const currentIndex = ["pending", "confirmed", "in-progress", "completed"].indexOf(
                        searchedAppointment.status,
                      )
                      const isActive = index <= currentIndex
                      const isCancelled = searchedAppointment.status === "cancelled"

                      return (
                        <div key={status} className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isActive && !isCancelled
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isActive && !isCancelled ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <span className="text-xs">{index + 1}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`font-medium text-sm ${
                                isActive && !isCancelled ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {statusConfig[status as keyof typeof statusConfig].label}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("appointmentDetails")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("date")}</p>
                        <p className="font-medium">{new Date(searchedAppointment.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("time")}</p>
                        <p className="font-medium">{searchedAppointment.time}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <h4 className="font-semibold mb-2">{t("servicesRequested")}</h4>
                    <div className="space-y-2">
                      {searchedAppointment.services.map((service: any, index: number) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium">{service.serviceName}</p>
                          {service.option && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {service.option.replace("-", " ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("total")}</p>
                      <p className="text-xl font-bold text-primary">${searchedAppointment.totalPrice}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("customer")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{searchedAppointment.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{searchedAppointment.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{searchedAppointment.customerPhone}</span>
                  </div>
                </CardContent>
              </Card>

              {searchedAppointment.vehicleInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("vehicle")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <Car className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {searchedAppointment.vehicleInfo.year} {searchedAppointment.vehicleInfo.make}{" "}
                          {searchedAppointment.vehicleInfo.model}
                        </p>
                        {searchedAppointment.vehicleInfo.engine && (
                          <p className="text-sm text-muted-foreground">{searchedAppointment.vehicleInfo.engine}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
