import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prompt Maker AI',
  description: 'Design perfect prompts with personas, context, and constraints.',
  metadataBase: new URL('https://agentic-9aaa2411.vercel.app')
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="container py-8">
          {children}
        </div>
      </body>
    </html>
  )
}
