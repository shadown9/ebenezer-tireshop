"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Shield, FileText, Activity } from "lucide-react"
import { toast } from "sonner"
import type { AuditLog } from "@/lib/types"

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterAction, setFilterAction] = useState<string>("all")
  const [filterResource, setFilterResource] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      const token = localStorage.getItem("admin_token")

      if (!token) {
        return
      }

      const response = await fetch("/api/audit", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to load audit logs")
      }

      const data = await response.json()
      setLogs(data.logs)
    } catch (error) {
      console.error("Error loading audit logs:", error)
      toast.error("Error al cargar los registros de auditoría")
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesAction = filterAction === "all" || log.action === filterAction
    const matchesResource = filterResource === "all" || log.resource === filterResource

    return matchesSearch && matchesAction && matchesResource
  })

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      login: "default",
      logout: "secondary",
      create: "default",
      update: "default",
      delete: "destructive",
    }
    return <Badge variant={variants[action] || "secondary"}>{action}</Badge>
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      admin: "destructive",
      manager: "default",
      employee: "secondary",
    }
    return <Badge variant={variants[role] || "secondary"}>{role}</Badge>
  }

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)))
  const uniqueResources = Array.from(new Set(logs.map((log) => log.resource)))

  return (
    <div>
      <AdminHeader
        title="Registro de Auditoría"
        description="Historial completo de actividad del sistema para control anti-fraude"
      />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Eventos</p>
                  <p className="text-3xl font-bold">{logs.length}</p>
                </div>
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hoy</p>
                  <p className="text-3xl font-bold">
                    {logs.filter((log) => new Date(log.timestamp).toDateString() === new Date().toDateString()).length}
                  </p>
                </div>
                <Activity className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuarios Únicos</p>
                  <p className="text-3xl font-bold">{new Set(logs.map((log) => log.userId)).size}</p>
                </div>
                <Shield className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en registros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Todas las acciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las acciones</SelectItem>
              {uniqueActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterResource} onValueChange={setFilterResource}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Todos los recursos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los recursos</SelectItem>
              {uniqueResources.map((resource) => (
                <SelectItem key={resource} value={resource}>
                  {resource}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Audit Log Table */}
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{log.userName}</TableCell>
                      <TableCell>{getRoleBadge(log.userRole)}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.resource}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate text-sm text-muted-foreground">{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
