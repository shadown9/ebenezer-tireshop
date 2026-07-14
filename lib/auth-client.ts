import type { User } from "./types"

export async function login(usernameOrEmail: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({ username: usernameOrEmail, password }),
    })

    if (!response.ok) {
      return null
    }

    const result = await response.json()

    return result
  } catch {
    return null
  }
}

export async function logout(token: string): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({ token }),
    })
  } catch {
  }
}

export async function getCurrentUser(token?: string | null): Promise<User | null> {
  try {
    const request = (includeToken: boolean) =>
      fetch("/api/auth/current", {
        headers: includeToken && token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "same-origin",
        cache: "no-store",
      })

    let response = await request(Boolean(token))
    if (!response.ok && token) {
      response = await request(false)
    }

    if (!response.ok) {
      return null
    }

    const { user } = await response.json()
    return user
  } catch {
    return null
  }
}

export async function getCurrentUserWithRetry(token?: string | null, attempts = 2): Promise<User | null> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const user = await getCurrentUser(token)
    if (user) return user

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 350))
    }
  }

  return null
}
