import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Predictions Feed',
  description: 'Auto-generated match predictions log. Track prediction accuracy, outcomes, and historical performance across all leagues.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
