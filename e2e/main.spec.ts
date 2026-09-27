import { expect, test } from '@playwright/test'

test('главная страница открывается', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Промпты')
  await expect(page.getByRole('link', { name: 'Техники', exact: true })).toBeVisible()
})

test('можно открыть описание техники', async ({ page }) => {
  await page.goto('/learn')
  await page.getByRole('link', { name: /Разобрать технику/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Zero-shot prompting' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Когда использовать' })).toBeVisible()
})

test('можно войти в личный кабинет', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('student@example.com')
  await page.getByLabel('Пароль').fill('123456')
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('heading', { name: 'Личный кабинет' })).toBeVisible()
})

test('можно создать и отредактировать шаблон без запущенного API', async ({ page }) => {
  await page.route('http://127.0.0.1:3002/**', (route) => route.abort('connectionrefused'))
  await page.goto('/login')
  await page.getByLabel('Email').fill('student@example.com')
  await page.getByLabel('Пароль').fill('123456')
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.getByRole('link', { name: /Создать шаблон/ }).click()
  await page.getByLabel('Название').fill('E2E шаблон')
  await page.getByLabel('Описание').fill('Описание тестового шаблона')
  await page.getByLabel('Категория').selectOption('Разработка')
  await page.getByLabel('Текст промпта').fill('## Задача\nНапиши тест для {{component}} → верни код')
  await page.getByRole('button', { name: 'Сохранить шаблон' }).click()
  await expect(page.getByRole('heading', { name: 'Личный кабинет' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'E2E шаблон' })).toBeVisible()
  await page.getByRole('link', { name: 'Редактировать' }).click()
  await expect(page.getByRole('heading', { name: 'Редактирование шаблона' })).toBeVisible()
  await page.getByLabel('Название').fill('E2E шаблон обновлён')
  await page.getByRole('button', { name: 'Сохранить изменения' }).click()
  await expect(page.getByRole('heading', { name: 'Личный кабинет' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'E2E шаблон обновлён' })).toBeVisible()
})
