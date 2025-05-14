const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user1 = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Property Owner',
      email: 'owner@example.com',
      password: hashedPassword
    }
  });

  // Create test properties
  const property1 = await prisma.property.create({
    data: {
      title: 'Luxury Villa',
      description: 'Beautiful villa with sea view',
      price: 200,
      location: 'Amsterdam',
      userId: user2.id
    }
  });

  const property2 = await prisma.property.create({
    data: {
      title: 'City Apartment',
      description: 'Modern apartment in city center',
      price: 150,
      location: 'Rotterdam',
      userId: user2.id
    }
  });

  // Create test bookings
  const booking1 = await prisma.booking.create({
    data: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'CONFIRMED',
      userId: user1.id,
      propertyId: property1.id
    }
  });

  // Create test reviews
  const review1 = await prisma.review.create({
    data: {
      rating: 5,
      comment: 'Great property!',
      userId: user1.id,
      propertyId: property1.id
    }
  });

  console.log('Database has been seeded!');
  console.log('Created users:', { user1, user2 });
  console.log('Created properties:', { property1, property2 });
  console.log('Created booking:', booking1);
  console.log('Created review:', review1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 