import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import HomePage from '../src/pages/HomePage'
import LearnPage from '../src/pages/LearnPage'
import TechniquePage from '../src/pages/TechniquePage'
import LoginPage from '../src/pages/LoginPage'
import CreateTemplatePage from '../src/pages/CreateTemplatePage'
import EditTemplatePage from '../src/pages/EditTemplatePage'
import DashboardPage from '../src/pages/DashboardPage'
import TemplatesPage from '../src/pages/TemplatesPage'
import TemplatePage from '../src/pages/TemplatePage'
import NotFoundPage from '../src/pages/NotFoundPage'
import App from '../src/App'
import type { PromptTemplate } from '../src/types'

const serviceMocks = vi.hoisted(() => ({
  getPublicTemplates: vi.fn(),
  getUserTemplates: vi.fn(),
  getTemplate: vi.fn(),
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  saveMessage: vi.fn(),
  canReadTemplate: vi.fn(),
  hasLocalChanges: vi.fn(),
  getShareUrl: vi.fn(),
  syncTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  getFavoriteIds: vi.fn(),
  toggleFavorite: vi.fn()
}))

vi.mock('../src/services/templatesService', () => serviceMocks)

const sample: PromptTemplate = {
  id: 1,
  title: 'Анализ текста',
  description: 'Понятное описание шаблона анализа',
  category: 'Анализ',
  content: '## Анализ\nПроанализируй {{text}} → верни JSON',
  author: 'student@example.com',
  isPublic: true,
  createdAt: '2026-05-20T12:00:00.000Z'
}

function route(element: React.ReactNode, initial = '/', path = '*', extras?: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path={path} element={element} />
        {extras}
      </Routes>
    </MemoryRouter>
  )
}

