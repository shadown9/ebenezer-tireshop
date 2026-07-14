"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Bot, Loader2, MessageCircle, Send, ShieldCheck, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  useAppointments,
  useSales,
  useServices,
  useTires,
} from "@/lib/firebase-hooks"
import { useAdminText } from "@/lib/admin-translations"
import type {
  AdminAssistantSummary,
  AssistantChatMessage,
  CashMovementSummary,
} from "@/lib/admin-assistant"
import type { Appointment, Sale, Tire } from "@/lib/types"
import { cn } from "@/lib/utils"

type AssistantMode = "local" | "ai"

const STORAGE_KEY = "ebenezer-admin-assistant-thread"

const copy = {
  es: {
    title: "Ayudante IA",
    subtitle: "Guia segura del admin",
    open: "Abrir ayudante",
    close: "Cerrar ayudante",
    placeholder: "Pregunta sobre caja, facturas, inventario, citas, taxes...",
    send: "Enviar",
    local: "modo seguro local",
    ai: "IA conectada",
    safety: "Solo lee resumenes. No cambia datos.",
    welcome:
      "Hola, soy tu ayudante del admin: amable, atento y con una pizca de sarcasmo limpio, porque alguien tiene que poner orden sin hacer drama. Puedo orientarte con caja, facturas, inventario, citas, reportes y taxes sin tocar datos automaticamente.",
    error: "No pude responder ahora mismo. Intenta con una pregunta mas corta.",
    quick: [
      "¿Qué puedo hacer aquí?",
      "Resumen de caja",
      "Productos más vendidos",
      "Buscar una factura",
      "Servicios más solicitados",
      "Preparación para taxes",
    ],
  },
  en: {
    title: "AI Helper",
    subtitle: "Safe admin guide",
    open: "Open helper",
    close: "Close helper",
    placeholder: "Ask about cash, invoices, inventory, appointments, taxes...",
    send: "Send",
    local: "safe local mode",
    ai: "AI connected",
    safety: "Reads summaries only. It does not change data.",
    welcome:
      "Hi, I am your admin helper: friendly, sharp, and lightly sarcastic in a clean way, because someone has to keep things organized without making it dramatic. I can guide you through cash, invoices, inventory, appointments, reports, and taxes without changing data automatically.",
    error: "I could not answer right now. Try a shorter question.",
    quick: [
      "What can I do here?",
      "Cash summary",
      "Top-selling products",
      "Find an invoice",
      "Most requested services",
      "Tax preparation",
    ],
  },
}

function toNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function isSameMonth(value?: string) {
  if (!value) return false
  const saleDate = new Date(value.includes("T") ? value : `${value}T00:00:00`)
  const now = new Date()
  return saleDate.getFullYear() === now.getFullYear() && saleDate.getMonth() === now.getMonth()
}

function sortRecentSales(a: Sale, b: Sale) {
  return new Date(b.sale_date || b.created_at).getTime() - new Date(a.sale_date || a.created_at).getTime()
}

function sortUpcomingAppointments(a: Appointment, b: Appointment) {
  return new Date(`${a.date}T${a.time || "00:00"}`).getTime() - new Date(`${b.date}T${b.time || "00:00"}`).getTime()
}

function compactTire(tire: Tire) {
  return {
    id: tire.id,
    brand: tire.brand,
    width: tire.width,
    ratio: tire.ratio,
    diameter: tire.diameter,
    condition: tire.condition,
    quantity: toNumber(tire.quantity),
    price: toNumber(tire.price),
    type: tire.type,
  }
}

function buildSummary({
  currentPath,
  tires,
  appointments,
  sales,
  services,
  cashMovements,
}: {
  currentPath: string
  tires: Tire[]
  appointments: Appointment[]
  sales: Sale[]
  services: ReturnType<typeof useServices>["services"]
  cashMovements: CashMovementSummary[]
}): AdminAssistantSummary {
  const today = dateKey()
  const lowStock = tires
    .filter((tire) => toNumber(tire.quantity) <= 3)
    .sort((a, b) => toNumber(a.quantity) - toNumber(b.quantity))
    .slice(0, 30)
    .map(compactTire)

  const sample = tires
    .slice()
    .sort((a, b) => `${a.brand} ${a.width}`.localeCompare(`${b.brand} ${b.width}`))
    .slice(0, 80)
    .map(compactTire)

  const byStatus = appointments.reduce<Record<string, number>>((acc, appointment) => {
    acc[appointment.status] = (acc[appointment.status] || 0) + 1
    return acc
  }, {})

  const topMap = new Map<string, { name: string; quantity: number; revenue: number; type: string }>()
  sales.forEach((sale) => {
    sale.sale_items?.forEach((item) => {
      const key = `${item.product_name || "Item"}-${item.type || "product"}`
      const current = topMap.get(key) || {
        name: item.product_name || "Item",
        quantity: 0,
        revenue: 0,
        type: item.type || "product",
      }
      current.quantity += toNumber(item.quantity)
      current.revenue += toNumber(item.total_price)
      topMap.set(key, current)
    })
  })

  const cashTotals = cashMovements.reduce(
    (acc, movement) => {
      const amount = Math.abs(toNumber(movement.amount))
      if (movement.type === "expense") acc.expenses += amount
      if (movement.type === "deposit" || movement.type === "adjustment") acc.deposits += amount
      if (movement.type === "withdrawal") acc.withdrawals += amount
      return acc
    },
    { expenses: 0, deposits: 0, withdrawals: 0 },
  )

  return {
    currentPath,
    generatedAt: new Date().toISOString(),
    inventory: {
      total: tires.length,
      lowStock,
      sample,
    },
    services: services.slice(0, 80).map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category,
      basePrice: toNumber(service.basePrice),
    })),
    appointments: {
      total: appointments.length,
      today: appointments.filter((appointment) => appointment.date === today).length,
      byStatus,
      upcoming: appointments
        .filter((appointment) => appointment.status !== "completed" && appointment.status !== "cancelled")
        .sort(sortUpcomingAppointments)
        .slice(0, 12)
        .map((appointment) => ({
          id: appointment.id,
          trackingNumber: appointment.trackingNumber,
          customerName: appointment.customerName,
          customerPhone: appointment.customerPhone,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
        })),
    },
    sales: {
      totalInvoices: sales.length,
      todayGross: sales
        .filter((sale) => sale.sale_date === today)
        .reduce((total, sale) => total + toNumber(sale.total_amount), 0),
      monthGross: sales
        .filter((sale) => isSameMonth(sale.sale_date))
        .reduce((total, sale) => total + toNumber(sale.total_amount), 0),
      topItems: Array.from(topMap.values())
        .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
        .slice(0, 12),
      recentInvoices: sales
        .slice()
        .sort(sortRecentSales)
        .slice(0, 12)
        .map((sale) => ({
          id: sale.id,
          ticket_number: sale.ticket_number,
          sale_date: sale.sale_date,
          customer_name: sale.customer_name,
          customer_phone: sale.customer_phone,
          total_amount: toNumber(sale.total_amount),
          payment_method: sale.payment_method,
        })),
    },
    cash: {
      totalMovements: cashMovements.length,
      expenses: cashTotals.expenses,
      deposits: cashTotals.deposits,
      withdrawals: cashTotals.withdrawals,
      recent: cashMovements.slice(0, 12),
    },
  }
}

