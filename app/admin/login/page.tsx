"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react"
import { getCurrentUser, login } from "@/lib/auth-client"
import Image from "next/image"

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkExistingSession = async () => {
      const token = localStorage.getItem("admin_token")
      const user = await getCurrentUser(token)

      if (user) {
        localStorage.setItem("admin_user", JSON.stringify(user))
        router.push("/admin")
      }
    }

    void checkExistingSession()

    // Initialize default admin via API call instead of direct DB call
    fetch("/api/auth/init").catch(console.error)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    console.log("[v0] Login form submitted")
    console.log("[v0] Username/Email entered:", username)
    console.log("[v0] Password length:", password.length)

    try {
      const result = await login(username, password)
      console.log("[v0] Login result:", result ? "Success" : "Failed")

      if (result) {
        console.log("[v0] User logged in:", result.user.username, result.user.email)
        // Store token in localStorage
        localStorage.setItem("admin_token", result.token)
        localStorage.setItem("admin_user", JSON.stringify(result.user))
        router.push("/admin")
      } else {
        console.log("[v0] Login failed: Invalid credentials or inactive user")
        setError("Usuario o contraseña incorrectos, o cuenta desactivada")
      }
    } catch (error) {
      console.error("[v0] Login error:", error)
      setError("Error al iniciar sesión. Por favor intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-600/5" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <Card className="w-full max-w-md relative bg-[#121212] border-white/10 shadow-2xl">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-16 h-16 mb-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Image src="/logo.png" alt="Logo" fill className="object-contain p-3" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-orange-500" />
              <h1 className="text-2xl font-bold text-white">Admin Access</h1>
            </div>
            <p className="text-sm text-gray-400">Ebenezer Tireshop Management</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">
                Usuario o Email
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario o email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-lg shadow-orange-500/20 transition-all"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="w-3 h-3" />
              <span>Secured with enterprise-grade encryption</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
