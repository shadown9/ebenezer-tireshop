"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Loader2, MessageCircle, Mic, MicOff, Send, ShieldCheck, Sparkles, Volume2, VolumeX, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  useAppointments,
  useSales,
  useServices,
  useTires,
} from "@/lib/firebase-hooks"
import type {
  AdminAssistantSummary,
  AssistantChatMessage,
  CashMovementSummary,
} from "@/lib/admin-assistant"
import type { Appointment, Sale, Tire, User as AdminUser } from "@/lib/types"
import { cn } from "@/lib/utils"

type AssistantMode = "local" | "ai"
type MessageSource = "text" | "voice"
type AssistantFallbackReason = "missing-session" | "invalid-session" | "ai-unavailable" | null

type SpeechRecognitionConstructor = new () => SpeechRecognition

interface SpeechRecognitionEventResult {
  readonly isFinal: boolean
  readonly 0: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
}

interface SpeechRecognitionEvent extends Event {
  readonly results: {
    readonly length: number
    readonly [index: number]: SpeechRecognitionEventResult
  }
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

const STORAGE_KEY = "ebenezer-admin-assistant-thread"
const MEMORY_STORAGE_KEY = "ebenezer-admin-assistant-memory"
const LANGUAGE_STORAGE_KEY = "ebenezer-admin-assistant-language"
const MODE_STORAGE_KEY = "ebenezer-admin-assistant-mode"
const ASSISTANT_NAME = "Ebenezer Assistant"

const copy = {
  es: {
    title: ASSISTANT_NAME,
    subtitle: "Tu copiloto de la gomera",
    open: "Abrir Ebenezer Assistant",
    close: "Cerrar Ebenezer Assistant",
    placeholder: "Pregunta sobre caja, facturas, inventario, citas, taxes...",
    send: "Enviar",
    local: "modo seguro local",
    ai: "IA conectada",
    safety: "Solo lee resumenes. No cambia datos.",
    reasons: {
      "missing-session": "No veo sesion activa para IA.",
      "invalid-session": "Sesion no validada para IA.",
      "ai-unavailable": "La IA externa no respondio; usando guia local.",
    },
    language: "Idioma",
    listen: "Escuchar respuesta",
    stopListening: "Detener voz",
    voiceInput: "Enviar nota de voz",
    stopVoiceInput: "Detener nota de voz",
    listening: "Escuchando...",
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
    title: ASSISTANT_NAME,
    subtitle: "Your tire shop copilot",
    open: "Open Ebenezer Assistant",
    close: "Close Ebenezer Assistant",
    placeholder: "Ask about cash, invoices, inventory, appointments, taxes...",
    send: "Send",
    local: "safe local mode",
    ai: "AI connected",
    safety: "Reads summaries only. It does not change data.",
    reasons: {
      "missing-session": "No active session for AI.",
      "invalid-session": "Session not validated for AI.",
      "ai-unavailable": "External AI did not respond; using local guide.",
    },
    language: "Language",
    listen: "Listen to response",
    stopListening: "Stop voice",
    voiceInput: "Send voice note",
    stopVoiceInput: "Stop voice note",
    listening: "Listening...",
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

function cleanAssistantText(content: string) {
  return content
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim()
}

function messageBlocks(content: string) {
  const cleaned = cleanAssistantText(content)
  return cleaned.split(/\n{2,}/).filter(Boolean)
}

function speechText(content: string) {
  return cleanAssistantText(content)
    .replace(/•/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function loadAdminUser() {
  if (typeof window === "undefined") return null

  try {
    const saved = window.localStorage.getItem("admin_user")
    return saved ? (JSON.parse(saved) as AdminUser) : null
  } catch {
    return null
  }
}

function getMemoryStorageKey(user: AdminUser | null) {
  const id = user?.id || user?.username || "shared"
  return `${MEMORY_STORAGE_KEY}:${id}`
}

function getVisibleChatStorageKey() {
  if (typeof window === "undefined") return STORAGE_KEY
  const token = window.localStorage.getItem("admin_token") || "no-session"
  return `${STORAGE_KEY}:${token.slice(0, 12)}`
}

function getModeStorageKey() {
  if (typeof window === "undefined") return MODE_STORAGE_KEY
  const token = window.localStorage.getItem("admin_token") || "no-session"
  return `${MODE_STORAGE_KEY}:${token.slice(0, 12)}`
}

function chooseVoice(voices: SpeechSynthesisVoice[], language: "es" | "en") {
  const preferredSpanish = ["google español", "google us spanish", "paulina", "monica", "sabina", "luciana", "jorge"]
  const preferredEnglish = ["google us english", "microsoft aria", "microsoft jenny", "samantha", "alex", "daniel"]
  const preferred = language === "es" ? preferredSpanish : preferredEnglish
  const languagePrefix = language === "es" ? "es" : "en"

  return (
    preferred
      .map((name) => voices.find((voice) => voice.name.toLowerCase().includes(name)))
      .find(Boolean) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(languagePrefix) && voice.localService) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(languagePrefix)) ||
    null
  )
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
  currentUser,
}: {
  currentPath: string
  tires: Tire[]
  appointments: Appointment[]
  sales: Sale[]
  services: ReturnType<typeof useServices>["services"]
  cashMovements: CashMovementSummary[]
  currentUser: AdminUser | null
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
    user: currentUser
      ? {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          role: currentUser.role,
        }
      : null,
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
  const [currentUser] = useState<AdminUser | null>(() => loadAdminUser())
  const [assistantLanguage, setAssistantLanguage] = useState<"es" | "en">(() => {
    if (typeof window === "undefined") return "es"
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return saved === "en" || saved === "es" ? saved : "es"
  })
  const text = copy[assistantLanguage]
  const { tires } = useTires()
  const { appointments } = useAppointments()
  const { services } = useServices()
  const { sales } = useSales()
  const [cashMovements, setCashMovements] = useState<CashMovementSummary[]>([])
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<AssistantMode>(() => {
    if (typeof window === "undefined") return "local"
    return window.localStorage.getItem(getModeStorageKey()) === "ai" ? "ai" : "local"
  })
  const [fallbackReason, setFallbackReason] = useState<AssistantFallbackReason>(null)
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [memory, setMemory] = useState<string[]>(() => {
    if (typeof window === "undefined") return []

    try {
      const saved = window.localStorage.getItem(getMemoryStorageKey(loadAdminUser()))
      const parsed = saved ? (JSON.parse(saved) as string[]) : []
      return Array.isArray(parsed) ? parsed.slice(-8) : []
    } catch {
      return []
    }
  })
  const [messages, setMessages] = useState<AssistantChatMessage[]>(() => {
    if (typeof window === "undefined") return []

    try {
      const saved = window.localStorage.getItem(getVisibleChatStorageKey())
      const parsed = saved ? (JSON.parse(saved) as AssistantChatMessage[]) : []
      if (!Array.isArray(parsed) || parsed.length === 0) return []
      const recent = parsed.slice(-12)
      return recent.some((message) => message.role === "user") ? recent : []
    } catch {
      return []
    }
  })
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const welcomeRequestedRef = useRef(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const transcriptRef = useRef("")

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, assistantLanguage)
  }, [assistantLanguage])

  useEffect(() => {
    window.localStorage.setItem(getVisibleChatStorageKey(), JSON.stringify(messages.slice(-12)))
  }, [messages])

  useEffect(() => {
    window.localStorage.setItem(getModeStorageKey(), mode)
  }, [mode])

  useEffect(() => {
    window.localStorage.setItem(getMemoryStorageKey(currentUser), JSON.stringify(memory.slice(-8)))
  }, [currentUser, memory])

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
      recognitionRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!("speechSynthesis" in window)) return

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices())
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

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
        currentUser,
      }),
    [appointments, cashMovements, currentUser, pathname, sales, services, tires],
  )
  const canUseVoiceInput = typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => {
    if (!open || messages.length > 0 || loading || welcomeRequestedRef.current) return
    welcomeRequestedRef.current = true
    void requestInitialGreeting()
    // The greeting should fire only once for a newly opened empty chat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, messages.length, open])

  function speakContent(content: string, index: number) {
    if (!("speechSynthesis" in window)) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(speechText(content))
    const voice = chooseVoice(voices, assistantLanguage)
    if (voice) {
      utterance.voice = voice
    }
    utterance.lang = assistantLanguage === "es" ? "es-US" : "en-US"
    utterance.rate = assistantLanguage === "es" ? 0.92 : 0.94
    utterance.pitch = 1.03
    utterance.onend = () => setSpeakingIndex(null)
    utterance.onerror = () => setSpeakingIndex(null)
    setSpeakingIndex(index)
    window.speechSynthesis.speak(utterance)
  }

  async function requestInitialGreeting() {
    setLoading(true)

    try {
      const adminToken = window.localStorage.getItem("admin_token") || ""
      const response = await fetch("/api/admin/assistant", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          event: "chat_opened",
          messages: [],
          summary,
          language: assistantLanguage,
          memory,
          token: adminToken,
        }),
      })
      const data = await response.json().catch(() => null)
      const fallbackReply =
        assistantLanguage === "es"
          ? "Estoy listo por aqui. Dime si revisamos caja, facturas, inventario, citas, reportes o taxes y lo aterrizamos sin vueltas."
          : "I am ready here. Tell me if we are checking cash, invoices, inventory, appointments, reports, or taxes and I will keep it practical."
      const reply = data?.reply || fallbackReply
      setMode(data?.mode === "ai" ? "ai" : "local")
      setFallbackReason(data?.mode === "ai" ? null : data?.reason || "ai-unavailable")
      setMessages([{ role: "assistant", content: reply }])
    } catch {
      setMode("local")
      setFallbackReason("ai-unavailable")
      setMessages([
        {
          role: "assistant",
          content:
            assistantLanguage === "es"
              ? "Estoy aqui para ayudarte con el panel. Dime que revisamos y arrancamos sin hacer drama administrativo."
              : "I am here to help with the admin panel. Tell me what we are checking and we will get moving.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function submitQuestion(question: string, source: MessageSource = "text") {
    const cleanQuestion = question.trim()
    if (!cleanQuestion || loading) return

    const nextMessages: AssistantChatMessage[] = [
      ...messages,
      { role: "user" as const, content: cleanQuestion },
    ].slice(-10)

    setMessages(nextMessages)
    setInput("")
    setLoading(true)

    try {
      const adminToken = window.localStorage.getItem("admin_token") || ""
      const requestBody = {
        messages: nextMessages,
        summary,
        language: assistantLanguage,
        memory,
        token: "",
      }
      const sendAssistantRequest = (token: string, includeToken = true) =>
        fetch("/api/admin/assistant", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            ...(includeToken && token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(includeToken ? requestBody : { ...requestBody, token: "" }),
        })

      let response = await sendAssistantRequest("", false)
      if (response.status === 401) {
        response = await sendAssistantRequest(adminToken)
      }
      const data = await response.json()
      if (!response.ok) {
        const authMessage =
          assistantLanguage === "es"
            ? "No pude validar la sesion para usar la IA conectada. El panel sigue abierto, pero vuelve a iniciar sesion para que el asistente lea datos reales."
            : "I could not validate the session for connected AI. The panel is still open, but log in again so the assistant can read real data."
        throw new Error(data?.error || authMessage)
      }
      const reply = data.reply || text.error
      setMode(data.mode === "ai" ? "ai" : "local")
      setFallbackReason(data.mode === "ai" ? null : data.reason || "ai-unavailable")
      setMessages((current) => {
        const next = [
          ...current,
          { role: "assistant" as const, content: reply },
        ].slice(-12)
        if (source === "voice") {
          window.setTimeout(() => speakContent(reply, next.length - 1), 150)
        }
        return next
      })
      setMemory((current) => [
        ...current,
        `Conversacion previa: el usuario pregunto "${cleanQuestion.slice(0, 140)}"; la respuesta trato sobre "${reply
          .replace(/\s+/g, " ")
          .slice(0, 180)}". Mantener continuidad sin repetir la misma frase.`,
      ].slice(-8))
    } catch (error) {
      setMode("local")
      setFallbackReason("ai-unavailable")
      setMessages((current) => [
        ...current,
        { role: "assistant" as const, content: error instanceof Error ? error.message : text.error },
      ].slice(-12))
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitQuestion(input)
  }

  function toggleVoice(content: string, index: number) {
    if (!("speechSynthesis" in window)) return

    if (speakingIndex === index) {
      window.speechSynthesis.cancel()
      setSpeakingIndex(null)
      return
    }

    speakContent(content, index)
  }

  function toggleVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition || loading) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    transcriptRef.current = ""
    recognition.lang = assistantLanguage === "es" ? "es-US" : "en-US"
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let transcript = ""
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript || ""
      }
      transcriptRef.current = transcript.trim()
      setInput(transcriptRef.current)
    }
    recognition.onerror = () => {
      setIsListening(false)
    }
    recognition.onend = () => {
      setIsListening(false)
      const transcript = transcriptRef.current.trim()
      transcriptRef.current = ""
      if (transcript) {
        void submitQuestion(transcript, "voice")
      }
    }
    setIsListening(true)
    recognition.start()
  }
  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden sm:bottom-5 sm:right-5">
      {open ? (
        <section className="flex h-[min(700px,calc(100vh-2rem))] w-[calc(100vw-2rem)] max-w-[440px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl sm:w-[440px]">
          <header className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-white ring-2 ring-orange-500">
                <Image
                  src="/logo.png"
                  alt={ASSISTANT_NAME}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
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

          <div className="space-y-2 border-b border-slate-200 px-4 py-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                {mode === "ai" ? <Sparkles className="size-3.5 text-orange-500" /> : <ShieldCheck className="size-3.5 text-emerald-600" />}
                {mode === "ai" ? text.ai : text.local}
              </span>
              <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5" aria-label={text.language}>
                {(["es", "en"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={cn(
                      "h-7 rounded px-3 text-xs font-bold transition",
                      assistantLanguage === option
                        ? "bg-orange-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-white",
                    )}
                    onClick={() => {
                      setAssistantLanguage(option)
                      window.speechSynthesis?.cancel()
                      setSpeakingIndex(null)
                    }}
                  >
                    {option === "es" ? "ES" : "EN"}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-slate-500">{text.safety}</p>
            {mode === "local" && fallbackReason ? (
              <p className="font-medium text-orange-700">{text.reasons[fallbackReason]}</p>
            ) : null}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "group max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed shadow-sm",
                  message.role === "user"
                    ? "ml-auto bg-orange-600 text-white"
                    : "mr-auto border border-slate-200 bg-white text-slate-900",
                )}
              >
                {message.role === "assistant" ? (
                  <div className="space-y-2">
                    <div className="space-y-2">
                      {messageBlocks(message.content).map((block, blockIndex) => (
                        <p key={blockIndex} className="whitespace-pre-line">
                          {block}
                        </p>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-700"
                      onClick={() => toggleVoice(message.content, index)}
                      aria-label={speakingIndex === index ? text.stopListening : text.listen}
                    >
                      {speakingIndex === index ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                      {speakingIndex === index ? text.stopListening : text.listen}
                    </button>
                  </div>
                ) : (
                  <p className="whitespace-pre-line">{cleanAssistantText(message.content)}</p>
                )}
              </div>
            ))}
            {loading ? (
              <div className="mr-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                <Loader2 className="size-4 animate-spin text-orange-600" />
                {assistantLanguage === "es" ? "Pensando..." : "Thinking..."}
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
            {isListening ? (
              <div className="mb-2 flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-orange-600" />
                </span>
                {text.listening}
              </div>
            ) : null}
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
                type="button"
                size="icon"
                variant={isListening ? "default" : "outline"}
                className={cn(
                  "h-11 w-11 shrink-0 transition",
                  isListening
                    ? "animate-pulse bg-slate-950 text-white ring-2 ring-orange-400 ring-offset-2 hover:bg-slate-800"
                    : "border-orange-200 text-orange-700 hover:bg-orange-50",
                )}
                disabled={loading || !canUseVoiceInput}
                aria-label={isListening ? text.stopVoiceInput : text.voiceInput}
                title={isListening ? text.listening : text.voiceInput}
                onClick={toggleVoiceInput}
              >
                {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </Button>
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
          <span className="relative size-7 overflow-hidden rounded-full bg-white">
            <Image src="/logo.png" alt="" fill sizes="28px" className="object-cover" />
          </span>
          <span className="hidden sm:inline">{text.title}</span>
          <MessageCircle className="size-4" />
        </Button>
      )}
    </div>
  )
}
