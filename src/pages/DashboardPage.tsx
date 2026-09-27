import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { deleteTemplate, getUserTemplates, getShareUrl, hasLocalChanges, syncTemplate } from '../services/templatesService'
import type { PromptTemplate } from '../types'
import { getUserEmail, isLoggedIn, logout } from '../utils/auth'

export default function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const loggedIn = isLoggedIn()
  const email = getUserEmail()
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loggedIn) return
    getUserTemplates(email).then(setTemplates).finally(() => setLoading(false))
  }, [email, loggedIn])

  if (!loggedIn) return <Navigate to="/login" replace />

  function handleLogout() {
    logout()
    navigate('/')
  }

  async function handleDelete(id: PromptTemplate['id']) {
    setBusy(true)
    setError('')
    setShareUrl('')
    try {
      await deleteTemplate(id)
      setTemplates((current) => current.filter((item) => String(item.id) !== String(id)))
      setMessage('Шаблон удалён.')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось удалить шаблон.')
    } finally { setBusy(false) }
  }

  async function handleSync(template: PromptTemplate) {
    setBusy(true)
    setError('')
    setShareUrl('')
    try {
      await syncTemplate(template)
      setTemplates(await getUserTemplates(email))
      setMessage('Шаблон сохранён на сервере.')
    } catch {
      setError('Не удалось отправить изменения на сервер. Локальная копия сохранена. Проверьте соединение и повторите.')
    } finally { setBusy(false) }
  }

  async function handleShare(template: PromptTemplate) {
    setBusy(true)
    setError('')
    setShareUrl('')
    try {
      setShareUrl(await getShareUrl(template))
      setMessage('Ссылка на опубликованный шаблон готова. Её можно скопировать из поля ниже.')
    } catch {
      setError('Не удалось подтвердить публикацию. Проверьте соединение и отправьте изменения на сервер.')
    } finally { setBusy(false) }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{email}</p>
          <h1>Личный кабинет</h1>
          <p className="lead">Управляйте своими шаблонами и создавайте новые.</p>
        </div>
        <button className="button button-secondary" type="button" onClick={handleLogout}>Выйти</button>
      </div>
      {(message || location.state?.message) && <p className="notice" role="status">{message || location.state.message}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {shareUrl && <div className="share-result"><label htmlFor="share-url">Ссылка на шаблон</label><input id="share-url" readOnly value={shareUrl} onFocus={(event) => event.target.select()} /></div>}
      <Link className="button" to="/dashboard/new">+ Создать шаблон</Link>
      <section className="dashboard-section" aria-labelledby="my-templates-title">
        <h2 id="my-templates-title">Мои шаблоны</h2>
        {loading && <p role="status">Загружаем шаблоны…</p>}
        {!loading && templates.length === 0 && <div className="empty-state"><p>У вас пока нет шаблонов. Самое время создать первый.</p></div>}
        <div className="grid">
          {templates.map((template) => (
            <article className="card" key={template.id}>
              <span className="badge">{template.category}</span>
              <h3>{template.title}</h3>
              <p>{template.description}</p>
              <p className="template-meta">{hasLocalChanges(template.id) ? 'Есть локальные изменения — ещё не отправлены на сервер' : template.isPublic ? 'Публичный' : 'Приватный'}</p>
              <div className="card-actions">
                <Link className="text-link" to={`/templates/${template.id}`}>Открыть</Link>
                <Link className="text-link" to={`/dashboard/edit/${template.id}`}>Редактировать</Link>
                {hasLocalChanges(template.id)
                  ? <button className="text-button" type="button" disabled={busy} onClick={() => handleSync(template)}>Отправить на сервер</button>
                  : template.isPublic && <button className="text-button" type="button" disabled={busy} onClick={() => handleShare(template)}>Получить ссылку</button>}
                <button className="danger-button" type="button" disabled={busy} onClick={() => handleDelete(template.id)}>Удалить</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
