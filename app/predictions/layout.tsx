import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Match Predictions',
  description: 'View upcoming match predictions with win probabilities, expected goals, and head-to-head history across the Premier League, La Liga, Bundesliga, and Serie A.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
