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
export const dynamic = "force-dynamic"

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

function getNvidiaApiKey() {
  const raw = process.env.NVIDIA_API_KEY?.trim() || ""
  return raw.match(/nvapi-[A-Za-z0-9_-]+/)?.[0] || raw
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
  const apiKey = getNvidiaApiKey()
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

  if (!response.ok) {
    console.warn("[admin-assistant] NVIDIA returned non-OK status:", response.status)
    return null
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  return typeof content === "string" && content.trim() ? content.trim() : null
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AssistantRequest
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
    const openingFallback =
      language === "es"
        ? "Estoy listo por aqui. Dime si revisamos caja, facturas, inventario, citas, reportes o taxes y lo aterrizamos sin vueltas."
        : "I am ready here. Tell me if we are checking cash, invoices, inventory, appointments, reports, or taxes and I will keep it practical."

    if (!summary || !latestQuestion.trim()) {
      return NextResponse.json(
        {
          mode: "local",
          reply:
            language === "es"
              ? "Hazme una pregunta sobre facturas, caja, inventario, citas, reportes o taxes."
              : "Ask me about invoices, cash, inventory, appointments, reports, or taxes.",
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      )
    }

    const fallback = isChatOpening ? openingFallback : buildLocalAssistantReply(latestQuestion, summary, language)
    const tokenCandidates = [
      req.cookies.get("admin_token")?.value,
      req.headers.get("authorization")?.replace("Bearer ", ""),
      body.token,
    ]
      .map((token) => token?.trim())
      .filter((token): token is string => Boolean(token))
      .filter((token, index, tokens) => tokens.indexOf(token) === index)

    if (tokenCandidates.length === 0) {
      return NextResponse.json(
        { mode: "local", reason: "missing-session", reply: fallback },
        { headers: { "Cache-Control": "no-store" } },
      )
    }

    let user = null
    for (const token of tokenCandidates) {
      user = await getCurrentUser(token)
      if (user) break
    }

    if (!user) {
      return NextResponse.json(
        { mode: "local", reason: "invalid-session", reply: fallback },
        { headers: { "Cache-Control": "no-store" } },
      )
    }

    const nvidiaMessages: AssistantChatMessage[] = isChatOpening
      ? [{ role: "user", content: latestQuestion }]
      : messages

    try {
      const aiReply = await askNvidia({ messages: nvidiaMessages, summary, language, memory })
      if (aiReply) {
        return NextResponse.json(
          { mode: "ai", reply: aiReply },
          { headers: { "Cache-Control": "no-store" } },
        )
      }
    } catch (error) {
      console.warn("[admin-assistant] NVIDIA fallback used:", error)
    }

    return NextResponse.json(
      { mode: "local", reason: "ai-unavailable", reply: fallback },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    console.error("[admin-assistant] request failed:", error)
    return NextResponse.json(
      {
        mode: "local",
        reply: "No pude procesar esa pregunta ahora mismo. Intenta de nuevo con una pregunta mas corta.",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    )
  }
}
