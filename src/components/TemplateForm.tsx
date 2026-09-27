import { FormEvent, useState } from 'react'
import { templateCategories } from '../data/templates'
import type { TemplateFormValues } from '../types'
import { validateTemplate } from '../utils/validation'
import FieldError from './FieldError'
import PromptEditor from './PromptEditor'

interface TemplateFormProps {
  initialValues?: TemplateFormValues
  initialIsPublic?: boolean
  submitLabel: string
  savingLabel: string
  onSubmit: (values: TemplateFormValues, isPublic: boolean) => Promise<void>
}

const emptyValues: TemplateFormValues = {
  title: '',
  description: '',
  category: '',
  content: ''
}

export default function TemplateForm({
  initialValues = emptyValues,
  initialIsPublic = true,
  submitLabel,
  savingLabel,
  onSubmit
}: TemplateFormProps) {
  const [values, setValues] = useState<TemplateFormValues>(initialValues)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [errors, setErrors] = useState<Partial<Record<keyof TemplateFormValues, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  function changeField<K extends keyof TemplateFormValues>(field: K, value: TemplateFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validateTemplate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)
    setSaveError('')
    try {
      await onSubmit(values, isPublic)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Не удалось сохранить шаблон. Попробуйте ещё раз.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="template-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="title">Название</label>
      <input
        id="title"
        value={values.title}
        onChange={(event) => changeField('title', event.target.value)}
        aria-invalid={Boolean(errors.title)}
        aria-describedby={errors.title ? 'title-error' : undefined}
      />
      <FieldError id="title-error">{errors.title}</FieldError>

      <label htmlFor="description">Описание</label>
      <textarea
        className="short-textarea"
        id="description"
        value={values.description}
        onChange={(event) => changeField('description', event.target.value)}
        aria-invalid={Boolean(errors.description)}
        aria-describedby={errors.description ? 'description-error' : undefined}
      />
      <FieldError id="description-error">{errors.description}</FieldError>

      <label htmlFor="category">Категория</label>
      <select
        id="category"
        value={values.category}
        onChange={(event) => changeField('category', event.target.value)}
        aria-invalid={Boolean(errors.category)}
        aria-describedby={errors.category ? 'category-error' : undefined}
      >
        <option value="">Выберите категорию</option>
        {templateCategories.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <FieldError id="category-error">{errors.category}</FieldError>

      <PromptEditor value={values.content} onChange={(value) => changeField('content', value)} error={errors.content} />

      <label className="checkbox-row">
        <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
        Сделать шаблон публичным
      </label>

      {saveError && <p className="error" role="alert">{saveError}</p>}
      <button className="button" type="submit" disabled={isSaving}>
        {isSaving ? savingLabel : submitLabel}
      </button>
    </form>
  )
}
