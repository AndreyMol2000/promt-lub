import Card from '../components/Card'
import { techniques } from '../data/techniques'
import { Link } from 'react-router-dom'

export default function LearnPage() {
  return (
    <section>
      <h1>Техники промпт-инжиниринга</h1>
      <p className="lead">Шесть понятных способов сделать запрос точнее. Начните с простого и добавляйте сложность только там, где она действительно нужна.</p>
      <div className="grid">
        {techniques.map((item) => (
          <Card key={item.id}>
            <span className="badge">Техника</span>
            <h2>{item.title}</h2>
            <p>{item.shortDescription}</p>
            <Link className="card-link" to={`/learn/${item.id}`}>Разобрать технику <span aria-hidden="true">→</span></Link>
          </Card>
        ))}
      </div>
    </section>
  )
}
