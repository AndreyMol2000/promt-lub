import { Navigate, useNavigate } from 'react-router-dom'
import TemplateForm from '../components/TemplateForm'
import { createTemplate, saveMessage } from '../services/templatesService'
import type { TemplateFormValues } from '../types'
import { getUserEmail, isLoggedIn } from '../utils/auth'

export default function CreateTemplatePage() {
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()

  if (!loggedIn) return <Navigate to="/login" replace />

  async function handleSubmit(values: TemplateFormValues, isPublic: boolean) {
    const saved = await createTemplate({ ...values, author: getUserEmail(), isPublic, createdAt: new Date().toISOString() })
    navigate('/dashboard', { state: { message: saveMessage(saved) } })
  }

  return (
    <section>
      <h1>Создание шаблона</h1>
      <TemplateForm
        submitLabel="Сохранить шаблон"
        savingLabel="Сохраняем…"
        onSubmit={handleSubmit}
      />
    </section>
  )
}
