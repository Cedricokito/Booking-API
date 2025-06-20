const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Clear existing data in reverse order of creation
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.property.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.host.deleteMany();
  await prisma.user.deleteMany();
  console.log('Cleared existing data.');

  // 2. Create Amenities
  const wifi = await prisma.amenity.create({ data: { name: 'WiFi' } });
  const kitchen = await prisma.amenity.create({ data: { name: 'Kitchen' } });
  const parking = await prisma.amenity.create({ data: { name: 'Free Parking' } });
  console.log('Created amenities.');

  // 3. Create Users
  const userPassword = await bcrypt.hash('password123', 10);
  const user1 = await prisma.user.create({
    data: {
      username: 'testuser1',
      name: 'Test User One',
      email: 'test1@example.com',
      password: userPassword,
      role: 'ADMIN',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'testuser2',
      name: 'Test User Two',
      email: 'test2@example.com',
      password: userPassword,
    },
  });
  console.log('Created users.');

  // 4. Create Hosts
  const host1 = await prisma.host.create({
    data: {
      username: 'hostuser1',
      name: 'Host User One',
      email: 'host1@example.com',
      password: userPassword,
    },
  });
  console.log('Created hosts.');

  // 5. Create Properties and connect them to hosts and amenities
  const property1 = await prisma.property.create({
    data: {
      title: 'Cozy Beachfront Cottage',
      description: 'A beautiful cottage right on the beach.',
      location: 'Beachville',
      pricePerNight: 125.5,
      hostId: host1.id,
      amenities: {
        connect: [{ id: wifi.id }, { id: kitchen.id }],
      },
    },
  });
  console.log('Created properties.');

  // 6. Create Bookings
  const booking1 = await prisma.booking.create({
    data: {
      userId: user1.id,
      propertyId: property1.id,
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-08-05'),
      status: 'CONFIRMED',
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      userId: user2.id,
      propertyId: property1.id,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-09-05'),
      status: 'PENDING',
    },
  });
  console.log('Created bookings.');

  // 7. Create Reviews
  await prisma.review.create({
    data: {
      userId: user1.id,
      propertyId: property1.id,
      rating: 5,
      comment: 'Amazing place, would definitely recommend!',
    },
  });
  console.log('Created reviews.');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 