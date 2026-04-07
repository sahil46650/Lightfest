import { getServerSession } from 'next-auth'
import authOptions from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { StatsCard } from '@/components/admin/stats-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Mail,
  ArrowUpRight,
  Eye,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  // Get this month's date range
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Fetch statistics
  const [
    bookingsThisMonth,
    revenueThisMonth,
    upcomingEvents,
    pendingEmails,
    recentBookings,
    upcomingEventsList,
    ticketCountResult,
  ] = await Promise.all([
    prisma.booking.count({
      where: {
        createdAt: { gte: monthStart },
        status: 'CONFIRMED',
      },
    }),
    prisma.booking.aggregate({
      where: {
        createdAt: { gte: monthStart },
        status: 'CONFIRMED',
      },
      _sum: { total: true },
    }),
    prisma.event.count({
      where: {
        date: { gte: now },
        status: 'PUBLISHED',
      },
    }),
    prisma.emailLog.count({
      where: { status: 'PENDING' },
    }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: { name: true },
        },
      },
    }),
    prisma.event.findMany({
      take: 5,
      where: {
        date: { gte: now },
        status: 'PUBLISHED',
      },
      orderBy: { date: 'asc' },
      include: {
        ticketTypes: {
          select: { quantityTotal: true },
        },
      },
    }),
    // Count tickets sold for upcoming events
    prisma.ticket.count({
      where: {
        booking: {
          status: 'CONFIRMED',
          event: {
            date: { gte: now },
            status: 'PUBLISHED',
          },
        },
      },
    }),
  ])

  const revenue = revenueThisMonth._sum.total || 0
  const totalCapacity = upcomingEventsList.reduce(
    (sum, event) => sum + event.ticketTypes.reduce((t, tt) => t + tt.quantityTotal, 0),
    0
  )
  const totalSold = ticketCountResult

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {session?.user?.name}. Here's what's happening today.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={TrendingUp}
          title="Bookings (This Month)"
          value={bookingsThisMonth}
          color="magenta"
        />
        <StatsCard
          icon={DollarSign}
          title="Revenue (This Month)"
          value={`$${Number(revenue).toFixed(2)}`}
          color="green"
        />
        <StatsCard
          icon={Calendar}
          title="Upcoming Events"
          value={upcomingEvents}
          color="blue"
        />
        <StatsCard
          icon={Mail}
          title="Pending Emails"
          value={pendingEmails}
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Bookings
              </h2>
              <Link href="/admin/bookings">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Confirmation #
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Customer
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Event
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No bookings yet
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 font-mono text-xs text-gray-600">
                          {booking.confirmationNumber.slice(0, 8)}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {booking.firstName} {booking.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {booking.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {booking.event.name}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          ${Number(booking.total).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.status === 'CONFIRMED'
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : booking.status === 'CANCELLED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Upcoming Events */}
        <div>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Upcoming Events
              </h2>
              <Link href="/admin/events">
                <Button variant="ghost" size="sm">
                  <Eye size={16} />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingEventsList.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No upcoming events
                </p>
              ) : (
                upcomingEventsList.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-magenta-300 transition-colors"
                  >
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="block group"
                    >
                      <p className="font-semibold text-gray-900 group-hover:text-magenta-600 line-clamp-1">
                        {event.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(event.date, 'MMM dd, yyyy HH:mm')}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          {totalSold}/{totalCapacity || 0} sold
                        </span>
                        <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-magenta-500"
                            style={{
                              width: `${
                                totalCapacity > 0
                                  ? (totalSold / totalCapacity) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
