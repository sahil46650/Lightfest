import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { ForgotPasswordForm } from '@/components/auth'

export const metadata: Metadata = {
  title: 'Forgot Password | Festival Lights',
  description: 'Reset your Festival Lights account password.',
}

export default async function ForgotPasswordPage() {
  // Check if already authenticated
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/account')
  }

  return (
    <div className="w-full max-w-md">
      <ForgotPasswordForm />
    </div>
  )
}
