"use client"

import type React from "react"
import type { Locale } from "date-fns"
import { useEffect, useMemo, useState } from "react"
import { format, startOfDay, startOfMonth, startOfWeek, startOfYear, endOfDay, endOfMonth, endOfWeek, endOfYear } from "date-fns"
import { enUS, es } from "date-fns/locale"
import { BarChart3, CalendarDays, Download, FileText, Printer, ReceiptText, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useSales } from "@/lib/firebase-hooks"
import { useAdminText } from "@/lib/admin-translations"

type PeriodMode = "day" | "week" | "month" | "year" | "custom"
type TaxMode = "exclusive" | "inclusive" | "none"

type CashMovement = {
    id: number
    type: "expense" | "withdrawal" | "deposit" | "adjustment"
    amount: string | number
    description?: string
    created_at: string
}

type SummaryRow = {
    key: string
    quantity: number
    revenue: number
    cost: number
    profit: number
    type: string
    manual: number
}

const NJ_SALES_TAX_RATE = 0.06625

const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
})

function toDate(value?: string) {
    if (!value) return new Date(0)
    return new Date(value.includes("T") ? value : `${value}T00:00:00`)
}

function clampPeriod(mode: PeriodMode, anchor: Date, customStart: string, customEnd: string, locale: Locale) {
    if (mode === "custom") {
        return {
            start: startOfDay(toDate(customStart)),
            end: endOfDay(toDate(customEnd || customStart)),
            label: `${customStart || "inicio"} - ${customEnd || customStart || "fin"}`,
        }
    }

    const ranges = {
        day: [startOfDay(anchor), endOfDay(anchor)],
        week: [startOfWeek(anchor, { weekStartsOn: 1 }), endOfWeek(anchor, { weekStartsOn: 1 })],
        month: [startOfMonth(anchor), endOfMonth(anchor)],
        year: [startOfYear(anchor), endOfYear(anchor)],
    } as const

    const [start, end] = ranges[mode]
    return {
        start,
        end,
        label: `${format(start, "dd MMM yyyy", { locale })} - ${format(end, "dd MMM yyyy", { locale })}`,
    }
}

function normalizeMethod(method?: string) {
    const value = (method || "cash").toLowerCase().trim()
    if (value === "tarjeta" || value === "credit" || value === "debit") return "card"
    if (value === "transferencia") return "transfer"
    if (value === "mixed") return "mixed"
    return value === "card" || value === "transfer" || value === "cash" ? value : "mixed"
}

function downloadText(filename: string, content: string, type = "text/csv;charset=utf-8") {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}

