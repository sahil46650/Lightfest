import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { BookingsTable } from '@/components/account'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'My Bookings | Festival Lights',
  description: 'View and manage all your event bookings.',
}

export default async function BookingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login?callbackUrl=/account/bookings')
  }

  const userId = (session.user as any).id

  // Fetch all user bookings with full details
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: {
      event: {
        select: {
          name: true,
          date: true,
          location: true,
          address: true,
        },
      },
      tickets: {
        include: {
          ticketType: {
            select: {
              name: true,
              price: true,
            },
          },
        },
      },
      promoCode: {
        select: {
          code: true,
          discountType: true,
          discountValue: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <Link href="/account">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Account
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-1 text-gray-600">
            View all your event bookings and ticket details
          </p>
        </div>

        {/* Bookings Table */}
        <BookingsTable
          bookings={bookings.map((booking) => ({
            id: booking.id,
            confirmationNumber: booking.confirmationNumber,
            status: booking.status,
            email: booking.email,
            firstName: booking.firstName,
            lastName: booking.lastName,
            phone: booking.phone,
            subtotal: booking.subtotal.toString(),
            discount: booking.discount.toString(),
            serviceFee: booking.serviceFee.toString(),
            total: booking.total.toString(),
            createdAt: booking.createdAt,
            event: {
              name: booking.event.name,
              date: booking.event.date,
              location: booking.event.location,
              address: booking.event.address,
            },
            tickets: booking.tickets.map((ticket) => ({
              id: ticket.id,
              attendeeName: ticket.attendeeName,
              attendeeEmail: ticket.attendeeEmail,
              qrCode: ticket.qrCode,
              ticketType: {
                name: ticket.ticketType.name,
                price: ticket.ticketType.price.toString(),
              },
              addOnsJson: ticket.addOnsJson,
            })),
            promoCode: booking.promoCode
              ? {
                  code: booking.promoCode.code,
                  discountType: booking.promoCode.discountType,
                  discountValue: booking.promoCode.discountValue.toString(),
                }
              : null,
          }))}
        />
      </div>
    </div>
  )
}
