interface Props {
  id: string
  children?: string
}

export default function FieldError({ id, children }: Props) {
  if (!children) return null
  return <p className="error" id={id} role="alert">{children}</p>
}
