import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketTypes: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('GET /api/admin/events/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const formData = await req.formData()
    const eventDataStr = formData.get('eventData') as string

    if (!eventDataStr) {
      return NextResponse.json(
        { error: 'Event data is required' },
        { status: 400 }
      )
    }

    const eventData = JSON.parse(eventDataStr)
    const { ticketTypes, ...eventFields } = eventData

    // Update event
    const event = await prisma.event.update({
      where: { id },
      data: eventFields,
      include: { ticketTypes: true },
    })

    // Update ticket types
    if (ticketTypes && Array.isArray(ticketTypes)) {
      // Delete removed ticket types
      const ticketTypeIds = ticketTypes
        .filter((tt: any) => tt.id)
        .map((tt: any) => tt.id)

      await prisma.ticketType.deleteMany({
        where: {
          eventId: id,
          id: { notIn: ticketTypeIds },
        },
      })

      // Upsert ticket types
      for (let index = 0; index < ticketTypes.length; index++) {
        const tt = ticketTypes[index]
        if (tt.id) {
          await prisma.ticketType.update({
            where: { id: tt.id },
            data: {
              name: tt.name,
              description: tt.description,
              price: parseFloat(tt.price),
              quantityTotal: parseInt(tt.quantityTotal),
              sortOrder: index,
              availableFrom: tt.availableFrom ? new Date(tt.availableFrom) : null,
              availableTo: tt.availableTo ? new Date(tt.availableTo) : null,
            },
          })
        } else {
          await prisma.ticketType.create({
            data: {
              eventId: id,
              name: tt.name,
              description: tt.description,
              price: parseFloat(tt.price),
              quantityTotal: parseInt(tt.quantityTotal),
              quantityAvailable: parseInt(tt.quantityTotal),
              sortOrder: index,
              availableFrom: tt.availableFrom ? new Date(tt.availableFrom) : null,
              availableTo: tt.availableTo ? new Date(tt.availableTo) : null,
            },
          })
        }
      }
    }

    return NextResponse.json({ event, success: true })
  } catch (error) {
    console.error('PATCH /api/admin/events/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Check if event has bookings
    const bookingCount = await prisma.booking.count({
      where: { eventId: id },
    })

    if (bookingCount > 0) {
      // Soft delete by changing status
      const event = await prisma.event.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })
      return NextResponse.json({ event, success: true })
    }

    // Hard delete if no bookings
    const event = await prisma.event.delete({
      where: { id },
    })

    return NextResponse.json({ event, success: true })
  } catch (error) {
    console.error('DELETE /api/admin/events/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
