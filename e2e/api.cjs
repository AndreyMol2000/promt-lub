const { createApp } = require('../server.cjs')
// Только память: E2E никогда не изменяет пользовательский db.json.
createApp({ templates: [] }).listen(3002, '127.0.0.1')
