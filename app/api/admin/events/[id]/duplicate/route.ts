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

    // Fetch the original event
    const originalEvent = await prisma.event.findUnique({
      where: { id },
      include: { ticketTypes: true },
    })

    if (!originalEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Create duplicate with new name and slug
    const newName = `${originalEvent.name} (Copy)`
    const newSlug = `${originalEvent.slug}-copy-${Date.now()}`

    const event = await prisma.event.create({
      data: {
        name: newName,
        slug: newSlug,
        description: originalEvent.description,
        imageUrl: originalEvent.imageUrl,
        location: originalEvent.location,
        address: originalEvent.address,
        latitude: originalEvent.latitude,
        longitude: originalEvent.longitude,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: originalEvent.endDate,
        timezone: originalEvent.timezone,
        capacity: originalEvent.capacity,
        status: 'DRAFT',
        ticketTypes: {
          create: originalEvent.ticketTypes.map((tt) => ({
            name: tt.name,
            description: tt.description,
            price: tt.price,
            quantityTotal: tt.quantityTotal,
            quantityAvailable: tt.quantityTotal,
            sortOrder: tt.sortOrder,
            availableFrom: tt.availableFrom,
            availableTo: tt.availableTo,
          })),
        },
      },
      include: { ticketTypes: true },
    })

    return NextResponse.json({ event, success: true })
  } catch (error) {
    console.error('POST /api/admin/events/[id]/duplicate error:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate event' },
      { status: 500 }
    )
  }
}
