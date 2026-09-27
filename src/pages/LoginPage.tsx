import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FieldError from '../components/FieldError'
import { login } from '../utils/auth'
import { validateLogin, type LoginErrors } from '../utils/validation'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginErrors>({})

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validateLogin(email, password)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    login(email)
    navigate('/dashboard')
  }

  return (
    <section className="form-page">
      <form className="form-card" onSubmit={handleSubmit} noValidate>
        <h1>Вход</h1>
        <p className="lead">Демонстрационная авторизация: подойдёт любой корректный email и пароль от 6 символов.</p>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
        <FieldError id="email-error">{errors.email}</FieldError>
        <label htmlFor="password">Пароль</label>
        <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} />
        <FieldError id="password-error">{errors.password}</FieldError>
        <button className="button" type="submit">Войти</button>
      </form>
    </section>
  )
}
