// Sales management functions
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

export interface SaleItem {
  product_id?: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Sale {
  id: string
  sale_date: string
  customer_name?: string
  customer_phone?: string
  sale_items: SaleItem[]
  total_amount: number
  payment_method?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  product_name: string
  product_type: string
  base_price: number
  is_visible_public: boolean
  description?: string
  image_url?: string
}

// Get all sales with optional date range
export async function getSales(startDate?: string, endDate?: string) {
  let query = `SELECT * FROM sales ORDER BY sale_date DESC`
  const params = []

  if (startDate && endDate) {
    query = `SELECT * FROM sales WHERE sale_date BETWEEN $1 AND $2 ORDER BY sale_date DESC`
    params.push(startDate, endDate)
  }

  const result = await sql(query, params)
  return result as Sale[]
}

// Get single sale
export async function getSaleById(id: string) {
  const result = await sql(`SELECT * FROM sales WHERE id = $1`, [id])
  return result[0] as Sale | undefined
}

// Create new sale
export async function createSale(sale: Omit<Sale, "id" | "created_at" | "updated_at">) {
  const result = await sql(
    `INSERT INTO sales (sale_date, customer_name, customer_phone, sale_items, total_amount, payment_method, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      sale.sale_date,
      sale.customer_name,
      sale.customer_phone,
      JSON.stringify(sale.sale_items),
      sale.total_amount,
      sale.payment_method,
      sale.notes,
      sale.created_by,
    ],
  )
  return result[0] as Sale
}

// Update sale
export async function updateSale(id: string, updates: Partial<Sale>) {
  const result = await sql(
    `UPDATE sales SET 
      sale_date = COALESCE($1, sale_date),
      customer_name = COALESCE($2, customer_name),
      customer_phone = COALESCE($3, customer_phone),
      sale_items = COALESCE($4, sale_items),
      total_amount = COALESCE($5, total_amount),
      payment_method = COALESCE($6, payment_method),
      notes = COALESCE($7, notes),
      updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [
      updates.sale_date,
      updates.customer_name,
      updates.customer_phone,
      updates.sale_items ? JSON.stringify(updates.sale_items) : null,
      updates.total_amount,
      updates.payment_method,
      updates.notes,
      id,
    ],
  )
  return result[0] as Sale
}

// Delete sale
export async function deleteSale(id: string) {
  await sql(`DELETE FROM sales WHERE id = $1`, [id])
}

// Get all products in catalog
export async function getProducts() {
  const result = await sql(`SELECT * FROM product_catalog ORDER BY product_name`)
  return result as Product[]
}

// Get products by type
export async function getProductsByType(type: string) {
  const result = await sql(`SELECT * FROM product_catalog WHERE product_type = $1 ORDER BY product_name`, [type])
  return result as Product[]
}

// Create new product
export async function createProduct(product: Omit<Product, "id">) {
  const result = await sql(
    `INSERT INTO product_catalog (product_name, product_type, base_price, is_visible_public, description, image_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      product.product_name,
      product.product_type,
      product.base_price,
      product.is_visible_public,
      product.description,
      product.image_url,
    ],
  )
  return result[0] as Product
}

// Get sales summary for date range
export async function getSalesSummary(startDate: string, endDate: string) {
  const result = await sql(
    `SELECT 
      DATE(sale_date) as date,
      COUNT(*) as total_sales,
      SUM(total_amount) as daily_revenue,
      AVG(total_amount) as average_sale
     FROM sales
     WHERE sale_date BETWEEN $1 AND $2
     GROUP BY DATE(sale_date)
     ORDER BY date DESC`,
    [startDate, endDate],
  )
  return result
}
