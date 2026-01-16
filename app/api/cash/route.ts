import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL || "")

// Helper to ensure table exists
async function ensureTable() {
    await sql`
    CREATE TABLE IF NOT EXISTS cash_movements (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `
}

export async function GET(req: NextRequest) {
    try {
        // Determine if we want all or just today's
        const { searchParams } = new URL(req.url)
        const limit = searchParams.get("limit") || "50"

        await ensureTable()

        const result = await sql`
      SELECT * FROM cash_movements 
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `
        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[v0] GET /api/cash error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { type, amount, description } = body

        if (!['expense', 'withdrawal', 'deposit', 'adjustment'].includes(type)) {
            return NextResponse.json({ error: "Invalid movement type" }, { status: 400 })
        }

        await ensureTable()

        const result = await sql`
      INSERT INTO cash_movements (type, amount, description)
      VALUES (${type}, ${amount}, ${description || null})
      RETURNING *
    `

        return NextResponse.json(result[0], { status: 201 })
    } catch (error: any) {
        console.error("[v0] POST /api/cash error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
