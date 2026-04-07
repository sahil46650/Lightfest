import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { RegisterForm } from '@/components/auth'

export const metadata: Metadata = {
  title: 'Create Account | Festival Lights',
  description: 'Create your Festival Lights account to book events and manage your tickets.',
}

export default async function RegisterPage() {
  // Check if already authenticated
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/account')
  }

  return (
    <div className="w-full max-w-md">
      <RegisterForm />
    </div>
  )
}
