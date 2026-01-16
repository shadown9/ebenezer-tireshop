import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("[v0] Upload API route called")

  try {
    const formData = await request.formData()
    console.log("[v0] FormData received")

    const file = formData.get("file") as File
    console.log("[v0] File from formData:", file?.name, file?.size, file?.type)

    if (!file) {
      console.log("[v0] No file in formData")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Uploading to Vercel Blob...")
    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
    })

    console.log("[v0] Upload successful! URL:", blob.url)
    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error: any) {
    console.error("[v0] Upload API error:", error)
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
  }
}
