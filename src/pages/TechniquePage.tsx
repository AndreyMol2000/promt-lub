import { Link, useParams } from 'react-router-dom'
import { techniques } from '../data/techniques'

export default function TechniquePage() {
  const { id } = useParams()
  const technique = techniques.find((item) => item.id === id)

  if (!technique) {
    return <section className="empty-state"><h1>Техника не найдена</h1><Link className="button" to="/learn">Вернуться к техникам</Link></section>
  }

  return (
    <article className="detail-page">
      <Link className="back-link" to="/learn">← Все техники</Link>
      <span className="badge">Техника</span>
      <h1>{technique.title}</h1>
      <p className="lead">{technique.description}</p>
      <section><h2>Когда использовать</h2><p>{technique.whenToUse}</p></section>
      <section><h2>Пример</h2><pre className="example">{technique.example}</pre></section>
      <div className="detail-columns">
        <section><h2>Преимущества</h2><ul>{technique.advantages.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section><h2>Ограничения</h2><ul>{technique.limitations.map((item) => <li key={item}>{item}</li>)}</ul></section>
      </div>
      <Link className="button" to="/dashboard/new">Создать шаблон</Link>
    </article>
  )
}
