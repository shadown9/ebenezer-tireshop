"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTires, useServices, addSale } from "@/lib/firebase-hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Trash2, CreditCard, Banknote, Landmark, Settings, PackagePlus, ChevronLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CartItem {
    id: string
    inventoryItemId?: string
    name: string
    price: number
    costPrice?: number
    quantity: number
    type: "tire" | "service" | "part"
    source: "inventory" | "manual"
    stock?: number
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
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [saleNotes, setSaleNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [manualItem, setManualItem] = useState({
        name: "",
        price: "",
        costPrice: "",
        quantity: "1",
        type: "part" as "tire" | "service" | "part",
    })

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
            stock: t.quantity,
            source: "inventory" as const,
        })),
        ...services.map(s => ({
            id: s.id,
            name: s.name,
            price: s.basePrice,
            costPrice: 0, // Services typically have 0 product cost, or we could add a field later
            type: "service" as const,
            stock: 999,
            source: "manual" as const,
        }))
    ]

    // Filter items based on search; if search is empty, show all
    const displayItems = searchTerm.length > 0
        ? allItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : allItems

    const addToCart = (item: any) => {
        if (item.source === "inventory" && item.stock <= 0) {
            toast({
                title: "Sin inventario",
                description: `${item.name} no tiene unidades disponibles.`,
                variant: "destructive",
            })
            return
        }

        setCart((prev) => {
            const existingItem = prev.find((i) => i.id === item.id)
            if (existingItem) {
                if (existingItem.source === "inventory" && existingItem.stock !== undefined && existingItem.quantity >= existingItem.stock) {
                    toast({
                        title: "Stock máximo",
                        description: `Solo hay ${existingItem.stock} disponible(s).`,
                        variant: "destructive",
                    })
                    return prev
                }

                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
                )
            }
            return [...prev, {
                id: item.id,
                inventoryItemId: item.source === "inventory" ? item.id : undefined,
                name: item.name,
                price: item.price,
                costPrice: item.costPrice,
                quantity: 1,
                type: item.type,
                source: item.source,
                stock: item.source === "inventory" ? item.stock : undefined,
            }]
        });
        setSearchTerm("") // Clear search after adding
    }

    const addManualItem = () => {
        const name = manualItem.name.trim()
        const price = Number(manualItem.price)
        const costPrice = Number(manualItem.costPrice || 0)
        const quantity = Math.max(1, Number.parseInt(manualItem.quantity, 10) || 1)

        if (!name || price <= 0) {
            toast({
                title: "Producto manual incompleto",
                description: "Agrega nombre y precio para facturarlo.",
                variant: "destructive",
            })
            return
        }

        setCart((prev) => [
            ...prev,
            {
                id: `manual-${crypto.randomUUID()}`,
                name,
                price,
                costPrice,
                quantity,
                type: manualItem.type,
                source: "manual",
            },
        ])
        setManualItem({ name: "", price: "", costPrice: "", quantity: "1", type: "part" })
    }

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta)
                if (item.source === "inventory" && item.stock !== undefined && newQty > item.stock) {
                    toast({
                        title: "Stock máximo",
                        description: `Solo hay ${item.stock} disponible(s).`,
                        variant: "destructive",
                    })
                    return item
                }
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id))
    }

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast({ title: "Carrito vacío", description: "Agrega al menos un producto.", variant: "destructive" })
            return
        }

        setIsSubmitting(true)
        try {
            const saleId = await addSale({
                sale_date: new Date().toISOString(),
                customer_name: customerName.trim() || "Cliente General",
                customer_phone: customerPhone.trim() || undefined,
                sale_items: cart.map(item => ({
                    inventory_item_id: item.inventoryItemId,
                    product_name: item.name,
                    quantity: item.quantity,
                    unit_price: item.price,
                    cost_price: item.costPrice || 0,
                    total_price: item.price * item.quantity,
                    type: item.type,
                    source: item.source
                })),
                total_amount: cartTotal,
                payment_method: paymentMethod,
                notes: [
                    paymentMethod === "cash" ? `Efectivo recibido: $${cashGiven}` : "",
                    saleNotes.trim(),
                ].filter(Boolean).join(" | ") || undefined
            })

            toast({ title: "Venta Completada", description: "La factura quedó registrada correctamente." })
            router.push(`/admin/pos/ticket/${saleId}`)
        } catch (error) {
            console.error("Error saving sale:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "No se pudo completar la venta",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">


            {step === 1 ? (
                <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">POS</p>
                            <h1 className="text-2xl font-black text-slate-900">Nueva venta</h1>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => router.push("/admin/pos")}>
                            Salir
                        </Button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Buscar producto..."
                            className="pl-10 h-12 text-lg bg-white shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                        <div className="flex items-center gap-2 text-slate-800 font-bold">
                            <PackagePlus className="h-5 w-5 text-blue-600" />
                            Producto manual
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                className="col-span-2"
                                placeholder="Nombre en factura"
                                value={manualItem.name}
                                onChange={(e) => setManualItem({ ...manualItem, name: e.target.value })}
                            />
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Precio"
                                value={manualItem.price}
                                onChange={(e) => setManualItem({ ...manualItem, price: e.target.value })}
                            />
                            <Input
                                type="number"
                                min="1"
                                step="1"
                                placeholder="Cant."
                                value={manualItem.quantity}
                                onChange={(e) => setManualItem({ ...manualItem, quantity: e.target.value })}
                            />
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Costo opcional"
                                value={manualItem.costPrice}
                                onChange={(e) => setManualItem({ ...manualItem, costPrice: e.target.value })}
                            />
                            <select
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                value={manualItem.type}
                                onChange={(e) => setManualItem({ ...manualItem, type: e.target.value as "tire" | "service" | "part" })}
                            >
                                <option value="part">Repuesto</option>
                                <option value="tire">Neumático</option>
                                <option value="service">Servicio</option>
                            </select>
                        </div>
                        <Button type="button" variant="outline" className="w-full" onClick={addManualItem}>
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar producto manual
                        </Button>
                    </div>

                    {/* Product List */}
                    <div className="flex-1 overflow-y-auto space-y-2 pb-24">
                        {displayItems.length > 0 ? (
                            displayItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center ${item.source === "inventory" && item.stock <= 0 ? "opacity-50" : "active:scale-[0.99]"}`}
                                    onClick={() => addToCart(item)}
                                >
                                    <div className="min-w-0 pr-3">
                                        <h3 className="font-bold text-slate-900">{item.name}</h3>
                                        <div className="flex flex-wrap gap-2 text-sm mt-1">
                                            <Badge variant={item.type === "tire" ? "default" : item.type === "part" ? "outline" : "secondary"}>
                                                {item.type === "tire" ? "Neumático" : item.type === "part" ? "Repuesto" : "Servicio"}
                                            </Badge>
                                            {item.source === "inventory" && (
                                                <Badge variant="secondary">Stock: {item.stock}</Badge>
                                            )}
                                            <span className="font-mono text-slate-600">${item.price}</span>
                                        </div>
                                    </div>
                                    <Button size="icon" className="h-10 w-10 rounded-full flex-shrink-0">
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
                                        <div key={item.id} className="flex justify-between items-center gap-3 text-sm">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="flex border rounded overflow-hidden">
                                                    <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200" onClick={() => updateQuantity(item.id, -1)}>-</button>
                                                    <span className="px-2 py-0.5 min-w-[1.5rem] text-center">{item.quantity}</span>
                                                    <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200" onClick={() => updateQuantity(item.id, 1)}>+</button>
                                                </div>
                                                <span className="truncate max-w-[46vw] sm:max-w-[260px]">{item.name}</span>
                                                {item.source === "manual" && (
                                                    <Badge variant="outline" className="text-[10px]">Manual</Badge>
                                                )}
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
                <div className="p-4 flex flex-col gap-5 max-w-md mx-auto w-full pb-10">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setStep(1)}>
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Confirmar</p>
                            <h1 className="text-xl font-black text-slate-900">Cobro y factura</h1>
                        </div>
                    </div>

                    <div className="p-6 text-center bg-slate-900 text-white rounded-xl shadow-lg">
                        <p className="text-slate-400 text-sm uppercase tracking-wide">Total a Pagar</p>
                        <h1 className="text-5xl font-black mt-2">${cartTotal.toFixed(2)}</h1>
                    </div>

                    <div className="space-y-3 bg-white rounded-xl border p-4">
                        <h3 className="font-bold text-slate-700">Resumen de factura</h3>
                        <div className="space-y-2">
                            {cart.map((item) => (
                                <div key={item.id} className="flex justify-between gap-3 text-sm">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 truncate">
                                            {item.quantity}x {item.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            ${item.price.toFixed(2)} c/u
                                            {item.source === "manual" ? " · Manual" : ""}
                                        </p>
                                    </div>
                                    <span className="font-mono font-bold flex-shrink-0">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3 bg-white rounded-xl border p-4">
                        <h3 className="font-bold text-slate-700">Datos del cliente</h3>
                        <Input
                            placeholder="Nombre del cliente (opcional)"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />
                        <Input
                            placeholder="Teléfono (opcional)"
                            inputMode="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                        <Input
                            placeholder="Nota para buscar luego (opcional)"
                            value={saleNotes}
                            onChange={(e) => setSaleNotes(e.target.value)}
                        />
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
