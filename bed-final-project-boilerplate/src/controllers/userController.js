import prisma from '../prismaClient.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY || 'default_secret_key';

const validateUserData = (data) => {
    const { username, password, name, email, profilePicture, phoneNumber } = data;
    if (!username || !password || !name || !email || !profilePicture || !phoneNumber) {
        return false;
    }
    return true;
};

export const signup = async (req, res) => {
    if (!validateUserData(req.body)) {
        return res.status(400).json({ error: "Missing required user details" });
    }
    const { username, password, name, email, phoneNumber, profilePicture } = req.body;

     // Check if username already exist
     const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { username }
            ]
        }
    });

    if (existingUser) {
        return res.status(400).json({ error: "Username or email already exists" });
    }
    try {
        const user = await prisma.user.create({
            data: { username, password, name, email, phoneNumber, profilePicture }
        });
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: "User could not be created" });
    }
};

export const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Missing username or password" });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { username }
        });
        if (user && user.password === password) {
            const token = jwt.sign({ userId: user.id }, AUTH_SECRET_KEY, { expiresIn: '1D' });
            res.json({ token });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
};

export const getUser = async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: "Invalid user ID" });
    }
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error retrieving user" });
    }
};

export const getUsers = async (req, res) => {
    const { username, email } = req.query;

    try {
        let users;

        if (username) {
            users = await prisma.user.findMany({
                where: {
                    username,
                },
                select: {
                    id: true,
                    username: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    profilePicture: true,
                },
            });
        } else if (email) {
            users = await prisma.user.findMany({
                where: {
                    email,
                },
                select: {
                    id: true,
                    username: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    profilePicture: true,
                },
            });
        } else {
            // If no query parameter provided, return all users
            users = await prisma.user.findMany({
                select: {
                    id: true,
                    username: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    profilePicture: true,
                },
            });
        }

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: "Error fetching users" });
    }
};

export const updateUser = async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: "Invalid input" });
    }
    
    try {
        const userExist = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExist)  {
           return res.status(404).json({ error: "User not found" });
        }
        const user = await prisma.user.update({
            where: { id: userId },
            data: req.body
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "User could not be updated" });
    }
};

export const deleteUser = async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: "Invalid user ID" });
    }
    try {
        const userExist = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExist)  {
            return res.status(404).json({ error: "User not found" });
        }
        // Delete related bookings
        await prisma.booking.deleteMany({
            where: { userId }
        });

        // Delete related reviews
        await prisma.review.deleteMany({
            where: { userId }
        });

        // Delete the user
        await prisma.user.delete({
            where: { id: userId }
        });

        res.status(200).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "User could not be deleted" });
    }
};
