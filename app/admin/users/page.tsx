"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { UserPlus, Search, Shield, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import type { User, UserRole } from "@/lib/types"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "employee" as UserRole,
    phone: "",
    isActive: true,
  })

  const currentUser = JSON.parse(localStorage.getItem("admin_user") || "{}")

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("admin_token")

      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to load users")
      }

      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Error al cargar los usuarios")
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!formData.name || !formData.username || !formData.password) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    try {
      const token = localStorage.getItem("admin_token")

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Error al crear el usuario")
        return
      }

      toast.success("Usuario creado exitosamente")
      setIsAddDialogOpen(false)
      resetForm()
      loadUsers()
    } catch (error) {
      console.error("Error adding user:", error)
      toast.error("Error al crear el usuario")
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      const token = localStorage.getItem("admin_token")

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...selectedUser,
          ...formData,
          password: formData.password || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Error al actualizar el usuario")
        return
      }

      toast.success("Usuario actualizado exitosamente")
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      resetForm()
      loadUsers()
    } catch (error) {
      console.error("Error editing user:", error)
      toast.error("Error al actualizar el usuario")
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${user.name}?`)) return

    try {
      const token = localStorage.getItem("admin_token")

      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Error al eliminar el usuario")
        return
      }

      toast.success("Usuario eliminado exitosamente")
      loadUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Error al eliminar el usuario")
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      const token = localStorage.getItem("admin_token")

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...user,
          isActive: !user.isActive,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Error al actualizar el usuario")
        return
      }

      toast.success(`Usuario ${!user.isActive ? "activado" : "desactivado"} exitosamente`)
      loadUsers()
    } catch (error) {
      console.error("Error toggling user active:", error)
      toast.error("Error al actualizar el usuario")
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      password: "",
      role: user.role,
      phone: user.phone || "",
      isActive: user.isActive,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      username: "",
      password: "",
      role: "employee",
      phone: "",
      isActive: true,
    })
    setShowPassword(false)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getRoleBadge = (role: UserRole) => {
    const variants = {
      admin: "destructive" as const,
      manager: "default" as const,
      employee: "secondary" as const,
    }
    const names = {
      admin: "Administrador",
      manager: "Gerente",
      employee: "Empleado",
    }
    return <Badge variant={variants[role]}>{names[role]}</Badge>
  }

  return (
    <div>
      <AdminHeader title="Gestión de Usuarios" description="Administra usuarios, roles y permisos del sistema" />

      <div className="p-6">
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Roles y Permisos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Badge variant="destructive" className="mb-2">
                  Administrador
                </Badge>
                <p className="text-muted-foreground">
                  Acceso completo a todas las funciones y configuraciones del sistema
                </p>
              </div>
              <div>
                <Badge variant="default" className="mb-2">
                  Gerente
                </Badge>
                <p className="text-muted-foreground">
                  Gestión de operaciones diarias, inventario y personal. No puede modificar configuraciones críticas.
                </p>
              </div>
              <div>
                <Badge variant="secondary" className="mb-2">
                  Empleado
                </Badge>
                <p className="text-muted-foreground">
                  Gestión de citas y acceso básico al sistema. Sin acceso a inventario o configuraciones.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Usuarios</p>
                  <p className="text-3xl font-bold">{users.length}</p>
                </div>
                <Shield className="h-10 w-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuarios Activos</p>
                  <p className="text-3xl font-bold text-green-600">{users.filter((u) => u.isActive).length}</p>
                </div>
                <Shield className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Administradores</p>
                  <p className="text-3xl font-bold text-orange-600">{users.filter((u) => u.role === "admin").length}</p>
                </div>
                <Shield className="h-10 w-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Agregar Usuario
          </Button>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Nunca"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleActive(user)}>
                          {user.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        {currentUser.id !== user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
            <DialogDescription>Crea una nueva cuenta de usuario en el sistema</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Empleado</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddUser}>Crear Usuario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Actualiza la información del usuario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre Completo</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-username">Usuario</Label>
                <Input id="edit-username" value={formData.username} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Dejar en blanco para mantener actual"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Empleado</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditUser}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
