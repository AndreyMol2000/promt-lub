import { useEffect, useMemo, useState } from 'react'
import TemplateCard from '../components/TemplateCard'
import { templateCategories } from '../data/templates'
import { getFavoriteIds, getPublicTemplates, toggleFavorite } from '../services/templatesService'
import type { PromptTemplate } from '../types'

type SortValue = 'newest' | 'title'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState<SortValue>('newest')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(getFavoriteIds)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicTemplates().then(setTemplates).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return templates
      .filter((item) => !query || `${item.title} ${item.description} ${item.content}`.toLowerCase().includes(query))
      .filter((item) => category === 'all' || item.category === category)
      .filter((item) => !favoritesOnly || favorites.includes(String(item.id)))
      .sort((a, b) => sort === 'title'
        ? a.title.localeCompare(b.title, 'ru')
        : (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [category, favorites, favoritesOnly, search, sort, templates])

  async function copyTemplate(item: PromptTemplate) {
    await navigator.clipboard.writeText(item.content)
    setCopiedId(String(item.id))
    window.setTimeout(() => setCopiedId(null), 1200)
  }

  function handleFavorite(id: PromptTemplate['id']) {
    setFavorites(toggleFavorite(id))
  }

  return (
    <section>
      <div className="page-intro">
        <p className="eyebrow">Библиотека сообщества</p>
        <h1>Шаблоны промптов</h1>
        <p className="lead">Найдите подходящий сценарий, скопируйте его и замените переменные своими данными.</p>
      </div>

      <form className="filters" role="search" onSubmit={(event) => event.preventDefault()}>
        <div className="filter-search">
          <label htmlFor="search">Поиск</label>
          <input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Название, описание или текст" />
        </div>
        <div>
          <label htmlFor="category-filter">Категория</label>
          <select id="category-filter" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">Все категории</option>
            {templateCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sort">Сортировка</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as SortValue)}>
            <option value="newest">Сначала новые</option>
            <option value="title">По названию</option>
          </select>
        </div>
        <label className="checkbox-row favorite-filter">
          <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} />
          Только избранное
        </label>
      </form>

      <p className="results-count" role="status">Найдено: {filtered.length}</p>
      {loading && <p>Загружаем шаблоны…</p>}
      {!loading && (
        <div className="grid">
          {filtered.map((item) => (
            <TemplateCard
              key={item.id}
              template={item}
              isFavorite={favorites.includes(String(item.id))}
              copied={copiedId === String(item.id)}
              onCopy={copyTemplate}
              onFavorite={handleFavorite}
            />
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && <div className="empty-state"><h2>Ничего не найдено</h2><p>Попробуйте изменить запрос или сбросить фильтры.</p></div>}
    </section>
  )
}
