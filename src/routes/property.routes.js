const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');

const prisma = new PrismaClient();

// Public routes
router.get('/', async (req, res) => {
  try {
    const {
      search,
      minPrice,
      maxPrice,
      location,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter
    const filter = {};
    if (search) {
      filter.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (minPrice) filter.price = { ...filter.price, gte: parseFloat(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, lte: parseFloat(maxPrice) };
    if (location) filter.location = { contains: location, mode: 'insensitive' };

    // Validate sort parameters
    const validSortFields = ['createdAt', 'price', 'title'];
    const validSortOrders = ['asc', 'desc'];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await prisma.property.count({ where: filter });

    const properties = await prisma.property.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy: {
        [sortField]: order
      },
      skip,
      take: parseInt(limit)
    });

    // Calculate average rating for each property
    const propertiesWithRating = properties.map(property => {
      const avgRating = property.reviews.length > 0
        ? property.reviews.reduce((acc, review) => acc + review.rating, 0) / property.reviews.length
        : 0;
      
      return {
        ...property,
        averageRating: avgRating,
        reviewCount: property.reviews.length
      };
    });

    res.json({
      properties: propertiesWithRating,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Calculate average rating
    const avgRating = property.reviews.length > 0
      ? property.reviews.reduce((acc, review) => acc + review.rating, 0) / property.reviews.length
      : 0;

    res.json({
      ...property,
      averageRating: avgRating,
      reviewCount: property.reviews.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { propertyId: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protected routes
router.use(protect);

router.post('/', async (req, res) => {
  try {
    const { title, description, price, location } = req.body;
    
    if (!title || !description || !price || !location) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    const property = await prisma.property.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        location,
        userId: req.user.id
      }
    });
    res.status(201).json(property);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    const { title, description, price, location } = req.body;
    
    if (price && price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    const updatedProperty = await prisma.property.update({
      where: { id: req.params.id },
      data: {
        title: title || property.title,
        description: description || property.description,
        price: price ? parseFloat(price) : property.price,
        location: location || property.location
      }
    });
    res.json(updatedProperty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    // Check if property has any active bookings
    const activeBookings = await prisma.booking.findFirst({
      where: {
        propertyId: req.params.id,
        status: 'CONFIRMED',
        endDate: { gt: new Date() }
      }
    });

    if (activeBookings) {
      return res.status(400).json({ 
        message: 'Cannot delete property with active bookings' 
      });
    }

    await prisma.property.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/reviews', async (req, res) => {
  try {
    const review = await prisma.review.create({
      data: {
        ...req.body,
        userId: req.user.id,
        propertyId: req.params.id
      }
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 