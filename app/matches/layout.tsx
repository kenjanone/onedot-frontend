import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fixtures & Results',
  description: 'Upcoming fixtures and recent results across all tracked leagues. Filter by league, season, or gameweek.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
