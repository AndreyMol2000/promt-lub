import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'

const LearnPage = lazy(() => import('./pages/LearnPage'))
const TechniquePage = lazy(() => import('./pages/TechniquePage'))
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'))
const TemplatePage = lazy(() => import('./pages/TemplatePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CreateTemplatePage = lazy(() => import('./pages/CreateTemplatePage'))
const EditTemplatePage = lazy(() => import('./pages/EditTemplatePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function withLoader(element: ReactNode) {
  return <Suspense fallback={<p>Загрузка...</p>}>{element}</Suspense>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'learn', element: withLoader(<LearnPage />) },
      { path: 'learn/:id', element: withLoader(<TechniquePage />) },
      { path: 'templates', element: withLoader(<TemplatesPage />) },
      { path: 'templates/:id', element: withLoader(<TemplatePage />) },
      { path: 'login', element: withLoader(<LoginPage />) },
      { path: 'dashboard', element: withLoader(<DashboardPage />) },
      { path: 'dashboard/new', element: withLoader(<CreateTemplatePage />) },
      { path: 'dashboard/edit/:id', element: withLoader(<EditTemplatePage />) },
      { path: '*', element: withLoader(<NotFoundPage />) }
    ]
  }
])

export default function App() {
  return <RouterProvider router={router} />
}
