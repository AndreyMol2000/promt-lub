import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import TemplateForm from '../components/TemplateForm'
import { getTemplate, updateTemplate, saveMessage } from '../services/templatesService'
import type { PromptTemplate, TemplateFormValues } from '../types'
import { getUserEmail, isLoggedIn } from '../utils/auth'

export default function EditTemplatePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()
  const email = getUserEmail()
  const [template, setTemplate] = useState<PromptTemplate>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!loggedIn) return
    let active = true
    setLoading(true)
    getTemplate(id).then((item) => { if (active) setTemplate(item) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, loggedIn])

  if (!loggedIn) return <Navigate to="/login" replace />
  if (loading) return <p role="status">Загружаем шаблон…</p>

  if (!template) {
    return (
      <section className="empty-state">
        <h1>Шаблон не найден</h1>
        <Link className="button" to="/dashboard">Вернуться в кабинет</Link>
      </section>
    )
  }

  if (template.author !== email) {
    return (
      <section className="empty-state">
        <h1>Нет доступа</h1>
        <p>Редактировать может только автор шаблона.</p>
        <Link className="button" to="/dashboard">Вернуться в кабинет</Link>
      </section>
    )
  }

  async function handleSubmit(values: TemplateFormValues, isPublic: boolean) {
    const saved = await updateTemplate({ ...template!, ...values, isPublic })
    navigate('/dashboard', { state: { message: saveMessage(saved) } })
  }

  return (
    <section>
      <Link className="back-link" to="/dashboard">← В личный кабинет</Link>
      <h1>Редактирование шаблона</h1>
      <TemplateForm
        key={id}
        initialValues={{
          title: template.title,
          description: template.description,
          category: template.category,
          content: template.content
        }}
        initialIsPublic={template.isPublic}
        submitLabel="Сохранить изменения"
        savingLabel="Сохраняем…"
        onSubmit={handleSubmit}
      />
    </section>
  )
}
