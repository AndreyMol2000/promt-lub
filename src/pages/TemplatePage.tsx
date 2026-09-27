import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { canReadTemplate, getFavoriteIds, getTemplate, toggleFavorite } from '../services/templatesService'
import type { PromptTemplate } from '../types'
import { highlightPrompt } from '../utils/highlight'

export default function TemplatePage() {
  const { id = '' } = useParams()
  const [template, setTemplate] = useState<PromptTemplate>()
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const [favorite, setFavorite] = useState(() => getFavoriteIds().includes(id))

  useEffect(() => {
    let active = true
    setLoading(true)
    setCopied(false)
    setCopyError('')
    setFavorite(getFavoriteIds().includes(id))
    getTemplate(id).then((item) => { if (active) setTemplate(item) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  if (loading) return <p role="status">Загружаем шаблон…</p>
  if (!template || !canReadTemplate(template)) return <section className="empty-state"><h1>Шаблон не найден</h1><Link className="button" to="/templates">Вернуться к шаблонам</Link></section>

  async function copy() {
    try {
      await navigator.clipboard.writeText(template!.content)
      setCopied(true)
      setCopyError('')
    } catch {
      setCopyError('Не удалось скопировать. Выделите и скопируйте текст вручную.')
    }
  }

  function handleFavorite() {
    const next = toggleFavorite(template!.id)
    setFavorite(next.includes(String(template!.id)))
  }

  return (
    <article className="detail-page template-detail">
      <Link className="back-link" to="/templates">← Все шаблоны</Link>
      <div className="card-title-row">
        <span className="badge">{template.category}</span>
        <button className="icon-button labeled-icon-button" type="button" aria-pressed={favorite} onClick={handleFavorite}>
          <span aria-hidden="true">{favorite ? '★' : '☆'}</span> {favorite ? 'В избранном' : 'В избранное'}
        </button>
      </div>
      <h1>{template.title}</h1>
      <p className="lead">{template.description}</p>
      <p className="template-meta">Автор: {template.author}</p>
      <section aria-labelledby="prompt-title">
        <div className="prompt-heading">
          <h2 id="prompt-title">Текст промпта</h2>
          <button className="button" type="button" onClick={copy}>{copied ? 'Скопировано' : 'Копировать'}</button>
        </div>
        <pre className="prompt-preview large-preview" dangerouslySetInnerHTML={{ __html: highlightPrompt(template.content) }} />
        {copyError && <p className="error" role="alert">{copyError}</p>}
      </section>
    </article>
  )
}
