import { fallbackTemplates } from '../data/templates'
import type { PromptTemplate } from '../types'
import { getUserEmail, isLoggedIn } from '../utils/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const LOCAL_TEMPLATES_KEY = 'promptLab.templates'
const FAVORITES_KEY = 'promptLab.favorites'
const DELETED_KEY = 'promptLab.deletedTemplates'

class ApiError extends Error {
  constructor(public status: number) {
    super('Сервер отклонил запрос. Проверьте доступ к шаблону.')
  }
}

function isDeleted(id: PromptTemplate['id']): boolean {
  return readJson<string[]>(DELETED_KEY, []).includes(String(id))
}

export function canReadTemplate(template: PromptTemplate): boolean {
  return template.isPublic || (isLoggedIn() && template.author === getUserEmail())
}

export function hasLocalChanges(id: PromptTemplate['id']): boolean {
  return getLocalTemplates().some((item) => String(item.id) === String(id))
}

export function saveMessage(template: PromptTemplate): string {
  return hasLocalChanges(template.id)
    ? 'Сохранено только в этом браузере. Для публикации на сервере нажмите «Отправить на сервер».'
    : 'Шаблон сохранён на сервере.'
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

export function getLocalTemplates(): PromptTemplate[] {
  return readJson<PromptTemplate[]>(LOCAL_TEMPLATES_KEY, [])
}

export function saveLocalTemplate(template: PromptTemplate): void {
  const templates = getLocalTemplates()
  localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify([...templates, template]))
}

export function removeLocalTemplate(id: PromptTemplate['id']): void {
  const templates = getLocalTemplates().filter((template) => String(template.id) !== String(id))
  localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(templates))
}

export function updateLocalTemplate(template: PromptTemplate): void {
  const templates = getLocalTemplates().filter((item) => String(item.id) !== String(template.id))
  localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify([...templates, template]))
}

function mergeTemplates(base: PromptTemplate[], overrides: PromptTemplate[]): PromptTemplate[] {
  const templates = new Map(base.map((template) => [String(template.id), template]))
  overrides.forEach((template) => templates.set(String(template.id), template))
  return [...templates.values()].filter((template) => !isDeleted(template.id))
}

export function getFavoriteIds(): string[] {
  return readJson<string[]>(FAVORITES_KEY, [])
}

export function toggleFavorite(id: PromptTemplate['id']): string[] {
  const current = getFavoriteIds()
  const normalizedId = String(id)
  const next = current.includes(normalizedId)
    ? current.filter((item) => item !== normalizedId)
    : [...current, normalizedId]
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  return next
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...(isLoggedIn() ? { 'X-Demo-User': getUserEmail() } : {}), ...options?.headers },
      signal: controller.signal
    })
    if (!response.ok) throw new ApiError(response.status)
    if (response.status === 204) return undefined as T
    return await response.json() as T
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function getPublicTemplates(): Promise<PromptTemplate[]> {
  const local = getLocalTemplates()
  try {
    const remote = await request<PromptTemplate[]>('/templates')
    return mergeTemplates(remote, local).filter((template) => template.isPublic)
  } catch {
    return mergeTemplates(fallbackTemplates, local).filter((template) => template.isPublic)
  }
}

export async function getUserTemplates(author: string): Promise<PromptTemplate[]> {
  if (!isLoggedIn() || author !== getUserEmail()) return []
  const local = getLocalTemplates().filter((template) => template.author === author)
  try {
    const remote = await request<PromptTemplate[]>(`/templates?author=${encodeURIComponent(author)}`)
    return mergeTemplates(remote, local)
  } catch {
    return local
  }
}

export async function getTemplate(id: string): Promise<PromptTemplate | undefined> {
  if (isDeleted(id)) return undefined
  const local = getLocalTemplates().find((template) => String(template.id) === id)
  if (local) return canReadTemplate(local) ? local : undefined
  const fallback = fallbackTemplates.find((template) => String(template.id) === id)
  try {
    const remote = await request<PromptTemplate>(`/templates/${encodeURIComponent(id)}`)
    return canReadTemplate(remote) ? remote : undefined
  } catch (error) {
    // A real 404/403 must never resurrect a bundled example.
    if (error instanceof ApiError && error.status < 500) return undefined
    return fallback && canReadTemplate(fallback) ? fallback : undefined
  }
}

export async function createTemplate(template: Omit<PromptTemplate, 'id'>): Promise<PromptTemplate> {
  const id = crypto.randomUUID()
  try {
    return await request<PromptTemplate>('/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...template, id: `tpl-${id}` })
    })
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) throw error
    const localTemplate: PromptTemplate = { ...template, id: `local-${id}` }
    saveLocalTemplate(localTemplate)
    return localTemplate
  }
}

export async function updateTemplate(template: PromptTemplate): Promise<PromptTemplate> {
  if (String(template.id).startsWith('local-')) {
    updateLocalTemplate(template)
    return template
  }

  try {
    const updated = await request<PromptTemplate>(`/templates/${encodeURIComponent(String(template.id))}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template)
    })
    removeLocalTemplate(template.id)
    return updated
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) throw error
    updateLocalTemplate(template)
    return template
  }
}

export async function deleteTemplate(id: PromptTemplate['id']): Promise<void> {
  if (String(id).startsWith('local-')) {
    removeLocalTemplate(id)
    return
  }
  try {
    await request(`/templates/${encodeURIComponent(String(id))}`, { method: 'DELETE' })
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      throw new Error('Не удалось удалить шаблон с сервера. Он сохранён; попробуйте ещё раз после восстановления соединения.')
    }
  }
  removeLocalTemplate(id)
  localStorage.setItem(DELETED_KEY, JSON.stringify([...new Set([...readJson<string[]>(DELETED_KEY, []), String(id)])]))
}

// Explicit sync never reports success when only a local copy was saved.
export async function syncTemplate(template: PromptTemplate): Promise<PromptTemplate> {
  const local = String(template.id).startsWith('local-')
  const target = local ? { ...template, id: String(template.id).replace(/^local-/, 'tpl-') } : template
  let saved: PromptTemplate
  try {
    saved = await request<PromptTemplate>(local ? '/templates' : `/templates/${encodeURIComponent(String(target.id))}`, {
      method: local ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(target)
    })
  } catch (error) {
    // Retrying a POST after a lost response uses the same ID, not a duplicate.
    if (!local || !(error instanceof ApiError && error.status === 409)) throw error
    saved = await request<PromptTemplate>(`/templates/${encodeURIComponent(String(target.id))}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(target)
    })
  }
  removeLocalTemplate(template.id)
  return saved
}

export async function getShareUrl(template: PromptTemplate): Promise<string> {
  if (!template.isPublic) throw new Error('Сначала сделайте шаблон публичным в редакторе.')
  if (hasLocalChanges(template.id)) throw new Error('Сначала отправьте изменения на сервер.')
  const remote = await request<PromptTemplate>(`/templates/${encodeURIComponent(String(template.id))}`)
  if (!remote.isPublic) throw new Error('Шаблон на сервере не опубликован.')
  const path = `/templates/${encodeURIComponent(String(remote.id))}`
  if (import.meta.env.MODE === 'pages') {
    const url = new URL(import.meta.env.BASE_URL, window.location.origin)
    url.hash = path
    return url.href
  }
  return new URL(path, window.location.origin).href
}
