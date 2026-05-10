import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SettingsProvider } from '@/lib/store'
import { AuthProvider } from '@/lib/auth'
import './globals.css'

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  metadataBase: new URL('https://plusone-frontend-mu.vercel.app'),
  title: {
    default: 'PlusOne | Football Stats & Match Predictions',
    template: '%s | PlusOne',
  },
  description: 'PlusOne tracks standings, fixtures, player stats, and match predictions across the Premier League, La Liga, Bundesliga, Serie A, and more. Built on real match data.',
  generator: 'Next.js',
  keywords: ['football statistics', 'match predictions', 'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'standings', 'football analytics'],
  openGraph: {
    type: 'website',
    siteName: 'PlusOne',
    title: 'PlusOne | Football Stats & Match Predictions',
    description: 'Real match data, standings, and predictions across the top European football leagues.',
    url: 'https://plusone-frontend-mu.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlusOne | Football Stats & Match Predictions',
    description: 'Real match data, standings, and predictions across the top European football leagues.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${_inter.variable} ${_jetbrainsMono.variable} font-sans antialiased`}>
        <SettingsProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SettingsProvider>
        <Analytics />
      </body>
    </html>
  )
}
