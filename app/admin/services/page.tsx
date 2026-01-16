"use client"

import { useState } from "react"
import {
  useServices,
  addService as addServiceToFirebase,
  updateService as updateServiceInFirebase,
  deleteService as deleteServiceFromFirebase,
} from "@/lib/firebase-hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import type { Service } from "@/lib/types"

export default function ServicesPage() {
  const { services, loading } = useServices()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    category: "tire" as "tire" | "mechanic" | "specialty",
    basePrice: 0,
    requiresVehicleInfo: false,
    hasOptions: false,
  })

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      category: "tire",
      basePrice: 0,
      requiresVehicleInfo: false,
      hasOptions: false,
    })
  }

  const handleAdd = async () => {
    if (!formData.name || !formData.id) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    const newService: Service = {
      id: formData.id,
      name: formData.name,
      category: formData.category,
      basePrice: formData.basePrice,
      requiresVehicleInfo: formData.requiresVehicleInfo,
      hasOptions: formData.hasOptions,
    }

    await addServiceToFirebase(newService)
    toast({
      title: "Servicio Agregado",
      description: `${formData.name} ha sido agregado exitosamente`,
    })
    setIsAddOpen(false)
    resetForm()
  }

  const handleEdit = async () => {
    if (!selectedService || !formData.name) return

    const updatedService: Partial<Service> = {
      name: formData.name,
      category: formData.category,
      basePrice: formData.basePrice,
      requiresVehicleInfo: formData.requiresVehicleInfo,
      hasOptions: formData.hasOptions,
    }

    await updateServiceInFirebase(selectedService.id, updatedService)
    toast({
      title: "Servicio Actualizado",
      description: `${formData.name} ha sido actualizado exitosamente`,
    })
    setIsEditOpen(false)
    setSelectedService(null)
    resetForm()
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el servicio "${name}"?`)) {
      await deleteServiceFromFirebase(id)
      toast({
        title: "Servicio Eliminado",
        description: `${name} ha sido eliminado`,
      })
    }
  }

  const openEditDialog = (service: Service) => {
    setSelectedService(service)
    setFormData({
      id: service.id,
      name: service.name,
      category: service.category,
      basePrice: service.basePrice,
      requiresVehicleInfo: service.requiresVehicleInfo,
      hasOptions: service.hasOptions || false,
    })
    setIsEditOpen(true)
  }

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categoryColors = {
    tire: "bg-blue-500",
    mechanic: "bg-orange-500",
    specialty: "bg-purple-500",
  }

  const categoryLabels = {
    tire: "Gomas",
    mechanic: "Mecánica",
    specialty: "Especialidad",
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Servicios</h1>
            <p className="text-sm text-muted-foreground mt-1">Administra los servicios disponibles para tus clientes</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Servicio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Servicio</DialogTitle>
                <DialogDescription>Ingresa los detalles del nuevo servicio</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="service-id">ID del Servicio *</Label>
                  <Input
                    id="service-id"
                    placeholder="ej: oil-change"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-name">Nombre del Servicio *</Label>
                  <Input
                    id="service-name"
                    placeholder="ej: Cambio de Aceite"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tire">Gomas</SelectItem>
                      <SelectItem value="mechanic">Mecánica</SelectItem>
                      <SelectItem value="specialty">Especialidad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio Base ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0"
                    value={formData.basePrice.toString()}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number.parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requires-vehicle"
                    checked={formData.requiresVehicleInfo}
                    onCheckedChange={(checked) => setFormData({ ...formData, requiresVehicleInfo: checked as boolean })}
                  />
                  <Label htmlFor="requires-vehicle" className="text-sm font-normal cursor-pointer">
                    Requiere información del vehículo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-options"
                    checked={formData.hasOptions}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasOptions: checked as boolean })}
                  />
                  <Label htmlFor="has-options" className="text-sm font-normal cursor-pointer">
                    Tiene opciones (ej: 2 o 4 rotores)
                  </Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAddOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleAdd} className="flex-1">
                  Agregar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="tire">Gomas</SelectItem>
                  <SelectItem value="mechanic">Mecánica</SelectItem>
                  <SelectItem value="specialty">Especialidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Servicios</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{services.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Servicios de Gomas</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{services.filter((s) => s.category === "tire").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Servicios Mecánicos</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{services.filter((s) => s.category === "mechanic").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Servicios Especiales</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{services.filter((s) => s.category === "specialty").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Services List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="p-4 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold text-foreground line-clamp-2">{service.name}</CardTitle>
                  <Badge className={`${categoryColors[service.category]} text-white shrink-0`}>
                    {categoryLabels[service.category]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex flex-col flex-1">
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-primary">${service.basePrice}</span>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground mb-4 min-h-[2.5rem]">
                  {service.requiresVehicleInfo && <div>• Requiere info del vehículo</div>}
                  {service.hasOptions && <div>• Tiene opciones disponibles</div>}
                  {!service.requiresVehicleInfo && !service.hasOptions && (
                    <div className="text-transparent">• Placeholder</div>
                  )}
                </div>

                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => openEditDialog(service)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(service.id, service.name)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No se encontraron servicios</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Servicio</DialogTitle>
            <DialogDescription>Modifica los detalles del servicio</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre del Servicio</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tire">Gomas</SelectItem>
                  <SelectItem value="mechanic">Mecánica</SelectItem>
                  <SelectItem value="specialty">Especialidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Precio Base ($)</Label>
              <Input
                id="edit-price"
                type="number"
                value={formData.basePrice.toString()}
                onChange={(e) => setFormData({ ...formData, basePrice: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-requires-vehicle"
                checked={formData.requiresVehicleInfo}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresVehicleInfo: checked as boolean })}
              />
              <Label htmlFor="edit-requires-vehicle" className="text-sm font-normal cursor-pointer">
                Requiere información del vehículo
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-has-options"
                checked={formData.hasOptions}
                onCheckedChange={(checked) => setFormData({ ...formData, hasOptions: checked as boolean })}
              />
              <Label htmlFor="edit-has-options" className="text-sm font-normal cursor-pointer">
                Tiene opciones
              </Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false)
                setSelectedService(null)
                resetForm()
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleEdit} className="flex-1">
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
