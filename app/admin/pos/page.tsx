"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, ClipboardList, Banknote, Settings, LogOut, TrendingUp, CreditCard } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useSales } from "@/lib/firebase-hooks"

interface LoggedSale {
    id: string
    total_amount: number
    payment_method: string
    created_at?: string
    sale_date: string
}

export default function POSDashboard() {
    const router = useRouter()
    const { sales, loading } = useSales()
    const [stats, setStats] = useState({
        total: 0,
        cash: 0,
        card: 0,
        transfer: 0,
        mixed: 0
    })

    useEffect(() => {
        if (!loading) {
            calculateStats()
        }
    }, [sales, loading])

    const calculateStats = () => {
        // Get local date string YYYY-MM-DD
        const today = new Date()
        const todayStr = format(today, "yyyy-MM-dd")

        const todaysSalesData = sales.filter(sale => {
            if (!sale.sale_date) return false
            // Handle both ISO strings and YYYY-MM-DD
            const saleDateStr = sale.sale_date.includes("T")
                ? format(new Date(sale.sale_date), "yyyy-MM-dd")
                : sale.sale_date
            return saleDateStr === todayStr
        })

        const newStats = {
            total: 0,
            cash: 0,
            card: 0,
            transfer: 0,
            mixed: 0
        }

        todaysSalesData.forEach(sale => {
            const amount = Number(sale.total_amount)
            newStats.total += amount
            const method = (sale.payment_method || 'cash').toLowerCase()
            if (method === 'cash') newStats.cash += amount
            else if (method === 'card' || method === 'tarjeta') newStats.card += amount
            else if (method === 'transfer' || method === 'transferencia') newStats.transfer += amount
            else newStats.mixed += amount
        })

        setStats(newStats)
    }


    return (
        <div className="min-h-screen bg-white text-slate-900 pb-20">

            {/* Main Stats Card */}
            <div className="p-4 space-y-4">
                <Card className="bg-white border-2 border-slate-100 shadow-sm overflow-hidden">
                    <CardContent className="p-6 text-center">
                        <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Ventas de Hoy</p>
                        <h2 className="text-4xl font-black text-slate-900 mb-4">
                            ${stats.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>

                        <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                            <div className="bg-green-50 text-green-700 p-2 rounded">
                                <p className="opacity-70">Efectivo</p>
                                <p className="text-sm font-bold">${stats.cash.toFixed(0)}</p>
                            </div>
                            <div className="bg-blue-50 text-blue-700 p-2 rounded">
                                <p className="opacity-70">Tarjeta</p>
                                <p className="text-sm font-bold">${stats.card.toFixed(0)}</p>
                            </div>
                            <div className="bg-purple-50 text-purple-700 p-2 rounded">
                                <p className="opacity-70">Transf.</p>
                                <p className="text-sm font-bold">${stats.transfer.toFixed(0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Grid */}
            <div className="p-4 grid grid-cols-1 gap-4">
                <Button
                    className="h-24 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-[0.98]"
                    onClick={() => router.push("/admin/pos/new")}
                >
                    <div className="flex flex-col items-center gap-2">
                        <ShoppingCart className="h-8 w-8" />
                        NUEVA VENTA
                    </div>
                </Button>

                <div className="grid grid-cols-2 gap-4">
                    <Button
                        className="h-24 text-base font-semibold bg-white text-slate-700 border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 shadow-sm"
                        onClick={() => router.push("/admin/pos/history")}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <ClipboardList className="h-6 w-6 text-blue-600" />
                            Historial
                        </div>
                    </Button>

                    <Button
                        className="h-24 text-base font-semibold bg-white text-slate-700 border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 shadow-sm"
                        onClick={() => router.push("/admin/pos/cash")}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Banknote className="h-6 w-6 text-green-600" />
                            Control Caja
                        </div>
                    </Button>
                </div>

                <Button
                    className="h-16 text-base font-medium bg-green-600 text-white hover:bg-green-700 shadow-sm"
                    onClick={() => router.push("/admin/pos/close?preview=true")}
                >
                    <ClipboardList className="h-5 w-5 mr-2" />
                    Ver Reporte del Día
                </Button>

                <Button
                    className="h-16 text-base font-medium bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                    onClick={() => router.push("/admin/pos/close")}
                >
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Cierre de Caja (Z)
                </Button>
            </div>
        </div>
    )
}
