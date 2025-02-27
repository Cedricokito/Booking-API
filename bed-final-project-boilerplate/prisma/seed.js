import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const seedDatabase = async () => {
    try {
        // Get the current working directory
        const currentDir = process.cwd();

        // Read JSON files containing seed data
        const usersData = JSON.parse(fs.readFileSync(path.join(currentDir, 'src/data/users.json'), 'utf8'));
        const hostsData = JSON.parse(fs.readFileSync(path.join(currentDir, 'src/data/hosts.json'), 'utf8'));
        const amenitiesData = JSON.parse(fs.readFileSync(path.join(currentDir, 'src/data/amenities.json'), 'utf8'));
        const bookingsData = JSON.parse(fs.readFileSync(path.join(currentDir, 'src/data/bookings.json'), 'utf8'));
        const propertiesData = JSON.parse(fs.readFileSync(path.join(currentDir, 'src/data/properties.json'), 'utf8'));
        const reviewsData = JSON.parse(fs.readFileSync(path.join(currentDir, 'src/data/reviews.json'), 'utf8'));
        // Seed users
        await Promise.all(
            usersData.users.map(async (userData) => {
                console.log(userData)
                await prisma.user.create({ data: userData });
            })
        );

        // Seed hosts
        await Promise.all(
            hostsData.hosts.map(async (hostData) => {
                await prisma.host.create({ data: hostData });
            })
        );

        // Seed amenities
        await Promise.all(
            amenitiesData.amenities.map(async (amenityData) => {
                await prisma.amenity.create({ data: amenityData });
            })
        );

          // Seed properties
          await Promise.all(
            propertiesData.properties.map(async (propertyData) => {
                await prisma.property.create({ data: propertyData });
            })
        );
        // Seed bookings
        await Promise.all(
            bookingsData.bookings.map(async (bookingData) => {
                await prisma.booking.create({ data: bookingData });
            })
        );

      

        // Seed reviews
        await Promise.all(
            reviewsData.reviews.map(async (reviewData) => {
                await prisma.review.create({ data: reviewData });
            })
        );

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await prisma.$disconnect();
    }
};

seedDatabase();
