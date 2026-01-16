"use client"

import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDataStore } from "@/lib/data-store"
import { Calendar, Package, AlertTriangle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { NotificationDemoTrigger } from "@/components/notification-demo-trigger"

export default function AdminDashboard() {
  const { appointments, tires } = useDataStore()

  const todayAppointments = appointments.filter(
    (apt) => apt.date === new Date().toISOString().split("T")[0] && apt.status !== "cancelled",
  )

  const pendingAppointments = appointments.filter((apt) => apt.status === "pending")

  const lowStockTires = tires.filter((tire) => tire.quantity < 4)

  const totalRevenue = appointments
    .filter((apt) => apt.status === "completed")
    .reduce((sum, apt) => sum + apt.totalPrice, 0)

  return (
    <div className="min-h-screen">
      <AdminHeader title="Dashboard" description="Welcome back! Here's your business overview." />

      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Today's Appointments
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{todayAppointments.length}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {pendingAppointments.length} pending confirmation
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Appointments</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{appointments.length}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">All time bookings</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-destructive">{lowStockTires.length}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Items below 4 units</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Inventory</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{tires.length}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Tire models in stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start h-12 sm:h-auto sm:py-3" size="lg">
                <Link href="/admin/agenda">
                  <Calendar className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">View Today's Schedule</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start bg-transparent h-12 sm:h-auto sm:py-3"
                size="lg"
              >
                <Link href="/admin/inventory">
                  <Package className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Manage Inventory</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start bg-transparent h-12 sm:h-auto sm:py-3"
                size="lg"
              >
                <Link href="/admin/cms">
                  <Package className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Update Website Content</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-foreground">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appointments.slice(0, 3).map((apt) => (
                  <div key={apt.id} className="text-sm border-l-2 border-primary pl-3">
                    <p className="font-medium text-foreground truncate">{apt.customerName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {apt.services[0]?.serviceName} - {apt.date}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <NotificationDemoTrigger />
        </div>
      </div>
    </div>
  )
}
