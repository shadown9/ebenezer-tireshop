"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useTires,
  updateTire,
  addTire as addTireToFirebase,
  deleteTire as deleteTireFromFirebase,
} from "@/lib/firebase-hooks"
import { Plus, Minus, Search, AlertTriangle, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
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
import type { Tire, TireCondition } from "@/lib/types"
import { notificationHelpers } from "@/lib/notification-system"

export default function InventoryPage() {
  const { tires, loading } = useTires()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [conditionFilter, setConditionFilter] = useState<"all" | "New" | "Used">("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingTire, setDeletingTire] = useState<{ id: string; brand: string } | null>(null)
  const [editingTire, setEditingTire] = useState<Tire | null>(null)

  const [newTire, setNewTire] = useState<Omit<Tire, "id">>({
    brand: "",
    width: 205,
    ratio: 55,
    diameter: 16,
    condition: "New",
    quantity: 0,
    price: 0,
    costPrice: 0,
    image: "",
    type: "tire",
  })

  const filteredTires = tires.filter((tire) => {
    const isPart = tire.type === 'part'
    const nameToSearch = isPart ? tire.brand : `${tire.brand} ${tire.width}/${tire.ratio}R${tire.diameter}`

    const matchesSearch = nameToSearch.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCondition = conditionFilter === "all" || tire.condition === conditionFilter

    return matchesSearch && matchesCondition
  })

  const lowStockCount = tires.filter((tire) => tire.quantity < 4).length

  const handleQuickSale = async (tireId: string) => {
    const tire = tires.find((t) => t.id === tireId)
    if (!tire) return

    const currentQuantity = tire.quantity
    if (currentQuantity > 0) {
      const newQuantity = currentQuantity - 1
      await updateTire(tireId, { quantity: newQuantity })

      if (newQuantity < 4) {
        notificationHelpers.lowInventory(
          tire.id,
          tire.type === 'part' ? tire.brand : `${tire.brand} ${tire.width}/${tire.ratio}R${tire.diameter}`,
          newQuantity,
        )
      }

      toast({
        title: "Quick Sale",
        description: "Quantity decreased by 1",
      })
    } else {
      toast({
        title: "Out of Stock",
        description: "Cannot decrease quantity below 0",
        variant: "destructive",
      })
    }
  }

  const handleAddStock = async (tireId: string, currentQuantity: number) => {
    await updateTire(tireId, { quantity: currentQuantity + 1 })
    toast({
      title: "Stock Added",
      description: "Quantity increased by 1",
    })
  }

  const handleAddNewTire = async () => {
    if (!newTire.brand || newTire.price <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Ensure numeric values for parts if they were hidden/ignored
    const itemToAdd = {
      ...newTire,
      width: newTire.type === 'part' ? 0 : newTire.width,
      ratio: newTire.type === 'part' ? 0 : newTire.ratio,
      diameter: newTire.type === 'part' ? 0 : newTire.diameter,
    }

    await addTireToFirebase(itemToAdd)
    setIsAddDialogOpen(false)
    setNewTire({
      brand: "",
      width: 205,
      ratio: 55,
      diameter: 16,
      condition: "New",
      quantity: 0,
      price: 0,
      costPrice: 0,
      image: "",
      type: "tire",
    })

    toast({
      title: "Item Added",
      description: "New item has been added to inventory",
    })
  }

  const handleEditTire = async () => {
    if (!editingTire || !editingTire.brand || editingTire.price <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const { id, ...updates } = editingTire
    await updateTire(id, updates)

    setIsEditDialogOpen(false)
    setEditingTire(null)

    toast({
      title: "Item Updated",
      description: "Item information has been updated",
    })
  }

  const openDeleteDialog = (tireId: string, brand: string) => {
    setDeletingTire({ id: tireId, brand })
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteTire = async () => {
    if (!deletingTire) return
    try {
      await deleteTireFromFirebase(deletingTire.id)
      toast({
        title: "Eliminado",
        description: `${deletingTire.brand} ha sido eliminado del inventario`,
      })
    } catch (error) {
      console.error("Error deleting:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setDeletingTire(null)
    }
  }

  const handleImageUpload = (file: File, isEdit = false) => {
    // Validar tamaño del archivo (máximo 500KB)
    if (file.size > 500000) {
      toast({
        title: "Imagen muy grande",
        description: "La imagen debe ser menor a 500KB. Por favor elige una imagen más pequeña.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string

      // Validar tamaño del base64 (Firebase limite ~1MB)
      if (base64String.length > 900000) {
        toast({
          title: "Imagen muy grande",
          description: "La imagen es demasiado grande para guardar. Por favor usa una imagen más pequeña.",
          variant: "destructive",
        })
        return
      }

      if (isEdit && editingTire) {
        setEditingTire({ ...editingTire, image: base64String })
      } else {
        setNewTire({ ...newTire, image: base64String })
      }
      toast({
        title: "Imagen Cargada",
        description: "La imagen se ha agregado correctamente",
      })
    }
    reader.onerror = () => {
      toast({
        title: "Error al Cargar",
        description: "No se pudo cargar la imagen. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading inventory...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Alert Banner for Low Stock */}
        {lowStockCount > 0 && (
          <Card className="p-4 mb-6 border-destructive/50 bg-destructive/5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-semibold text-foreground">Low Stock Alert</p>
                <p className="text-sm text-muted-foreground">
                  {lowStockCount} items below minimum stock level (4 units)
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Search and Actions */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por marca, nombre o medida..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={conditionFilter} onValueChange={(value: any) => setConditionFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las condiciones</SelectItem>
                <SelectItem value="New">Nueva</SelectItem>
                <SelectItem value="Used">Usada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Inventario
          </Button>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Ítem</DialogTitle>
              <DialogDescription>Ingrese los detalles del producto para agregar al inventario</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              {/* TYPE SELECTOR */}
              <div className="space-y-2 col-span-full">
                <Label>Tipo de Producto</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={newTire.type === 'tire' ? 'default' : 'outline'}
                    onClick={() => setNewTire({ ...newTire, type: 'tire' })}
                    className="flex-1"
                  >
                    Neumático
                  </Button>
                  <Button
                    type="button"
                    variant={newTire.type === 'part' ? 'default' : 'outline'}
                    onClick={() => setNewTire({ ...newTire, type: 'part' })}
                    className="flex-1"
                  >
                    Parte / Repuesto
                  </Button>
                </div>
              </div>

              {/* Image upload removed - products will use default icons */}

              <div className="space-y-2 col-span-full">
                <Label>{newTire.type === 'tire' ? 'Marca' : 'Nombre del Producto'}</Label>
                <Input
                  id="brand"
                  value={newTire.brand}
                  onChange={(e) => setNewTire({ ...newTire, brand: e.target.value })}
                  placeholder={newTire.type === 'tire' ? "Michelin, Goodyear, etc." : "Ej: Filtro de Aceite, Batería..."}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condición</Label>
                <Select
                  value={newTire.condition}
                  onValueChange={(val) => setNewTire({ ...newTire, condition: val as TireCondition })}
                >
                  <SelectTrigger id="condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">Nuevo</SelectItem>
                    <SelectItem value="Used">Usado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newTire.type === 'tire' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="width">Ancho (Width)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={newTire.width.toString()}
                      onChange={(e) => setNewTire({ ...newTire, width: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ratio">Perfil (Ratio)</Label>
                    <Input
                      id="ratio"
                      type="number"
                      value={newTire.ratio.toString()}
                      onChange={(e) => setNewTire({ ...newTire, ratio: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diameter">Diámetro (Rim)</Label>
                    <Input
                      id="diameter"
                      type="number"
                      value={newTire.diameter.toString()}
                      onChange={(e) => setNewTire({ ...newTire, diameter: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newTire.quantity.toString()}
                  onChange={(e) => setNewTire({ ...newTire, quantity: Number.parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio Venta ($)</Label>
                <Input
                  id="price"
                  type="number"
                  value={newTire.price.toString()}
                  onChange={(e) => setNewTire({ ...newTire, price: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice" className="text-slate-600">Precio Costo ($)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={newTire.costPrice?.toString() || "0"}
                  onChange={(e) => setNewTire({ ...newTire, costPrice: Number.parseFloat(e.target.value) || 0 })}
                  className="bg-slate-50"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddNewTire}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Ítem</DialogTitle>
              <DialogDescription>Actualizar información del inventario</DialogDescription>
            </DialogHeader>

            {editingTire && (
              <div className="grid grid-cols-2 gap-4 py-4">

                {/* No type editing for now to avoid complexity, assume type is set */}

                {/* Image upload removed from edit dialog */}

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-brand">{editingTire.type === 'part' ? 'Nombre del Producto' : 'Marca'}</Label>
                  <Input
                    id="edit-brand"
                    value={editingTire.brand}
                    onChange={(e) => setEditingTire({ ...editingTire, brand: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-condition">Condición</Label>
                  <Select
                    value={editingTire.condition}
                    onValueChange={(val) => setEditingTire({ ...editingTire, condition: val as TireCondition })}
                  >
                    <SelectTrigger id="edit-condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">Nuevo</SelectItem>
                      <SelectItem value="Used">Usado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(editingTire.type !== 'part') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit-width">Ancho</Label>
                      <Input
                        id="edit-width"
                        type="number"
                        value={editingTire.width.toString()}
                        onChange={(e) => setEditingTire({ ...editingTire, width: Number.parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-ratio">Perfil</Label>
                      <Input
                        id="edit-ratio"
                        type="number"
                        value={editingTire.ratio.toString()}
                        onChange={(e) => setEditingTire({ ...editingTire, ratio: Number.parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-diameter">Diámetro</Label>
                      <Input
                        id="edit-diameter"
                        type="number"
                        value={editingTire.diameter.toString()}
                        onChange={(e) => setEditingTire({ ...editingTire, diameter: Number.parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Cantidad</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    value={editingTire.quantity.toString()}
                    onChange={(e) => setEditingTire({ ...editingTire, quantity: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-price">Precio Venta ($)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editingTire.price.toString()}
                    onChange={(e) => setEditingTire({ ...editingTire, price: Number.parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-costPrice" className="text-slate-600">Precio Costo ($)</Label>
                  <Input
                    id="edit-costPrice"
                    type="number"
                    value={editingTire.costPrice?.toString() || "0"}
                    onChange={(e) => setEditingTire({ ...editingTire, costPrice: Number.parseFloat(e.target.value) || 0 })}
                    className="bg-slate-50"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditTire}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Inventory Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 sm:w-20">Img</TableHead>
                  <TableHead className="min-w-[120px]">Producto / Marca</TableHead>
                  <TableHead className="min-w-[100px]">Medida / Info</TableHead>
                  <TableHead className="min-w-[90px]">Cond.</TableHead>
                  <TableHead className="text-right min-w-[80px]">Cant.</TableHead>
                  <TableHead className="text-right min-w-[70px]">Precio</TableHead>
                  <TableHead className="text-right min-w-[180px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTires.map((tire) => {
                  const isLowStock = tire.quantity < 4
                  const isPart = tire.type === 'part'

                  return (
                    <TableRow
                      key={tire.id}
                      className={isLowStock ? "bg-destructive/5 border-l-4 border-l-destructive" : ""}
                    >
                      <TableCell>
                        {tire.image ? (
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden shadow-sm">
                            <Image
                              src={tire.image}
                              alt={tire.brand}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className="h-12 w-12 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-md"
                            style={{
                              background: `linear-gradient(135deg, ${['#f97316', '#8b5cf6', '#06b6d4', '#10b981', '#f43f5e', '#3b82f6', '#eab308'][
                                tire.brand.charCodeAt(0) % 7
                              ]
                                } 0%, ${['#ea580c', '#7c3aed', '#0891b2', '#059669', '#e11d48', '#2563eb', '#ca8a04'][
                                tire.brand.charCodeAt(0) % 7
                                ]
                                } 100%)`
                            }}
                          >
                            {tire.brand.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{tire.brand}</TableCell>
                      <TableCell className="font-mono text-sm text-foreground">
                        {isPart ? <Badge variant="outline">Repuesto</Badge> : `${tire.width}/${tire.ratio}R${tire.diameter}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tire.condition === "New" ? "default" : "secondary"} className="capitalize">
                          {tire.condition === 'New' ? 'Nuevo' : 'Usado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isLowStock && <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />}
                          <span className={`font-medium ${isLowStock ? "text-destructive" : "text-foreground"}`}>
                            {tire.quantity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">${tire.price}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => handleAddStock(tire.id, tire.quantity)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => handleQuickSale(tire.id)}
                            disabled={tire.quantity === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => {
                              setEditingTire(tire)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                            onClick={() => openDeleteDialog(tire.id, tire.brand)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredTires.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p>No se encontraron ítems.</p>
            </div>
          )}
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <Card className="p-4">
            <CardHeader>
              <CardTitle>Total Modelos</CardTitle>
              <CardDescription>{tires.length}</CardDescription>
            </CardHeader>
          </Card>
          <Card className="p-4">
            <CardHeader>
              <CardTitle>Unidades Totales</CardTitle>
              <CardDescription>{tires.reduce((sum, tire) => sum + tire.quantity, 0)}</CardDescription>
            </CardHeader>
          </Card>
          <Card className="p-4">
            <CardHeader>
              <CardTitle>Bajo Stock</CardTitle>
              <CardDescription className="text-destructive">{lowStockCount}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div >

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar <strong>{deletingTire?.brand}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTire}>
              Sí, Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
