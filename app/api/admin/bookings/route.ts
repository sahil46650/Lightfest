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
    const eventId = searchParams.get('eventId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const format = searchParams.get('format')

    const where: any = {}

    if (search) {
      where.OR = [
        {
          confirmationNumber: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          firstName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    if (status !== 'all') {
      where.status = status
    }

    if (eventId) {
      where.eventId = eventId
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          event: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: format === 'csv' ? undefined : (page - 1) * limit,
        take: format === 'csv' ? undefined : limit,
      }),
      prisma.booking.count({ where }),
    ])

    if (format === 'csv') {
      // Return CSV format
      const headers = [
        'Confirmation Number',
        'Customer Email',
        'Customer Name',
        'Event',
        'Date',
        'Amount',
        'Status',
      ]
      const rows = bookings.map(b => [
        b.confirmationNumber,
        b.email,
        `${b.firstName} ${b.lastName}`,
        b.event.name,
        new Date(b.createdAt).toISOString().split('T')[0],
        Number(b.total).toFixed(2),
        b.status,
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition':
            'attachment; filename=bookings.csv',
        },
      })
    }

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/admin/bookings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
