import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { EditProfileForm } from '@/components/account/edit-profile-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Edit Profile | Festival Lights',
  description: 'Update your profile information.',
}

export default async function EditProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login?callbackUrl=/account/edit')
  }

  const userId = (session.user as any).id

  // Fetch user data for the form
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      image: true,
    },
  })

  if (!user) {
    redirect('/login')
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <p className="mt-1 text-gray-600">
            Update your personal information
          </p>
        </div>

        {/* Edit Profile Form */}
        <EditProfileForm user={user} />
      </div>
    </div>
  )
}
