import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { ProfileCard, QuickActions, RecentBookings } from '@/components/account'

export const metadata: Metadata = {
  title: 'My Account | Festival Lights',
  description: 'Manage your Festival Lights account, view bookings, and update your profile.',
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login?callbackUrl=/account')
  }

  const userId = (session.user as any).id

  // Fetch user data with recent bookings
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      image: true,
      createdAt: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  // Fetch recent bookings (last 3)
  const recentBookings = await prisma.booking.findMany({
    where: { userId },
    include: {
      event: {
        select: {
          name: true,
          date: true,
          location: true,
        },
      },
      tickets: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <p className="mt-1 text-gray-600">
            Manage your profile and view your bookings
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Profile and Quick Actions */}
          <div className="space-y-6 lg:col-span-1">
            <ProfileCard user={user} />
            <QuickActions />
          </div>

          {/* Right column - Recent Bookings */}
          <div className="lg:col-span-2">
            <RecentBookings
              bookings={recentBookings.map((booking) => ({
                id: booking.id,
                confirmationNumber: booking.confirmationNumber,
                status: booking.status,
                event: {
                  name: booking.event.name,
                  date: booking.event.date,
                  location: booking.event.location,
                },
                total: booking.total.toString(),
                tickets: booking.tickets,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
