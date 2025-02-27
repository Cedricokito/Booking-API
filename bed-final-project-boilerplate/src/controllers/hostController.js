import prisma from '../prismaClient.js';
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY || 'default_secret_key';

const validateHostData = (data) => {
    const { username, password, name, email, phoneNumber, profilePicture, aboutMe } = data;
    if (!username || !password || !name || !email || !phoneNumber || !profilePicture || !aboutMe) {
        throw new Error("Missing required fields");
    }
};

export const signupHost = async (req, res) => {
    const { username, password, name, email, phoneNumber, profilePicture, aboutMe } = req.body;

    try {
        validateHostData(req.body);

        const existingHost = await prisma.host.findFirst({
            where: {
                OR: [
                    { username }
                ]
            }
        });

        if (existingHost) {
            return res.status(400).json({ error: "Username or email already exists" });
        }
        const host = await prisma.host.create({
            data: { username, password, name, email, phoneNumber, profilePicture, aboutMe }
        });
        // Generate JWT token
        const token = jwt.sign({ hostId: host.id }, AUTH_SECRET_KEY, { expiresIn: '1d' });
        res.status(201).json({ host, token });
    } catch (error) {
        res.status(400).json({ error: "Unable to create host." });
    }
};

export const getHosts = async (req, res) => {
    const { name } = req.query;

    try {
        let hosts;

        if (name) {
            hosts = await prisma.host.findMany({
                where: {
                    name,
                },
                select: {
                    id: true,
                    username: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    profilePicture: true,
                    aboutMe: true,
                },
            });
        } else {
            // If no query parameter provided, return all hosts
            hosts = await prisma.host.findMany({
                select: {
                    id: true,
                    username: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    profilePicture: true,
                    aboutMe: true,
                },
            });
        }

        res.json(hosts);
    } catch (error) {
        res.status(500).json({ error: "Error fetching hosts" });
    }
};

export const loginHost = async (req, res) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            throw new Error("Missing username or password");
        }
        const host = await prisma.host.findUnique({
            where: { username }
        });
        if (host && host.password === password) {
            // Generate JWT token
            const token = jwt.sign({ hostId: host.id }, AUTH_SECRET_KEY, { expiresIn: '1d' });
            res.json({ token });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


export const getHost = async (req, res) => {
    const { hostId } = req.params;
   
    try {
        if (!hostId) {
            return res.status(400).json({ error: "Invalid input" });
        }
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (host) {
            res.json(host);
        } else {
            res.status(404).json({ error: "Host not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error retrieving host" });
    }
};

export const updateHost = async (req, res) => {
    const { hostId } = req.params;
    const updates = req.body;
    try {
        if (!hostId) {
            return res.status(400).json({ error: "Invalid input" });
        }

        const hostExist = await prisma.host.findUnique({ where: { id: hostId } });
        if (!hostExist)  {
           return res.status(404).json({ error: "Host not found" });
        }
        const host = await prisma.host.update({
            where: { id: hostId },
            data: updates
        });
        res.json(host);
    } catch (error) {
        res.status(400).json({ error: "Error updating host." });
    }
};

export const deleteHost = async (req, res) => {
    const { hostId } = req.params;
    try {
        if (!hostId) {
            return res.status(400).json({ error: "Invalid input" });
        }

        const hostExist = await prisma.host.findUnique({ where: { id: hostId } });
        if (!hostExist)  {
           return res.status(404).json({ error: "Host not found" });
        }
 // Find all properties related to the host
 const properties = await prisma.property.findMany({
    where: { hostId: hostId },
    select: { id: true }
});

for (const property of properties) {
    const propertyId = property.id;

    // Delete related reviews of the property
    await prisma.review.deleteMany({
        where: { propertyId: propertyId }
    });

    // Delete related bookings of the property
    await prisma.booking.deleteMany({
        where: { propertyId: propertyId }
    });


    // Delete the property itself
    await prisma.property.delete({
        where: { id: propertyId }
    });
}
    await prisma.host.delete({
            where: { id: hostId }
        });
        res.status(200).send();
    } catch (error) {
        res.status(500).json({ error: "Host could not be deleted" });
    }
};

