import type { Appointment, Sale, Service, Tire } from "@/lib/types"

export type AssistantLanguage = "en" | "es"

export interface CashMovementSummary {
  id?: string | number
  type: "expense" | "withdrawal" | "deposit" | "adjustment" | string
  amount: number
  description?: string | null
  created_at?: string
}

export interface AdminAssistantSummary {
  currentPath: string
  generatedAt: string
  user?: {
    id?: string
    name?: string
    username?: string
    role?: string
  } | null
  inventory: {
    total: number
    lowStock: Pick<Tire, "id" | "brand" | "width" | "ratio" | "diameter" | "condition" | "quantity" | "price" | "type">[]
    sample: Pick<Tire, "id" | "brand" | "width" | "ratio" | "diameter" | "condition" | "quantity" | "price" | "type">[]
  }
  services: Pick<Service, "id" | "name" | "category" | "basePrice">[]
  appointments: {
    total: number
    today: number
    byStatus: Record<string, number>
    upcoming: Pick<Appointment, "id" | "trackingNumber" | "customerName" | "customerPhone" | "date" | "time" | "status">[]
  }
  sales: {
    totalInvoices: number
    todayGross: number
    monthGross: number
    topItems: { name: string; quantity: number; revenue: number; type: string }[]
    recentInvoices: Pick<Sale, "id" | "ticket_number" | "sale_date" | "customer_name" | "customer_phone" | "total_amount" | "payment_method">[]
  }
  cash: {
    totalMovements: number
    expenses: number
    deposits: number
    withdrawals: number
    recent: CashMovementSummary[]
  }
}

