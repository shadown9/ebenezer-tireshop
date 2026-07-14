import { type NextRequest, NextResponse } from "next/server"
import {
  buildAdminAssistantSystemPrompt,
  buildLocalAssistantReply,
  detectAssistantLanguage,
  type AdminAssistantSummary,
  type AssistantChatMessage,
  type AssistantLanguage,
} from "@/lib/admin-assistant"
import { getCurrentUser } from "@/lib/auth-server"

export const runtime = "nodejs"

interface AssistantRequest {
  messages?: AssistantChatMessage[]
  summary?: AdminAssistantSummary
  language?: AssistantLanguage
  memory?: string[]
  token?: string
  event?: "chat_opened" | "message"
}

function safeMessages(messages: AssistantChatMessage[]) {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-10)
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").slice(0, 1600),
    }))
}

async function askNvidia({
  messages,
  summary,
  language,
  memory,
}: {
  messages: AssistantChatMessage[]
  summary: AdminAssistantSummary
  language: AssistantLanguage
  memory: string[]
}) {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) return null

  const baseUrl = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1"
  const model = process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct"

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.55,
      top_p: 0.9,
      max_tokens: 550,
      messages: [
        { role: "system", content: buildAdminAssistantSystemPrompt(summary, language, memory) },
        ...safeMessages(messages),
      ],
    }),
  })

  if (!response.ok) return null

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  return typeof content === "string" && content.trim() ? content.trim() : null
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AssistantRequest
    const token = req.headers.get("authorization")?.replace("Bearer ", "") || body.token || req.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 })
    }

    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })
    }

    const messages = Array.isArray(body.messages) ? body.messages : []
    const memory = Array.isArray(body.memory)
      ? body.memory.map((item) => String(item).slice(0, 500)).slice(-8)
      : []
    const summary = body.summary
    const panelLanguage: AssistantLanguage = body.language === "en" ? "en" : "es"
    const isChatOpening = body.event === "chat_opened"
    const latestQuestion = isChatOpening
      ? panelLanguage === "es"
        ? "El chat acaba de abrirse. Saluda como Ebenezer Assistant y ofrece ayuda de forma natural."
        : "The chat just opened. Greet as Ebenezer Assistant and offer help naturally."
      : messages.filter((message) => message.role === "user").at(-1)?.content || ""
    const language = detectAssistantLanguage(latestQuestion, panelLanguage)

    if (!summary || !latestQuestion.trim()) {
      return NextResponse.json(
        {
          mode: "local",
          reply:
            language === "es"
              ? "Hazme una pregunta sobre facturas, caja, inventario, citas, reportes o taxes."
              : "Ask me about invoices, cash, inventory, appointments, reports, or taxes.",
        },
        { status: 200 },
      )
    }

    const openingFallback =
      language === "es"
        ? "Estoy listo por aqui. Dime si revisamos caja, facturas, inventario, citas, reportes o taxes y lo aterrizamos sin vueltas."
        : "I am ready here. Tell me if we are checking cash, invoices, inventory, appointments, reports, or taxes and I will keep it practical."
    const fallback = isChatOpening ? openingFallback : buildLocalAssistantReply(latestQuestion, summary, language)
    const nvidiaMessages: AssistantChatMessage[] = isChatOpening
      ? [{ role: "user", content: latestQuestion }]
      : messages

    try {
      const aiReply = await askNvidia({ messages: nvidiaMessages, summary, language, memory })
      if (aiReply) {
        return NextResponse.json({ mode: "ai", reply: aiReply })
      }
    } catch (error) {
      console.warn("[admin-assistant] NVIDIA fallback used:", error)
    }

    return NextResponse.json({ mode: "local", reply: fallback })
  } catch (error) {
    console.error("[admin-assistant] request failed:", error)
    return NextResponse.json(
      {
        mode: "local",
        reply: "No pude procesar esa pregunta ahora mismo. Intenta de nuevo con una pregunta mas corta.",
      },
      { status: 200 },
    )
  }
}
