import type { ReactNode } from 'react'

export default function Card({ children }: { children: ReactNode }) {
  return <article className="card">{children}</article>
}
