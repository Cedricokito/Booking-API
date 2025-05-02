import prisma from '../prismaClient.js';

export const createReview = async (req, res) => {
    const { userId, propertyId, rating, comment } = req.body;
    try {
        if (!userId || !propertyId || !rating || !comment) {
            return res.status(400).json({ error: "Missing required review details" });
        }
        const review = await prisma.review.create({
            data: { userId, propertyId, rating, comment }
        });
        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ error: "Review could not be created" });
    }
};

export const getReview = async (req, res) => {
    const { reviewId } = req.params;
    try {
        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (review) {
            res.json(review);
        } else {
            res.status(404).json({ error: "Review not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error retrieving review" });
    }
};

export const updateReview = async (req, res) => {
    const { reviewId } = req.params;
    const updates = req.body;
    try {

        const reviewExist = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!reviewExist)  {
           return res.status(404).json({ error: "Review not found" });
        }
        const review = await prisma.review.update({
            where: { id: reviewId },
            data: updates
        });
        res.json(review);
    } catch (error) {
        res.status(500).json({ error: "Review could not be updated" });
    }
};

export const deleteReview = async (req, res) => {
    const { reviewId } = req.params;
    try {
        const reviewExist = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!reviewExist)  {
           return res.status(404).json({ error: "Review not found" });
        }
        await prisma.review.delete({
            where: { id: reviewId }
        });
        res.status(200).send();
    } catch (error) {
        res.status(500).json({ error: "Review could not be deleted" });
    }
};

export const getAllReviews = async (req, res) => {
    try {
        const reviews = await prisma.review.findMany();
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: "Error fetching reviews" });
    }
};