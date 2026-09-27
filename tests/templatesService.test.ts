import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createTemplate,
  deleteTemplate,
  getFavoriteIds,
  getLocalTemplates,
  getPublicTemplates,
  getTemplate,
  getUserTemplates,
  removeLocalTemplate,
  saveLocalTemplate,
  toggleFavorite,
  updateLocalTemplate,
  updateTemplate,
  syncTemplate, getShareUrl, hasLocalChanges, saveMessage
} from '../src/services/templatesService'
import { login, logout } from '../src/utils/auth'
import type { PromptTemplate } from '../src/types'

const sample: PromptTemplate = {
  id: 10,
  title: 'Тестовый шаблон',
  description: 'Описание тестового шаблона',
  category: 'Анализ',
  content: 'Достаточно длинный текст промпта',
  author: 'student@example.com',
  isPublic: true
}

function response(data: unknown, ok = true, status = ok ? 200 : 500) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(data) } as Response)
}

describe('templatesService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    login(sample.author)
  })

  it('сохраняет и удаляет локальные шаблоны', () => {
    expect(getLocalTemplates()).toEqual([])
    saveLocalTemplate(sample)
    expect(getLocalTemplates()).toEqual([sample])
    removeLocalTemplate(sample.id)
    expect(getLocalTemplates()).toEqual([])
  })

  it('обновляет локальные шаблоны без создания дублей', () => {
    saveLocalTemplate({ ...sample, id: 'local-0' })
    updateLocalTemplate({ ...sample, id: 'local-0', title: 'Новое название' })
    expect(getLocalTemplates()).toEqual([expect.objectContaining({ id: 'local-0', title: 'Новое название' })])
  })

  it('безопасно обрабатывает повреждённый localStorage', () => {
    localStorage.setItem('promptLab.templates', '{oops')
    expect(getLocalTemplates()).toEqual([])
  })

  it('переключает избранное', () => {
    expect(toggleFavorite(10)).toEqual(['10'])
    expect(getFavoriteIds()).toEqual(['10'])
    expect(toggleFavorite(10)).toEqual([])
  })

  it('получает публичные шаблоны с API и добавляет локальные', async () => {
    saveLocalTemplate({ ...sample, id: 'local-1' })
    vi.stubGlobal('fetch', vi.fn(() => response([sample, { ...sample, id: 11, isPublic: false }])))
    const templates = await getPublicTemplates()
    expect(templates.map((item) => item.id)).toEqual([10, 'local-1'])
  })

  it('учитывает локальную приватность поверх данных API', async () => {
    saveLocalTemplate({ ...sample, isPublic: false })
    vi.stubGlobal('fetch', vi.fn(() => response([sample])))
    expect(await getPublicTemplates()).toEqual([])
  })

  it('использует резервные данные при ошибке API', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    expect((await getPublicTemplates()).length).toBeGreaterThan(0)
  })

  it('получает шаблоны пользователя с API и локально', async () => {
    saveLocalTemplate({ ...sample, id: 'local-2' })
    vi.stubGlobal('fetch', vi.fn(() => response([sample])))
    expect((await getUserTemplates(sample.author)).length).toBe(2)
  })

  it('возвращает только локальные шаблоны пользователя без API', async () => {
    saveLocalTemplate({ ...sample, id: 'local-3' })
    saveLocalTemplate({ ...sample, id: 'local-4', author: 'other@example.com' })
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    expect(await getUserTemplates(sample.author)).toHaveLength(1)
  })

  it('получает один шаблон с API и из резервных данных', async () => {
    vi.stubGlobal('fetch', vi.fn(() => response(sample)))
    expect(await getTemplate('10')).toEqual(sample)
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    expect((await getTemplate('1'))?.title).toBe('Описание товара')
    expect(await getTemplate('missing')).toBeUndefined()

    saveLocalTemplate({ ...sample, id: 'local-template' })
    expect(await getTemplate('local-template')).toEqual(expect.objectContaining({ id: 'local-template' }))
  })

  it('создаёт шаблон через API или локально', async () => {
    const values = { ...sample }
    delete (values as Partial<PromptTemplate>).id
    vi.stubGlobal('fetch', vi.fn(() => response(sample)))
    expect(await createTemplate(values)).toEqual(sample)

    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    const local = await createTemplate(values)
    expect(String(local.id)).toMatch(/^local-/)
    expect(getLocalTemplates()).toHaveLength(1)
  })

  it('обновляет шаблон через API или локально', async () => {
    const remoteUpdated = { ...sample, title: 'Обновлено через API' }
    const fetchMock = vi.fn(() => response(remoteUpdated))
    vi.stubGlobal('fetch', fetchMock)
    expect(await updateTemplate(remoteUpdated)).toEqual(remoteUpdated)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/templates/10'),
      expect.objectContaining({ method: 'PATCH' })
    )

    const local = { ...sample, id: 'local-10', title: 'Локальное обновление' }
    saveLocalTemplate({ ...local, title: 'Старое название' })
    expect(await updateTemplate(local)).toEqual(local)
    expect(getLocalTemplates()).toContainEqual(local)

    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    const offline = { ...sample, title: 'Обновлено без API' }
    expect(await updateTemplate(offline)).toEqual(offline)
    expect(getLocalTemplates()).toContainEqual(offline)
  })

  it('удаляет локальный и удалённый шаблон', async () => {
    saveLocalTemplate({ ...sample, id: 'local-5' })
    await deleteTemplate('local-5')
    expect(getLocalTemplates()).toEqual([])

    const fetchMock = vi.fn(() => response({}))
    vi.stubGlobal('fetch', fetchMock)
    await deleteTemplate(10)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/templates/10'), expect.objectContaining({ method: 'DELETE' }))
  })

  it('сообщает об ошибке удаления на API и сохраняет локальную копию', async () => {
    saveLocalTemplate({ ...sample, id: 99 })
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    await expect(deleteTemplate(99)).rejects.toThrow('Не удалось удалить')
    expect(getLocalTemplates()).toHaveLength(1)
  })

  it('обрабатывает ответ API с ошибкой', async () => {
    vi.stubGlobal('fetch', vi.fn(() => response({}, false)))
    expect((await getPublicTemplates()).length).toBeGreaterThan(0)
  })

  it('приватный шаблон доступен только своему автору', async () => {
    const privateTemplate = { ...sample, isPublic: false }
    vi.stubGlobal('fetch', vi.fn(() => response(privateTemplate)))
    expect(await getTemplate('10')).toEqual(privateTemplate)
    logout()
    expect(await getTemplate('10')).toBeUndefined()
    saveLocalTemplate(privateTemplate)
    login('other@example.com')
    expect(await getTemplate('10')).toBeUndefined()
    expect(await getUserTemplates(sample.author)).toEqual([])
    login(sample.author)
    expect(await getTemplate('10')).toEqual(privateTemplate)
  })

  it('не подменяет 404 и 403 резервным шаблоном', async () => {
    for (const status of [404, 403]) {
      vi.stubGlobal('fetch', vi.fn(() => response({}, false, status)))
      expect(await getTemplate('1')).toBeUndefined()
    }
  })

  it('онлайн-редактирование удаляет устаревшую офлайн-копию', async () => {
    const offline = { ...sample, title: 'Офлайн версия' }
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    await updateTemplate(offline)
    expect(hasLocalChanges(sample.id)).toBe(true)
    expect(saveMessage(offline)).toContain('только в этом браузере')
    const online = { ...sample, title: 'Последняя версия' }
    vi.stubGlobal('fetch', vi.fn(() => response(online)))
    await updateTemplate(online)
    expect(getLocalTemplates()).toEqual([])
    expect(await getTemplate('10')).toEqual(online)
    expect(saveMessage(online)).toContain('на сервере')
  })

  it('удаление убирает обе копии и предотвращает возврат резервного примера', async () => {
    saveLocalTemplate({ ...sample, id: 1 })
    vi.stubGlobal('fetch', vi.fn(() => response(undefined, true, 204)))
    await deleteTemplate(1)
    expect(getLocalTemplates()).toEqual([])
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    expect(await getTemplate('1')).toBeUndefined()
    expect((await getPublicTemplates()).some((item) => item.id === 1)).toBe(false)
  })

  it('завершает удаление уже отсутствующего шаблона', async () => {
    saveLocalTemplate(sample)
    vi.stubGlobal('fetch', vi.fn(() => response({}, false, 404)))
    await deleteTemplate(10)
    expect(getLocalTemplates()).toEqual([])
  })

  it('отклонённые сервером изменения не выдаются за успешное сохранение', async () => {
    vi.stubGlobal('fetch', vi.fn(() => response({}, false, 403)))
    await expect(updateTemplate(sample)).rejects.toThrow()
    await expect(createTemplate(sample)).rejects.toThrow()
    expect(getLocalTemplates()).toEqual([])
  })

  it('публикует локальный шаблон и создаёт ссылку только после успеха', async () => {
    const local = { ...sample, id: 'local-share' }
    saveLocalTemplate(local)
    await expect(getShareUrl(local)).rejects.toThrow('отправьте изменения')
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    await expect(syncTemplate(local)).rejects.toThrow()
    expect(getLocalTemplates()).toEqual([local])
    const remote = { ...local, id: 'tpl-share' }
    vi.stubGlobal('fetch', vi.fn(() => response(remote)))
    expect(await syncTemplate(local)).toEqual(remote)
    expect(getLocalTemplates()).toEqual([])
    expect(await getShareUrl(remote)).toContain('/templates/tpl-share')
    await expect(getShareUrl({ ...remote, isPublic: false })).rejects.toThrow('публичным')
    vi.stubGlobal('fetch', vi.fn(() => response({ ...remote, isPublic: false })))
    await expect(getShareUrl(remote)).rejects.toThrow('не опубликован')
  })

  it('повторная публикация после потерянного ответа обновляет тот же ID', async () => {
    const local = { ...sample, id: 'local-retry' }
    saveLocalTemplate(local)
    const remote = { ...local, id: 'tpl-retry' }
    const fetchMock = vi.fn().mockImplementationOnce(() => response({}, false, 409))
      .mockImplementationOnce(() => response(remote))
    vi.stubGlobal('fetch', fetchMock)
    expect(await syncTemplate(local)).toEqual(remote)
    expect(fetchMock.mock.calls[1][0]).toContain('/templates/tpl-retry')
    expect(fetchMock.mock.calls[1][1].method).toBe('PATCH')
    expect(getLocalTemplates()).toEqual([])
  })

  it('отправляет накопленные изменения существующего серверного шаблона', async () => {
    saveLocalTemplate(sample)
    vi.stubGlobal('fetch', vi.fn(() => response(sample)))
    await syncTemplate(sample)
    expect(getLocalTemplates()).toEqual([])
  })
})
