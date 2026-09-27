import { expect, test, type Page, type APIRequestContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const api = 'http://127.0.0.1:3002'
const owner = 'student@example.com'
const headers = { 'X-Demo-User': owner }
const values = { title: 'Проверяемый шаблон', description: 'Описание для проверки изменений',
  category: 'Анализ', content: 'Проанализируй этот достаточно длинный текст {{text}}', author: owner, isPublic: true }

async function seed(request: APIRequestContext, isPublic = true) {
  const item = { ...values, id: 'tpl-' + randomUUID(), isPublic }
  expect((await request.post(api + '/templates', { headers, data: item })).status()).toBe(201)
  return item
}

async function login(page: Page, email = owner) {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Пароль', { exact: true }).fill('123456')
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Личный кабинет', exact: true })).toBeVisible()
}

async function edit(page: Page, id: string, title: string) {
  await page.goto('/dashboard/edit/' + id)
  await page.getByLabel('Название', { exact: true }).fill(title)
  await page.getByRole('button', { name: 'Сохранить изменения', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Личный кабинет', exact: true })).toBeVisible()
}

test('приватный шаблон скрыт от гостя и другого пользователя в UI и API', async ({ page, request }) => {
  const item = await seed(request, false)
  expect((await request.get(api + '/templates/' + item.id)).status()).toBe(404)
  expect((await request.get(api + '/templates/' + item.id, { headers })).status()).toBe(200)
  const list = await (await request.get(api + '/templates')).json()
  expect(list.some((row: { id: string }) => row.id === item.id)).toBe(false)
  expect((await request.get(api + '/db')).status()).toBe(404)
  expect((await request.patch(api + '/templates/' + item.id, {
    headers: { 'X-Demo-User': 'other@example.com' }, data: { title: 'Чужое изменение' }
  })).status()).toBe(403)
  await page.goto('/templates/' + item.id)
  await expect(page.getByRole('heading', { name: 'Шаблон не найден' })).toBeVisible()
  await login(page, 'other@example.com')
  await page.goto('/templates/' + item.id)
  await expect(page.getByRole('heading', { name: 'Шаблон не найден' })).toBeVisible()
  await login(page)
  await page.goto('/templates/' + item.id)
  await expect(page.getByRole('heading', { name: item.title, exact: true })).toBeVisible()
})

test('офлайн → онлайн: актуальная версия сохраняется, удалённый шаблон не возвращается', async ({ page, request }) => {
  const item = await seed(request)
  await login(page)
  await page.goto('/dashboard/edit/' + item.id)
  await page.getByLabel('Название', { exact: true }).waitFor()
  let offline = true
  await page.route(api + '/**', (route) => offline ? route.abort('connectionrefused') : route.continue())
  await page.getByLabel('Название', { exact: true }).fill('Офлайн изменение')
  await page.getByRole('button', { name: 'Сохранить изменения' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'только в этом браузере' })).toBeVisible()
  offline = false
  await edit(page, item.id, 'Финальная онлайн версия')
  await page.reload()
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Финальная онлайн версия', exact: true }) })
  await expect(card).toBeVisible()
  expect((await (await request.get(api + '/templates/' + item.id)).json()).title).toBe('Финальная онлайн версия')
  // Ещё одна офлайн-копия перед удалением.
  await page.goto('/dashboard/edit/' + item.id)
  await page.getByLabel('Название', { exact: true }).waitFor()
  offline = true
  await page.getByLabel('Название', { exact: true }).fill('Локальная копия для удаления')
  await page.getByRole('button', { name: 'Сохранить изменения' }).click()
  const pending = page.getByRole('article').filter({ hasText: 'Локальная копия для удаления' })
  await expect(pending).toBeVisible()
  await pending.getByRole('button', { name: 'Удалить', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Не удалось удалить')
  await expect(pending).toBeVisible()
  offline = false
  await pending.getByRole('button', { name: 'Удалить', exact: true }).click()
  await expect(pending).toHaveCount(0)
  await page.reload()
  await expect(page.getByText('Локальная копия для удаления', { exact: true })).toHaveCount(0)
  expect((await request.get(api + '/templates/' + item.id)).status()).toBe(404)
})

test('локальный публичный шаблон отправляется на сервер и открывается у получателя', async ({ page, browser }) => {
  let offline = true
  await page.route(api + '/**', (route) => offline ? route.abort('connectionrefused') : route.continue())
  await login(page)
  await page.goto('/dashboard/new')
  await page.getByLabel('Название', { exact: true }).fill('Новый общий шаблон')
  await page.getByLabel('Описание', { exact: true }).fill(values.description)
  await page.getByLabel('Категория', { exact: true }).selectOption(values.category)
  await page.getByLabel('Текст промпта', { exact: true }).fill(values.content)
  await page.getByRole('button', { name: 'Сохранить шаблон' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'только в этом браузере' })).toBeVisible()
  const card = page.getByRole('article').filter({ hasText: 'Новый общий шаблон' })
  await expect(card.getByRole('button', { name: 'Получить ссылку' })).toHaveCount(0)
  await card.getByRole('button', { name: 'Отправить на сервер' }).click()
  await expect(page.getByRole('alert')).toContainText('Локальная копия сохранена')
  offline = false
  await card.getByRole('button', { name: 'Отправить на сервер' }).click()
  await card.getByRole('button', { name: 'Получить ссылку' }).click()
  const url = await page.getByLabel('Ссылка на шаблон').inputValue()
  const recipient = await browser.newContext()
  try {
    const other = await recipient.newPage()
    await other.goto(url)
    await expect(other.getByRole('heading', { name: 'Новый общий шаблон', exact: true })).toBeVisible()
  } finally { await recipient.close() }
})

test('кабинет, каталог и формы помещаются в экран 320 px', async ({ page, request }) => {
  const item = await seed(request)
  await page.setViewportSize({ width: 320, height: 800 })
  await login(page)
  for (const path of ['/dashboard', '/templates', '/dashboard/new', '/dashboard/edit/' + item.id]) {
    await page.goto(path)
    await page.getByRole('heading', { level: 1 }).waitFor()
    if (path === '/dashboard' || path === '/templates') await page.getByRole('article').first().waitFor()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  }
})