export default function POSReportsPage() {
    const { sales, loading } = useSales()
    const { at, language } = useAdminText()
    const dateLocale = language === "es" ? es : enUS
    const [cashMovements, setCashMovements] = useState<CashMovement[]>([])
    const [periodMode, setPeriodMode] = useState<PeriodMode>("month")
    const [anchorDate, setAnchorDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
    const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"))
    const [taxRate, setTaxRate] = useState((NJ_SALES_TAX_RATE * 100).toString())
    const [taxMode, setTaxMode] = useState<TaxMode>("exclusive")

    useEffect(() => {
        fetch("/api/cash?limit=1000")
            .then((res) => (res.ok ? res.json() : []))
            .then((rows) => setCashMovements(Array.isArray(rows) ? rows : []))
            .catch(() => setCashMovements([]))
    }, [])

    const period = useMemo(
        () => clampPeriod(periodMode, toDate(anchorDate), customStart, customEnd, dateLocale),
        [periodMode, anchorDate, customStart, customEnd, dateLocale],
    )

    const report = useMemo(() => {
        const inRange = (value?: string) => {
            const date = toDate(value)
            return date >= period.start && date <= period.end
        }

        const periodSales = sales.filter((sale) => inRange(sale.sale_date || sale.created_at))
        const periodCash = cashMovements.filter((move) => inRange(move.created_at))

        const byMethod = { cash: 0, card: 0, transfer: 0, mixed: 0 }
        const itemMap = new Map<string, SummaryRow>()
        const serviceMap = new Map<string, SummaryRow>()

        let grossSales = 0
        let totalCost = 0
        let manualRevenue = 0
        let inventoryRevenue = 0

        periodSales.forEach((sale) => {
            const method = normalizeMethod(sale.payment_method) as keyof typeof byMethod
            const saleTotal = Number(sale.total_amount || 0)
            grossSales += saleTotal
            byMethod[method] += saleTotal

            ;(sale.sale_items || []).forEach((item) => {
                const quantity = Number(item.quantity || 0)
                const revenue = Number(item.total_price || Number(item.unit_price || 0) * quantity)
                const cost = Number(item.cost_price || 0) * quantity
                const type = item.type || "part"
                const source = item.source || (item.inventory_item_id ? "inventory" : "manual")
                const target = type === "service" ? serviceMap : itemMap
                const key = item.product_name || at("noNameProduct")
                const current = target.get(key) || {
                    key,
                    quantity: 0,
                    revenue: 0,
                    cost: 0,
                    profit: 0,
                    type,
                    manual: 0,
                }

                current.quantity += quantity
                current.revenue += revenue
                current.cost += cost
                current.profit += revenue - cost
                current.manual += source === "manual" ? quantity : 0
                target.set(key, current)

                totalCost += cost
                if (source === "manual") manualRevenue += revenue
                else inventoryRevenue += revenue
            })
        })

        const rate = Math.max(0, Number(taxRate) || 0) / 100
        const estimatedSalesTax =
            taxMode === "none"
                ? 0
                : taxMode === "inclusive"
                    ? grossSales - grossSales / (1 + rate)
                    : grossSales * rate
        const taxableSales =
            taxMode === "inclusive" && rate > 0 ? grossSales / (1 + rate) : grossSales

        const expenses = periodCash
            .filter((move) => move.type === "expense")
            .reduce((sum, move) => sum + Number(move.amount || 0), 0)
        const withdrawals = periodCash
            .filter((move) => move.type === "withdrawal")
            .reduce((sum, move) => sum + Number(move.amount || 0), 0)
        const deposits = periodCash
            .filter((move) => move.type === "deposit")
            .reduce((sum, move) => sum + Number(move.amount || 0), 0)

        const topProducts = Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
        const topServices = Array.from(serviceMap.values()).sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)

        return {
            periodSales,
            periodCash,
            grossSales,
            taxableSales,
            estimatedSalesTax,
            totalCost,
            grossProfit: grossSales - totalCost,
            expenses,
            withdrawals,
            deposits,
            netAfterExpenses: grossSales - totalCost - expenses,
            byMethod,
            manualRevenue,
            inventoryRevenue,
            topProducts,
            topServices,
            averageTicket: periodSales.length > 0 ? grossSales / periodSales.length : 0,
        }
    }, [sales, cashMovements, period, taxMode, taxRate, at])

    const exportCsv = () => {
        const rows = [
            ["invoice", "date", "customer", "phone", "method", "item", "type", "source", "quantity", "unit_price", "cost", "total"],
            ...report.periodSales.flatMap((sale) =>
                (sale.sale_items || []).map((item) => [
                    sale.ticket_number || sale.id,
                    sale.sale_date,
                    sale.customer_name || "",
                    sale.customer_phone || "",
                    sale.payment_method,
                    item.product_name,
                    item.type || "",
                    item.source || "",
                    item.quantity,
                    item.unit_price,
                    item.cost_price || 0,
                    item.total_price,
                ]),
            ),
        ]
        const csv = rows
            .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
            .join("\n")
        downloadText(`ebenezer-tax-report-${format(period.start, "yyyyMMdd")}-${format(period.end, "yyyyMMdd")}.csv`, csv)
    }

    if (loading) {
        return <div className="p-10 text-center text-slate-500">{at("preparingReports")}</div>
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 print:bg-white">
            <div className="p-4 lg:p-6 space-y-5 print:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:block">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{at("accounting")}</p>
                        <h1 className="text-2xl sm:text-3xl font-black">{at("reportsAndTaxes")}</h1>
                        <p className="text-sm text-slate-500 mt-1">{at("period")}: {period.label}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 print:hidden">
                        <Button variant="outline" onClick={exportCsv}>
                            <Download className="h-4 w-4 mr-2" />
                            CSV
                        </Button>
                        <Button onClick={() => window.print()}>
                            <Printer className="h-4 w-4 mr-2" />
                            {at("print")}
                        </Button>
                    </div>
                </div>

                <Card className="print:hidden">
                    <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {[
                                ["day", at("day")],
                                ["week", at("week")],
                                ["month", at("month")],
                                ["year", at("year")],
                                ["custom", at("manual")],
                            ].map(([value, label]) => (
                                <Button
                                    key={value}
                                    variant={periodMode === value ? "default" : "outline"}
                                    onClick={() => setPeriodMode(value as PeriodMode)}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <label className="space-y-1">
                                <span className="text-xs font-bold text-slate-500">{at("baseDate")}</span>
                                <Input type="date" value={anchorDate} onChange={(event) => setAnchorDate(event.target.value)} />
                            </label>
                            <label className="space-y-1">
                                <span className="text-xs font-bold text-slate-500">{at("from")}</span>
                                <Input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
                            </label>
                            <label className="space-y-1">
                                <span className="text-xs font-bold text-slate-500">{at("to")}</span>
                                <Input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
                            </label>
                            <label className="space-y-1">
                                <span className="text-xs font-bold text-slate-500">NJ Sales Tax %</span>
                                <Input type="number" step="0.001" min="0" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} />
                            </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                                ["exclusive", at("taxExclusive")],
                                ["inclusive", at("taxInclusive")],
                                ["none", at("noTax")],
                            ].map(([value, label]) => (
                                <Button
                                    key={value}
                                    variant={taxMode === value ? "default" : "outline"}
                                    onClick={() => setTaxMode(value as TaxMode)}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <MetricCard title={at("grossSales")} value={money.format(report.grossSales)} icon={<TrendingUp className="h-5 w-5" />} />
                    <MetricCard title={at("invoices")} value={report.periodSales.length.toString()} icon={<ReceiptText className="h-5 w-5" />} />
                    <MetricCard title={at("averageTicket")} value={money.format(report.averageTicket)} icon={<BarChart3 className="h-5 w-5" />} />
                    <MetricCard title={at("grossProfit")} value={money.format(report.grossProfit)} icon={<FileText className="h-5 w-5" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{at("accountingSummary")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <MoneyLine label={at("grossSales")} value={report.grossSales} strong />
                            <MoneyLine label={at("productCost")} value={-report.totalCost} />
                            <MoneyLine label={at("cashExpenses")} value={-report.expenses} />
                            <MoneyLine label={at("profitAfterCosts")} value={report.netAfterExpenses} strong />
                            <div className="border-t pt-2 mt-2" />
                            <MoneyLine label={at("cash")} value={report.byMethod.cash} />
                            <MoneyLine label={at("card")} value={report.byMethod.card} />
                            <MoneyLine label={at("transfer")} value={report.byMethod.transfer} />
                            <MoneyLine label={at("mixed")} value={report.byMethod.mixed} />
                            <div className="border-t pt-2 mt-2" />
                            <MoneyLine label={at("deposits")} value={report.deposits} />
                            <MoneyLine label={at("withdrawals")} value={-report.withdrawals} />
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200">
                        <CardHeader>
                            <CardTitle className="text-base">{at("njTaxPrep")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <MoneyLine label={at("salesToReview")} value={report.grossSales} strong />
                            <MoneyLine label={at("estimatedPretaxSales")} value={report.taxableSales} />
                            <MoneyLine label={`${at("estimatedSalesTax")} (${taxRate || "0"}%)`} value={report.estimatedSalesTax} strong />
                            <p className="text-xs text-slate-500 pt-2">
                                {at("njTaxNote")}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <RankedTable title={at("topProducts")} rows={report.topProducts} empty={at("noProducts")} soldLabel={at("sold")} profitLabel={at("profit")} manualLabel={at("manual")} />
                    <RankedTable title={at("topServices")} rows={report.topServices} empty={at("noServices")} soldLabel={at("sold")} profitLabel={at("profit")} manualLabel={at("manual")} />
                </div>

                <Card className="print:border-black">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <CalendarDays className="h-5 w-5" />
                            {at("taxPreparerPackage")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <SummaryPill label={at("period")} value={period.label} />
                            <SummaryPill label={at("generated")} value={format(new Date(), "dd/MM/yyyy h:mm a")} />
                            <SummaryPill label={at("includedInvoices")} value={report.periodSales.length.toString()} />
                            <SummaryPill label={at("cashMovements")} value={report.periodCash.length.toString()} />
                        </div>
                        <div className="rounded-lg border p-3 bg-white">
                            <p className="font-bold mb-2">{at("documentChecklist")}</p>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600">
                                <li>{at("checklistCsv")}</li>
                                <li>{at("checklistPrinted")}</li>
                                <li>{at("checklistReceipts")}</li>
                                <li>{at("checklistStatements")}</li>
                                <li>{at("checklistPayroll")}</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function MetricCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400">{title}</p>
                        <p className="text-xl font-black text-slate-900 mt-1">{value}</p>
                    </div>
                    <div className="text-blue-600">{icon}</div>
                </div>
            </CardContent>
        </Card>
    )
}

function MoneyLine({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
    return (
        <div className={`flex justify-between gap-3 ${strong ? "font-black" : ""}`}>
            <span>{label}</span>
            <span className={value < 0 ? "text-red-600" : "text-slate-900"}>{money.format(value)}</span>
        </div>
    )
}

function RankedTable({
    title,
    rows,
    empty,
    soldLabel,
    profitLabel,
    manualLabel,
}: {
    title: string
    rows: SummaryRow[]
    empty: string
    soldLabel: string
    profitLabel: string
    manualLabel: string
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {rows.length === 0 ? (
                    <p className="text-sm text-slate-500">{empty}</p>
                ) : (
                    rows.slice(0, 12).map((row, index) => (
                        <div key={row.key} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center border-b last:border-0 pb-2">
                            <span className="text-xs font-black text-slate-400">#{index + 1}</span>
                            <div className="min-w-0">
                                <p className="font-semibold truncate">{row.key}</p>
                                <p className="text-xs text-slate-500">
                                    {row.quantity} {soldLabel} · {profitLabel} {money.format(row.profit)}
                                    {row.manual > 0 && <Badge variant="outline" className="ml-2 text-[10px]">{manualLabel} {row.manual}</Badge>}
                                </p>
                            </div>
                            <span className="font-mono font-bold">{money.format(row.revenue)}</span>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}

function SummaryPill({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-white p-3">
            <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
            <p className="font-black text-slate-900">{value}</p>
        </div>
    )
}
