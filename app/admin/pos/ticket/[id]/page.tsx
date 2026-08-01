"use client"

import { useRouter, useParams } from "next/navigation"
import { format } from "date-fns"
import { Printer, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSales } from "@/lib/firebase-hooks"

export default function TicketPage() {
    const router = useRouter()
    const params = useParams()
    const { sales, loading } = useSales()

    const sale = sales.find((s) => s.id === params.id)

    if (loading) return <div className="p-10 text-center">Cargando ticket...</div>
    if (!sale) return <div className="p-10 text-center">Ticket no encontrado</div>

    const invoiceNumber = sale.ticket_number || sale.id.slice(0, 6)

    const paymentLabel = {
        cash: "Efectivo",
        card: "Tarjeta",
        transfer: "Transferencia",
        mixed: "Mixto",
    }[sale.payment_method] || sale.payment_method

    return (
        <div className="invoice-print-root min-h-screen bg-slate-100 p-4 print:bg-white print:p-0 print:min-h-0">
            <div className="invoice-print-page mx-auto bg-white shadow-lg rounded-lg print:shadow-none print:rounded-none">

                {/* Header (Hidden in Print) */}
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button onClick={() => window.print()} className="gap-2">
                        <Printer className="h-4 w-4" /> Imprimir
                    </Button>
                </div>

                {/* Invoice Content */}
                <div className="invoice-print-content text-slate-950">
                    <div className="flex items-start justify-between gap-8 border-b-2 border-slate-900 pb-5">
                        <div className="flex items-start gap-4">
                            <div className="invoice-logo-wrap flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white p-1">
                                <img src="/logo.png" alt="Ebenezer Tire Shop" className="h-full w-full object-contain" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tight">Ebenezer Tire Shop</h2>
                                <div className="mt-2 text-base leading-relaxed text-slate-700">
                                    <p>507 Hawthorne Ave</p>
                                    <p>Newark, New Jersey 07112</p>
                                    <p>Tel: (973) 896-8575</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Factura</p>
                            <p className="mt-1 text-3xl font-black">#{invoiceNumber}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 border-b border-slate-300 py-5 text-base">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Cliente</p>
                            <p className="mt-1 text-lg font-bold">{sale.customer_name || "Cliente General"}</p>
                            {sale.customer_phone && <p className="text-slate-700">{sale.customer_phone}</p>}
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Fecha</p>
                            <p className="mt-1 text-lg font-bold">
                                {format(new Date(sale.created_at || sale.sale_date), "dd/MM/yyyy")}
                            </p>
                            <p className="text-slate-700">{format(new Date(sale.created_at || sale.sale_date), "h:mm a")}</p>
                        </div>
                    </div>

                    <table className="invoice-items-table my-5 w-full border-collapse text-left text-base">
                        <thead>
                            <tr className="border-b-2 border-slate-900 text-xs uppercase tracking-wide text-slate-500">
                                <th className="py-3 pr-3">Descripción</th>
                                <th className="w-20 px-3 text-center">Cant.</th>
                                <th className="w-28 px-3 text-right">Precio</th>
                                <th className="w-32 pl-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.sale_items.map((item: any, i: number) => (
                                <tr key={i} className="invoice-row border-b border-slate-200">
                                    <td className="py-3 pr-3 font-semibold">{item.product_name}</td>
                                    <td className="px-3 py-3 text-center">{item.quantity}</td>
                                    <td className="px-3 py-3 text-right">${Number(item.unit_price || 0).toFixed(2)}</td>
                                    <td className="py-3 pl-3 text-right font-bold">${Number(item.total_price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="invoice-footer-block ml-auto w-full max-w-sm space-y-3">
                        <div className="flex justify-between text-base">
                            <span className="font-semibold text-slate-600">Método de pago</span>
                            <span className="font-bold">{paymentLabel}</span>
                        </div>
                        <div className="flex justify-between border-t-2 border-slate-900 pt-3 text-3xl font-black">
                            <span>TOTAL</span>
                            <span>${Number(sale.total_amount).toFixed(2)}</span>
                        </div>
                    </div>

                    {sale.notes && (
                        <div className="invoice-row mt-5 rounded-lg border border-slate-300 p-4 text-base">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Notas</p>
                            <p className="mt-1">{sale.notes}</p>
                        </div>
                    )}

                    <div className="invoice-thanks mt-8 border-t border-slate-300 pt-4 text-center text-sm text-slate-600">
                        <p className="font-bold text-slate-900">Gracias por su compra.</p>
                        <p>Use este número para cualquier reclamo: #{invoiceNumber}</p>
                        <p>No se aceptan devoluciones después de 30 días.</p>
                    </div>

                </div>
            </div>
        </div>
    )
}
