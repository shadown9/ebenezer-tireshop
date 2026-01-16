import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL || "")

export async function GET(req: NextRequest) {
  try {
    const result = await sql`SELECT * FROM sales ORDER BY sale_date DESC LIMIT 100`
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] GET /api/sales error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sale_date, customer_name, customer_phone, sale_items, total_amount, payment_method, notes } = body

    const result = await sql`
      INSERT INTO sales (sale_date, customer_name, customer_phone, sale_items, total_amount, payment_method, notes)
      VALUES (${sale_date}, ${customer_name || null}, ${customer_phone || null}, ${JSON.stringify(sale_items)}, ${total_amount}, ${payment_method}, ${notes || null})
      RETURNING *`

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error("[v0] POST /api/sales error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
