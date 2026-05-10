import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Player Stats',
  description: 'Player-level statistics including goals, assists, appearances, and form across all tracked leagues and seasons.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