export function AdminAssistant() {
  const pathname = usePathname()
  const { language } = useAdminText()
  const text = copy[language]
  const { tires } = useTires()
  const { appointments } = useAppointments()
  const { services } = useServices()
  const { sales } = useSales()
  const [cashMovements, setCashMovements] = useState<CashMovementSummary[]>([])
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<AssistantMode>("local")
  const [messages, setMessages] = useState<AssistantChatMessage[]>(() => {
    if (typeof window === "undefined") {
      return [{ role: "assistant", content: text.welcome }]
    }

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      const parsed = saved ? (JSON.parse(saved) as AssistantChatMessage[]) : []
      return Array.isArray(parsed) && parsed.length > 0
        ? parsed.slice(-12)
        : [{ role: "assistant", content: text.welcome }]
    } catch {
      return [{ role: "assistant", content: text.welcome }]
    }
  })
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-12)))
  }, [messages])

  useEffect(() => {
    let ignore = false

    fetch("/api/cash?limit=200")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (!ignore && Array.isArray(data)) {
          setCashMovements(
            data.map((movement) => ({
              id: movement.id,
              type: movement.type,
              amount: toNumber(movement.amount),
              description: movement.description,
              created_at: movement.created_at,
            })),
          )
        }
      })
      .catch(() => {
        if (!ignore) setCashMovements([])
      })

    return () => {
      ignore = true
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, loading, open])

  const summary = useMemo(
    () =>
      buildSummary({
        currentPath: pathname || "/admin",
        tires,
        appointments,
        sales,
        services,
        cashMovements,
      }),
    [appointments, cashMovements, pathname, sales, services, tires],
  )

  async function submitQuestion(question: string) {
    const cleanQuestion = question.trim()
    if (!cleanQuestion || loading) return

    const nextMessages: AssistantChatMessage[] = [
      ...messages,
      { role: "user", content: cleanQuestion },
    ].slice(-10)

    setMessages(nextMessages)
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          summary,
          language,
        }),
      })
      const data = await response.json()
      setMode(data.mode === "ai" ? "ai" : "local")
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply || text.error },
      ].slice(-12))
    } catch {
      setMode("local")
      setMessages((current) => [...current, { role: "assistant", content: text.error }].slice(-12))
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitQuestion(input)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden sm:bottom-5 sm:right-5">
      {open ? (
        <section className="flex h-[min(680px,calc(100vh-2rem))] w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl sm:w-[420px]">
          <header className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-orange-500">
                <Bot className="size-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">{text.title}</h2>
                <p className="truncate text-xs text-slate-300">{text.subtitle}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              aria-label={text.close}
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </Button>
          </header>

          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
              {mode === "ai" ? <Sparkles className="size-3.5 text-orange-500" /> : <ShieldCheck className="size-3.5 text-emerald-600" />}
              {mode === "ai" ? text.ai : text.local}
            </span>
            <span className="text-right text-slate-500">{text.safety}</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "max-w-[88%] whitespace-pre-line rounded-lg px-3 py-2 text-sm leading-relaxed shadow-sm",
                  message.role === "user"
                    ? "ml-auto bg-orange-600 text-white"
                    : "mr-auto border border-slate-200 bg-white text-slate-900",
                )}
              >
                {message.content}
              </div>
            ))}
            {loading ? (
              <div className="mr-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                <Loader2 className="size-4 animate-spin text-orange-600" />
                {language === "es" ? "Pensando..." : "Thinking..."}
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {text.quick.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-orange-300 hover:text-orange-700"
                  onClick={() => void submitQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    void submitQuestion(input)
                  }
                }}
                placeholder={text.placeholder}
                className="max-h-28 min-h-11 resize-none text-sm"
              />
              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 shrink-0 bg-orange-600 hover:bg-orange-700"
                disabled={loading || !input.trim()}
                aria-label={text.send}
              >
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </section>
      ) : (
        <Button
          type="button"
          className="h-14 rounded-full bg-slate-950 px-4 text-white shadow-2xl hover:bg-slate-800"
          aria-label={text.open}
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="size-5" />
          <span className="hidden sm:inline">{text.title}</span>
        </Button>
      )}
    </div>
  )
}
