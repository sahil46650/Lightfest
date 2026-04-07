import { prisma } from './helpers/database'

async function checkDatabase() {
  try {
    const eventCount = await prisma.event.count()
    const userCount = await prisma.user.count()
    const bookingCount = await prisma.booking.count()
    const ticketTypeCount = await prisma.ticketType.count()

    console.log('\n📊 Database Summary:')
    console.log(`   Events: ${eventCount}`)
    console.log(`   Users: ${userCount}`)
    console.log(`   Bookings: ${bookingCount}`)
    console.log(`   Ticket Types: ${ticketTypeCount}`)

    if (eventCount === 0 && userCount === 0 && bookingCount === 0 && ticketTypeCount === 0) {
      console.log('\n⚠️  Database is EMPTY - no seed data loaded')
      console.log('Run: npm run seed (if available) or load seed data\n')
    } else {
      console.log('\n✅ Database has data\n')
    }
  } catch (error) {
    console.error('❌ Database error:', error instanceof Error ? error.message : error)
  }
}

checkDatabase()
