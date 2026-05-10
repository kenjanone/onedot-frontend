import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Head to Head',
  description: 'Head-to-head records between clubs. Compare past meetings, win rates, and goal scoring patterns for any two teams.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
