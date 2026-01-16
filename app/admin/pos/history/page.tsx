"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ChevronLeft, Trash2, AlertTriangle, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface SaleItem {
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
    type?: "tire" | "service"
}

interface Sale {
    id: string
    sale_date: string
    sale_items: SaleItem[]
    total_amount: number
    payment_method: string
    created_at: string
}

export default function POSHistoryPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [sales, setSales] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)
    const [saleToDelete, setSaleToDelete] = useState<string | null>(null)

    useEffect(() => {
        fetchTodaySales()
    }, [])

    const fetchTodaySales = async () => {
        try {
            setLoading(true)
            const res = await fetch("/api/sales")
            if (!res.ok) throw new Error("Failed to fetch")
            const allSales: Sale[] = await res.json()

            // Filter for today
            const today = new Date().toISOString().split("T")[0]
            const todaysSales = allSales.filter(s => s.sale_date.startsWith(today))

            // Sort by newest first (assuming created_at exists, or use sale_date/id)
            todaysSales.sort((a, b) => new Date(b.created_at || b.sale_date).getTime() - new Date(a.created_at || a.sale_date).getTime())

            setSales(todaysSales)
        } catch (error) {
            console.error("Error fetching sales:", error)
            toast({ title: "Error", description: "No se pudo cargar el historial", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handleVoidSale = async () => {
        if (!saleToDelete) return

        try {
            const res = await fetch(`/api/sales/${saleToDelete}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Delete failed")

            toast({ title: "Venta Anulada", description: "La venta ha sido eliminada del registro." })
            setSales(prev => prev.filter(s => s.id !== saleToDelete))
            setSaleToDelete(null)
        } catch (error) {
            toast({ title: "Error", description: "No se pudo anular la venta", variant: "destructive" })
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b p-4 flex items-center gap-4 sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => router.push("/admin/pos")}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="font-bold text-lg">Historial de Hoy</h1>
            </div>

            <div className="p-4 space-y-4 pb-20">
                {loading ? (
                    <div className="text-center p-10 text-slate-400">Cargando...</div>
                ) : sales.length === 0 ? (
                    <div className="text-center p-10 text-slate-400">
                        <p>No hay ventas registradas hoy.</p>
                    </div>
                ) : (
                    sales.map(sale => (
                        <Card key={sale.id} className="overflow-hidden">
                            <div className="bg-slate-100 px-4 py-2 flex justify-between items-center text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                    <span>{format(new Date(sale.created_at || sale.sale_date), "h:mm a")}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => router.push(`/admin/pos/ticket/${sale.id}`)}
                                    >
                                        <Printer className="h-4 w-4 text-slate-400" />
                                    </Button>
                                </div>
                                <Badge variant="outline" className="uppercase text-xs bg-white">
                                    {sale.payment_method}
                                </Badge>
                            </div>
                            <CardContent className="p-4">
                                <div className="space-y-2 mb-4">
                                    {sale.sale_items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-slate-700">
                                                <span className="font-bold text-slate-900">{item.quantity}x</span> {item.product_name}
                                            </span>
                                            <span className="font-mono">${(item.total_price || 0).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-end border-t pt-3">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase">Total Venta</p>
                                        <p className="text-2xl font-black text-slate-900">${Number(sale.total_amount).toFixed(2)}</p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setSaleToDelete(sale.id)}
                                        className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 border shadow-none"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Anular
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={!!saleToDelete} onOpenChange={(open) => !open && setSaleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            ¿Anular esta venta?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará la venta permanentemente del registro y afectará el cierre de caja.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleVoidSale} className="bg-red-600 hover:bg-red-700">
                            Sí, Anular Venta
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
