import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { isLoggedIn } from '../utils/auth'

export default function Layout() {
  useLocation()
  const loggedIn = isLoggedIn()

  return (
    <>
      <a className="skip-link" href="#main">Перейти к содержимому</a>
      <header className="header">
        <NavLink className="logo" to="/" aria-label="PromptLab — главная">Prompt<span>Lab</span></NavLink>
        <nav aria-label="Основная навигация">
          <NavLink to="/">Главная</NavLink>
          <NavLink to="/learn">Техники</NavLink>
          <NavLink to="/templates">Шаблоны</NavLink>
          {loggedIn ? <NavLink to="/dashboard">Кабинет</NavLink> : <NavLink to="/login">Войти</NavLink>}
        </nav>
      </header>
      <main id="main" className="container">
        <Outlet />
      </main>
      <footer className="footer">
        <p><strong>Prompt Lab</strong> — учебный проект по разработке интерфейса пользователя</p>
      </footer>
    </>
  )
}
