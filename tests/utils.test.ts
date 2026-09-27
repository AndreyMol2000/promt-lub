import { beforeEach, describe, expect, it } from 'vitest'
import { getUserEmail, isLoggedIn, login, logout } from '../src/utils/auth'
import { validateLogin, validateTemplate } from '../src/utils/validation'

describe('валидация', () => {
  it('проверяет пустые и некорректные данные входа', () => {
    expect(validateLogin('', '')).toEqual({ email: 'Введите email.', password: 'Введите пароль.' })
    expect(validateLogin('wrong', '123')).toEqual({
      email: 'Введите корректный email.',
      password: 'Пароль должен содержать минимум 6 символов.'
    })
    expect(validateLogin('student@example.com', '123456')).toEqual({})
  })

  it('проверяет все поля шаблона', () => {
    expect(validateTemplate({ title: '', description: '', category: '', content: '' })).toEqual({
      title: expect.any(String), description: expect.any(String), category: expect.any(String), content: expect.any(String)
    })
    expect(validateTemplate({ title: 'Тест', description: 'Достаточное описание', category: 'Анализ', content: 'Достаточно длинный текст промпта' })).toEqual({})
  })
})

describe('auth storage', () => {
  beforeEach(() => localStorage.clear())

  it('входит, читает пользователя и выходит', () => {
    expect(isLoggedIn()).toBe(false)
    expect(getUserEmail()).toBe('student@example.com')
    login('andrey@example.com')
    expect(isLoggedIn()).toBe(true)
    expect(getUserEmail()).toBe('andrey@example.com')
    logout()
    expect(isLoggedIn()).toBe(false)
  })
})
