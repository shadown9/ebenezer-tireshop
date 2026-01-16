"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Clock, User, Car, CheckCircle, XCircle, AlertCircle, Loader } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Appointment, AppointmentStatus } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppointments, updateAppointment as updateAppointmentInFirebase } from "@/lib/firebase-hooks"
import { notificationHelpers } from "@/lib/notification-system"

const statusConfig = {
  pending: {
    label: "Pending",
    icon: AlertCircle,
    color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    variant: "outline",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle,
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    variant: "outline",
  },
  "in-progress": {
    label: "In Progress",
    icon: Loader,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    variant: "outline",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    variant: "outline",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    variant: "outline",
  },
}

function AppointmentCard({ appointment, onStatusChange }: { appointment: Appointment; onStatusChange: () => void }) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const { toast } = useToast()

  const StatusIcon = statusConfig[appointment.status].icon

  const handleQuickStatusChange = async (newStatus: AppointmentStatus, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    await updateAppointmentInFirebase(appointment.id, { status: newStatus })

    notificationHelpers.appointmentStatusChange(appointment.trackingNumber || appointment.id, newStatus)

    toast({
      title: "Estado Actualizado",
      description: `Cita marcada como ${statusConfig[newStatus].label}`,
    })
    onStatusChange()
  }

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    await updateAppointmentInFirebase(appointment.id, { status: newStatus })

    notificationHelpers.appointmentStatusChange(appointment.trackingNumber || appointment.id, newStatus)

    toast({
      title: "Estado Actualizado",
      description: `Cita marcada como ${statusConfig[newStatus].label}`,
    })
    onStatusChange()
    setSelectedAppointment(null)
  }

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setSelectedAppointment(appointment)}
      >
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg mb-1 break-words">{appointment.customerName}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{appointment.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{appointment.time}</span>
                </div>
              </div>
            </div>
            <Badge
              variant={statusConfig[appointment.status].variant}
              className="flex items-center gap-1 whitespace-nowrap self-start sm:self-auto"
            >
              <StatusIcon className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs">{statusConfig[appointment.status].label}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {appointment.vehicleInfo && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground break-words">
                {appointment.vehicleInfo.year} {appointment.vehicleInfo.make} {appointment.vehicleInfo.model}
              </span>
            </div>
          )}

          <div className="space-y-1">
            {appointment.services.map((service, idx) => (
              <div key={idx} className="text-xs sm:text-sm text-muted-foreground">
                {service.serviceName}
                {service.rotorCount && <span className="ml-1">({service.rotorCount} Rotors)</span>}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-base sm:text-lg font-bold text-primary">${appointment.totalPrice}</span>
            {appointment.trackingNumber && (
              <span className="text-xs text-muted-foreground font-mono">{appointment.trackingNumber}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            {appointment.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => handleQuickStatusChange("in-progress", e)}
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 text-xs h-8"
                >
                  <Loader className="h-3 w-3 mr-1" />
                  Comenzar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => handleQuickStatusChange("confirmed", e)}
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 text-xs h-8"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Confirmar
                </Button>
              </>
            )}
            {appointment.status === "in-progress" && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => handleQuickStatusChange("completed", e)}
                className="col-span-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 text-xs h-8"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Marcar como Listo
              </Button>
            )}
            {(appointment.status === "confirmed" || appointment.status === "completed") && (
              <div className="col-span-2 text-center text-xs text-muted-foreground py-1">
                Haz clic para ver más opciones
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedAppointment?.id === appointment.id && (
        <Dialog open={true} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] p-0">
            <ScrollArea className="max-h-[90vh]">
              <div className="p-6">
                <DialogHeader className="mb-4">
                  <DialogTitle>Detalles de la Cita</DialogTitle>
                  <DialogDescription>Ver y gestionar información de la cita</DialogDescription>
                </DialogHeader>

                {selectedAppointment && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Customer Info */}
                    <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Información del Cliente
                      </h3>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span className="text-muted-foreground">Nº de Rastreo:</span>
                          <span className="font-mono font-semibold text-primary">
                            {selectedAppointment.trackingNumber}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span className="text-muted-foreground">Nombre:</span>
                          <span className="font-medium text-foreground">{selectedAppointment.customerName}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium text-foreground break-all">
                            {selectedAppointment.customerEmail}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span className="text-muted-foreground">Teléfono:</span>
                          <span className="font-medium text-foreground">{selectedAppointment.customerPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Info */}
                    {selectedAppointment.vehicleInfo && (
                      <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground mb-3 flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          Información del Vehículo
                        </h3>
                        <div className="space-y-2 text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground">Año:</span>
                            <span className="font-medium text-foreground">{selectedAppointment.vehicleInfo.year}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground">Marca:</span>
                            <span className="font-medium text-foreground">{selectedAppointment.vehicleInfo.make}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground">Modelo:</span>
                            <span className="font-medium text-foreground">{selectedAppointment.vehicleInfo.model}</span>
                          </div>
                          {selectedAppointment.vehicleInfo.engine && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="text-muted-foreground">Motor:</span>
                              <span className="font-medium text-foreground">
                                {selectedAppointment.vehicleInfo.engine}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Services */}
                    <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground mb-3">Servicios Solicitados</h3>
                      <div className="space-y-2">
                        {selectedAppointment.services.map((service, index) => (
                          <div key={index} className="flex justify-between text-xs sm:text-sm">
                            <div>
                              <p className="font-medium text-foreground">{service.serviceName}</p>
                              {service.option && (
                                <p className="text-xs text-muted-foreground capitalize">
                                  {service.option.replace("-", " ")}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold text-base sm:text-lg pt-2 border-t">
                          <span className="text-foreground">Precio Total:</span>
                          <span className="text-primary">${selectedAppointment.totalPrice}</span>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground mb-3">
                        Fecha y Hora de la Cita
                      </h3>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span className="text-muted-foreground">Fecha:</span>
                          <span className="font-medium text-foreground">
                            {new Date(selectedAppointment.date).toLocaleDateString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span className="text-muted-foreground">Hora:</span>
                          <span className="font-medium text-foreground">{selectedAppointment.time}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 items-start sm:items-center">
                          <span className="text-muted-foreground">Estado:</span>
                          <Badge className={`${statusConfig[selectedAppointment.status].color} border text-xs`}>
                            {statusConfig[selectedAppointment.status].label}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">Cambiar Estado de la Cita:</p>
                        <Badge variant="outline" className="text-xs">
                          Actual: {statusConfig[selectedAppointment.status].label}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <Button
                          variant="outline"
                          onClick={() => handleStatusChange("confirmed")}
                          disabled={selectedAppointment.status === "confirmed"}
                          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed h-auto py-3 sm:py-4 text-xs sm:text-sm font-medium"
                        >
                          <CheckCircle className="mr-1 sm:mr-2 h-4 w-4" />
                          Confirmar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleStatusChange("in-progress")}
                          disabled={selectedAppointment.status === "in-progress"}
                          className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:text-purple-800 disabled:opacity-50 disabled:cursor-not-allowed h-auto py-3 sm:py-4 text-xs sm:text-sm font-medium"
                        >
                          <Loader className="mr-1 sm:mr-2 h-4 w-4" />
                          En Progreso
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleStatusChange("completed")}
                          disabled={selectedAppointment.status === "completed"}
                          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed h-auto py-3 sm:py-4 text-xs sm:text-sm font-medium"
                        >
                          <CheckCircle className="mr-1 sm:mr-2 h-4 w-4" />
                          Completar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleStatusChange("cancelled")}
                          disabled={selectedAppointment.status === "cancelled"}
                          className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed h-auto py-3 sm:py-4 text-xs sm:text-sm font-medium"
                        >
                          <XCircle className="mr-1 sm:mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        Toca un botón para actualizar el estado de esta cita
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export default function AgendaPage() {
  const { appointments, loading } = useAppointments()
  const [refreshKey, setRefreshKey] = useState(0)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setRefreshKey((k) => k + 1)
  }, [appointments])

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  const todayAppointments = appointments.filter((apt) => apt.date === todayStr)
  const upcomingAppointments = appointments.filter((apt) => apt.date > todayStr)
  const pastAppointments = appointments.filter((apt) => apt.date < todayStr)

  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    await updateAppointmentInFirebase(appointmentId, { status: newStatus })
    setIsDetailDialogOpen(false)
    toast({
      title: "Status Updated",
      description: `Appointment status changed to ${newStatus}`,
    })
  }

  const handleQuickStatusChange = async (
    e: React.MouseEvent,
    appointmentId: string,
    newStatus: AppointmentStatus,
    statusText: string,
  ) => {
    e.stopPropagation()
    await updateAppointmentInFirebase(appointmentId, { status: newStatus })

    notificationHelpers.appointmentStatusChange(appointmentId, newStatus)

    toast({
      title: "Estado Actualizado",
      description: statusText,
    })
  }

  return (
    <div>
      <div className="pt-14 lg:pt-0">
        <AdminHeader title="Agenda" description="Manage appointments and schedule" />
      </div>

      <div className="p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardHeader className="pb-2 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Today</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{todayAppointments.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600">
                {appointments.filter((apt) => apt.status === "pending").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">
                {appointments.filter((apt) => apt.status === "in-progress").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
                {appointments.filter((apt) => apt.status === "completed").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="today" className="w-full">
          <div className="overflow-x-auto mb-4 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="mb-0 w-full sm:w-auto inline-flex min-w-full sm:min-w-0">
              <TabsTrigger value="today" className="text-xs sm:text-sm flex-1 sm:flex-none">
                Today ({todayAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="text-xs sm:text-sm flex-1 sm:flex-none">
                Upcoming ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="text-xs sm:text-sm flex-1 sm:flex-none">
                Past ({pastAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs sm:text-sm flex-1 sm:flex-none">
                All ({appointments.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="today">
            {todayAppointments.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {todayAppointments.map((appointment) => (
                  <AppointmentCard
                    key={`${appointment.id}-${refreshKey}`}
                    appointment={appointment}
                    onStatusChange={() => setRefreshKey((k) => k + 1)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-muted-foreground">No appointments scheduled for today</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingAppointments.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {upcomingAppointments.map((appointment) => (
                  <AppointmentCard
                    key={`${appointment.id}-${refreshKey}`}
                    appointment={appointment}
                    onStatusChange={() => setRefreshKey((k) => k + 1)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-muted-foreground">No upcoming appointments</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastAppointments.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {pastAppointments.map((appointment) => (
                  <AppointmentCard
                    key={`${appointment.id}-${refreshKey}`}
                    appointment={appointment}
                    onStatusChange={() => setRefreshKey((k) => k + 1)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-muted-foreground">No past appointments</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {appointments.map((appointment) => (
                <AppointmentCard
                  key={`${appointment.id}-${refreshKey}`}
                  appointment={appointment}
                  onStatusChange={() => setRefreshKey((k) => k + 1)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
