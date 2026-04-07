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
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Create a new email log entry to resend the confirmation
    const emailLog = await prisma.emailLog.create({
      data: {
        bookingId: id,
        recipientEmail: booking.email,
        templateType: 'BOOKING_CONFIRMATION',
        status: 'PENDING',
      },
    })

    console.log(
      `Resend confirmation email queued for ${booking.email} (Booking: ${booking.confirmationNumber})`
    )

    return NextResponse.json({
      success: true,
      message: 'Confirmation email will be resent shortly',
      emailLogId: emailLog.id,
    })
  } catch (error) {
    console.error('POST /api/admin/bookings/[id]/resend error:', error)
    return NextResponse.json(
      { error: 'Failed to resend email' },
      { status: 500 }
    )
  }
}
