import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Card from '../src/components/Card'
import FieldError from '../src/components/FieldError'
import Layout from '../src/components/Layout'
import PromptEditor from '../src/components/PromptEditor'
import TemplateCard from '../src/components/TemplateCard'
import type { PromptTemplate } from '../src/types'

const template: PromptTemplate = {
  id: 7,
  title: 'Шаблон анализа',
  description: 'Описание шаблона',
  category: 'Анализ',
  content: '{{text}}',
  author: 'student@example.com',
  isPublic: true
}

describe('базовые компоненты', () => {
  beforeEach(() => localStorage.clear())

  it('отображает Card и FieldError', () => {
    const { rerender } = render(<><Card>Содержимое</Card><FieldError id="problem">Ошибка</FieldError></>)
    expect(screen.getByText('Содержимое')).toBeVisible()
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'problem')
    rerender(<FieldError id="empty" />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('редактирует промпт и показывает ошибку', async () => {
    function EditorHarness() {
      const [value, setValue] = useState('')
      return <PromptEditor value={value} onChange={setValue} error="Заполните промпт" />
    }
    render(<EditorHarness />)
    const editor = screen.getByLabelText('Текст промпта')
    await userEvent.type(editor, '## Заголовок')
    expect(editor).toHaveValue('## Заголовок')
    expect(screen.getByLabelText('Предпросмотр подсветки')).toHaveTextContent('## Заголовок')
    expect(screen.getByRole('alert')).toHaveTextContent('Заполните промпт')
  })

  it('вызывает действия карточки шаблона', async () => {
    const onCopy = vi.fn()
    const onFavorite = vi.fn()
    render(
      <MemoryRouter>
        <TemplateCard template={template} isFavorite={false} copied={false} onCopy={onCopy} onFavorite={onFavorite} />
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('button', { name: /добавить.*избранное/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Копировать' }))
    expect(onFavorite).toHaveBeenCalledWith(7)
    expect(onCopy).toHaveBeenCalledWith(template)
    expect(screen.getByRole('link', { name: template.title })).toHaveAttribute('href', '/templates/7')
  })

  it('показывает состояние избранного и копирования', () => {
    render(<MemoryRouter><TemplateCard template={template} isFavorite copied onCopy={vi.fn()} onFavorite={vi.fn()} /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /удалить.*избранного/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Скопировано' })).toBeVisible()
  })

  it('Layout показывает вход или кабинет и дочернюю страницу', () => {
    const renderLayout = () => render(
      <MemoryRouter initialEntries={['/']}>
        <Routes><Route path="/" element={<Layout />}><Route index element={<h1>Контент</h1>} /></Route></Routes>
      </MemoryRouter>
    )
    const first = renderLayout()
    expect(screen.getByRole('link', { name: 'Войти' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Контент' })).toBeVisible()
    first.unmount()
    localStorage.setItem('promptLab.loggedIn', 'true')
    renderLayout()
    expect(screen.getByRole('link', { name: 'Кабинет' })).toBeVisible()
  })
})
