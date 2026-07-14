import { NextResponse } from "next/server"
import {
  buildAdminAssistantSystemPrompt,
  buildLocalAssistantReply,
  detectAssistantLanguage,
  type AdminAssistantSummary,
  type AssistantChatMessage,
  type AssistantLanguage,
} from "@/lib/admin-assistant"

export const runtime = "nodejs"

interface AssistantRequest {
  messages?: AssistantChatMessage[]
  summary?: AdminAssistantSummary
  language?: AssistantLanguage
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
}: {
  messages: AssistantChatMessage[]
  summary: AdminAssistantSummary
  language: AssistantLanguage
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
      temperature: 0.2,
      max_tokens: 550,
      messages: [
        { role: "system", content: buildAdminAssistantSystemPrompt(summary, language) },
        ...safeMessages(messages),
      ],
    }),
  })

  if (!response.ok) return null

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  return typeof content === "string" && content.trim() ? content.trim() : null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AssistantRequest
    const messages = Array.isArray(body.messages) ? body.messages : []
    const summary = body.summary
    const panelLanguage: AssistantLanguage = body.language === "en" ? "en" : "es"
    const latestQuestion = messages.filter((message) => message.role === "user").at(-1)?.content || ""
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

    const fallback = buildLocalAssistantReply(latestQuestion, summary, language)

    try {
      const aiReply = await askNvidia({ messages, summary, language })
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
