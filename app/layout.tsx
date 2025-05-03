import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Truth',
  description: 'sito non fatto con wix',
  generator: 'LA-Mina',
  icons: {
    icon: '/ugello.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
