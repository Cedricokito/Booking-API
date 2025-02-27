import prisma from '../prismaClient.js';

export const createProperty = async (req, res) => {
    const { title, description, location, pricePerNight, bedroomCount, bathRoomCount, maxGuestCount, hostId } = req.body;
    try {
        if (!title || !description || !location || !pricePerNight || !bedroomCount || !bathRoomCount || !maxGuestCount || !hostId) {
        return res.status(400).json({ error: "Missing required property details" });
    }
        const property = await prisma.property.create({
            data: { title, description, location, pricePerNight, bedroomCount, bathRoomCount, maxGuestCount, hostId }
        });
        res.status(201).json(property);
    } catch (error) {
        res.status(500).json({ error: "Property could not be created" });
    }
};

export const getProperty = async (req, res) => {
    const { propertyId } = req.params;
    try {
        const property = await prisma.property.findUnique({ where: { id: propertyId } });
        if (property) {
            res.json(property);
        } else {
            res.status(404).json({ error: "Property not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error retrieving property" });
    }
};

export const updateProperty = async (req, res) => {
    const { propertyId } = req.params;
    const updates = req.body;
    try {
        const propertyExist = await prisma.property.findUnique({ where: { id: propertyId } });
        if (!propertyExist)  {
           return res.status(404).json({ error: "Property not found" });
        }
        const property = await prisma.property.update({
            where: { id: propertyId },
            data: updates
        });
        res.json(property);
    } catch (error) {
        res.status(500).json({ error: "Property could not be updated" });
    }
};

export const deleteProperty = async (req, res) => {
    const { propertyId } = req.params;
    try {
        const propertyExist = await prisma.property.findUnique({ where: { id: propertyId } });
        if (!propertyExist)  {
           return res.status(404).json({ error: "Property not found" });
        }
        await prisma.property.delete({
            where: { id: propertyId }
        });
        res.status(200).send();
    } catch (error) {
        res.status(500).json({ error: "Property could not be deleted" });
    }
};

export const getProperties = async (req, res) => {
    const { location, pricePerNight, amenities } = req.query;

    try {
        let properties;

        if (location || pricePerNight || amenities) {
            properties = await prisma.property.findMany({
                where: {
                    AND: [
                        location && { location },
                        pricePerNight && { pricePerNight: parseFloat(pricePerNight) },
                        amenities && { amenities: { some: { name: amenities } } },
                    ].filter(Boolean),
                },
            });
        } else {
            // If no query parameter provided, return all properties
            properties = await prisma.property.findMany();
        }

        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: "Error fetching properties" });
    }
};
