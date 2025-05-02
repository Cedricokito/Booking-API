import prisma from '../../prismaClient.js';

export const createProperty = async (propertyData) => {
    const { title, description, location, pricePerNight, bedroomCount, bathRoomCount, maxGuestCount, hostId } = propertyData;

    if (!title || !description || !location || !pricePerNight || !bedroomCount || !bathRoomCount || !maxGuestCount || !hostId) {
        throw new Error("Missing required property details");
    }

    return await prisma.property.create({
        data: {
            ...propertyData,
            rating: 0, // Initialize rating as 0
            reviews: {
                create: []
            }
        }
    });
}; 