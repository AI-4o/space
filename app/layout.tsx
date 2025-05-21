// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AIsoft – Alfredo Ingraldo, Software Engineer & AI Expert',
  description: 'Portfolio e servizi di Alfredo Ingraldo: tool AI, automazioni CLI e consulenza software. “YOUR ONLY LIMIT IS YOUR MIND.”',
  keywords: [
    'Alfredo Ingraldo',
    'AIsoft',
    'software engineer',
    'machine learning',
    'automazioni CLI',
    'Next.js',
    'freelance AI',
    'workflow optimization'
  ],
  generator: 'LA-Mina',
  icons: { icon: '/ugello.ico' },
  viewport: 'width=device-width, initial-scale=1',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'AIsoft – Portfolio di Alfredo Ingraldo',
    description: 'Tool AI e automazioni via CLI per sviluppatori e freelance.',
    url: 'https://space.aisoft.sh/',
    siteName: 'AIsoft',
    images: [
      { url: 'https://space.aisoft.sh/og-image.jpg', width: 1200, height: 630 }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIsoft – Alfredo Ingraldo',
    description: 'Portfolio AI & automazioni CLI',
    images: ['https://space.aisoft.sh/og-image.jpg'],
    creator: '@alfredo_ingraldo'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
