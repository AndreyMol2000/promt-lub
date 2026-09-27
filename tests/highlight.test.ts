import { describe, expect, it } from 'vitest'
import { highlightPrompt } from '../src/utils/highlight'

describe('highlightPrompt', () => {
  it('подсвечивает переменные', () => {
    expect(highlightPrompt('Привет {{name}}')).toContain('class="token variable"')
  })

  it('подсвечивает заголовки', () => {
    expect(highlightPrompt('## Заголовок')).toContain('class="token heading"')
  })

  it('экранирует HTML', () => {
    expect(highlightPrompt('<script>')).not.toContain('<script>')
  })

  it('подсвечивает все конструкции синтаксиса без вложенной разметки', () => {
    const result = highlightPrompt('`code` <tag> +++Format "key": "value" IMPORTANT → ∈\n—')
    expect(result).toContain('token code')
    expect(result).toContain('token xml')
    expect(result).toContain('token decorator')
    expect(result).toContain('token json')
    expect(result).toContain('token caps')
    expect(result).toContain('token symbol')
    expect(result).toContain('token separator')
  })

  it('экранирует кавычки и амперсанд', () => {
    expect(highlightPrompt("Tom & 'Jerry'")).toBe('Tom &amp; &#039;Jerry&#039;')
  })
})
