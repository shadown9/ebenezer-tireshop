import type { User } from "./types"

export async function login(usernameOrEmail: string, password: string): Promise<{ user: User; token: string } | null> {


  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: usernameOrEmail, password }),
    })

    if (!response.ok) {

      return null
    }

    const result = await response.json()

    return result
  } catch (error) {

    return null
  }
}

export async function logout(token: string): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
  } catch (error) {

  }
}

export async function getCurrentUser(token: string): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/current", {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      return null
    }

    const { user } = await response.json()
    return user
  } catch (error) {

    return null
  }
}
