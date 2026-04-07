import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { LoginForm } from '@/components/auth'

export const metadata: Metadata = {
  title: 'Sign In | Festival Lights',
  description: 'Sign in to your Festival Lights account to manage your bookings and view your tickets.',
}

interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string
    registered?: string
    reset?: string
    error?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Check if already authenticated
  const session = await getServerSession(authOptions)
  const params = await searchParams

  if (session) {
    redirect(params.callbackUrl || '/account')
  }

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Success messages */}
      {params.registered === 'true' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700">
          Account created successfully! Please sign in.
        </div>
      )}
      {params.reset === 'true' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700">
          Password reset successfully! Please sign in with your new password.
        </div>
      )}

      {/* Error messages */}
      {params.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
          {params.error === 'CredentialsSignin'
            ? 'Invalid email or password. Please try again.'
            : 'An error occurred. Please try again.'}
        </div>
      )}

      <LoginForm callbackUrl={params.callbackUrl} />
    </div>
  )
}
