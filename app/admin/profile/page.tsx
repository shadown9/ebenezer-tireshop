"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Shield, Bell, Lock, SettingsIcon } from "lucide-react"
import type { User, UserPreferences } from "@/lib/types"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Password change form
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  // Profile form
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        router.push("/admin/login")
        return
      }

      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to load profile")
      }

      const data = await response.json()

      setUser(data.user)
      setName(data.user.name)
      setEmail(data.user.email)
      setPhone(data.user.phone || "")
      setPreferences(data.preferences)
    } catch (error) {
      console.error("Error loading user data:", error)
      toast.error("Error al cargar los datos del usuario")
      router.push("/admin/login")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    if (newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (!user) return

    setChangingPassword(true)

    try {
      const token = localStorage.getItem("admin_token")

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "password",
          data: { currentPassword, newPassword },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Error al cambiar la contraseña")
        return
      }

      toast.success("Contraseña actualizada exitosamente")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Error al cambiar la contraseña")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    setSavingProfile(true)

    try {
      const token = localStorage.getItem("admin_token")

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "profile",
          data: { name, email, phone },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Error al actualizar el perfil")
        return
      }

      setUser(data.user)
      localStorage.setItem("admin_user", JSON.stringify(data.user))

      toast.success("Perfil actualizado exitosamente")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Error al actualizar el perfil")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleUpdatePreferences = async () => {
    if (!preferences || !user) return

    setSaving(true)

    try {
      const token = localStorage.getItem("admin_token")

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "preferences",
          data: preferences,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Error al actualizar las preferencias")
        return
      }

      toast.success("Preferencias actualizadas exitosamente")
    } catch (error) {
      console.error("Error updating preferences:", error)
      toast.error("Error al actualizar las preferencias")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (!user || !preferences) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Mi Perfil" description="Gestiona tu información personal y preferencias" />

      <div className="p-6 max-w-4xl mx-auto">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <Shield className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="h-4 w-4 mr-2" />
              Seguridad
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Preferencias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Actualiza tu información de perfil</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre Completo</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Usuario</Label>
                      <Input id="username" value={user.username} disabled className="bg-gray-100" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (787) 123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Rol</Label>
                      <Input
                        id="role"
                        value={
                          user.role === "admin" ? "Administrador" : user.role === "manager" ? "Gerente" : "Empleado"
                        }
                        disabled
                        className="bg-gray-100 capitalize"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={savingProfile}>
                      {savingProfile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar Cambios"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Cambiar Contraseña</CardTitle>
                <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Contraseña Actual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Tu contraseña actual"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={changingPassword}>
                      {changingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cambiando...
                        </>
                      ) : (
                        "Cambiar Contraseña"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Preferencias de Notificación</CardTitle>
                <CardDescription>Gestiona cómo recibes las notificaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-gray-500">Recibe actualizaciones importantes por correo electrónico</p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, emailNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por SMS</Label>
                    <p className="text-sm text-gray-500">Recibe alertas urgentes por mensaje de texto</p>
                  </div>
                  <Switch
                    checked={preferences.smsNotifications}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, smsNotifications: checked })}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleUpdatePreferences} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Preferencias"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferencias del Sistema</CardTitle>
                <CardDescription>Personaliza tu experiencia en el panel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Tema</Label>
                  <Select
                    value={preferences.theme}
                    onValueChange={(value: "light" | "dark" | "system") =>
                      setPreferences({ ...preferences, theme: value })
                    }
                  >
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Oscuro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value: "es" | "en") => setPreferences({ ...preferences, language: value })}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Puerto_Rico">Puerto Rico (AST)</SelectItem>
                      <SelectItem value="America/New_York">New York (EST)</SelectItem>
                      <SelectItem value="America/Chicago">Chicago (CST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Los Angeles (PST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
                  <Select
                    value={preferences.sessionTimeout.toString()}
                    onValueChange={(value) =>
                      setPreferences({ ...preferences, sessionTimeout: Number.parseInt(value) })
                    }
                  >
                    <SelectTrigger id="sessionTimeout">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="240">4 horas</SelectItem>
                      <SelectItem value="480">8 horas</SelectItem>
                      <SelectItem value="1440">24 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleUpdatePreferences} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Preferencias"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
