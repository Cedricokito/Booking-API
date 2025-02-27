import prisma from '../prismaClient.js';

export const createBooking = async (req, res) => {
    const { userId, propertyId, checkinDate, checkoutDate, numberOfGuests, totalPrice, bookingStatus } = req.body;
    try {
        if (!userId || !propertyId || !checkinDate || !checkoutDate || !numberOfGuests || !totalPrice || !bookingStatus) {
            return res.status(400).json({ error: "Missing required booking details" });
        }
        const booking = await prisma.booking.create({
            data: { userId, propertyId, checkinDate, checkoutDate, numberOfGuests, totalPrice, bookingStatus }
        });
        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ error: "Booking could not be created" });
    }
};

export const getBooking = async (req, res) => {
    const { bookingId } = req.params;
    try {
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (booking) {
            res.json(booking);
        } else {
            res.status(404).json({ error: "Booking not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error retrieving booking" });
    }
};

export const updateBooking = async (req, res) => {
    const { bookingId } = req.params;
    const updates = req.body;
    try {
        const bookingExist = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!bookingExist)  {
           return res.status(404).json({ error: "Booking not found" });
        }
        const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: updates
        });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: "Booking could not be updated" });
    }
};

export const deleteBooking = async (req, res) => {
    const { bookingId } = req.params;
    try {
        const bookingExist = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!bookingExist)  {
           return res.status(404).json({ error: "Booking not found" });
        }
        await prisma.booking.delete({
            where: { id: bookingId }
        });
        res.status(200).send();
    } catch (error) {
        res.status(500).json({ error: "Booking could not be deleted" });
    }
};

export const getBookings = async (req, res) => {
    const { userId } = req.query;

    try {
        let bookings;

        if (userId) {
            bookings = await prisma.booking.findMany({
                where: {
                    userId,
                },
            });
        } else {
            // If no query parameter provided, return all bookings
            bookings = await prisma.booking.findMany();
        }

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: "Error fetching bookings" });
    }
};