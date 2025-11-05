export function getCurrentUser() {
  if (typeof window === "undefined") return null
  const user = localStorage.getItem("currentUser")
  return user ? JSON.parse(user) : null
}

export function setCurrentUser(user: { id: string; username: string } | null) {
  if (typeof window === "undefined") return
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user))
  } else {
    localStorage.removeItem("currentUser")
  }
}

export function isAuthenticated() {
  return getCurrentUser() !== null
}
