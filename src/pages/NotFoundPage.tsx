import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return <section className="empty-state"><p className="error-code">404</p><h1>Такой страницы нет</h1><p>Возможно, ссылка устарела или в адресе есть опечатка.</p><Link className="button" to="/">На главную</Link></section>
}
