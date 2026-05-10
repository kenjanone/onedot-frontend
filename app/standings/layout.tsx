import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'League Standings',
  description: 'Current and historical league standings for the Premier League, La Liga, Bundesliga, Serie A, and more. Points, goal difference, and form at a glance.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
