import type { User } from "./types"

export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await fetch("/api/users")
    if (!response.ok) return []
    const { users } = await response.json()
    return users
  } catch (error) {

    return []
  }
}

export async function addUser(user: User): Promise<void> {
  await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  })
}

export async function updateUser(user: User): Promise<void> {
  await fetch("/api/users", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  })
}

export async function deleteUser(id: string): Promise<void> {
  await fetch(`/api/users?id=${id}`, {
    method: "DELETE",
  })
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "gomerapro_salt_2025")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function logAction(
  userId: string,
  userName: string,
  userRole: "admin" | "manager" | "employee",
  action: string,
  resource: string,
  resourceId?: string,
  details?: string,
): Promise<void> {
  // Will be implemented with audit log API

}

export function deleteUserSessions(userId: string): void {
  // Sessions are handled server-side now

}
