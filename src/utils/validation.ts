import type { TemplateFormValues } from '../types'

export interface LoginErrors {
  email?: string
  password?: string
}

export function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {}
  if (!email.trim()) errors.email = 'Введите email.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Введите корректный email.'

  if (!password) errors.password = 'Введите пароль.'
  else if (password.length < 6) errors.password = 'Пароль должен содержать минимум 6 символов.'
  return errors
}

export function validateTemplate(values: TemplateFormValues): Partial<Record<keyof TemplateFormValues, string>> {
  const errors: Partial<Record<keyof TemplateFormValues, string>> = {}
  if (values.title.trim().length < 3) errors.title = 'Название должно содержать минимум 3 символа.'
  if (values.description.trim().length < 10) errors.description = 'Описание должно содержать минимум 10 символов.'
  if (!values.category) errors.category = 'Выберите категорию.'
  if (values.content.trim().length < 20) errors.content = 'Промпт должен содержать минимум 20 символов.'
  return errors
}
