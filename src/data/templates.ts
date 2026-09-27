import type { PromptTemplate } from '../types'

export const fallbackTemplates: PromptTemplate[] = [
  {
    id: 1,
    title: 'Описание товара',
    description: 'Карточка товара с выгодами для выбранной аудитории.',
    category: 'Маркетинг',
    content: '## Задача\nТы копирайтер. Напиши описание {{product}} для {{audience}}.\n+++Format\nЗаголовок, 3 преимущества и призыв к действию.',
    author: 'student@example.com',
    isPublic: true,
    createdAt: '2026-05-20T12:00:00.000Z'
  },
  {
    id: 2,
    title: 'Объяснение сложной темы',
    description: 'Простое объяснение с аналогией и примерами.',
    category: 'Обучение',
    content: 'Ты преподаватель. Объясни {{topic}} простыми словами.\nIMPORTANT: приведи аналогию и 3 примера.',
    author: 'student@example.com',
    isPublic: true,
    createdAt: '2026-05-22T12:00:00.000Z'
  },
  {
    id: 3,
    title: 'Анализ отзыва',
    description: 'Определение настроения и главной проблемы клиента.',
    category: 'Анализ',
    content: 'Проанализируй <review>{{review}}</review> → определи тон → выдели проблему.\n+++Format\n{"sentiment": "...", "problem": "..."}',
    author: 'mentor@example.com',
    isPublic: true,
    createdAt: '2026-05-25T12:00:00.000Z'
  }
]

export const templateCategories = ['Маркетинг', 'Обучение', 'Анализ', 'Разработка', 'Другое']
