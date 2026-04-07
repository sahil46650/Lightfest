import { Suspense } from 'react'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light to-white flex flex-col">
      {/* Simple header */}
      <header className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary" />
          <span className="text-xl font-bold text-gray-900">
            Festival Lights
          </span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          }
        >
          {children}
        </Suspense>
      </main>

      {/* Simple footer */}
      <footer className="p-4 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Festival Lights. All rights reserved.</p>
      </footer>
    </div>
  )
}
