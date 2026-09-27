import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Практикум по работе с ИИ</p>
          <h1>Промпты, которые дают предсказуемый результат</h1>
          <p>Изучайте современные техники, разбирайте примеры и сохраняйте собственные шаблоны в одном месте.</p>
          <div className="hero-actions">
            <Link className="button" to="/learn">Изучить техники</Link>
            <Link className="button button-secondary" to="/templates">Открыть шаблоны</Link>
          </div>
        </div>
        <pre className="hero-code" aria-label="Пример промпта">{'## Роль\nТы — UX-редактор.\n\n## Задача\nУлучши {{text}}\n→ сохрани смысл\n→ убери канцелярит\n\n+++Format\nКраткий ответ'}</pre>
      </section>
      <section className="features" aria-labelledby="features-title">
        <p className="eyebrow">Возможности</p>
        <h2 id="features-title">От теории сразу к своему шаблону</h2>
        <div className="grid feature-grid">
          <article className="card"><span className="feature-number">01</span><h3>Изучайте</h3><p>Шесть базовых техник с примерами, плюсами и ограничениями.</p></article>
          <article className="card"><span className="feature-number">02</span><h3>Создавайте</h3><p>Редактор подсвечивает переменные, теги, JSON и другие конструкции.</p></article>
          <article className="card"><span className="feature-number">03</span><h3>Используйте</h3><p>Ищите, фильтруйте, добавляйте в избранное и копируйте промпты.</p></article>
        </div>
      </section>
    </>
  )
}
