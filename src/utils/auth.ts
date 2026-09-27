const LOGIN_KEY = 'promptLab.loggedIn'
const EMAIL_KEY = 'promptLab.userEmail'

export function isLoggedIn(): boolean {
  return localStorage.getItem(LOGIN_KEY) === 'true'
}

export function getUserEmail(): string {
  return localStorage.getItem(EMAIL_KEY) || 'student@example.com'
}

export function login(email: string): void {
  localStorage.setItem(LOGIN_KEY, 'true')
  localStorage.setItem(EMAIL_KEY, email)
}

export function logout(): void {
  localStorage.removeItem(LOGIN_KEY)
  localStorage.removeItem(EMAIL_KEY)
}
