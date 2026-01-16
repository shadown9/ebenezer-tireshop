"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, Plus, Minus, DollarSign, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface CashMovement {
    id: number
    type: "expense" | "withdrawal" | "deposit" | "adjustment"
    amount: string
    description: string
    created_at: string
}

export default function CashControlPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [balance, setBalance] = useState({ total: 0, sales: 0, expenses: 0, withdrawals: 0, deposits: 0 })
    const [movements, setMovements] = useState<CashMovement[]>([])
    const [loading, setLoading] = useState(true)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [actionType, setActionType] = useState<"withdrawal" | "expense" | "deposit">("expense")
    const [formData, setFormData] = useState({ amount: "", description: "" })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            // Fetch Sales for "Cash Sales" Calculation
            const salesRes = await fetch("/api/sales")
            const sales = await salesRes.json()

            // Calculate Cash from Sales (Today)
            const today = new Date().toISOString().split("T")[0]
            const cashSales = sales
                .filter((s: any) => s.sale_date.startsWith(today) && s.payment_method === 'cash')
                .reduce((sum: number, s: any) => sum + Number(s.total_amount), 0)

            // Fetch Movements
            const cashRes = await fetch("/api/cash")
            const cashMovements: CashMovement[] = await cashRes.json()

            // Calculate Movements (Today) for balance
            const todayMovements = cashMovements.filter(m => new Date(m.created_at).toISOString().startsWith(today))

            const expenses = todayMovements
                .filter(m => m.type === 'expense')
                .reduce((sum, m) => sum + Number(m.amount), 0)

            const withdrawals = todayMovements
                .filter(m => m.type === 'withdrawal')
                .reduce((sum, m) => sum + Number(m.amount), 0)

            const deposits = todayMovements
                .filter(m => m.type === 'deposit')
                .reduce((sum, m) => sum + Number(m.amount), 0)

            // Total Balance: Cash Sales + Deposits - Expenses - Withdrawals
            // (Adjustment Logic could be added here later)
            const total = cashSales + deposits - expenses - withdrawals

            setBalance({
                total,
                sales: cashSales,
                expenses,
                withdrawals,
                deposits
            })
            setMovements(cashMovements)

        } catch (error) {
            console.error("Error fetching data", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = (type: "withdrawal" | "expense" | "deposit") => {
        setActionType(type)
        setFormData({ amount: "", description: "" })
        setDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!formData.amount || Number(formData.amount) <= 0) {
            toast({ title: "Monto inválido", variant: "destructive" })
            return
        }

        try {
            await fetch("/api/cash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: actionType,
                    amount: parseFloat(formData.amount),
                    description: formData.description || (actionType === 'expense' ? 'Gasto Vario' : 'Movimiento Manual')
                })
            })

            toast({ title: "Movimiento Registrado" })
            setDialogOpen(false)
            fetchData() // Refresh
        } catch (error) {
            toast({ title: "Error al registrar", variant: "destructive" })
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b p-4 flex items-center gap-4 sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => router.push("/admin/pos")}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="font-bold text-lg">Control de Efectivo</h1>
            </div>

            <div className="p-4 space-y-6 max-w-lg mx-auto">

                {/* Main Balance Card */}
                <Card className="bg-slate-900 text-white border-none shadow-lg">
                    <CardContent className="p-6 text-center">
                        <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">Efectivo en Caja (Estimado)</p>
                        <h2 className="text-5xl font-black mb-4">${balance.total.toFixed(2)}</h2>

                        <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-700 pt-4">
                            <div>
                                <p className="text-slate-400">Ventas (Cash)</p>
                                <p className="font-bold text-green-400">+${balance.sales.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Gastos</p>
                                <p className="font-bold text-red-400">-${balance.expenses.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Retiros</p>
                                <p className="font-bold text-orange-400">-${balance.withdrawals.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        className="h-16 bg-white text-red-600 border border-slate-200 hover:bg-red-50 hover:border-red-200 shadow-sm"
                        onClick={() => handleAction("expense")}
                    >
                        <div className="flex flex-col items-center">
                            <TrendingDown className="h-5 w-5 mb-1" />
                            <span className="font-bold">Registrar Gasto</span>
                        </div>
                    </Button>
                    <Button
                        className="h-16 bg-white text-orange-600 border border-slate-200 hover:bg-orange-50 hover:border-orange-200 shadow-sm"
                        onClick={() => handleAction("withdrawal")}
                    >
                        <div className="flex flex-col items-center">
                            <ArrowUpRight className="h-5 w-5 mb-1" />
                            <span className="font-bold">Retiro / Depósito</span>
                        </div>
                    </Button>
                </div>

                {/* Recent Movements List */}
                <div>
                    <h3 className="font-bold text-slate-700 mb-3 px-1">Movimientos Recientes</h3>
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        {movements.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">No hay movimientos registrados</div>
                        ) : (
                            movements.map((move, i) => (
                                <div key={i} className="flex justify-between items-center p-4 border-b last:border-0 hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${move.type === 'expense' ? 'bg-red-100 text-red-600' : move.type === 'withdrawal' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                            {move.type === 'expense' ? <TrendingDown className="h-4 w-4" /> : move.type === 'withdrawal' ? <ArrowUpRight className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 capitalize">{move.type === 'expense' ? 'Gasto' : move.type}</p>
                                            <p className="text-xs text-slate-500">{move.description || "Sin descripción"}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${move.type === 'deposit' ? 'text-green-600' : 'text-slate-900'}`}>
                                            {move.type === 'deposit' ? '+' : '-'}${Number(move.amount).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-slate-400">{format(new Date(move.created_at), "h:mm a")}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Action Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="capitalize">
                            {actionType === 'expense' ? 'Registrar Gasto' : 'Registrar Retiro'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'expense' ? 'Salida de dinero para compras o pagos.' : 'Retiro de efectivo para banco o caja fuerte.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Monto</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <Input
                                    className="pl-10 text-lg font-bold"
                                    placeholder="0.00"
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción / Motivo</Label>
                            <Input
                                placeholder={actionType === 'expense' ? "Ej: Compra de almuerzo" : "Ej: Depósito bancario"}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancelar</Button>
                        <Button onClick={handleSubmit} className="flex-1 capitalize">Confirmar {actionType}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
