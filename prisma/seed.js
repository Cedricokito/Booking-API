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

  const testUser = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'USER'
    }
  });

  const ownerUser = await prisma.user.create({
    data: {
      name: 'Property Owner',
      email: 'owner@example.com',
      password: hashedPassword,
      role: 'OWNER'
    }
  });

  // Create test properties
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        title: 'Beach House',
        description: 'Beautiful beach house with ocean view',
        price: 200,
        location: 'Amsterdam Beach',
        amenities: ['wifi', 'parking', 'pool'],
        userId: ownerUser.id
      }
    }),
    prisma.property.create({
      data: {
        title: 'Mountain Cabin',
        description: 'Cozy cabin in the mountains',
        price: 150,
        location: 'Mountain Valley',
        amenities: ['wifi', 'fireplace'],
        userId: ownerUser.id
      }
    }),
    prisma.property.create({
      data: {
        title: 'City Apartment',
        description: 'Modern apartment in the city center',
        price: 100,
        location: 'City Center',
        amenities: ['wifi', 'gym'],
        userId: ownerUser.id
      }
    })
  ]);

  // Create test bookings
  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'CONFIRMED',
        userId: testUser.id,
        propertyId: properties[0].id
      }
    }),
    prisma.booking.create({
      data: {
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000), // 37 days from now
        status: 'PENDING',
        userId: testUser.id,
        propertyId: properties[1].id
      }
    })
  ]);

  // Create test reviews
  await Promise.all([
    prisma.review.create({
      data: {
        rating: 5,
        comment: 'Amazing property!',
        userId: testUser.id,
        propertyId: properties[0].id
      }
    }),
    prisma.review.create({
      data: {
        rating: 4,
        comment: 'Great location and amenities',
        userId: testUser.id,
        propertyId: properties[1].id
      }
    })
  ]);

  console.log('Database has been seeded!');
  console.log('Test users created:');
  console.log('- Test User (test@example.com / password123)');
  console.log('- Property Owner (owner@example.com / password123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 