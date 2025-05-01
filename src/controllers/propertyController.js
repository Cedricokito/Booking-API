import * as propertyCreateService from '../services/property/create.js';
import * as propertyUpdateService from '../services/property/update.js';
import prisma from '../prismaClient.js';

export const createProperty = async (req, res) => {
    try {
        const property = await propertyCreateService.createProperty(req.body);
        res.status(201).json(property);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateProperty = async (req, res) => {
    const { propertyId } = req.params;
    try {
        const property = await propertyUpdateService.updateProperty(propertyId, req.body);
        res.json(property);
    } catch (error) {
        res.status(error.message === "Property not found" ? 404 : 400).json({ error: error.message });
    }
};

export const deleteProperty = async (req, res) => {
    const { propertyId } = req.params;
    try {
        await prisma.property.delete({
            where: { id: propertyId }
        });
        res.status(200).send();
    } catch (error) {
        res.status(500).json({ error: "Property could not be deleted" });
    }
};

export const getProperty = async (req, res) => {
    const { propertyId } = req.params;
    try {
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                reviews: true,
                amenities: true
            }
        });
        if (property) {
            res.json(property);
        } else {
            res.status(404).json({ error: "Property not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error retrieving property" });
    }
};

export const getProperties = async (req, res) => {
    const { location, pricePerNight, amenities } = req.query;

    try {
        let properties;
        const where = {
            AND: [
                location && { location },
                pricePerNight && { pricePerNight: parseFloat(pricePerNight) },
                amenities && { amenities: { some: { name: amenities } } }
            ].filter(Boolean)
        };

        properties = await prisma.property.findMany({
            where: Object.keys(where.AND).length > 0 ? where : undefined,
            include: {
                reviews: true,
                amenities: true
            }
        });

        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: "Error fetching properties" });
    }
}; 