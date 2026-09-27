import { Link } from 'react-router-dom'
import type { PromptTemplate } from '../types'

interface Props {
  template: PromptTemplate
  isFavorite: boolean
  copied: boolean
  onCopy: (template: PromptTemplate) => void
  onFavorite: (id: PromptTemplate['id']) => void
}

export default function TemplateCard({ template, isFavorite, copied, onCopy, onFavorite }: Props) {
  return (
    <article className="card template-card">
      <div className="card-title-row">
        <span className="badge">{template.category}</span>
        <button
          className="icon-button"
          type="button"
          aria-label={isFavorite ? `Удалить «${template.title}» из избранного` : `Добавить «${template.title}» в избранное`}
          aria-pressed={isFavorite}
          onClick={() => onFavorite(template.id)}
        >
          <span aria-hidden="true">{isFavorite ? '★' : '☆'}</span>
        </button>
      </div>
      <h2><Link to={`/templates/${template.id}`}>{template.title}</Link></h2>
      <p>{template.description}</p>
      <pre className="example template-preview">{template.content}</pre>
      <div className="card-bottom">
        <small>Автор: {template.author}</small>
        <button className="text-button" type="button" onClick={() => onCopy(template)}>
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
      </div>
    </article>
  )
}
