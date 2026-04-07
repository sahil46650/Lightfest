import { PrismaClient, EventStatus, UserRole, DiscountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Utility to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Utility to calculate dates
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  console.log('🌟 Starting Festival Lights database seeding...\n');

  try {
    await prisma.$transaction(async (tx) => {
      // ============================================================================
      // 1. CREATE ADMIN USER
      // ============================================================================
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('Admin123!', 10);

      const admin = await tx.user.upsert({
        where: { email: 'admin@festivalights.com' },
        update: {},
        create: {
          email: 'admin@festivalights.com',
          name: 'Super Admin',
          password: hashedPassword,
          role: UserRole.SUPER_ADMIN,
          emailVerified: new Date(),
        },
      });
      console.log(`✓ Admin user created/verified: ${admin.email} (ID: ${admin.id})\n`);

      // ============================================================================
      // 2. CREATE EVENTS WITH TICKET TYPES
      // ============================================================================
      console.log('🎉 Creating festival events...\n');

      const eventsData = [
        {
          name: 'Winter Wonderland',
          slug: 'winter-wonderland',
          description: 'Experience a magical winter evening illuminated by thousands of stunning light installations. Walk through enchanted gardens transformed into a luminous wonderland featuring ice sculptures, interactive light displays, and seasonal refreshments. Perfect for families and photographers alike.',
          imageUrl: 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=1200',
          location: 'Griffith Park',
          address: '4730 Crystal Springs Dr, Los Angeles, CA 90027',
          latitude: 34.1365,
          longitude: -118.2942,
          date: new Date('2026-02-14T18:00:00Z'),
          endDate: new Date('2026-02-14T23:00:00Z'),
          timezone: 'America/Los_Angeles',
          capacity: 600,
          status: EventStatus.PUBLISHED,
        },
        {
          name: 'Cherry Blossom Night',
          slug: 'cherry-blossom-night',
          description: 'Celebrate the beauty of spring with our Cherry Blossom Night festival. Marvel at delicate pink and white light installations mimicking blooming cherry trees. Enjoy traditional Japanese lantern displays, live music, and authentic cultural performances under a canopy of illuminated blossoms.',
          imageUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1200',
          location: 'Brooklyn Botanic Garden',
          address: '990 Washington Ave, Brooklyn, NY 11225',
          latitude: 40.6689,
          longitude: -73.9642,
          date: new Date('2026-04-18T19:00:00Z'),
          endDate: new Date('2026-04-18T23:30:00Z'),
          timezone: 'America/New_York',
          capacity: 500,
          status: EventStatus.PUBLISHED,
        },
        {
          name: 'Summer Lantern Float',
          slug: 'summer-lantern-float',
          description: 'Join us for a breathtaking Independence Day celebration featuring thousands of floating lanterns on the water. Release your own lantern with a wish, enjoy food trucks, live entertainment, and a spectacular fireworks finale. A truly unforgettable 4th of July experience.',
          imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200',
          location: 'Echo Park Lake',
          address: '751 Echo Park Ave, Los Angeles, CA 90026',
          latitude: 34.0734,
          longitude: -118.2608,
          date: new Date('2026-07-04T20:00:00Z'),
          endDate: new Date('2026-07-05T01:00:00Z'),
          timezone: 'America/Los_Angeles',
          capacity: 800,
          status: EventStatus.PUBLISHED,
        },
        {
          name: 'Dia de los Muertos',
          slug: 'dia-de-los-muertos',
          description: 'Honor loved ones at our vibrant Day of the Dead celebration. Experience magnificent light installations inspired by traditional ofrendas, marigold pathways, and sugar skull designs. Live mariachi music, traditional food, face painting, and altar-building workshops create an authentic cultural celebration.',
          imageUrl: 'https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=1200',
          location: 'Hollywood Forever Cemetery',
          address: '6000 Santa Monica Blvd, Los Angeles, CA 90038',
          latitude: 34.0900,
          longitude: -118.3202,
          date: new Date('2026-11-01T18:30:00Z'),
          endDate: new Date('2026-11-02T00:00:00Z'),
          timezone: 'America/Los_Angeles',
          capacity: 700,
          status: EventStatus.PUBLISHED,
        },
        {
          name: "New Year's Eve Spectacular",
          slug: 'new-years-eve-spectacular',
          description: "Ring in 2027 with the most spectacular light show in Times Square. Premium viewing area, champagne toast at midnight, DJ entertainment, and front-row seats to the iconic ball drop. Limited capacity ensures an intimate yet electrifying New Year's celebration.",
          imageUrl: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=1200',
          location: 'Times Square',
          address: 'Times Square, Manhattan, NY 10036',
          latitude: 40.7580,
          longitude: -73.9855,
          date: new Date('2026-12-31T21:00:00Z'),
          endDate: new Date('2027-01-01T02:00:00Z'),
          timezone: 'America/New_York',
          capacity: 300,
          status: EventStatus.PUBLISHED,
        },
      ];

      const createdEvents = [];

      for (const eventData of eventsData) {
        const event = await tx.event.upsert({
          where: { slug: eventData.slug },
          update: {},
          create: eventData,
        });
        createdEvents.push(event);
        console.log(`✓ Event: ${event.name} (${event.date.toLocaleDateString()})`);

        // Create ticket types for each event
        const ticketTypesData = [
          {
            name: 'Early Bird',
            description: 'Save with our early bird special! Limited availability.',
            price: 55,
            quantityTotal: Math.floor(event.capacity * 0.3),
            quantityAvailable: Math.floor(event.capacity * 0.3),
            sortOrder: 1,
            availableFrom: addDays(event.date, -60), // 60 days before
            availableTo: addDays(event.date, -46), // Available for 2 weeks
          },
          {
            name: 'General Admission',
            description: 'Standard entry to the festival with full access to all areas.',
            price: 63,
            quantityTotal: Math.floor(event.capacity * 0.5),
            quantityAvailable: Math.floor(event.capacity * 0.5),
            sortOrder: 2,
            availableFrom: addDays(event.date, -60),
            availableTo: addDays(event.date, -1), // Available for ~2 months
          },
          {
            name: 'VIP',
            description: 'Premium experience with exclusive access, complimentary drinks, and priority entry.',
            price: 75,
            quantityTotal: Math.floor(event.capacity * 0.2),
            quantityAvailable: Math.floor(event.capacity * 0.2),
            sortOrder: 3,
            availableFrom: addDays(event.date, -60),
            availableTo: event.date, // Available until event day
          },
        ];

        for (const ticketTypeData of ticketTypesData) {
          // Use a compound identifier for idempotency
          const existingTicketType = await tx.ticketType.findFirst({
            where: {
              eventId: event.id,
              name: ticketTypeData.name,
            },
          });

          const ticketType = existingTicketType
            ? existingTicketType
            : await tx.ticketType.create({
                data: {
                  ...ticketTypeData,
                  eventId: event.id,
                },
              });

          console.log(`  → ${ticketType.name}: $${ticketType.price} (${ticketType.quantityTotal} available)`);
        }
        console.log('');
      }

      console.log(`✓ Created ${createdEvents.length} events with ticket types\n`);

      // ============================================================================
      // 3. CREATE PROMO CODES
      // ============================================================================
      console.log('🎟️  Creating promo codes...\n');

      const promoCodes = [
        {
          code: 'EARLYBIRD15',
          description: '15% off for early bird shoppers',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 15,
          maxUses: null, // Unlimited
          expiresAt: new Date('2026-02-01T23:59:59Z'),
          minPurchaseAmount: null,
        },
        {
          code: 'VIP20',
          description: '$20 off VIP tickets',
          discountType: DiscountType.FIXED,
          discountValue: 20,
          maxUses: null, // Unlimited
          expiresAt: null, // No expiration
          minPurchaseAmount: 100,
        },
        {
          code: 'WELCOME10',
          description: '10% off for new customers',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
          maxUses: null, // Unlimited
          expiresAt: new Date('2026-12-31T23:59:59Z'),
          minPurchaseAmount: null,
        },
        {
          code: 'FINISH10',
          description: '10% off - Limited to first 50 uses',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
          maxUses: 50,
          expiresAt: null,
          minPurchaseAmount: null,
        },
      ];

      for (const promoCode of promoCodes) {
        const created = await tx.promoCode.upsert({
          where: { code: promoCode.code },
          update: {},
          create: promoCode,
        });

        const expiryInfo = created.expiresAt
          ? `expires ${created.expiresAt.toLocaleDateString()}`
          : 'no expiration';
        const usageInfo = created.maxUses
          ? `max ${created.maxUses} uses`
          : 'unlimited uses';
        const minPurchase = created.minPurchaseAmount
          ? `, min $${created.minPurchaseAmount}`
          : '';

        console.log(`✓ ${created.code}: ${created.discountType === 'PERCENTAGE' ? created.discountValue + '%' : '$' + created.discountValue} off (${expiryInfo}, ${usageInfo}${minPurchase})`);
      }

      console.log(`\n✓ Created ${promoCodes.length} promo codes\n`);
    });

    // ============================================================================
    // VERIFICATION: Count all created records
    // ============================================================================
    console.log('📊 Verification - Database Summary:\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { role: UserRole.SUPER_ADMIN } });
    const eventCount = await prisma.event.count();
    const publishedEventCount = await prisma.event.count({ where: { status: EventStatus.PUBLISHED } });
    const ticketTypeCount = await prisma.ticketType.count();
    const promoCodeCount = await prisma.promoCode.count();

    console.log(`👥 Users:          ${userCount} total (${adminCount} admin)`);
    console.log(`🎉 Events:         ${eventCount} total (${publishedEventCount} published)`);
    console.log(`🎫 Ticket Types:   ${ticketTypeCount} total`);
    console.log(`🎟️  Promo Codes:    ${promoCodeCount} total\n`);

    // List all events with their ticket types
    console.log('📋 Event Details:\n');
    const events = await prisma.event.findMany({
      include: {
        ticketTypes: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
    });

    for (const event of events) {
      console.log(`\n🎪 ${event.name}`);
      console.log(`   Location: ${event.location}`);
      console.log(`   Date: ${event.date.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: event.timezone
      })}`);
      console.log(`   Capacity: ${event.capacity} attendees`);
      console.log(`   Ticket Types:`);

      for (const ticket of event.ticketTypes) {
        const availableFrom = ticket.availableFrom?.toLocaleDateString() || 'Now';
        const availableTo = ticket.availableTo?.toLocaleDateString() || 'Event day';
        console.log(`     • ${ticket.name}: $${ticket.price} (${ticket.quantityTotal} available) [${availableFrom} - ${availableTo}]`);
      }
    }

    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('✅ Database seeding completed successfully!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('🔐 Admin Credentials:');
    console.log('   Email: admin@festivalights.com');
    console.log('   Password: Admin123!\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
