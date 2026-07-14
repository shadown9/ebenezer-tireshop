"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { enUS, es } from "date-fns/locale"
import { ChevronLeft, Printer, Banknote, CreditCard, Landmark, Settings, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useSales } from "@/lib/firebase-hooks"
import { useAdminText } from "@/lib/admin-translations"

export default function POSClosePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isPreview = searchParams.get('preview') === 'true'
    const { toast } = useToast()
    const { at, language } = useAdminText()
    const dateLocale = language === "es" ? es : enUS
    const { sales: allSales, loading: salesLoading } = useSales()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalSales: 0,
        totalCost: 0,
        netProfit: 0,
        totalCount: 0,
        byMethod: { cash: 0, card: 0, transfer: 0, mixed: 0 },
        cashBalance: { sales: 0, withdrawals: 0, expenses: 0, deposits: 0, final: 0 },
        productsByMethod: {
            cash: [] as any[],
            card: [] as any[],
            transfer: [] as any[],
            mixed: [] as any[]
        },
        soldItems: [] as { name: string; quantity: number; costPrice: number; salePrice: number; totalCost: number; totalSale: number; profit: number }[]
    })

    useEffect(() => {
        if (!salesLoading) {
            calculateStats()
        }
    }, [salesLoading, allSales])

    const calculateStats = async () => {
        try {
            setLoading(true)

            // We normally would fetch cash movements here too
            // const allCash = await fetch("/api/cash").then(r => r.json())
            // For now, let's assume empty cash movements or keep the fetch if that endpoint works
            // To be consistent, let's just fetch cash from API if exists or mock distinct parts
            // Assuming /api/cash still exists or needs replacing. Let's keep existing fetch for cash BUT useHook for sales

            const cashRes = await fetch("/api/cash").catch(() => ({ ok: false, json: () => [] }))
            const allCash = cashRes.ok ? await cashRes.json() : []

            // Local Date String YYYY-MM-DD
            const today = format(new Date(), "yyyy-MM-dd")

            const todaysSales = allSales.filter((s: any) => {
                const saleDateStr = s.sale_date.includes("T")
                    ? format(new Date(s.sale_date), "yyyy-MM-dd")
                    : s.sale_date
                return saleDateStr === today
            })

            const todaysCash = allCash.filter((m: any) => m.created_at && m.created_at.startsWith(today))

            // 1. Sales Totals
            const totalSales = todaysSales.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0)
            const byMethod = { cash: 0, card: 0, transfer: 0, mixed: 0 }

            // 2. Products by Method (and calculate Total Cost)
            let totalCost = 0;
            const soldItems: { name: string; quantity: number; costPrice: number; salePrice: number; totalCost: number; totalSale: number; profit: number }[] = [];

            const productsByMethod = {
                cash: new Map(),
                card: new Map(),
                transfer: new Map(),
                mixed: new Map()
            }

            todaysSales.forEach((sale: any) => {
                const method = (sale.payment_method || 'cash').toLowerCase().trim() as keyof typeof byMethod
                // Safety check for method
                if (byMethod[method] !== undefined) {
                    byMethod[method] += Number(sale.total_amount)
                } else {
                    // Default to mixed if unknown
                    byMethod.mixed += Number(sale.total_amount)
                }

                // Cost Calculation and collect sold items details
                if (sale.sale_items && Array.isArray(sale.sale_items)) {
                    sale.sale_items.forEach((item: any) => {
                        const unitCost = Number(item.cost_price) || 0;
                        const unitPrice = Number(item.unit_price) || 0;
                        const qty = Number(item.quantity) || 1;
                        const itemTotalCost = unitCost * qty;
                        const itemTotalSale = unitPrice * qty;
                        const itemProfit = itemTotalSale - itemTotalCost;

                        totalCost += itemTotalCost;

                        // Add to soldItems list for detailed breakdown
                        soldItems.push({
                            name: item.product_name || 'Producto',
                            quantity: qty,
                            costPrice: unitCost,
                            salePrice: unitPrice,
                            totalCost: itemTotalCost,
                            totalSale: itemTotalSale,
                            profit: itemProfit
                        });
                    });
                }

                const safeMethod = productsByMethod[method] ? method : 'mixed'
                const targetMap = productsByMethod[safeMethod]

                sale.sale_items.forEach((item: any) => {
                    const current = targetMap.get(item.product_name) || { quantity: 0, revenue: 0 }
                    targetMap.set(item.product_name, {
                        quantity: current.quantity + Number(item.quantity),
                        revenue: current.revenue + Number(item.total_price || (item.quantity * item.unit_price))
                    })
                })
            })

            const netProfit = totalSales - totalCost;

            // 3. Cash Control
            const expenses = todaysCash.filter((m: any) => m.type === 'expense').reduce((s: number, m: any) => s + Number(m.amount), 0)
            const withdrawals = todaysCash.filter((m: any) => m.type === 'withdrawal').reduce((s: number, m: any) => s + Number(m.amount), 0)
            const deposits = todaysCash.filter((m: any) => m.type === 'deposit').reduce((s: number, m: any) => s + Number(m.amount), 0)

            const cashBalance = {
                sales: byMethod.cash, // Cash from sales
                expenses,
                withdrawals,
                deposits,
                final: byMethod.cash + deposits - expenses - withdrawals
            }

            setStats({
                totalSales,
                totalCost: totalCost,
                netProfit: netProfit,
                totalCount: todaysSales.length,
                byMethod,
                cashBalance,
                productsByMethod: {
                    cash: Array.from(productsByMethod.cash.entries()).map(([name, data]) => ({ name, ...data })),
                    card: Array.from(productsByMethod.card.entries()).map(([name, data]) => ({ name, ...data })),
                    transfer: Array.from(productsByMethod.transfer.entries()).map(([name, data]) => ({ name, ...data })),
                    mixed: Array.from(productsByMethod.mixed.entries()).map(([name, data]) => ({ name, ...data })),
                },
                soldItems
            })

        } catch (error) {
            console.error("Error fetching stats:", error)
            toast({ title: "Error", description: at("reportErrorDescription"), variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => window.print()

    if (loading) return <div className="text-center p-10">{at("generatingReport")}</div>

    return (
        <div className="min-h-screen bg-slate-50 print:bg-white text-slate-900 pb-20">
            <div className="p-4 space-y-6 print:p-8">

                {/* Header */}
                <div className="text-center border-b pb-6">
                    {isPreview && (
                        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4 font-medium">
                            👁 {at("previewOpenDay")}
                        </div>
                    )}
                    <h2 className="text-2xl font-bold uppercase tracking-widest">
                        {isPreview ? at("dailySummary") : at("dailyZReport")}
                    </h2>
                    <p className="text-slate-500 capitalize">{format(new Date(), language === "es" ? "EEEE, d 'de' MMMM yyyy" : "EEEE, MMMM d, yyyy", { locale: dateLocale })}</p>
                    {!isPreview && <p className="text-sm text-slate-400">{at("cutoff")}: {format(new Date(), "h:mm a")}</p>}
                </div>

                {/* Financial Summary */}
                <Card className="border-2 border-slate-900">
                    <CardHeader className="bg-slate-50 pb-2 border-b">
                        <CardTitle className="text-sm font-bold uppercase text-slate-500">{at("financialSummary")}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="font-bold text-slate-700">{at("totalSalesGross")}</span>
                            <span className="font-black text-2xl">${stats.totalSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>- {at("estimatedInventoryCost")}</span>
                            <span>${stats.totalCost.toFixed(2)}</span>
                        </div>
                        <div className="my-2 border-t pt-2 flex justify-between">
                            <span className="font-semibold text-green-700">{at("netProfit")}</span>
                            <span className="font-bold text-xl text-green-700">${stats.netProfit.toFixed(2)}</span>
                        </div>

                        <div className="border-t my-4"></div>

                        <div className="space-y-1 pt-2 text-sm">
                            <div className="flex justify-between text-green-700 font-medium">
                                <span>{at("cash")}</span>
                                <span>${stats.byMethod.cash.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-blue-700 font-medium">
                                <span>{at("card")}</span>
                                <span>${stats.byMethod.card.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-purple-700 font-medium">
                                <span>{at("transfer")}</span>
                                <span>${stats.byMethod.transfer.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-orange-700 font-medium">
                                <span>{at("mixed")}</span>
                                <span>${stats.byMethod.mixed.toFixed(2)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* DETAILED BREAKDOWN - Only for Admin Preview */}
                {stats.soldItems.length > 0 && (
                    <Card className="border-orange-200 bg-orange-50/30">
                        <CardHeader className="pb-2 border-b border-orange-100">
                            <CardTitle className="text-sm font-bold uppercase text-orange-800 flex items-center gap-2">
                                📊 {at("detailedProductBreakdown")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-1">
                            <div className="grid grid-cols-5 gap-2 text-xs font-bold text-slate-600 border-b pb-2 mb-2">
                                <span className="col-span-2">{at("product")}</span>
                                <span className="text-right">{at("cost")}</span>
                                <span className="text-right">{at("soldAmount")}</span>
                                <span className="text-right">{at("profit")}</span>
                            </div>
                            {stats.soldItems.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-5 gap-2 text-sm py-1 border-b border-dashed border-slate-200 last:border-0">
                                    <span className="col-span-2 font-medium truncate">
                                        {item.quantity > 1 && <span className="text-orange-600 mr-1">{item.quantity}x</span>}
                                        {item.name}
                                    </span>
                                    <span className="text-right text-slate-500">${item.totalCost.toFixed(2)}</span>
                                    <span className="text-right text-blue-700">${item.totalSale.toFixed(2)}</span>
                                    <span className={`text-right font-bold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.profit >= 0 ? '+' : ''}${item.profit.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                            <div className="pt-3 mt-2 border-t-2 border-orange-200 grid grid-cols-5 gap-2 text-sm font-bold">
                                <span className="col-span-2 text-slate-700">{at("totals")}</span>
                                <span className="text-right text-slate-700">${stats.totalCost.toFixed(2)}</span>
                                <span className="text-right text-blue-700">${stats.totalSales.toFixed(2)}</span>
                                <span className={`text-right ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toFixed(2)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* CASH CONTROL SECTION */}
                <Card className="border-green-200 bg-green-50/30">
                    <CardHeader className="pb-2 border-b border-green-100">
                        <CardTitle className="text-sm font-bold uppercase text-green-800 flex items-center gap-2">
                            <Banknote className="h-4 w-4" /> {at("cashControl")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>(+) {at("cashSales")}</span>
                            <span className="font-mono font-bold">${stats.cashBalance.sales.toFixed(2)}</span>
                        </div>
                        {stats.byMethod.mixed > 0 && (
                            <div className="flex justify-between text-orange-600 italic">
                                <span>(+) {at("mixedSalesCheck")}</span>
                                <span className="font-mono font-bold">${stats.byMethod.mixed.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-green-600">
                            <span>(+) {at("deposits")}</span>
                            <span className="font-mono font-bold">${stats.cashBalance.deposits.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                            <span>(-) {at("expenses")}</span>
                            <span className="font-mono font-bold">-${stats.cashBalance.expenses.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-orange-600">
                            <span>(-) {at("withdrawals")}</span>
                            <span className="font-mono font-bold">-${stats.cashBalance.withdrawals.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-green-200 pt-2 mt-2 flex justify-between text-lg font-black text-green-900">
                            <span>= {at("cashInRegisterTotal")}</span>
                            <span>${stats.cashBalance.final.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* PRODUCT BREAKDOWN */}
                <div className="space-y-4">
                    {/* Cash Products */}
                    {stats.productsByMethod.cash.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold uppercase text-green-700 mb-2 border-b border-green-200 pb-1">{at("soldInCash")} ({stats.productsByMethod.cash.length})</h3>
                            {stats.productsByMethod.cash.map((p: any, i) => (
                                <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0 border-slate-100">
                                    <span>{p.quantity}x {p.name}</span>
                                    <span className="font-mono">${p.revenue.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Card Products */}
                    {stats.productsByMethod.card.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold uppercase text-blue-700 mb-2 border-b border-blue-200 pb-1">{at("soldByCard")} ({stats.productsByMethod.card.length})</h3>
                            {stats.productsByMethod.card.map((p: any, i) => (
                                <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0 border-slate-100">
                                    <span>{p.quantity}x {p.name}</span>
                                    <span className="font-mono">${p.revenue.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Transfer Products */}
                    {stats.productsByMethod.transfer.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold uppercase text-purple-700 mb-2 border-b border-purple-200 pb-1">{at("soldByTransfer")} ({stats.productsByMethod.transfer.length})</h3>
                            {stats.productsByMethod.transfer.map((p: any, i) => (
                                <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0 border-slate-100">
                                    <span>{p.quantity}x {p.name}</span>
                                    <span className="font-mono">${p.revenue.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Mixed Products */}
                    {stats.productsByMethod.mixed.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold uppercase text-orange-700 mb-2 border-b border-orange-200 pb-1">{at("soldByMixed")} ({stats.productsByMethod.mixed.length})</h3>
                            {stats.productsByMethod.mixed.map((p: any, i) => (
                                <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0 border-slate-100">
                                    <span>{p.quantity}x {p.name}</span>
                                    <span className="font-mono">${p.revenue.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Signature */}
                <div className="hidden print:block mt-16 pt-8 border-t border-slate-400">
                    <div className="flex justify-between text-xs font-bold uppercase">
                        <span className="border-t border-black w-32 pt-2 text-center">{at("cashierSignature")}</span>
                        <span className="border-t border-black w-32 pt-2 text-center">{at("supervisorSignature")}</span>
                    </div>
                </div>
            </div>
        </div >
    )
}
