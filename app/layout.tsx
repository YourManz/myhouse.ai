import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'myhouse.ai — AI-Powered Architectural CAD',
  description: 'Design your dream home with AI-generated floor plans, 3D rendering, and parametric BIM exports.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
