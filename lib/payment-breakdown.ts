import type { Sale } from "@/lib/types"

export type PaymentBreakdown = {
  cash?: number
  card?: number
  transfer?: number
}

export const paymentMethods = ["cash", "card", "transfer"] as const

export function getSalePaymentBreakdown(sale: Pick<Sale, "payment_method" | "payment_breakdown" | "total_amount">) {
  const total = Number(sale.total_amount || 0)
  const saved = sale.payment_breakdown

  if (saved) {
    return paymentMethods.reduce<Record<(typeof paymentMethods)[number], number>>((result, method) => {
      result[method] = Math.max(0, Number(saved[method] || 0))
      return result
    }, { cash: 0, card: 0, transfer: 0 })
  }

  return {
    cash: sale.payment_method === "cash" ? total : 0,
    card: sale.payment_method === "card" ? total : 0,
    transfer: sale.payment_method === "transfer" ? total : 0,
  }
}
