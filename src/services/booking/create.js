import prisma from '../../prismaClient.js';

/**
 * Validate booking dates for a property
 */
const validateBookingDates = async (propertyId, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date format
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format');
    }

    // Check if dates are in the future
    if (start < new Date()) {
        throw new Error('Start date must be in the future');
    }

    // Check if end date is after start date
    if (start >= end) {
        throw new Error('End date must be after start date');
    }

    // Check for overlapping bookings
    const existingBooking = await prisma.booking.findFirst({
        where: {
            propertyId,
            status: { not: 'CANCELLED' },
            AND: [
                { startDate: { lte: end } },
                { endDate: { gte: start } }
            ]
        }
    });

    if (existingBooking) {
        throw new Error('Property is already booked for these dates');
    }
};

/**
 * Calculate total price for booking
 */
const calculateTotalPrice = (pricePerNight, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return days * pricePerNight;
};

/**
 * Create a new booking
 */
export const createBooking = async (bookingData) => {
    const { propertyId, userId, startDate, endDate } = bookingData;

    if (!propertyId || !userId || !startDate || !endDate) {
        throw new Error('Missing required booking details');
    }

    // Get property details
    const property = await prisma.property.findUnique({
        where: { id: propertyId }
    });

    if (!property) {
        throw new Error('Property not found');
    }

    // Validate dates
    await validateBookingDates(propertyId, startDate, endDate);

    // Calculate total price
    const totalPrice = calculateTotalPrice(property.pricePerNight, startDate, endDate);

    // Create booking
    const booking = await prisma.booking.create({
        data: {
            propertyId,
            userId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            totalPrice,
            status: 'PENDING'
        },
        include: {
            property: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    return booking;
}; 