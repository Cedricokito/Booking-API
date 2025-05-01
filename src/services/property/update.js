import prisma from '../../prismaClient.js';

export const updateProperty = async (propertyId, updates) => {
    const propertyExists = await prisma.property.findUnique({
        where: { id: propertyId }
    });

    if (!propertyExists) {
        throw new Error("Property not found");
    }

    return await prisma.property.update({
        where: { id: propertyId },
        data: updates
    });
};

export const updatePropertyRating = async (propertyId) => {
    const reviews = await prisma.review.findMany({
        where: { propertyId },
        select: { rating: true }
    });

    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

    return await prisma.property.update({
        where: { id: propertyId },
        data: { rating: averageRating }
    });
}; 