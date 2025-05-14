const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Verwijder bestaande data
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  // Maak test gebruikers
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe',
      password: hashedPassword,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      password: hashedPassword,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Maak test properties
  const property1 = await prisma.property.create({
    data: {
      title: 'Luxe Villa in Amsterdam',
      description: 'Prachtige villa met uitzicht op het IJ',
      location: 'Amsterdam',
      price: 250.00,
      ownerId: user1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const property2 = await prisma.property.create({
    data: {
      title: 'Cozy Apartment in Rotterdam',
      description: 'Modern appartement in het centrum',
      location: 'Rotterdam',
      price: 150.00,
      ownerId: user2.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Maak test bookings
  await prisma.booking.create({
    data: {
      id: new Date().getTime().toString(),
    },
  });

  // Maak test reviews
  await prisma.review.create({
    data: {
      id: new Date().getTime().toString(),
    },
  });

  console.log('Database is succesvol geseed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 