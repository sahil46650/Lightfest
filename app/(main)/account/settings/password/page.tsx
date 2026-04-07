import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth/config'
import { ChangePasswordForm } from '@/components/account/change-password-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Change Password | Festival Lights',
  description: 'Update your account password.',
}

export default async function ChangePasswordPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login?callbackUrl=/account/settings/password')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <Link href="/account">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Account
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
          <p className="mt-1 text-gray-600">
            Keep your account secure by updating your password regularly
          </p>
        </div>

        {/* Change Password Form */}
        <ChangePasswordForm />
      </div>
    </div>
  )
}
