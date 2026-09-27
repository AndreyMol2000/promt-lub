import { useId } from 'react'
import { highlightPrompt } from '../utils/highlight'
import FieldError from './FieldError'

interface Props {
  value: string
  onChange: (value: string) => void
  error?: string
}

export default function PromptEditor({ value, onChange, error }: Props) {
  const id = useId()

  return (
    <div className="editor-block">
      <label htmlFor={id}>Текст промпта</label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={12}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        spellCheck="false"
        placeholder={'## Заголовок\n<context>Описание</context>\nIMPORTANT\n{{variable}} → результат'}
      />
      <FieldError id={`${id}-error`}>{error}</FieldError>
      <div className="preview-wrap">
        <p className="preview-title" id={`${id}-preview`}>Предпросмотр подсветки</p>
        <pre
          className="prompt-preview"
          aria-labelledby={`${id}-preview`}
          dangerouslySetInnerHTML={{ __html: highlightPrompt(value) || 'Здесь появится подсветка' }}
        />
      </div>
    </div>
  )
}
