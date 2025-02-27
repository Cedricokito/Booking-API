import prisma from '../prismaClient.js';

export const createAmenity = async (req, res) => {
    const { name } = req.body;
    try {
        if (!name) {
            return res.status(400).json({ error: "Missing required booking details" });
        }
        const amenity = await prisma.amenity.create({
            data: { name }
        });
        res.status(201).json(amenity);
    } catch (error) {
        res.status(500).json({ error: "Amenity could not be created" });
    }
};

export const getAmenity = async (req, res) => {
    const { amenityId } = req.params;
    try {
        const amenity = await prisma.amenity.findUnique({ where: { id: amenityId } });
        if (amenity) {
            res.json(amenity);
        } else {
            res.status(404).json({ error: "Amenity not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error retrieving amenity" });
    }
};



export const updateAmenity = async (req, res) => {
    const { amenityId } = req.params;
    const updates = req.body;
    try {
        const amenityExist = await prisma.amenity.findUnique({ where: { id: amenityId } });
        if (!amenityExist)  {
           return res.status(404).json({ error: "Amenity not found" });
        }
        const amenity = await prisma.amenity.update({
            where: { id: amenityId },
            data: updates
        });
        res.json(amenity);
    } catch (error) {
        res.status(500).json({ error: "Amenity could not be updated" });
    }
};

export const deleteAmenity = async (req, res) => {
    const { amenityId } = req.params;
    try {
        const amenityExist = await prisma.amenity.findUnique({ where: { id: amenityId } });
        if (!amenityExist)  {
           return res.status(404).json({ error: "Amenity not found" });
        }
        await prisma.amenity.delete({
            where: { id: amenityId }
        });
        res.status(200).send();
    } catch (error) {
        res.status(500).json({ error: "Amenity could not be deleted" });
    }
};

export const getAllAmenities = async (req, res) => {
    try {
        const amenities = await prisma.amenity.findMany();
        res.json(amenities);
    } catch (error) {
        res.status(500).json({ error: "Error fetching amenities" });
    }
}
