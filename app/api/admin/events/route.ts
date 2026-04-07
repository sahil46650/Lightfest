import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      }
    }

    if (status !== 'all') {
      where.status = status
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          ticketTypes: {
            select: { quantityTotal: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ])

    // Get ticket counts separately
    const ticketCounts = await Promise.all(
      events.map(event =>
        prisma.ticket.count({
          where: {
            ticketType: { eventId: event.id },
            booking: { status: 'CONFIRMED' },
          },
        })
      )
    )

    const eventsWithCapacity = events.map((event, index) => ({
      ...event,
      capacity: event.ticketTypes.reduce((sum, t) => sum + t.quantityTotal, 0),
      soldTickets: ticketCounts[index],
    }))

    return NextResponse.json({
      events: eventsWithCapacity,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/admin/events error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const eventDataStr = formData.get('eventData') as string
    const imageFile = formData.get('image') as File | null

    if (!eventDataStr) {
      return NextResponse.json(
        { error: 'Event data is required' },
        { status: 400 }
      )
    }

    const eventData = JSON.parse(eventDataStr)
    const { ticketTypes, ...eventFields } = eventData

    let imageUrl: string | undefined

    if (imageFile) {
      // For now, we'll store a placeholder. In production, upload to blob storage
      imageUrl = `https://placeholder.com/1200x630?text=${encodeURIComponent(
        eventFields.name
      )}`
    }

    const event = await prisma.event.create({
      data: {
        ...eventFields,
        imageUrl,
        ticketTypes: {
          create: ticketTypes.map((tt: any, index: number) => ({
            name: tt.name,
            description: tt.description,
            price: parseFloat(tt.price),
            quantityTotal: parseInt(tt.quantityTotal),
            quantityAvailable: parseInt(tt.quantityTotal),
            sortOrder: index,
            availableFrom: tt.availableFrom ? new Date(tt.availableFrom) : null,
            availableTo: tt.availableTo ? new Date(tt.availableTo) : null,
          })),
        },
      },
      include: { ticketTypes: true },
    })

    return NextResponse.json({ event, success: true })
  } catch (error) {
    console.error('POST /api/admin/events error:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
