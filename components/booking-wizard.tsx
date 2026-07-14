"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { useServices, addAppointment } from "@/lib/firebase-hooks"
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { mockServices, serviceOptions } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { VehicleInfo } from "@/lib/types"
import type { Appointment } from "@/lib/types"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { generateTrackingNumber } from "@/lib/mock-data"
import { X } from "lucide-react"
import { CheckCircle2 } from "lucide-react"
import { useTranslations } from "@/lib/translations"

interface BookingWizardProps {
  preselectedTireId?: string | null
  onClose?: () => void
}

type WizardStep = {
  id: WizardStepId
  label: string
}

type WizardStepId = "services" | "vehicle" | "datetime" | "contact" | "confirmation"

const stepIds: WizardStepId[] = ["services", "vehicle", "datetime", "contact", "confirmation"]

export function BookingWizard({ preselectedTireId, onClose }: BookingWizardProps) {
  const { services: firebaseServices, loading: servicesLoading } = useServices()
  const { toast } = useToast()
  const router = useRouter()
  const { t, language } = useTranslations()
  const dateLocale = language === "es" ? "es-ES" : "en-US"

  const steps: WizardStep[] = stepIds.map((id) => ({
    id,
    label:
      id === "services"
        ? t("selectServices")
        : id === "vehicle"
          ? t("vehicleInfo")
          : id === "datetime"
            ? t("chooseDate")
            : id === "contact"
              ? t("contactInformation")
              : t("confirmBooking"),
  }))

  const availableServices = firebaseServices.length > 0 ? firebaseServices : mockServices

  const [currentStep, setCurrentStep] = useState<WizardStepId>("services")
  const [activeCategory, setActiveCategory] = useState<"tire" | "mechanical" | "specialty">("tire")
  const [selectedServices, setSelectedServices] = useState<string[]>(preselectedTireId ? ["mount-balance"] : [])
  const [serviceOptionsMap, setServiceOptionsMap] = useState<Record<string, string>>({})
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    year: new Date().getFullYear(),
    make: "",
    model: "",
    engine: "",
  })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState("")
  const [contactInfo, setContactInfo] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [selectedRotorOption, setSelectedRotorOption] = useState<string | undefined>(undefined)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const availableTimes = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]

  const requiresVehicleInfo = selectedServices.some((serviceId) => {
    const service = availableServices.find((s) => s.id === serviceId)
    return service?.requiresVehicleInfo
  })

  const hasDiscResurfacing = selectedServices.includes("disc-resurfacing")

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId))
      const newOptionsMap = { ...serviceOptionsMap }
      delete newOptionsMap[serviceId]
      setServiceOptionsMap(newOptionsMap)
    } else {
      setSelectedServices([...selectedServices, serviceId])
    }
  }

  const calculateTotal = () => {
    let total = 0
    selectedServices.forEach((serviceId) => {
      const service = availableServices.find((s) => s.id === serviceId)
      if (service?.hasOptions && serviceOptionsMap[serviceId]) {
        const option = serviceOptions.find(
          (opt) => opt.serviceId === serviceId && opt.option === serviceOptionsMap[serviceId],
        )
        total += option?.price || 0
      } else {
        total += service?.basePrice || 0
      }
    })
    return total
  }

  const handleNextStep = () => {
    if (currentStep === "services") {
      if (selectedServices.length === 0) {
        toast({
          title: t("selectAtLeastOneService"),
          variant: "destructive",
        })
        return
      }

      if (hasDiscResurfacing && !selectedRotorOption) {
        toast({
          title: t("selectNumberOfRotors"),
          description: t("rotorRequiredDescription"),
          variant: "destructive",
        })
        return
      }

      if (requiresVehicleInfo) {
        setCurrentStep("vehicle")
      } else {
        setCurrentStep("datetime")
      }
    } else if (currentStep === "vehicle") {
      if (!vehicleInfo.make || !vehicleInfo.model) {
        toast({
          title: t("vehicleInfoRequired"),
          description: t("enterVehicleMakeModel"),
          variant: "destructive",
        })
        return
      }
      setCurrentStep("datetime")
    } else if (currentStep === "datetime") {
      if (!selectedDate || !selectedTime) {
        toast({
          title: t("selectDateTimeRequired"),
          variant: "destructive",
        })
        return
      }
      setCurrentStep("contact")
    } else if (currentStep === "contact") {
      if (!contactInfo.name || !contactInfo.email || !contactInfo.phone) {
        toast({
          title: t("fillContactInfo"),
          description: t("enterNameEmailPhone"),
          variant: "destructive",
        })
        return
      }
      setCurrentStep("confirmation")
    }
  }

  const handlePrevStep = () => {
    if (currentStep === "vehicle") {
      setCurrentStep("services")
    } else if (currentStep === "datetime") {
      if (requiresVehicleInfo) {
        setCurrentStep("vehicle")
      } else {
        setCurrentStep("services")
      }
    } else if (currentStep === "contact") {
      setCurrentStep("datetime")
    } else if (currentStep === "confirmation") {
      setCurrentStep("contact")
    }
  }

  const handleBookAppointment = async () => {
    try {
      const servicesList = selectedServices.map((serviceId) => {
        const service = availableServices.find((s) => s.id === serviceId)
        const option = serviceId === "disc-resurfacing" && selectedRotorOption ? selectedRotorOption : undefined

        // Only include option if it exists
        const serviceData: any = {
          serviceId,
          serviceName: service?.name || "",
        }

        if (option) {
          serviceData.option = option
        }

        return serviceData
      })

      const appointment: Omit<Appointment, "id"> = {
        trackingNumber: generateTrackingNumber(),
        customerName: contactInfo.name,
        customerEmail: contactInfo.email,
        customerPhone: contactInfo.phone,
        services: servicesList,
        date: selectedDate?.toISOString().split("T")[0] || "",
        time: selectedTime,
        status: "pending",
        totalPrice: calculateTotal(),
        createdAt: new Date().toISOString(),
      }

      // Only add vehicleInfo if it's required
      if (requiresVehicleInfo) {
        appointment.vehicleInfo = vehicleInfo
      }



      const appointmentId = await addAppointment(appointment)



      setTrackingNumber(appointment.trackingNumber)
      setIsSuccess(true)

      // Create notification for admin
      try {
        await addDoc(collection(db, "notifications"), {
          type: "appointment",
        title: "Nueva Cita Reservada",
          message: `${contactInfo.name} ha reservado una cita para ${appointment.date} a las ${appointment.time}`,
          priority: "high",
          read: false,
          createdAt: new Date().toISOString(),
          link: "/admin/agenda",
          metadata: {
            appointmentId: appointmentId,
            customerName: contactInfo.name
          }
        })
      } catch (error) {
        console.error("Error creating notification", error)
      }

      toast({
        title: t("appointmentBooked"),
        description: `${t("trackingNumberIs")}: ${appointment.trackingNumber}`,
        duration: 8000,
      })
    } catch (error) {

      toast({
        title: "Error",
        description: t("bookingError"),
        variant: "destructive",
      })
    }
  }

  const handleBack = () => {
    handlePrevStep()
  }

  const handleNext = () => {
    handleNextStep()
  }

  const handleConfirm = () => {
    handleBookAppointment()
  }

  const canProceed = () => {


    if (currentStep === "services") {
      return selectedServices.length > 0 && (!hasDiscResurfacing || selectedRotorOption)
    }
    if (currentStep === "vehicle") {
      return vehicleInfo.make && vehicleInfo.model
    }
    if (currentStep === "datetime") {
      return selectedDate && selectedTime
    }
    if (currentStep === "contact") {
      const isValid = !!(contactInfo.name && contactInfo.email && contactInfo.phone)

      return isValid
    }
    if (currentStep === "confirmation") {
      return true
    }
    return false
  }

  useEffect(() => {

  }, [currentStep, requiresVehicleInfo, selectedServices])

  if (isSuccess && trackingNumber) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t("appointmentConfirmedTitle")}</h2>
              <p className="text-muted-foreground">{t("appointmentConfirmedDescription")}</p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">{t("trackingNumberIs")}</p>
              <p className="text-3xl font-bold font-mono text-primary tracking-wider">{trackingNumber}</p>
              <p className="text-xs text-muted-foreground mt-3">{t("saveThisNumber")}</p>
            </div>

            <div className="space-y-3">
              <Button onClick={() => (window.location.href = `/track?tracking=${trackingNumber}`)} className="w-full">
                {t("trackMyService")}
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/")} className="w-full">
                {t("backToHome")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-3xl mx-auto border-border/50 shadow-lg">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">{t("bookYourService")}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose ?? (() => router.push("/"))} className="hover:bg-accent">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <CardDescription className="text-sm sm:text-base text-muted-foreground">
          {t("simpleBookingSteps")}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Progress Steps */}
        <div className="flex justify-between items-center">
          {steps
            .filter((step) => step.id !== "vehicle" || requiresVehicleInfo)
            .map((step, index, filteredSteps) => {
              const stepIndex = steps.findIndex((s) => s.id === step.id)
              const currentStepIndex = steps.findIndex((s) => s.id === currentStep)
              const isActive = step.id === currentStep
              const isCompleted = stepIndex < currentStepIndex

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-medium transition-colors",
                        isActive && "bg-primary text-primary-foreground",
                        isCompleted && "bg-primary/80 text-primary-foreground",
                        !isActive && !isCompleted && "bg-muted text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={cn(
                        "text-xs sm:text-sm mt-2 text-center hidden sm:block",
                        isActive && "text-primary font-medium",
                        !isActive && "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < filteredSteps.length - 1 && (
                    <div
                      className={cn("h-[2px] flex-1 transition-colors", isCompleted ? "bg-primary/80" : "bg-muted")}
                    />
                  )}
                </div>
              )
            })}
        </div>

        {/* Service Selection */}
        {currentStep === "services" && (
          <div className="w-full max-w-2xl mx-auto p-4 sm:p-6">
            <Card className="border-border/50">
              <CardHeader className="space-y-1 pb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">{t("selectServices")}</h3>
                <p className="text-sm text-muted-foreground">{t("chooseServicesNeeded")}</p>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <Tabs
                  value={activeCategory}
                  onValueChange={(value) => setActiveCategory(value as "tire" | "mechanical" | "specialty")}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="tire" className="text-xs sm:text-sm">
                      {t("tire")}
                    </TabsTrigger>
                    <TabsTrigger value="mechanical" className="text-xs sm:text-sm">
                      {t("mechanical")}
                    </TabsTrigger>
                    <TabsTrigger value="specialty" className="text-xs sm:text-sm">
                      {t("specialty")}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="tire" className="space-y-4 mt-0">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">{t("tireServices")}</h3>
                      {availableServices
                        .filter((s) => s.category === "tire")
                        .map((service) => (
                          <div key={service.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <Checkbox
                              id={service.id}
                              checked={selectedServices.includes(service.id)}
                              onCheckedChange={() => toggleService(service.id)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={service.id} className="font-medium cursor-pointer">
                                {service.name}
                              </Label>
                              <p className="text-sm text-muted-foreground">${service.basePrice}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="mechanical" className="space-y-4 mt-0">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">{t("mechanicalServices")}</h3>
                      {availableServices
                        .filter((s) => s.category === "mechanic")
                        .map((service) => (
                          <div key={service.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <Checkbox
                              id={service.id}
                              checked={selectedServices.includes(service.id)}
                              onCheckedChange={() => toggleService(service.id)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={service.id} className="font-medium cursor-pointer">
                                {service.name}
                              </Label>
                              <p className="text-sm text-muted-foreground">${service.basePrice}</p>
                              {service.requiresVehicleInfo && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  {t("requiresVehicleInfo")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="specialty" className="space-y-4 mt-0">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">{t("specialtyServices")}</h3>
                      {availableServices
                        .filter((s) => s.category === "specialty")
                        .map((service) => (
                          <div key={service.id} className="space-y-3">
                            <div className="flex items-start gap-3 p-3 border rounded-lg">
                              <Checkbox
                                id={service.id}
                                checked={selectedServices.includes(service.id)}
                                onCheckedChange={() => toggleService(service.id)}
                              />
                              <div className="flex-1">
                                <Label htmlFor={service.id} className="font-medium cursor-pointer">
                                  {service.name}
                                </Label>
                                <p className="text-sm text-muted-foreground">${service.basePrice}</p>
                                {service.requiresVehicleInfo && (
                                  <Badge variant="secondary" className="mt-1 text-xs">
                                    {t("requiresVehicleInfo")}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {service.id === "disc-resurfacing" && selectedServices.includes(service.id) && (
                              <div className="ml-9 p-3 bg-muted/50 rounded-lg space-y-2">
                                <Label className="text-sm font-medium">{t("selectNumberOfRotorsLabel")}</Label>
                                <RadioGroup
                                  value={selectedRotorOption}
                                  onValueChange={(value) => {
                                    setSelectedRotorOption(value)
                                    setServiceOptionsMap({
                                      ...serviceOptionsMap,
                                      [service.id]: value,
                                    })
                                  }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="2-rotors" id="2-rotors" />
                                    <Label htmlFor="2-rotors" className="cursor-pointer">
                                      {t("twoRotors")}
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="4-rotors" id="4-rotors" />
                                    <Label htmlFor="4-rotors" className="cursor-pointer">
                                      {t("fourRotors")}
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </TabsContent>
                </Tabs>

                {selectedServices.length > 0 && (
                  <div className="bg-muted p-3 sm:p-4 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2 text-sm sm:text-base">{t("selectedServices")}:</h4>
                    <div className="space-y-2">
                      {selectedServices.map((serviceId) => {
                        const service = availableServices.find((s) => s.id === serviceId)
                        const option =
                          serviceId === "disc-resurfacing" && selectedRotorOption ? selectedRotorOption : undefined

                        return (
                          <div key={serviceId} className="flex justify-between text-xs sm:text-sm">
                            <span className="text-foreground">
                              {service?.name}
                              {option && ` (${option})`}
                            </span>
                            <span className="font-medium">
                              $
                              {option ? serviceOptions.find((opt) => opt.option === option)?.price : service?.basePrice}
                            </span>
                          </div>
                        )
                      })}
                      <div className="flex justify-between font-bold text-base sm:text-lg pt-2 border-t">
                        <span className="text-foreground">{t("total")}</span>
                        <span className="text-primary text-xl">${calculateTotal()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Vehicle Information - Only show if required */}
        {currentStep === "vehicle" && requiresVehicleInfo && (
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">{t("vehicleInfo")}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">{t("year")} *</Label>
                <Input
                  id="year"
                  type="number"
                  value={vehicleInfo.year}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, year: Number.parseInt(e.target.value) })}
                  placeholder="2020"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="make">{t("make")} *</Label>
                <Input
                  id="make"
                  value={vehicleInfo.make}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, make: e.target.value })}
                  placeholder="Toyota"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">{t("model")} *</Label>
                <Input
                  id="model"
                  value={vehicleInfo.model}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                  placeholder="Corolla"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="engine">{t("engineOptional")}</Label>
                <Input
                  id="engine"
                  value={vehicleInfo.engine}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, engine: e.target.value })}
                  placeholder="1.8L"
                />
              </div>
            </div>
          </div>
        )}

        {/* Date & Time Selection */}
        {currentStep === "datetime" && (
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">{t("chooseDate")}</h3>

            {!selectedDate ? (
              <div>
                <Label className="text-sm sm:text-base">{t("chooseADate")} *</Label>
                <div className="mt-2 w-full overflow-x-auto">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      return date < today
                    }}
                    className="rounded-md border mx-auto"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-muted p-3 sm:p-4 rounded-lg">
                  <span className="text-sm sm:text-base font-medium text-foreground">
                    {selectedDate.toLocaleDateString(dateLocale, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)}>
                    {t("change")}
                  </Button>
                </div>

                <div>
                  <Label className="text-sm sm:text-base">{t("selectTime")} *</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">
                    {availableTimes
                      .filter((time) => {
                        if (!selectedDate) return true
                        const now = new Date()
                        const isToday =
                          selectedDate.getDate() === now.getDate() &&
                          selectedDate.getMonth() === now.getMonth() &&
                          selectedDate.getFullYear() === now.getFullYear()

                        if (!isToday) return true

                        const [hours, minutes] = time.split(":").map(Number)
                        const timeDate = new Date()
                        timeDate.setHours(hours, minutes, 0, 0)

                        return timeDate > now
                      })
                      .map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          onClick={() => setSelectedTime(time)}
                          className="w-full text-xs sm:text-sm"
                          size="sm"
                        >
                          {time}
                        </Button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact Info */}
        {currentStep === "contact" && (
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">{t("contactInformation")}</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("fullName")} *</Label>
                <Input
                  id="name"
                  value={contactInfo.name}
                  onChange={(e) => {

                    setContactInfo({ ...contactInfo, name: e.target.value })
                  }}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => {

                    setContactInfo({ ...contactInfo, email: e.target.value })
                  }}
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("phoneNumber")} *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => {

                    setContactInfo({ ...contactInfo, phone: e.target.value })
                  }}
                  placeholder="+1-555-0100"
                />
              </div>
            </div>
          </div>
        )}

        {/* Confirmation */}
        {currentStep === "confirmation" && (
          <div className="space-y-6">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">{t("confirmYourAppointment")}</h3>

            <div className="space-y-4">
              <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-semibold text-foreground mb-3 text-sm sm:text-base">{t("servicesSummary")}</h4>
                <div className="space-y-2">
                  {selectedServices.map((serviceId) => {
                    const service = availableServices.find((s) => s.id === serviceId)
                    const option =
                      serviceId === "disc-resurfacing" && selectedRotorOption ? selectedRotorOption : undefined

                    return (
                      <div key={serviceId} className="flex justify-between text-xs sm:text-sm">
                        <span className="text-foreground">
                          {service?.name}
                          {option && ` (${option})`}
                        </span>
                        <span className="font-medium">
                          ${option ? serviceOptions.find((opt) => opt.option === option)?.price : service?.basePrice}
                        </span>
                      </div>
                    )
                  })}
                  <div className="flex justify-between font-bold text-base sm:text-lg pt-2 border-t">
                    <span className="text-foreground">{t("total")}</span>
                    <span className="text-primary text-xl">${calculateTotal()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-semibold text-foreground mb-3 text-sm sm:text-base">{t("dateTime")}</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <span>
                    {selectedDate?.toLocaleDateString(dateLocale, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    {language === "es" ? "a las" : "at"} {selectedTime}
                  </span>
                </div>
              </div>

              <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-semibold text-foreground mb-3 text-sm sm:text-base">{t("contactInformation")}</h4>
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="grid grid-cols-[80px_1fr] items-center">
                    <span className="font-medium text-muted-foreground">{t("name")}:</span>
                    <span className="text-foreground">{contactInfo.name}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] items-center">
                    <span className="font-medium text-muted-foreground">Email:</span>
                    <span className="text-foreground">{contactInfo.email}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] items-center">
                    <span className="font-medium text-muted-foreground">{t("phone")}:</span>
                    <span className="text-foreground">{contactInfo.phone}</span>
                  </div>
                </div>
              </div>

              {requiresVehicleInfo && vehicleInfo && (
                <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-3 text-sm sm:text-base">{t("vehicleInfo")}</h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <span>
                      {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                      {vehicleInfo.engine && ` (${vehicleInfo.engine})`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
        {steps.findIndex((step) => step.id === currentStep) > 0 && (
          <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto order-2 sm:order-1 bg-transparent">
            {t("back")}
          </Button>
        )}
        {steps.findIndex((step) => step.id === currentStep) < steps.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed()} className="w-full sm:flex-1 order-1 sm:order-2">
            {t("continue")}
          </Button>
        ) : (
          <Button onClick={handleConfirm} disabled={!canProceed()} className="w-full sm:flex-1 order-1 sm:order-2">
            {t("confirmAppointment")}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