export interface AssistantChatMessage {
  role: "user" | "assistant"
  content: string
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function money(value: number) {
  return currency.format(Number.isFinite(value) ? value : 0)
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function isCasualGreeting(question: string) {
  const q = normalize(question).trim()
  return /^(hola|hello|hi|buenas|saludos|hey|que tal|como estas|como estas\?|hola amigo|hola amiga)([\s!?.]*)?$/.test(q)
}

export function buildGreetingReply(
  question: string,
  summary: AdminAssistantSummary,
  language: AssistantLanguage = "es",
) {
  const q = normalize(question)
  const rawName = summary.user?.name?.trim()
  const roleWords = ["administrador", "administrator", "admin", "manager", "employee", "empleado"]
  const firstName = rawName && !roleWords.includes(normalize(rawName)) ? rawName.split(" ")[0] : ""

  const greetings =
    language === "es"
      ? [
          `Hola${firstName ? `, ${firstName}` : ""}. Estoy aqui, listo para ayudarte con lo que haga falta en el panel.`,
          `Todo bien por aqui${firstName ? `, ${firstName}` : ""}. Dime que revisamos y me pongo en modo taller, pero sin drama.`,
          `Buenas${firstName ? `, ${firstName}` : ""}. Estoy activo y con las herramientas listas. Que necesitas mirar?`,
        ]
      : [
          `Hi${firstName ? `, ${firstName}` : ""}. I am here and ready to help with anything in the admin panel.`,
          `All good here${firstName ? `, ${firstName}` : ""}. Tell me what we are checking and I will get to work, no drama.`,
          `Hey${firstName ? `, ${firstName}` : ""}. I am active and ready. What do you want to look at?`,
        ]

  const index = Math.abs(q.split("").reduce((total, char) => total + char.charCodeAt(0), 0) + new Date().getMinutes()) % greetings.length
  return greetings[index]
}

export function detectAssistantLanguage(question: string, fallback: AssistantLanguage = "es"): AssistantLanguage {
  const q = normalize(question)
  const spanishSignals = [
    "hola",
    "espanol",
    "español",
    "hablas",
    "sabes",
    "puedes",
    "quiero",
    "necesito",
    "factura",
    "caja",
    "goma",
    "gomas",
    "servicio",
    "cita",
    "inventario",
    "reporte",
    "busca",
    "como",
    "que",
    "cuanto",
    "donde",
  ]
  const englishSignals = [
    "hello",
    "english",
    "speak",
    "can you",
    "need",
    "invoice",
    "cash",
    "tire",
    "tires",
    "appointment",
    "inventory",
    "report",
    "search",
    "how",
    "what",
    "where",
  ]

  const spanishScore = spanishSignals.reduce((score, word) => score + (q.includes(normalize(word)) ? 1 : 0), 0)
  const englishScore = englishSignals.reduce((score, word) => score + (q.includes(word) ? 1 : 0), 0)

  if (spanishScore > englishScore) return "es"
  if (englishScore > spanishScore) return "en"
  return fallback
}

function routeGuide(path: string, language: AssistantLanguage) {
  const guides = {
    es: [
      ["/admin/pos/reports", "Estas en Reportes y Taxes. Aqui revisas ventas, ganancias, productos mas vendidos, servicios solicitados y preparas el paquete para taxes."],
      ["/admin/pos/history", "Estas en historial de facturas. Usa filtros por ID/ticket, cliente, telefono o detalles de la factura para encontrar reclamos rapido."],
      ["/admin/pos/cash", "Estas en Caja. Aqui se registran gastos, depositos y retiros para que el cierre y los reportes queden claros."],
      ["/admin/pos", "Estas en Punto de Venta. Puedes facturar productos de inventario y tambien articulos manuales que no esten publicados."],
      ["/admin/agenda", "Estas en Agenda. Cuando admin actualiza una cita o servicio, el cliente puede ver el progreso con su numero de seguimiento."],
      ["/admin/inventory", "Estas en Inventario. Mantener cantidades y costos correctos mejora facturas, ganancias y reportes."],
      ["/admin/services", "Estas en Servicios. Lo que configures aqui aparece para clientes y tambien ayuda a medir los servicios mas solicitados."],
    ],
    en: [
      ["/admin/pos/reports", "You are in Reports and Taxes. This area reviews sales, profit, top products, top services, and the tax preparer package."],
      ["/admin/pos/history", "You are in invoice history. Use filters by ID, customer, phone, or invoice details to find claims quickly."],
      ["/admin/pos/cash", "You are in Cash. Record expenses, deposits, and withdrawals so closing and reports stay clear."],
      ["/admin/pos", "You are in Point of Sale. You can invoice inventory items and manual items that are not published."],
      ["/admin/agenda", "You are in Agenda. When admin updates an appointment or service, the customer can track progress with their tracking number."],
      ["/admin/inventory", "You are in Inventory. Accurate quantities and costs improve invoices, profits, and reports."],
      ["/admin/services", "You are in Services. Items configured here appear for customers and help measure requested services."],
    ],
  } as const

  return guides[language].find(([route]) => path.startsWith(route))?.[1] ?? (language === "es"
    ? "Estas en el panel administrativo. Puedo orientarte por caja, facturas, inventario, citas, reportes y taxes."
    : "You are in the admin dashboard. I can guide you through cash, invoices, inventory, appointments, reports, and taxes.")
}

function findInventoryMatches(question: string, summary: AdminAssistantSummary) {
  const terms = normalize(question)
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 2)

  if (terms.length === 0) return []

  return [...summary.inventory.sample, ...summary.inventory.lowStock]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .filter((item) => {
      const haystack = normalize(`${item.brand} ${item.width}/${item.ratio}R${item.diameter} ${item.condition} ${item.type ?? "tire"}`)
      return terms.some((term) => haystack.includes(term))
    })
    .slice(0, 5)
}

function topItemsLine(summary: AdminAssistantSummary, language: AssistantLanguage) {
  if (summary.sales.topItems.length === 0) {
    return language === "es"
      ? "Todavia no veo productos o servicios vendidos en el periodo cargado."
      : "I do not see sold products or services in the loaded period yet."
  }

  return summary.sales.topItems
    .slice(0, 5)
    .map((item, index) => `${index + 1}. ${item.name}: ${item.quantity} (${money(item.revenue)})`)
    .join("\n")
}

export function buildAdminAssistantSystemPrompt(
  summary: AdminAssistantSummary,
  language: AssistantLanguage,
  memory: string[] = [],
) {
  return [
    language === "es"
      ? "Eres Ebenezer Assistant, parte del equipo de Ebenezer Tireshop. Tu trabajo es ayudar en el admin de la gomera, pero tu forma de hablar debe sentirse viva: amable, despierta, con criterio propio, un toque de humor limpio cuando venga natural, y cero libreto repetido. Conversa como alguien que entiende el taller y quiere resolver, no como un formulario."
      : "You are Ebenezer Assistant, part of the Ebenezer Tireshop team. Your job is to help in the tire shop admin, but your voice should feel alive: friendly, alert, thoughtful, with a touch of clean humor when it naturally fits, and no repeated script. Speak like someone who understands the shop and wants to solve things, not like a form.",
    language === "es"
      ? "Tu mision: orientar sobre caja, facturas, inventario, citas, servicios, reportes, taxes y flujo del cliente. Si la conversacion es casual, responde casual. Si piden datos o accion, usa el resumen del negocio y guia al usuario con precision."
      : "Your mission: guide cash, invoices, inventory, appointments, services, reports, taxes, and customer flow. If the conversation is casual, answer casually. If they ask for data or action, use the business summary and guide them precisely.",
    "Use only the provided business summary and the app guide for factual business data. Do not invent totals, invoices, customers, taxes, or inventory.",
    language === "es"
      ? "No repitas frases anteriores si el usuario hace una pregunta parecida. Cambia el angulo, reconoce el contexto y responde como si estuvieras presente en la conversacion. Usa etiquetas como Resumen o Siguiente paso solo cuando realmente ayuden."
      : "Do not repeat previous phrasing when the user asks something similar. Change the angle, recognize the context, and answer as if you are present in the conversation. Use labels like Summary or Next step only when they genuinely help.",
    language === "es"
      ? "No llames al usuario 'Administrador' como saludo normal. Si no sabes su nombre real, habla directo sin titulo. El humor debe ser fresco y breve; nunca fuerces chistes sobre stock bajo, dinero o errores."
      : "Do not call the user 'Administrator' as a normal greeting. If you do not know their real name, speak directly without a title. Humor should be fresh and brief; never force jokes about low stock, money, or errors.",
    language === "es"
      ? "Responde en espanol cuando el usuario escriba en espanol, aunque el panel este en ingles. Si el usuario cambia a ingles, responde en ingles."
      : "Answer in English when the user writes in English. If the user switches to Spanish, answer in Spanish.",
    "You cannot change, delete, refund, close, or create records. You may guide the admin to the correct screen.",
    "Never ask for passwords or secrets. Do not expose API keys.",
    summary.user
      ? `Current logged-in admin: ${summary.user.name || "Unknown"} (${summary.user.username || "no username"}), role: ${summary.user.role || "unknown"}.`
      : "Current logged-in admin: unknown.",
    memory.length > 0
      ? `Useful prior memory for this admin: ${memory.slice(-8).join(" | ")}`
      : "Useful prior memory for this admin: none yet.",
    `Current route guide: ${routeGuide(summary.currentPath, language)}`,
    `Live summary JSON: ${JSON.stringify(summary).slice(0, 12000)}`,
  ].join("\n")
}

export function buildLocalAssistantReply(
  question: string,
  summary: AdminAssistantSummary,
  language: AssistantLanguage = "es",
) {
  const q = normalize(question)
  const isSpanish = language === "es"
  const matches = findInventoryMatches(question, summary)
  const location = routeGuide(summary.currentPath, language)

  if (/\b(hola|hello|hi|buenas|saludos)\b/.test(q) && q.length <= 30) {
    return buildGreetingReply(question, summary, language)
  }

  if (/\b(hablas|sabes hablar|puedes hablar|espanol|español|spanish|speak spanish)\b/.test(q)) {
    return isSpanish
      ? "Si, hablo espanol. Tambien puedo responder en ingles si me escribes en ingles. El panel puede estar en un idioma, pero yo sigo el idioma de tu pregunta, que seria lo normal... y por fin lo estamos haciendo bien."
      : "Yes, I can speak Spanish. I can also answer in English when you write in English. The panel can be in one language, but I follow the language of your question, which is the sensible thing to do."
  }

  if (/\b(quien eres|que eres|que puedes hacer|ayuda|help|what can you do|who are you)\b/.test(q)) {
    return isSpanish
      ? `Soy el ayudante del admin de Ebenezer Tireshop. Puedo leer resumenes de inventario, facturas, caja, citas, servicios y reportes para orientarte rapido. No hago cambios automaticos, porque una IA con boton de borrar sin permiso seria una novela de terror administrativa.\n\n${location}`
      : `I am the Ebenezer Tireshop admin helper. I can read summaries for inventory, invoices, cash, appointments, services, and reports so I can guide you quickly. I do not make automatic changes, because an AI with a delete button and no permission would be an admin horror story.\n\n${location}`
  }

  if (/\b(delete|remove|refund|void|close|cerrar|borrar|eliminar|reembols|anular|cambiar|actualizar|crear)\b/.test(q)) {
    return isSpanish
      ? `${location}\n\nPuedo guiarte, pero no hago cambios automaticos. Ya sabes, tocar datos reales a ciegas es una idea espectacular... si uno quiere problemas. Para modificar datos, usa la pantalla correspondiente y confirma manualmente. Facturas: /admin/pos/history. Caja: /admin/pos/cash. Citas: /admin/agenda.`
      : `${location}\n\nI can guide you, but I do not make automatic changes. Touching real data blindly is a brilliant plan... if we are collecting problems. Use the matching screen and confirm manually. Invoices: /admin/pos/history. Cash: /admin/pos/cash. Appointments: /admin/agenda.`
  }

  if (/\b(inventario|inventory|stock|goma|tire|llanta|rin|marca)\b/.test(q)) {
    const lowStock = summary.inventory.lowStock
      .slice(0, 6)
      .map((item) => `${item.brand} ${item.width}/${item.ratio}R${item.diameter} ${item.condition}: ${item.quantity}`)
      .join("\n")
    const found = matches
      .map((item) => `${item.brand} ${item.width}/${item.ratio}R${item.diameter} ${item.condition}: ${item.quantity} disponible(s), ${money(item.price)}`)
      .join("\n")

    return isSpanish
      ? `Inventario total: ${summary.inventory.total} item(s). Bajo stock: ${summary.inventory.lowStock.length}. Nada dramatico, solo el inventario pidiendo atencion como siempre.\n\n${found ? `Coincidencias:\n${found}\n\n` : ""}${lowStock ? `Bajo stock:\n${lowStock}` : "No veo alertas de bajo stock en el resumen cargado."}\n\nPara ajustar cantidades: /admin/inventory.`
      : `Total inventory: ${summary.inventory.total} item(s). Low stock: ${summary.inventory.lowStock.length}. Nothing dramatic, just inventory asking for attention as usual.\n\n${found ? `Matches:\n${found}\n\n` : ""}${lowStock ? `Low stock:\n${lowStock}` : "I do not see low-stock alerts in the loaded summary."}\n\nTo adjust quantities: /admin/inventory.`
  }

  if (/\b(factura|invoice|ticket|cliente|customer|reclamo|claim|buscar|search)\b/.test(q)) {
    const recent = summary.sales.recentInvoices
      .slice(0, 5)
      .map((sale) => `${sale.ticket_number}: ${sale.customer_name || (isSpanish ? "Cliente sin nombre" : "Unnamed customer")} - ${money(sale.total_amount)}`)
      .join("\n")

    return isSpanish
      ? `Hay ${summary.sales.totalInvoices} factura(s) cargadas. Recientes:\n${recent || "No hay facturas recientes en el resumen."}\n\nPara encontrar una factura rapido, entra a /admin/pos/history y filtra por numero ID/ticket, nombre, telefono o detalles. El numero de ticket debe salir igual para el cliente y para el negocio, porque adivinar facturas no es un sistema contable muy elegante.`
      : `There are ${summary.sales.totalInvoices} loaded invoice(s). Recent:\n${recent || "No recent invoices in the summary."}\n\nTo find an invoice quickly, open /admin/pos/history and filter by ticket ID, name, phone, or details. The ticket number should match for the customer and business copy, because guessing invoices is not exactly elegant accounting.`
  }

  if (/\b(caja|cash|gasto|expense|deposit|deposito|retiro|withdrawal|dinero)\b/.test(q)) {
    return isSpanish
      ? `Caja actual del resumen:\nGastos: ${money(summary.cash.expenses)}\nDepositos: ${money(summary.cash.deposits)}\nRetiros: ${money(summary.cash.withdrawals)}\nMovimientos: ${summary.cash.totalMovements}\n\nPara registrar dinero que entra o sale: /admin/pos/cash. Esto alimenta los reportes y el cierre del dia, que es mucho mejor que confiar en la memoria despues de un dia largo.`
      : `Cash summary:\nExpenses: ${money(summary.cash.expenses)}\nDeposits: ${money(summary.cash.deposits)}\nWithdrawals: ${money(summary.cash.withdrawals)}\nMovements: ${summary.cash.totalMovements}\n\nTo record money in or out: /admin/pos/cash. This feeds reports and daily closing, which beats trusting memory after a long day.`
  }

  if (/\b(reporte|tax|taxes|contabilidad|accounting|ventas|sales|ganancia|profit|mas vendido|top|servicio)\b/.test(q)) {
    return isSpanish
      ? `Ventas de hoy: ${money(summary.sales.todayGross)}. Ventas del mes cargado: ${money(summary.sales.monthGross)}.\n\nMas vendido/solicitado:\n${topItemsLine(summary, language)}\n\nPara contabilidad y taxes: /admin/pos/reports. Ahi puedes filtrar por dia, semana, mes, ano o rango manual y preparar el paquete para tu preparador de NJ.`
      : `Today's sales: ${money(summary.sales.todayGross)}. Loaded month sales: ${money(summary.sales.monthGross)}.\n\nTop sold/requested:\n${topItemsLine(summary, language)}\n\nFor accounting and taxes: /admin/pos/reports. Filter by day, week, month, year, or manual range and prepare the NJ tax package.`
  }

  if (/\b(cita|appointment|agenda|seguimiento|tracking|estado|status|cliente)\b/.test(q)) {
    const status = Object.entries(summary.appointments.byStatus)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")
    const upcoming = summary.appointments.upcoming
      .slice(0, 5)
      .map((item) => `${item.trackingNumber}: ${item.customerName}, ${item.date} ${item.time}, ${item.status}`)
      .join("\n")

    return isSpanish
      ? `Citas cargadas: ${summary.appointments.total}. Para hoy: ${summary.appointments.today}. Estados: ${status || "sin datos"}.\n\nProximas:\n${upcoming || "No veo citas proximas en el resumen."}\n\nEl cliente usa su numero de seguimiento. Cuando admin cambia el estado en /admin/agenda, el cliente ve el progreso actualizado en Track.`
      : `Loaded appointments: ${summary.appointments.total}. Today: ${summary.appointments.today}. Statuses: ${status || "no data"}.\n\nUpcoming:\n${upcoming || "No upcoming appointments in the summary."}\n\nThe customer uses the tracking number. When admin updates status in /admin/agenda, the customer sees the progress in Track.`
  }

  return isSpanish
      ? `${location}\n\nPuedo ayudarte con inventario, facturas, caja, citas, reportes, productos mas vendidos, servicios solicitados y taxes. Preguntame algo como: "resumen de caja", "busca una factura", "que gomas estan bajas", o "que debo revisar para taxes". Prometo no hacerme la importante... demasiado.`
    : `${location}\n\nI can help with inventory, invoices, cash, appointments, reports, top products, requested services, and taxes. Ask me something like: "cash summary", "find an invoice", "what tires are low", or "what should I review for taxes". I promise not to act too important... mostly.`
}
