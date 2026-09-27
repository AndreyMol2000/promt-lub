# Как подготовить Lighthouse-отчёт

В этой версии уже сохранены отчёты по локальной главной странице: [Mobile](lighthouse-mobile.html) и [Desktop](lighthouse-desktop.html). Условия и метрики указаны в [test-results.md](test-results.md). После публикации повторите проверку по рабочему адресу.

Аудит нужно запускать для production-сборки, а не для dev-сервера Vite.

```bash
npm run build
npm run preview
```

Затем:

1. Открыть адрес из терминала, обычно `http://localhost:4173`.
2. Открыть Chrome DevTools → **Lighthouse**.
3. Выбрать Performance, Accessibility, Best Practices и SEO.
4. Выбрать Desktop и нажать **Analyze page load**.
5. Экспортировать результат через **Save as HTML**.
6. Сохранить файл как `docs/lighthouse-report.html`.

Перед аудитом отключите расширения браузера, используйте свежую production-сборку и проверьте отсутствие ошибок в консоли.

Ориентир для лабораторной проверки — не менее 90 баллов в каждой категории. Lighthouse не подтверждает все полевые Core Web Vitals: INP требует отдельного измерения взаимодействий.
