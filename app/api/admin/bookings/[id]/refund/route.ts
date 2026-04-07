import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { event: true },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // In production, integrate with payment processor (Stripe, etc.)
    // For now, just update the status

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'REFUNDED',
        updatedAt: new Date(),
      },
      include: { event: true },
    })

    // Log the refund action
    console.log(
      `Refund issued for booking ${booking.confirmationNumber}: $${Number(
        booking.total
      ).toFixed(2)}`
    )

    return NextResponse.json({
      booking: updatedBooking,
      success: true,
      message: `Refund of $${Number(booking.total).toFixed(2)} processed`,
    })
  } catch (error) {
    console.error('POST /api/admin/bookings/[id]/refund error:', error)
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    )
  }
}
