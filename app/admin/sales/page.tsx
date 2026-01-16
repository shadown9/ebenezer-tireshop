"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface SaleItem {
  product_name: string
  quantity: number | string
  unit_price: number | string
  total_price: number
}

interface Sale {
  id: string
  sale_date: string
  customer_name?: string
  customer_phone?: string
  sale_items: SaleItem[]
  total_amount: number
  payment_method?: string
  notes?: string
}

export default function SalesPage() {
  const { toast } = useToast()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)

  const [newSale, setNewSale] = useState<Omit<Sale, "id">>({
    sale_date: new Date().toISOString().split("T")[0],
    customer_name: "",
    customer_phone: "",
    sale_items: [{ product_name: "", quantity: 1, unit_price: 0, total_price: 0 }],
    total_amount: 0,
    payment_method: "cash",
    notes: "",
  })

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/sales")
      const data = await response.json()
      setSales(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load sales",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_phone?.includes(searchTerm) ||
      sale.id.includes(searchTerm)
    return matchesSearch
  })

  const handleAddItem = () => {
    setNewSale({
      ...newSale,
      sale_items: [...newSale.sale_items, { product_name: "", quantity: 1, unit_price: 0, total_price: 0 }],
    })
  }

  const handleRemoveItem = (index: number) => {
    const updated = newSale.sale_items.filter((_, i) => i !== index)
    const total = updated.reduce((sum, item) => sum + item.total_price, 0)
    setNewSale({ ...newSale, sale_items: updated, total_amount: total })
  }

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updated = [...newSale.sale_items]
    const item = updated[index]

    if (field === "quantity" || field === "unit_price") {
      item[field as keyof SaleItem] = value
      item.total_price = Number(item.quantity || 0) * Number(item.unit_price || 0)
    } else {
      item[field as keyof SaleItem] = value
    }

    const total = updated.reduce((sum, i) => sum + i.total_price, 0)
    setNewSale({ ...newSale, sale_items: updated, total_amount: total })
  }

  const handleSaveSale = async () => {
    if (newSale.sale_items.some((item) => !item.product_name || Number(item.quantity) <= 0)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all product details",
        variant: "destructive",
      })
      return
    }

    try {
      let response
      if (editingSale) {
        // Update existing sale
        response = await fetch(`/api/sales/${editingSale.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSale),
        })
      } else {
        // Create new sale
        response = await fetch("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSale),
        })
      }

      if (!response.ok) throw new Error("Failed to save sale")

      toast({
        title: editingSale ? "Sale Updated" : "Sale Recorded",
        description: editingSale ? "The sale has been updated successfully" : "New sale has been recorded successfully",
      })

      setIsAddDialogOpen(false)
      setEditingSale(null)
      setNewSale({
        sale_date: new Date().toISOString().split("T")[0],
        customer_name: "",
        customer_phone: "",
        sale_items: [{ product_name: "", quantity: 1, unit_price: 0, total_price: 0 }],
        total_amount: 0,
        payment_method: "cash",
        notes: "",
      })

      await fetchSales()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save sale",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSale = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return

    try {
      const response = await fetch(`/api/sales/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete sale")

      toast({
        title: "Sale Deleted",
        description: "Sale has been removed",
      })

      await fetchSales()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete sale",
        variant: "destructive",
      })
    }
  }

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading sales...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AdminHeader title="Ventas" description="Manage and track all sales transactions" />

      <div className="p-4 sm:p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <CardDescription className="text-2xl font-bold text-foreground mt-2">{sales.length}</CardDescription>
            </CardHeader>
          </Card>
          <Card className="p-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CardDescription className="text-2xl font-bold text-foreground mt-2">
                ${totalRevenue.toFixed(2)}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="p-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
              <CardDescription className="text-2xl font-bold text-foreground mt-2">
                ${sales.length > 0 ? (Number(totalRevenue) / sales.length).toFixed(2) : "0.00"}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name, phone, or sale ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" />
            Record Sale
          </Button>
        </div>

        {/* Add Sale Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) {
            setEditingSale(null)
            setNewSale({
              sale_date: new Date().toISOString().split("T")[0],
              customer_name: "",
              customer_phone: "",
              sale_items: [{ product_name: "", quantity: 1, unit_price: 0, total_price: 0 }],
              total_amount: 0,
              payment_method: "cash",
              notes: "",
            })
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSale ? "Edit Sale" : "Record New Sale"}</DialogTitle>
              <DialogDescription>{editingSale ? "Update sale details" : "Enter sale details and items"}</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sale-date">Sale Date</Label>
                <Input
                  id="sale-date"
                  type="date"
                  value={newSale.sale_date}
                  onChange={(e) => setNewSale({ ...newSale, sale_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select
                  value={newSale.payment_method}
                  onValueChange={(val) => setNewSale({ ...newSale, payment_method: val })}
                >
                  <SelectTrigger id="payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="debit">Debit Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="customer-name">Customer Name (Optional)</Label>
                <Input
                  id="customer-name"
                  value={newSale.customer_name}
                  onChange={(e) => setNewSale({ ...newSale, customer_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="customer-phone">Customer Phone (Optional)</Label>
                <Input
                  id="customer-phone"
                  value={newSale.customer_phone}
                  onChange={(e) => setNewSale({ ...newSale, customer_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Sale Items</Label>
                <div className="space-y-3 border rounded p-3 bg-muted/50">
                  <div className="grid grid-cols-12 gap-2 mb-2 px-1 text-xs font-medium text-muted-foreground">
                    <div className="col-span-5">Product / Service</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">Unit Cost ($)</div>
                    <div className="col-span-2 text-right">Total</div>
                    <div className="col-span-1"></div>
                  </div>

                  {newSale.sale_items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Input
                          placeholder="e.g. New Tire"
                          value={item.product_name}
                          onChange={(e) => handleUpdateItem(index, "product_name", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.quantity}
                          min="1"
                          onChange={(e) => handleUpdateItem(index, "quantity", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={item.unit_price}
                          min="0"
                          step="0.01"
                          onChange={(e) => handleUpdateItem(index, "unit_price", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2 text-sm font-medium text-right text-foreground">
                        ${item.total_price.toFixed(2)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    className="w-full bg-background hover:bg-muted"
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Add Item
                  </Button>
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={newSale.notes}
                  onChange={(e) => setNewSale({ ...newSale, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  className="h-20"
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Amount:</p>
                <p className="text-2xl font-bold text-foreground">${newSale.total_amount.toFixed(2)}</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSale}>{editingSale ? "Update Sale" : "Record Sale"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sales Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Date</TableHead>
                  <TableHead className="min-w-[150px]">Customer</TableHead>
                  <TableHead className="min-w-[100px]">Items</TableHead>
                  <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                  <TableHead className="min-w-[100px]">Payment</TableHead>
                  <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium text-foreground">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-foreground">{sale.customer_name || "Walk-in"}</TableCell>
                    <TableCell className="text-foreground">
                      <div className="flex flex-col gap-0.5">
                        {sale.sale_items.map((item, i) => (
                          <span key={i} className="text-sm">
                            {item.product_name} <span className="text-muted-foreground text-xs">x{item.quantity}</span>
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      ${Number(sale.total_amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="capitalize text-foreground">{sale.payment_method || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => {
                            setEditingSale(sale)
                            setNewSale({
                              sale_date: new Date(sale.sale_date).toISOString().split("T")[0],
                              customer_name: sale.customer_name || "",
                              customer_phone: sale.customer_phone || "",
                              sale_items: sale.sale_items, // assuming structure matches
                              total_amount: Number(sale.total_amount),
                              payment_method: sale.payment_method || "cash",
                              notes: sale.notes || "",
                            })
                            setIsAddDialogOpen(true)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                          onClick={() => handleDeleteSale(sale.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredSales.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p>No sales found. Start recording sales to see them here.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
