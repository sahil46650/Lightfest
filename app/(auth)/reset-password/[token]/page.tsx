import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { ResetPasswordForm } from '@/components/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Reset Password | Festival Lights',
  description: 'Set a new password for your Festival Lights account.',
}

interface ResetPasswordPageProps {
  params: Promise<{
    token: string
  }>
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params

  // Check if already authenticated
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/account')
  }

  // Validate token exists and not expired
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  // Token not found
  if (!verificationToken) {
    return (
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Invalid Reset Link</h2>
              <p className="text-gray-600">
                This password reset link is invalid. It may have already been used or the link is incorrect.
              </p>
              <div className="pt-4 space-y-2">
                <Link href="/forgot-password">
                  <Button className="w-full">Request a new reset link</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full">Back to login</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Token expired
  if (verificationToken.expires < new Date()) {
    return (
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Reset Link Expired</h2>
              <p className="text-gray-600">
                This password reset link has expired. For security reasons, reset links are only valid for 24 hours.
              </p>
              <div className="pt-4 space-y-2">
                <Link href="/forgot-password">
                  <Button className="w-full">Request a new reset link</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full">Back to login</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Valid token - show reset form
  return (
    <div className="w-full max-w-md">
      <ResetPasswordForm token={token} />
    </div>
  )
}