describe('страницы', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    serviceMocks.getPublicTemplates.mockResolvedValue([sample])
    serviceMocks.getUserTemplates.mockResolvedValue([sample])
    serviceMocks.getTemplate.mockResolvedValue(sample)
    serviceMocks.createTemplate.mockResolvedValue(sample)
    serviceMocks.updateTemplate.mockResolvedValue(sample)
    serviceMocks.saveMessage.mockReturnValue('Шаблон сохранён на сервере.')
    serviceMocks.canReadTemplate.mockReturnValue(true)
    serviceMocks.hasLocalChanges.mockReturnValue(false)
    serviceMocks.getShareUrl.mockResolvedValue('http://localhost/templates/1')
    serviceMocks.syncTemplate.mockResolvedValue(sample)
    serviceMocks.deleteTemplate.mockResolvedValue(undefined)
    serviceMocks.getFavoriteIds.mockReturnValue([])
    serviceMocks.toggleFavorite.mockReturnValue(['1'])
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) }
    })
  })

  it('показывает главную страницу, каталог техник и 404', () => {
    const home = route(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Промпты')
    home.unmount()
    const learn = route(<LearnPage />)
    expect(screen.getAllByRole('article')).toHaveLength(6)
    learn.unmount()
    route(<NotFoundPage />)
    expect(screen.getByText('404')).toBeVisible()
  })

  it('открывает существующую технику', () => {
    route(<TechniquePage />, '/learn/zero-shot', '/learn/:id')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Zero-shot')
    expect(screen.getByRole('heading', { name: 'Преимущества' })).toBeVisible()
  })

  it('показывает ошибку для неизвестной техники', () => {
    route(<TechniquePage />, '/learn/missing', '/learn/:id')
    expect(screen.getByRole('heading', { name: 'Техника не найдена' })).toBeVisible()
  })

  it('валидирует вход и авторизует пользователя', async () => {
    route(
      <LoginPage />,
      '/login',
      '/login',
      <Route path="/dashboard" element={<h1>Кабинет открыт</h1>} />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))
    expect(screen.getAllByRole('alert')).toHaveLength(2)
    await userEvent.type(screen.getByLabelText('Email'), 'student@example.com')
    await userEvent.type(screen.getByLabelText('Пароль'), '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))
    expect(await screen.findByRole('heading', { name: 'Кабинет открыт' })).toBeVisible()
    expect(localStorage.getItem('promptLab.loggedIn')).toBe('true')
  })

  it('защищает страницу создания шаблона', () => {
    route(<CreateTemplatePage />, '/dashboard/new', '/dashboard/new', <Route path="/login" element={<p>Нужен вход</p>} />)
    expect(screen.getByText('Нужен вход')).toBeVisible()
  })

  it('валидирует и создаёт шаблон', async () => {
    localStorage.setItem('promptLab.loggedIn', 'true')
    localStorage.setItem('promptLab.userEmail', 'student@example.com')
    route(<CreateTemplatePage />, '/dashboard/new', '/dashboard/new', <Route path="/dashboard" element={<p>Шаблон готов</p>} />)
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить шаблон' }))
    expect(screen.getAllByRole('alert')).toHaveLength(4)
    await userEvent.type(screen.getByLabelText('Название'), 'Анализ текста')
    await userEvent.type(screen.getByLabelText('Описание'), 'Подробное описание шаблона')
    await userEvent.selectOptions(screen.getByLabelText('Категория'), 'Анализ')
    await userEvent.type(screen.getByLabelText('Текст промпта'), 'Проанализируй этот достаточно длинный текст')
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить шаблон' }))
    expect(await screen.findByText('Шаблон готов')).toBeVisible()
    expect(serviceMocks.createTemplate).toHaveBeenCalledWith(expect.objectContaining({ category: 'Анализ', author: 'student@example.com' }))
  })

  it('защищает страницу редактирования шаблона', () => {
    route(<EditTemplatePage />, '/dashboard/edit/1', '/dashboard/edit/:id', <Route path="/login" element={<p>Нужен вход</p>} />)
    expect(screen.getByText('Нужен вход')).toBeVisible()
  })

  it('редактирует собственный шаблон', async () => {
    localStorage.setItem('promptLab.loggedIn', 'true')
    localStorage.setItem('promptLab.userEmail', 'student@example.com')
    route(
      <EditTemplatePage />,
      '/dashboard/edit/1',
      '/dashboard/edit/:id',
      <Route path="/dashboard" element={<p>Изменения сохранены</p>} />
    )

    expect(await screen.findByRole('heading', { name: 'Редактирование шаблона' })).toBeVisible()
    expect(screen.getByLabelText('Название')).toHaveValue(sample.title)
    await userEvent.clear(screen.getByLabelText('Название'))
    await userEvent.type(screen.getByLabelText('Название'), 'Обновлённый анализ')
    await userEvent.click(screen.getByLabelText('Сделать шаблон публичным'))
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }))

    expect(await screen.findByText('Изменения сохранены')).toBeVisible()
    expect(serviceMocks.updateTemplate).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      title: 'Обновлённый анализ',
      isPublic: false
    }))
  })

  it('не позволяет редактировать чужой или отсутствующий шаблон', async () => {
    localStorage.setItem('promptLab.loggedIn', 'true')
    localStorage.setItem('promptLab.userEmail', 'other@example.com')
    const forbidden = route(<EditTemplatePage />, '/dashboard/edit/1', '/dashboard/edit/:id')
    expect(await screen.findByRole('heading', { name: 'Нет доступа' })).toBeVisible()
    forbidden.unmount()

    serviceMocks.getTemplate.mockResolvedValue(undefined)
    route(<EditTemplatePage />, '/dashboard/edit/missing', '/dashboard/edit/:id')
    expect(await screen.findByRole('heading', { name: 'Шаблон не найден' })).toBeVisible()
  })

  it('защищает кабинет', () => {
    route(<DashboardPage />, '/dashboard', '/dashboard', <Route path="/login" element={<p>Авторизуйтесь</p>} />)
    expect(screen.getByText('Авторизуйтесь')).toBeVisible()
  })

  it('показывает и удаляет шаблон в кабинете', async () => {
    localStorage.setItem('promptLab.loggedIn', 'true')
    route(<DashboardPage />, '/dashboard', '/dashboard')
    expect(await screen.findByRole('heading', { name: sample.title })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Редактировать' })).toHaveAttribute('href', '/dashboard/edit/1')
    await userEvent.click(screen.getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: sample.title })).not.toBeInTheDocument())
    expect(serviceMocks.deleteTemplate).toHaveBeenCalledWith(1)
  })

  it('показывает пустой кабинет и позволяет выйти', async () => {
    localStorage.setItem('promptLab.loggedIn', 'true')
    serviceMocks.getUserTemplates.mockResolvedValue([])
    route(<DashboardPage />, '/dashboard', '/dashboard', <Route path="/" element={<p>Главная после выхода</p>} />)
    expect(await screen.findByText(/пока нет шаблонов/i)).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Выйти' }))
    expect(screen.getByText('Главная после выхода')).toBeVisible()
  })

  it('показывает ошибку удаления, сохраняя карточку', async () => {
    localStorage.setItem('promptLab.loggedIn', 'true')
    serviceMocks.deleteTemplate.mockRejectedValueOnce(new Error('Нет соединения'))
    route(<DashboardPage />)
    await screen.findByRole('heading', { name: sample.title })
    await userEvent.click(screen.getByRole('button', { name: 'Удалить' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Нет соединения')
    expect(screen.getByRole('heading', { name: sample.title })).toBeVisible()
  })

  it('выдаёт ссылку после проверки сервера и сообщает об ошибке публикации', async () => {
    localStorage.setItem('promptLab.loggedIn', 'true')
    route(<DashboardPage />)
    await screen.findByRole('heading', { name: sample.title })
    await userEvent.click(screen.getByRole('button', { name: 'Получить ссылку' }))
    expect(await screen.findByLabelText('Ссылка на шаблон')).toHaveValue('http://localhost/templates/1')
    serviceMocks.getShareUrl.mockRejectedValueOnce(new Error('offline'))
    await userEvent.click(screen.getByRole('button', { name: 'Получить ссылку' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось подтвердить публикацию')
    expect(screen.queryByLabelText('Ссылка на шаблон')).not.toBeInTheDocument()
  })

  it('отправляет локальные изменения и позволяет повторить после ошибки', async () => {
    localStorage.setItem('promptLab.loggedIn', 'true')
    serviceMocks.hasLocalChanges.mockReturnValue(true)
    serviceMocks.syncTemplate.mockRejectedValueOnce(new Error('offline'))
    route(<DashboardPage />)
    await screen.findByRole('heading', { name: sample.title })
    await userEvent.click(screen.getByRole('button', { name: 'Отправить на сервер' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Локальная копия сохранена')
    await userEvent.click(screen.getByRole('button', { name: 'Отправить на сервер' }))
    expect(await screen.findByText('Шаблон сохранён на сервере.')).toBeVisible()
    expect(serviceMocks.syncTemplate).toHaveBeenCalledWith(sample)
  })

  it('сохраняет введённый текст при ошибке формы', async () => {
    localStorage.setItem('promptLab.loggedIn', 'true')
    localStorage.setItem('promptLab.userEmail', sample.author)
    serviceMocks.updateTemplate.mockRejectedValueOnce(new Error('Нет доступа'))
    route(<EditTemplatePage />, '/dashboard/edit/1', '/dashboard/edit/:id')
    await screen.findByLabelText('Название')
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Нет доступа')
    expect(screen.getByLabelText('Название')).toHaveValue(sample.title)
    expect(screen.getByRole('button', { name: 'Сохранить изменения' })).toBeEnabled()
  })

  it('не отображает приватное содержимое, если доступ запрещён', async () => {
    serviceMocks.canReadTemplate.mockReturnValue(false)
    route(<TemplatePage />, '/templates/1', '/templates/:id')
    expect(await screen.findByRole('heading', { name: 'Шаблон не найден' })).toBeVisible()
    expect(screen.queryByText(sample.content)).not.toBeInTheDocument()
  })

  it('ищет, сортирует, фильтрует, копирует и сохраняет шаблоны', async () => {
    const second = { ...sample, id: 2, title: 'Карточка товара', category: 'Маркетинг', createdAt: '2026-05-22T12:00:00.000Z' }
    serviceMocks.getPublicTemplates.mockResolvedValue([sample, second])
    route(<TemplatesPage />)
    expect(await screen.findByRole('heading', { name: sample.title })).toBeVisible()
    await userEvent.selectOptions(screen.getByLabelText('Сортировка'), 'title')
    await userEvent.selectOptions(screen.getByLabelText('Категория'), 'Маркетинг')
    expect(screen.queryByRole('heading', { name: sample.title })).not.toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Категория'), 'all')
    await userEvent.type(screen.getByLabelText('Поиск'), 'анализ')
    expect(screen.getByRole('heading', { name: sample.title })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: `Добавить «${sample.title}» в избранное` }))
    expect(serviceMocks.toggleFavorite).toHaveBeenCalledWith(1)
    await userEvent.click(screen.getAllByRole('button', { name: 'Копировать' })[0])
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sample.content)
    await userEvent.click(screen.getByLabelText('Только избранное'))
  })

  it('показывает пустой результат фильтра и ошибку загрузки без падения', async () => {
    route(<TemplatesPage />)
    await screen.findByRole('heading', { name: sample.title })
    await userEvent.type(screen.getByLabelText('Поиск'), 'ничего такого нет')
    expect(screen.getByRole('heading', { name: 'Ничего не найдено' })).toBeVisible()
  })

  it('открывает шаблон, копирует и добавляет его в избранное', async () => {
    route(<TemplatePage />, '/templates/1', '/templates/:id')
    expect(await screen.findByRole('heading', { name: sample.title })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Копировать' }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sample.content)
    await userEvent.click(screen.getByRole('button', { name: /в избранное/i }))
    expect(serviceMocks.toggleFavorite).toHaveBeenCalledWith(1)
  })

  it('показывает ошибку отсутствующего шаблона', async () => {
    serviceMocks.getTemplate.mockResolvedValue(undefined)
    route(<TemplatePage />, '/templates/missing', '/templates/:id')
    expect(await screen.findByRole('heading', { name: 'Шаблон не найден' })).toBeVisible()
  })

  it('корневой App отображает маршрут приложения', async () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Промпты')
  })
})
