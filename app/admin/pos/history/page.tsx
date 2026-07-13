"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Search, Trash2, AlertTriangle, Printer, FileText, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { useSales, deleteSale } from "@/lib/firebase-hooks"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function POSHistoryPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { sales: allSales, loading } = useSales()
    const [saleToDelete, setSaleToDelete] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [viewMode, setViewMode] = useState<"today" | "all">("today")
    const [paymentFilter, setPaymentFilter] = useState<"all" | "cash" | "card" | "transfer" | "mixed">("all")

    // Get today's local date string YYYY-MM-DD
    const today = format(new Date(), "yyyy-MM-dd")

    const normalize = (value: unknown) =>
        String(value ?? "")
            .toLowerCase()
            .replaceAll("#", "")
            .replaceAll("$", "")
            .trim()

    // Filter and sort sales based on mode and search
    const filteredSales = allSales
        .filter(s => {
            // Filter by view mode (today only or all)
            if (viewMode === "today") {
                const saleDateStr = s.sale_date.includes("T")
                    ? format(new Date(s.sale_date), "yyyy-MM-dd")
                    : s.sale_date

                if (saleDateStr !== today) return false
            }

            const paymentMethod = normalize(s.payment_method)
            if (paymentFilter !== "all" && paymentMethod !== paymentFilter) return false

            // Filter by search query (multiple criteria)
            if (searchQuery.trim()) {
                const query = normalize(searchQuery)
                const dateStr = format(new Date(s.sale_date), "dd/MM/yyyy")
                const searchableText = [
                    s.ticket_number,
                    s.id,
                    s.id.slice(0, 6),
                    s.customer_name,
                    s.customer_phone,
                    s.total_amount,
                    paymentMethod,
                    s.notes,
                    dateStr,
                    format(new Date(s.sale_date), "yyyy-MM-dd"),
                    ...(s.sale_items ?? []).flatMap((item: any) => [
                        item.product_name,
                        item.quantity,
                        item.unit_price,
                        item.total_price,
                        item.type,
                        item.source,
                    ]),
                ].map(normalize).join(" ")

                return searchableText.includes(query)
            }

            return true
        })
        .sort((a, b) => new Date(b.created_at || b.sale_date).getTime() - new Date(a.created_at || a.sale_date).getTime())

    const handleVoidSale = async () => {
        if (!saleToDelete) return

        try {
            await deleteSale(saleToDelete)
            toast({ title: "Venta Anulada", description: "La venta ha sido eliminada del registro." })
            setSaleToDelete(null)
        } catch (error) {
            console.error("Error voiding sale:", error)
            toast({ title: "Error", description: "No se pudo anular la venta", variant: "destructive" })
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="p-4 space-y-4 pb-20">
                {/* Search Bar */}
                <div className="space-y-2">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Facturas</p>
                        <h1 className="text-2xl font-black text-slate-900">Historial de ventas</h1>
                    </div>
                    <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Buscar por # factura, cliente, teléfono, producto, nota o monto"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 text-base"
                    />
                    </div>
                </div>

                {/* View Mode Tabs */}
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "today" | "all")}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="today" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Hoy ({allSales.filter(s => {
                                const saleDateStr = s.sale_date.includes("T")
                                    ? format(new Date(s.sale_date), "yyyy-MM-dd")
                                    : s.sale_date
                                return saleDateStr === today
                            }).length})
                        </TabsTrigger>
                        <TabsTrigger value="all" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Todas ({allSales.length})
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                        ["all", "Todos"],
                        ["cash", "Efectivo"],
                        ["card", "Tarjeta"],
                        ["transfer", "Transfer."],
                        ["mixed", "Mixto"],
                    ].map(([value, label]) => (
                        <Button
                            key={value}
                            type="button"
                            variant={paymentFilter === value ? "default" : "outline"}
                            className="h-10"
                            onClick={() => setPaymentFilter(value as typeof paymentFilter)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>

                {/* Results count */}
                {searchQuery && (
                    <p className="text-sm text-slate-500">
                        {filteredSales.length} factura{filteredSales.length !== 1 ? "s" : ""} encontrada{filteredSales.length !== 1 ? "s" : ""}
                    </p>
                )}

                {/* Sales List */}
                {loading ? (
                    <div className="text-center p-10 text-slate-400">Cargando...</div>
                ) : filteredSales.length === 0 ? (
                    <div className="text-center p-10 text-slate-400">
                        {searchQuery ? (
                            <p>No se encontraron facturas con &quot;{searchQuery}&quot;</p>
                        ) : viewMode === "today" ? (
                            <p>No hay ventas registradas hoy.</p>
                        ) : (
                            <p>No hay ventas registradas.</p>
                        )}
                    </div>
                ) : (
                    filteredSales.map(sale => (
                        <Card key={sale.id} className="overflow-hidden">
                            <div className="bg-slate-100 px-4 py-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm text-slate-500">
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Ticket Number - Prominent */}
                                    <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border">
                                        #{sale.ticket_number || sale.id.slice(0, 6)}
                                    </span>
                                    <span className="text-slate-400">
                                        {format(new Date(sale.created_at || sale.sale_date), "dd/MM/yy h:mm a", { locale: es })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => router.push(`/admin/pos/ticket/${sale.id}`)}
                                        title="Ver/Imprimir factura"
                                    >
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                    <Badge variant="outline" className="uppercase text-xs bg-white">
                                        {sale.payment_method}
                                    </Badge>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <div className="mb-3 text-xs text-slate-500">
                                    <span className="font-semibold text-slate-700">{sale.customer_name || "Cliente General"}</span>
                                    {sale.customer_phone && <span> · {sale.customer_phone}</span>}
                                </div>
                                <div className="space-y-2 mb-4">
                                    {sale.sale_items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between gap-3 text-sm">
                                            <span className="text-slate-700 min-w-0">
                                                <span className="font-bold text-slate-900">{item.quantity}x</span> {item.product_name}
                                                {item.source === "manual" && (
                                                    <Badge variant="outline" className="ml-2 text-[10px]">Manual</Badge>
                                                )}
                                            </span>
                                            <span className="font-mono flex-shrink-0">${Number(item.total_price || 0).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 border-t pt-3">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase">Total Venta</p>
                                        <p className="text-2xl font-black text-slate-900">${Number(sale.total_amount).toFixed(2)}</p>
                                    </div>
                                    <div className="grid grid-cols-[1fr_auto] sm:flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/admin/pos/ticket/${sale.id}`)}
                                        >
                                            <Printer className="h-4 w-4 mr-2" />
                                            Ver Factura
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setSaleToDelete(sale.id)}
                                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 border shadow-none"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
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
