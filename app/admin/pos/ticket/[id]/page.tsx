"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { format } from "date-fns"
import { Printer, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function TicketPage() {
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()
    const [sale, setSale] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSale()
    }, [])

    const fetchSale = async () => {
        try {
            const res = await fetch(`/api/sales/${params.id}`) // We need a GET endpoint for single sale, reusing current if available or filtering
            // Actually /api/sales/[id] currently supports DELETE and PUT. We need GET.
            // Wait, standard CRUD usually puts GET in [id]. Let's check `app/api/sales/[id]/route.ts`. 
            // If it doesn't have GET, we might need to add it or fetch all and filter (inefficient but safe for now).
            // Let's assume for now we might need to fallback or add it. 
            // To be expeditious, I'll fetch ALL and filter since I already have that endpoint working for History.

            const allRes = await fetch("/api/sales")
            const allSales = await allRes.json()
            const found = allSales.find((s: any) => s.id == params.id)

            if (found) setSale(found)
            else throw new Error("Sale not found")

        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar el ticket", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-10 text-center">Cargando ticket...</div>
    if (!sale) return <div className="p-10 text-center">Ticket no encontrado</div>

    return (
        <div className="min-h-screen bg-slate-100 p-4">
            <div className="max-w-sm mx-auto bg-white shadow-lg p-6 rounded-lg print:shadow-none">

                {/* Header (Hidden in Print) */}
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button onClick={() => window.print()} className="gap-2">
                        <Printer className="h-4 w-4" /> Imprimir
                    </Button>
                </div>

                {/* Receipt Content */}
                <div className="text-center font-mono text-sm leading-relaxed">
                    <h2 className="font-bold text-xl mb-1 uppercase">Ebenezer Tire Shop</h2>
                    <p>507 Hawthorne Ave</p>
                    <p>Newark, New Jersey 07112</p>
                    <p className="mb-4">Tel: (973) 896-8575</p>

                    <div className="border-b border-dashed border-slate-300 my-4"></div>

                    <div className="flex justify-between text-xs text-slate-500 mb-4">
                        <span>{format(new Date(sale.created_at || sale.sale_date), "dd/MM/yyyy h:mm a")}</span>
                        <span>Ticket #{sale.id.slice(0, 6)}</span>
                    </div>

                    <div className="space-y-2 mb-4 text-left">
                        {sale.sale_items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between">
                                <span>{item.quantity}x {item.product_name}</span>
                                <span>${(Number(item.total_price)).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-b border-dashed border-slate-300 my-4"></div>

                    <div className="flex justify-between font-bold text-lg">
                        <span>TOTAL</span>
                        <span>${Number(sale.total_amount).toFixed(2)}</span>
                    </div>

                    <div className="mt-2 text-xs flex justify-between uppercase">
                        <span>Método de Pago:</span>
                        <span>{sale.payment_method}</span>
                    </div>

                    <div className="mt-8 text-center text-xs text-slate-400">
                        <p>¡Gracias por su compra!</p>
                        <p>No se aceptan devoluciones después de 30 días</p>
                    </div>

                </div>
            </div>
        </div>
    )
}
