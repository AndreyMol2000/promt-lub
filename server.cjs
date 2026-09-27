const jsonServer = require('json-server')
const path = require('node:path')

// Учебная идентификация по email. Для реального сервиса нужна серверная сессия.
function createApp(source = path.join(__dirname, 'db.json')) {
  const app = jsonServer.create()
  const router = jsonServer.router(source)
  app.use(jsonServer.defaults({ logger: false }))
  app.use(jsonServer.bodyParser)
  const user = (req) => req.get('X-Demo-User') || ''
  const readable = (item, req) => item.isPublic || (!!user(req) && item.author === user(req))
  const find = (id) => router.db.get('templates').find((item) => String(item.id) === id).value()
  const valid = (item) => typeof item.title === 'string' && item.title.trim().length >= 3
    && typeof item.description === 'string' && item.description.trim().length >= 10
    && typeof item.content === 'string' && item.content.trim().length >= 20
    && ['Маркетинг', 'Обучение', 'Анализ', 'Разработка', 'Другое'].includes(item.category)
    && typeof item.isPublic === 'boolean'

  app.get('/templates', (req, res) => {
    const templates = router.db.get('templates').value()
      .filter((item) => readable(item, req))
      .filter((item) => !req.query.author || item.author === req.query.author)
    res.json(templates)
  })
  app.get('/templates/:id', (req, res) => {
    const item = find(req.params.id)
    if (!item || !readable(item, req)) return res.status(404).json({ error: 'Шаблон не найден' })
    res.json(item)
  })
  app.use((req, res, next) => {
    const match = req.path.match(/^\/templates(?:\/([^/]+))?\/?$/)
    if (!match || !['POST', 'PATCH', 'DELETE'].includes(req.method)) {
      return res.status(404).json({ error: 'Маршрут не найден' })
    }
    if (!user(req)) return res.status(401).json({ error: 'Необходим вход' })
    const id = match[1] && decodeURIComponent(match[1])
    if (req.method === 'POST' && !id) {
      if (!valid(req.body) || typeof req.body.id !== 'string') return res.status(400).json({ error: 'Неверные данные' })
      const existing = find(req.body.id)
      if (existing) return res.status(existing.author === user(req) ? 409 : 403).json({ error: 'ID уже существует' })
      req.body.author = user(req)
    } else {
      const item = id && find(id)
      if (!item) return res.status(404).json({ error: 'Шаблон не найден' })
      if (item.author !== user(req)) return res.status(403).json({ error: 'Нет доступа' })
      if (req.method === 'PATCH') {
        req.body = { ...item, ...req.body, id: item.id, author: item.author, createdAt: item.createdAt }
        if (!valid(req.body)) return res.status(400).json({ error: 'Неверные данные' })
      } else if (req.method !== 'DELETE') return res.status(405).end()
    }
    next()
  })
  app.use(router)
  return app
}

module.exports = { createApp }
if (require.main === module) {
  const port = Number(process.env.PORT || 3001)
  createApp().listen(port, () => console.log(`Mock API: http://localhost:${port}`))
}
