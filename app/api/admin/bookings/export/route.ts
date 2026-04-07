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
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

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

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        event: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Generate CSV
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
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=bookings-${new Date().toISOString().split('T')[0]}.csv`,
      },
    })
  } catch (error) {
    console.error('GET /api/admin/bookings/export error:', error)
    return NextResponse.json(
      { error: 'Failed to export bookings' },
      { status: 500 }
    )
  }
}
