"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTires, useServices, addSale } from "@/lib/firebase-hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Minus, Trash2, ShoppingCart, ChevronLeft, ArrowRight, CreditCard, Banknote, Landmark, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CartItem {
    id: string
    name: string
    price: number
    costPrice?: number
    quantity: number
    type: "tire" | "service" | "part"
}

export default function NewSalePage() {
    const router = useRouter()
    const { toast } = useToast()
    const { tires, loading: loadingTires } = useTires()
    const { services, loading: loadingServices } = useServices()

    const [step, setStep] = useState<1 | 2>(1)
    const [searchTerm, setSearchTerm] = useState("")
    const [cart, setCart] = useState<CartItem[]>([])
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer" | "mixed">("cash")
    const [cashGiven, setCashGiven] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Auto-fill cash amount when entering checkout or total changes
    useEffect(() => {
        if (step === 2) {
            setCashGiven(cartTotal.toFixed(2))
        }
    }, [step, cartTotal])

    // Combined items from Tires and Services
    const allItems = [
        ...tires.map(t => ({
            id: t.id,
            name: t.type === 'part' ? t.brand : `${t.brand} ${t.width}/${t.ratio}R${t.diameter}`,
            price: t.price,
            costPrice: t.costPrice || 0,
            type: (t.type === 'part' ? 'part' : 'tire') as "tire" | "service" | "part",
            stock: t.quantity
        })),
        ...services.map(s => ({
            id: s.id,
            name: s.name,
            price: s.basePrice,
            costPrice: 0, // Services typically have 0 product cost, or we could add a field later
            type: "service" as const,
            stock: 999
        }))
    ]

    // Filter items based on search; if search is empty, show all
    const displayItems = searchTerm.length > 0
        ? allItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : allItems

    const addToCart = (item: any) => {
        setCart((prev) => {
            const existingItem = prev.find((i) => i.id === item.id)
            if (existingItem) {
                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
                )
            }
            return [...prev, { id: item.id, name: item.name, price: item.price, costPrice: item.costPrice, quantity: 1, type: item.type }]
        });
        setSearchTerm("") // Clear search after adding
    }

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id))
    }

    const handleCheckout = async () => {
        setIsSubmitting(true)
        try {
            await addSale({
                sale_date: new Date().toISOString(),
                customer_name: "Cliente General",
                sale_items: cart.map(item => ({
                    product_name: item.name,
                    quantity: item.quantity,
                    unit_price: item.price,
                    cost_price: item.costPrice || 0,
                    total_price: item.price * item.quantity,
                    type: item.type
                })),
                total_amount: cartTotal,
                payment_method: paymentMethod as "cash" | "card" | "transfer",
                notes: paymentMethod === "cash" ? `Efectivo recibido: $${cashGiven}` : undefined
            })

            toast({ title: "Venta Completada", description: "La venta se ha registrado correctamente." })
            router.push("/admin/pos")
        } catch (error) {
            console.error("Error saving sale:", error)
            toast({ title: "Error", description: "No se pudo completar la venta", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">


            {step === 1 ? (
                <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Buscar producto..."
                            className="pl-10 h-12 text-lg bg-white shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Product List */}
                    <div className="flex-1 overflow-y-auto space-y-2 pb-24">
                        {displayItems.length > 0 ? (
                            displayItems.map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center" onClick={() => addToCart(item)}>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{item.name}</h3>
                                        <div className="flex gap-2 text-sm mt-1">
                                            <Badge variant={item.type === "tire" ? "default" : item.type === "part" ? "outline" : "secondary"}>
                                                {item.type === "tire" ? "Neumático" : item.type === "part" ? "Repuesto" : "Servicio"}
                                            </Badge>
                                            <span className="font-mono text-slate-600">${item.price}</span>
                                        </div>
                                    </div>
                                    <Button size="icon" className="h-8 w-8 rounded-full">
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            !loadingTires && !loadingServices && (
                                <div className="text-center text-slate-400 mt-10">
                                    <p>No hay servicios ni productos disponibles.</p>
                                    <Button variant="link" onClick={() => router.push("/admin/services")}>
                                        Crear Servicios
                                    </Button>
                                </div>
                            )
                        )}
                    </div>
                    {/* Cart Summary Bottom Sheet */}
                    {cart.length > 0 && (
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 pb-8 z-20">
                            <div className="flex justify-between items-end mb-4 max-h-40 overflow-y-auto">
                                <div className="w-full space-y-2">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase">Carrito ({cart.length})</h3>
                                    {cart.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="flex border rounded overflow-hidden">
                                                    <button className="px-2 bg-slate-100 hover:bg-slate-200" onClick={() => updateQuantity(item.id, -1)}>-</button>
                                                    <span className="px-2 py-0.5 min-w-[1.5rem] text-center">{item.quantity}</span>
                                                    <button className="px-2 bg-slate-100 hover:bg-slate-200" onClick={() => updateQuantity(item.id, 1)}>+</button>
                                                </div>
                                                <span className="truncate max-w-[150px]">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                                                <Trash2 className="h-4 w-4 text-red-500 cursor-pointer" onClick={() => removeFromCart(item.id)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Button className="w-full h-14 text-lg font-bold shadow-lg" onClick={() => setStep(2)}>
                                Cobrar ${cartTotal.toFixed(2)}
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                // Step 2: Checkout
                <div className="p-4 flex flex-col gap-6 max-w-md mx-auto w-full">
                    <div className="p-6 text-center bg-slate-900 text-white rounded-xl shadow-lg">
                        <p className="text-slate-400 text-sm uppercase tracking-wide">Total a Pagar</p>
                        <h1 className="text-5xl font-black mt-2">${cartTotal.toFixed(2)}</h1>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-700">Método de Pago</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaymentMethod("cash")}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 bg-white text-slate-600'}`}
                            >
                                <Banknote className="h-6 w-6" />
                                <span className="font-bold">Efectivo</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod("card")}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'}`}
                            >
                                <CreditCard className="h-6 w-6" />
                                <span className="font-bold">Tarjeta</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod("transfer")}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'transfer' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 bg-white text-slate-600'}`}
                            >
                                <Landmark className="h-6 w-6" />
                                <span className="font-bold">Transferencia</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod("mixed")}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'mixed' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white text-slate-600'}`}
                            >
                                <Settings className="h-6 w-6" />
                                <span className="font-bold">Mixto</span>
                            </button>
                        </div>
                    </div>

                    {paymentMethod === "cash" && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-slate-700">Monto Recibido</h3>
                            <Input
                                type="number"
                                className="h-14 text-2xl text-center font-bold"
                                placeholder="$0.00"
                                value={cashGiven}
                                onChange={(e) => setCashGiven(e.target.value)}
                            />
                            {Number(cashGiven) > 0 && (
                                <div className="p-4 bg-slate-100 rounded-lg flex justify-between items-center">
                                    <span className="font-bold text-slate-500">Cambio:</span>
                                    <span className={`text-xl font-black ${Number(cashGiven) - cartTotal < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                        ${(Number(cashGiven) - cartTotal).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <Button
                        className="w-full h-16 text-xl font-bold mt-4 shadow-xl"
                        size="lg"
                        onClick={handleCheckout}
                        disabled={isSubmitting || (paymentMethod === "cash" && Number(cashGiven) < cartTotal)}
                    >
                        {isSubmitting ? "Procesando..." : "CONFIRMAR VENTA"}
                    </Button>
                </div>
            )}
        </div>
    )
}
